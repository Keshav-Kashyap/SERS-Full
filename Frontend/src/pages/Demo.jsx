import { useEffect, useRef, useState, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiCheckCircle, FiMapPin, FiNavigation, FiRadio, FiXCircle, FiShield } from 'react-icons/fi'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import {
  DEMO_ROADS,
  ROUTE_LENGTH_METERS,
  WEATHER_OPTIONS,
  TRAFFIC_OPTIONS,
  DRIVER_BEHAVIOR_OPTIONS,
  buildPredictionPayload,
} from '../data/demoDriveData'

const CRITICAL_RISK_THRESHOLD = 90

function getConditionRiskScore(weather, traffic, driverBehavior, route, distanceM) {
  const weatherScore = weather === 'Foggy' ? 3 : weather === 'Rainy' ? 2 : weather === 'Cloudy' ? 1 : 0
  const trafficScore = traffic === 'Heavy' ? 2 : traffic === 'Moderate' ? 1 : 0
  const driverScore = driverBehavior === 'Aggressive' ? 2 : driverBehavior === 'Normal' ? 1 : 0
  const totalScore = weatherScore + trafficScore + driverScore

  let targetRisk = 90
  if (totalScore <= 1) targetRisk = 30
  else if (totalScore === 2) targetRisk = 40
  else if (totalScore === 3) targetRisk = 80
  else if (totalScore === 4) targetRisk = 90

  const severeCondition = (weather === 'Rainy' || weather === 'Foggy') && traffic === 'Heavy' && driverBehavior === 'Aggressive'
  const rampStartM = severeCondition ? 20 : 40
  const rampEndM = severeCondition
    ? 180
    : 280
  const rampSpan = Math.max(1, rampEndM - rampStartM)
  const progress = Math.max(0, Math.min(1, (distanceM - rampStartM) / rampSpan))

  const profileStartRisk = route.profile === 'high' ? 52 : route.profile === 'medium' ? 45 : 26
  const startRisk = Math.min(profileStartRisk, targetRisk)

  return Math.round(startRisk + (targetRisk - startRisk) * progress)
}

// ─── Phase labels ──────────────────────────────────────────────────────────────
const PHASE_STATUS = {
  idle: 'Demo ready. Click Start Demo Drive.',
  starting: 'Starting engine... Sensors activating.',
  monitoring: 'Route monitoring active — prediction runs at every 100m checkpoint.',
  riskAlert: '⚠️ HIGH RISK DETECTED! Collision probability critical!',
  decision: 'Alert issued. Awaiting driver response.',
  braking: 'Driver following instruction — crash avoided!',
  accident: 'Driver ignored alert! Approaching crash zone...',
  crashSpin: '💥 COLLISION DETECTED! Impact sensor triggered!',
  sosSending: 'Sending SOS to nearest emergency responder...',
  sosSent: 'SOS Delivered to nearest emergency responder.',
  safe: '✅ Safe! Risk cleared. Driver & passenger are safe.',
}

// ─── Sound functions ───────────────────────────────────────────────────────────
function playBeep() {
  try {
    const ctx = new window.AudioContext()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(860, ctx.currentTime)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
    setTimeout(() => ctx.close(), 400)
  } catch {
    return
  }
}

function playMultiBeep(count = 3) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playBeep(), i * 320)
  }
}

function playCrashSound() {
  try {
    const ctx = new window.AudioContext()
    const bufLen = ctx.sampleRate * 0.5
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 4000)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.35, ctx.currentTime)
    src.connect(g)
    g.connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 800)
  } catch {
    return
  }
}

function playSosBeep() {
  try {
    const ctx = new window.AudioContext()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.4)
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.65)
    setTimeout(() => ctx.close(), 900)
  } catch {
    return
  }
}

function playMultiSos(count = 4) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playSosBeep(), i * 700)
  }
}

function interpolatePath(points, t) {
  if (!Array.isArray(points) || points.length === 0) {
    return { lat: 28.6139, lng: 77.209 }
  }

  if (points.length === 1) {
    return points[0]
  }

  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (points.length - 1)
  const startIdx = Math.floor(scaled)
  const endIdx = Math.min(startIdx + 1, points.length - 1)
  const localT = scaled - startIdx

  const a = points[startIdx]
  const b = points[endIdx]

  const aLat = typeof a.lat === 'number' ? a.lat : a?.latLng?.lat
  const aLng = typeof a.lng === 'number' ? a.lng : a?.latLng?.lng
  const bLat = typeof b.lat === 'number' ? b.lat : b?.latLng?.lat
  const bLng = typeof b.lng === 'number' ? b.lng : b?.latLng?.lng

  return {
    lat: aLat + (bLat - aLat) * localT,
    lng: aLng + (bLng - aLng) * localT,
  }
}

function RoutingMachine({ startPoint, endPoint, onRouteReady }) {
  const map = useMap()
  const controlRef = useRef(null)

  useEffect(() => {
    if (!startPoint || !endPoint) return undefined

    if (controlRef.current) {
      map.removeControl(controlRef.current)
      controlRef.current = null
    }

    const control = L.Routing.control({
      waypoints: [L.latLng(startPoint.lat, startPoint.lng), L.latLng(endPoint.lat, endPoint.lng)],
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
      show: false,
      lineOptions: {
        styles: [
          { color: '#0ea5e9', opacity: 0.95, weight: 7 },
          { color: '#e2e8f0', opacity: 0.4, weight: 11 },
        ],
      },
      createMarker: () => null,
    }).addTo(map)

    control.on('routesfound', (event) => {
      const points = event.routes?.[0]?.coordinates || []
      onRouteReady(points)
    })

    controlRef.current = control

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current)
        controlRef.current = null
      }
    }
  }, [endPoint, map, onRouteReady, startPoint])

  return null
}

const CAR_ICON = L.divIcon({
  className: 'demo-car-icon',
  html: `<div style="
    width:30px;
    height:30px;
    border-radius:9999px;
    background:rgba(15,23,42,0.86);
    border:1px solid rgba(148,163,184,0.6);
    display:flex;
    align-items:center;
    justify-content:center;
    color:#22d3ee;
    font-size:14px;
    box-shadow:0 8px 18px rgba(15,23,42,0.4);
  ">🚗</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

function RealMapPanel({ selectedRoad, realCarPoint, riskLevel, riskScore, riskPointLatLng, onRouteReady }) {
  const isCriticalRisk = riskScore >= CRITICAL_RISK_THRESHOLD
  const zoneColor = isCriticalRisk ? '#dc2626' : riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#22c55e'
  const zoneRadius = isCriticalRisk ? 180 : riskLevel === 'high' ? 140 : riskLevel === 'medium' ? 100 : 70

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-300/70 bg-slate-100">
      <MapContainer
        center={[selectedRoad.startPoint.lat, selectedRoad.startPoint.lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
        key={selectedRoad.id}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RoutingMachine
          startPoint={selectedRoad.startPoint}
          endPoint={selectedRoad.endPoint}
          onRouteReady={onRouteReady}
        />

        <Marker position={[realCarPoint.lat, realCarPoint.lng]} icon={CAR_ICON} />

        <Circle
          center={[riskPointLatLng.lat, riskPointLatLng.lng]}
          radius={zoneRadius}
          pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: isCriticalRisk ? 0.3 : 0.2, weight: isCriticalRisk ? 3 : 2 }}
        />
      </MapContainer>
    </div>
  )
}

// ─── Main Demo Component ───────────────────────────────────────────────────────
export default function Demo() {
  const [selectedRoadId, setSelectedRoadId] = useState(DEMO_ROADS[0].id)
  const [selectedWeather, setSelectedWeather] = useState('Clear')
  const [selectedTraffic, setSelectedTraffic] = useState('Light')
  const [selectedDriverBehavior, setSelectedDriverBehavior] = useState('Normal')
  const [phase, setPhase] = useState('idle')
  const [carT, setCarT] = useState(0)
  const [riskScore, setRiskScore] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [distanceCovered, setDistanceCovered] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const [driverAction, setDriverAction] = useState('pending')
  const [beepFlash, setBeepFlash] = useState(false)
  const [predictionSource, setPredictionSource] = useState('waiting')
  const [riskLevel, setRiskLevel] = useState('low')
  const [riskPointT, setRiskPointT] = useState(null)
  const [routePoints, setRoutePoints] = useState([])
  const [lastPredictionAt, setLastPredictionAt] = useState('—')
  const [isCallingApi, setIsCallingApi] = useState(false)

  const animRef = useRef(null)
  const apiLockRef = useRef(false)
  const checkpointRef = useRef(0)
  const lastTimeRef = useRef(0)
  const phaseRef = useRef(phase)
  const selectedRoadRef = useRef(DEMO_ROADS[0])
  const carTRef = useRef(0)
  const riskRef = useRef(0)
  const decisionExpiredRef = useRef(false)
  const riskPointRef = useRef(null)

  phaseRef.current = phase

  const selectedRoad = DEMO_ROADS.find((item) => item.id === selectedRoadId) || DEMO_ROADS[0]
  selectedRoadRef.current = selectedRoad

  const routePath = routePoints.length > 1 ? routePoints : selectedRoad.realRoute
  const realCarPoint = interpolatePath(routePath, carT)
  const riskAnchorT = riskPointT ?? carT
  const riskPointLatLng = interpolatePath(routePath, riskAnchorT)

  const statusText = phase === 'sosSent'
    ? `SOS Delivered — ${selectedRoad.gps.lat}, ${selectedRoad.gps.lng}`
    : PHASE_STATUS[phase] || ''

  const requestPrediction = useCallback(async (distanceM) => {
    if (apiLockRef.current) return

    const road = selectedRoadRef.current
    const conditionRisk = getConditionRiskScore(
      selectedWeather,
      selectedTraffic,
      selectedDriverBehavior,
      road,
      distanceM,
    )
    const payload = buildPredictionPayload(
      road,
      distanceM,
      selectedWeather,
      selectedTraffic,
      selectedDriverBehavior,
    )
    const apiBase = import.meta.env.VITE_API_URL || 'https://sers-backend.onrender.com'

    apiLockRef.current = true
    setIsCallingApi(true)
    setPredictionSource('api')
    setSpeed(payload.speed)

    try {
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.status}`)
      }

      await response.json()

      const normalizedRisk = conditionRisk
      const nextLevel = normalizedRisk >= CRITICAL_RISK_THRESHOLD ? 'high' : normalizedRisk >= 60 ? 'medium' : 'low'

      setRiskScore(normalizedRisk)
      riskRef.current = normalizedRisk
      setRiskLevel(nextLevel)
      setLastPredictionAt(`${distanceM}m`)

      if (normalizedRisk >= CRITICAL_RISK_THRESHOLD && phaseRef.current === 'monitoring') {
        const nextRiskPoint = Math.min(0.995, carTRef.current + 0.22)
        riskPointRef.current = nextRiskPoint
        setRiskPointT(nextRiskPoint)
        setPhase('riskAlert')
      }
    } catch {
      setPredictionSource('fallback')
      const fallbackRisk = conditionRisk
      const nextLevel = fallbackRisk >= CRITICAL_RISK_THRESHOLD ? 'high' : fallbackRisk >= 60 ? 'medium' : 'low'

      setRiskScore(fallbackRisk)
      riskRef.current = fallbackRisk
      setRiskLevel(nextLevel)
      setLastPredictionAt(`${distanceM}m`)

      if (fallbackRisk >= CRITICAL_RISK_THRESHOLD && phaseRef.current === 'monitoring') {
        const nextRiskPoint = Math.min(0.995, carTRef.current + 0.22)
        riskPointRef.current = nextRiskPoint
        setRiskPointT(nextRiskPoint)
        setPhase('riskAlert')
      }
    } finally {
      apiLockRef.current = false
      setIsCallingApi(false)
    }
  }, [selectedDriverBehavior, selectedTraffic, selectedWeather])

  const stopAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
    lastTimeRef.current = 0
  }, [])

  const loop = useCallback((ts) => {
    if (!lastTimeRef.current) lastTimeRef.current = ts
    const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = ts
    const p = phaseRef.current

    if (p === 'monitoring') {
      const newT = Math.min(carTRef.current + dt * 0.025, 0.99)
      carTRef.current = newT
      setCarT(newT)
      setDistanceCovered(Math.round(newT * ROUTE_LENGTH_METERS))
      
      // If car reached accident zone, boost risk to 100%
      if (riskPointRef.current && newT >= riskPointRef.current) {
        riskRef.current = 100
        setRiskScore(100)
      }
      
      if (newT >= 0.99) {
        stopAnim()
        setSpeed(0)
        setPhase('safe')
        return
      }
    } else if (p === 'decision') {
      const newT = Math.min(carTRef.current + dt * 0.022, 0.995)
      carTRef.current = newT
      setCarT(newT)
      
      // Keep speed 100+ by default at critical risk; slow down only on follow.
      let decisionSpeed = 105
      
      if (driverAction === 'follow') {
        decisionSpeed = 44
      }
      
      setSpeed(decisionSpeed)
      
      setDistanceCovered(Math.round(newT * ROUTE_LENGTH_METERS))
      
      // If car reached accident zone, boost risk to 100%
      if (riskPointRef.current && newT >= riskPointRef.current) {
        riskRef.current = 100
        setRiskScore(100)
      }
      
      const crashThreshold = riskPointRef.current ?? riskPointT ?? 0.995
      if (decisionExpiredRef.current && newT >= crashThreshold) {
        const crashPoint = crashThreshold
        carTRef.current = crashPoint
        setCarT(crashPoint)
        setDistanceCovered(Math.round(crashPoint * ROUTE_LENGTH_METERS))
        setPhase('accident')
        return
      }
    } else if (p === 'braking') {
      const newT = Math.min(carTRef.current + dt * 0.02, 0.97)
      carTRef.current = newT
      setCarT(newT)
      setSpeed(44)
      setDistanceCovered(Math.round(newT * ROUTE_LENGTH_METERS))
      const newRisk = Math.max(12, riskRef.current - dt * 40)
      riskRef.current = newRisk
      setRiskScore(Math.round(newRisk))
      if (newT >= 0.97) { stopAnim(); setPhase('safe'); setSpeed(0); return }
    } else if (p === 'accident') {
      setSpeed(0)
      setDistanceCovered(Math.round(carTRef.current * ROUTE_LENGTH_METERS))
      riskRef.current = 100
      setRiskScore(100)
      stopAnim()
      setPhase('crashSpin')
      return
    } else if (p === 'crashSpin') {
      setSpeed(0)
      setDistanceCovered(Math.round(carTRef.current * ROUTE_LENGTH_METERS))
      riskRef.current = 100
      setRiskScore(100)
    }

    animRef.current = requestAnimationFrame(loop)
  }, [stopAnim, driverAction])

  useEffect(() => {
    setRoutePoints([])
  }, [selectedRoadId])

  useEffect(() => {
    if (phase === 'starting') {
      const t = setTimeout(() => setPhase('monitoring'), 1200)
      return () => clearTimeout(t)
    }
    if (phase === 'monitoring') {
      lastTimeRef.current = 0
      animRef.current = requestAnimationFrame(loop)
      return stopAnim
    }
    if (phase === 'riskAlert') {
      // 🔊 3 rapid beeps on 90% risk alert
      playMultiBeep(3)
      setBeepFlash(true)
      const f = setTimeout(() => setBeepFlash(false), 700)
      const t = setTimeout(() => setPhase('decision'), 1400)
      return () => { clearTimeout(f); clearTimeout(t) }
    }
    if (phase === 'decision') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(
          'Warning! Accident probability is 90 percent! Reduce speed immediately and move to the left lane!'
        )
        utter.rate = 0.95; utter.pitch = 1.1; utter.volume = 1
        window.speechSynthesis.speak(utter)
      }
      lastTimeRef.current = 0
      animRef.current = requestAnimationFrame(loop)
      let cd = 10
      setCountdown(cd)
      const timer = setInterval(() => {
        cd -= 1
        const nextCountdown = Math.max(0, cd)
        setCountdown(nextCountdown)

        if (nextCountdown === 0) {
          clearInterval(timer)
          decisionExpiredRef.current = true
          setDriverAction('ignore')
        }
      }, 1000)
      return () => { clearInterval(timer); stopAnim(); window.speechSynthesis?.cancel() }
    }
    if (phase === 'braking') {
      lastTimeRef.current = 0
      animRef.current = requestAnimationFrame(loop)
      return stopAnim
    }
    if (phase === 'accident') {
      const t = setTimeout(() => setPhase('crashSpin'), 900)
      return () => clearTimeout(t)
    }
    if (phase === 'crashSpin') {
      playCrashSound()
      const t = setTimeout(() => setPhase('sosSending'), 1200)
      return () => clearTimeout(t)
    }
    if (phase === 'sosSending') {
      // 🔊 SOS beeps when sending
      playCrashSound()
      playMultiSos(4)
      const t = setTimeout(() => setPhase('sosSent'), 2800)
      return () => clearTimeout(t)
    }
  }, [phase, loop, stopAnim])

  useEffect(() => {
    if (!['monitoring', 'decision'].includes(phase)) return

    const checkpoint = Math.floor(distanceCovered / 100)
    if (checkpoint < 1 || checkpoint <= checkpointRef.current) return

    checkpointRef.current = checkpoint
    const checkpointMeters = checkpoint * 100
    requestPrediction(checkpointMeters)
  }, [distanceCovered, phase, requestPrediction])

  const startSim = async () => {
    stopAnim()
    checkpointRef.current = 0
    carTRef.current = 0; riskRef.current = 0
    decisionExpiredRef.current = false
    riskPointRef.current = null
    setCarT(0); setRiskScore(0); setRiskLevel('low'); setSpeed(0); setDistanceCovered(0); setCountdown(10)
    setPredictionSource('waiting'); setDriverAction('pending'); setBeepFlash(false); setRiskPointT(null); setLastPredictionAt('0m')
    await requestPrediction(0)
    setPhase('starting')
  }

  const resetSim = () => {
    stopAnim()
    window.speechSynthesis?.cancel()
    checkpointRef.current = 0
    carTRef.current = 0; riskRef.current = 0
    decisionExpiredRef.current = false
    riskPointRef.current = null
    setCarT(0); setRiskScore(0); setRiskLevel('low'); setSpeed(0); setDistanceCovered(0); setCountdown(10)
    setPredictionSource('waiting'); setDriverAction('pending'); setBeepFlash(false); setRiskPointT(null); setLastPredictionAt('—')
    setPhase('idle')
  }

  const follow = () => {
    if (phase !== 'decision') return
    window.speechSynthesis?.cancel()
    decisionExpiredRef.current = false
    setDriverAction('follow')
    setPhase('braking')
  }

  const canStart = ['idle', 'safe', 'sosSent'].includes(phase)
  const isRiskPhase = ['riskAlert', 'decision', 'accident', 'crashSpin', 'sosSending', 'sosSent'].includes(phase)

  const riskColor = riskScore >= CRITICAL_RISK_THRESHOLD ? 'bg-rose-500' : riskScore >= 60 ? 'bg-amber-400' : 'bg-emerald-400'


  return (
    // ── Outer container: full viewport height, no overflow ──────────────────
    <div className="h-dvh w-full overflow-hidden bg-slate-50 flex flex-col p-2 md:p-3 gap-2 md:gap-3">

      {/* ── TOP INPUT BAR (under navbar) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 md:p-2.5 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2">
          <select
            value={selectedRoadId}
            onChange={(event) => setSelectedRoadId(event.target.value)}
            disabled={!canStart}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {DEMO_ROADS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.city} - {item.road}
              </option>
            ))}
          </select>
          <select
            value={selectedWeather}
            onChange={(event) => setSelectedWeather(event.target.value)}
            disabled={!canStart}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {WEATHER_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} Weather</option>
            ))}
          </select>
          <select
            value={selectedTraffic}
            onChange={(event) => setSelectedTraffic(event.target.value)}
            disabled={!canStart}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {TRAFFIC_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} Traffic</option>
            ))}
          </select>
          <select
            value={selectedDriverBehavior}
            onChange={(event) => setSelectedDriverBehavior(event.target.value)}
            disabled={!canStart}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {DRIVER_BEHAVIOR_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} Driver</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-slate-900 leading-tight">
            Live Predictive Accident Demo
          </h1>
          <p className="hidden sm:block text-[11px] md:text-xs text-slate-500 mt-0.5">
            AI-powered route monitoring · Risk prediction · Driver response simulation
          </p>
        </div>
        <Motion.span
          animate={beepFlash ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-300 ${
            beepFlash
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <FiRadio className="shrink-0" />
          {beepFlash ? 'Alert Triggered!' : 'Monitoring Active'}
        </Motion.span>
      </div>

      {/* ── MAIN GRID: map left (big) + sidebar right ── */}
      <div className="flex gap-2 md:gap-3 flex-1 min-h-0">

        <div className="flex-1 min-w-0 relative min-h-60">
          <RealMapPanel
            selectedRoad={selectedRoad}
            realCarPoint={realCarPoint}
            riskLevel={riskLevel}
            riskScore={riskScore}
            riskPointLatLng={riskPointLatLng}
            onRouteReady={setRoutePoints}
          />
        </div>

        {/* ── SIDEBAR ── */}
        <div className="w-64 xl:w-72 shrink-0 flex flex-col gap-2 overflow-hidden">

          {/* Control buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5 shrink-0">
            <p className="text-xs font-semibold text-slate-700 mb-2">Simulation Control</p>
            <div className="flex gap-2">
              <button onClick={startSim} disabled={!canStart}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                ▶ Start Demo
              </button>
              <button onClick={resetSim}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400">
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Live status */}
          <AnimatePresence mode="wait">
            <Motion.div key={statusText}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
              className={`rounded-2xl border p-2.5 shrink-0 transition-colors duration-300 ${
                isRiskPhase && phase !== 'safe' ? 'border-rose-200 bg-rose-50'
                : phase === 'safe' ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
              }`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Live Status</p>
              <p className={`text-xs font-semibold leading-snug ${
                isRiskPhase && phase !== 'safe' ? 'text-rose-800'
                : phase === 'safe' ? 'text-emerald-800' : 'text-slate-800'
              }`}>{statusText}</p>
            </Motion.div>
          </AnimatePresence>

          {/* Speed + Risk bars */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <div className="bg-slate-50 rounded-xl p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <FiShield size={10} className="text-slate-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Speed</span>
                </div>
                <p className="text-base font-semibold text-slate-800 leading-none">
                  {speed}<span className="text-xs font-normal text-slate-400 ml-0.5">km/h</span>
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <FiAlertTriangle size={10} className={riskScore >= CRITICAL_RISK_THRESHOLD ? 'text-rose-500' : riskScore >= 60 ? 'text-amber-500' : 'text-emerald-500'} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Risk</span>
                </div>
                <p className={`text-base font-semibold leading-none ${riskScore >= CRITICAL_RISK_THRESHOLD ? 'text-rose-600' : riskScore >= 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {riskScore}%
                </p>
              </div>
            </div>

            <div className="mb-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Risk Probability</span><span>{riskScore}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <Motion.div animate={{ width: `${riskScore}%` }} transition={{ duration: 0.4 }}
                  className={`h-full rounded-full ${riskColor} transition-colors duration-500`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-1.5">
              <p className="text-[10px] text-slate-500">Driver: <span className="font-semibold text-slate-700">
                {driverAction === 'pending' ? 'Awaiting' : driverAction === 'follow' ? '✓ Following' : '✗ Ignored'}
              </span></p>
              <p className="text-[10px] text-slate-500">Timer: <span className="font-semibold text-slate-700">
                {phase === 'decision' ? `${countdown}s` : '—'}
              </span></p>
            </div>
          </div>

          {/* Decision alert */}
          <AnimatePresence>
            {phase === 'decision' && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                className="rounded-2xl border border-rose-200 bg-rose-50 p-2 shrink-0">
                <p className="text-[11px] font-semibold text-rose-800 leading-tight">
                  ⚠️ Reduce speed! Move to left lane!
                </p>
                <p className="mt-0.5 text-[10px] text-rose-600">Accident chances: 90% — Respond now!</p>
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={follow}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition">
                    ✓ Follow
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Route Summary</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{selectedRoad.city} - {selectedRoad.road}</p>
            <p className="mt-1 text-[10px] text-slate-500">Last prediction: <span className="font-semibold text-slate-700">{lastPredictionAt}</span></p>
            <p className="mt-0.5 text-[10px] text-slate-500">Source: <span className="font-semibold text-slate-700">{predictionSource}</span></p>
            <p className="mt-0.5 text-[10px] text-slate-500">API: <span className="font-semibold text-slate-700">{isCallingApi ? 'Running' : 'Idle'}</span></p>
          </div>

        </div>
      </div>
    </div>
  )
}