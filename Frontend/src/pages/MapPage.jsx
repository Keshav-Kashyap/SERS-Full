import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { MapContainer, Marker, Popup, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet'
import { FiActivity, FiAlertTriangle, FiLoader, FiMapPin, FiNavigation, FiPlay, FiRotateCcw } from 'react-icons/fi'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'

const DEFAULT_START = { lat: 28.6139, lng: 77.209 }
const DEFAULT_END = { lat: 28.6518, lng: 77.2315 }
const MOVE_STEP = 1
const PREDICT_EVERY = 4
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sers-backend.onrender.com'

const WEATHER_OPTIONS = ['Clear', 'Rainy', 'Foggy', 'Cloudy']
const TRAFFIC_OPTIONS = ['Light', 'Moderate', 'Heavy']
const DRIVER_BEHAVIOR_OPTIONS = ['Cautious', 'Normal', 'Aggressive']

const DRIVER_RULES = {
  Cautious: { speedDelta: -10, vehicle_condition: 'Excellent', intervalMs: 180 },
  Normal: { speedDelta: 0, vehicle_condition: 'Good', intervalMs: 130 },
  Aggressive: { speedDelta: 10, vehicle_condition: 'Fair', intervalMs: 95 },
}

const WEATHER_RULES = {
  Clear: { rain: 0, fog: 0, visibility: 95, road_condition: 'Dry', bad_weather: 0 },
  Rainy: { rain: 1, fog: 0, visibility: 65, road_condition: 'Wet', bad_weather: 1 },
  Foggy: { rain: 0, fog: 1, visibility: 42, road_condition: 'Low Visibility', bad_weather: 1 },
  Cloudy: { rain: 0, fog: 0, visibility: 82, road_condition: 'Normal', bad_weather: 0 },
}

const TRAFFIC_RULES = {
  Light: { traffic_density: 1, speed_limit: 70, is_rush_hour: 0, area_previous_accidents: 1 },
  Moderate: { traffic_density: 2, speed_limit: 55, is_rush_hour: 1, area_previous_accidents: 2 },
  Heavy: { traffic_density: 3, speed_limit: 40, is_rush_hour: 1, area_previous_accidents: 4 },
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function getDayType() {
  return [0, 6].includes(new Date().getDay()) ? 'Weekend' : 'Weekday'
}

function buildPredictPayload(point, weather, traffic, driverBehavior) {
  const weatherRule = WEATHER_RULES[weather] || WEATHER_RULES.Clear
  const trafficRule = TRAFFIC_RULES[traffic] || TRAFFIC_RULES.Light
  const driverRule = DRIVER_RULES[driverBehavior] || DRIVER_RULES.Normal
  const isWeekend = getDayType() === 'Weekend' ? 1 : 0
  const adjustedSpeed = trafficRule.speed_limit - 12 + driverRule.speedDelta

  return {
    location: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    speed: Math.max(20, adjustedSpeed),
    speed_limit: trafficRule.speed_limit,
    rain: weatherRule.rain,
    fog: weatherRule.fog,
    visibility: weatherRule.visibility,
    traffic_density: trafficRule.traffic_density,
    time_of_day: getTimeOfDay(),
    day_type: getDayType(),
    is_rush_hour: trafficRule.is_rush_hour,
    road_condition: weatherRule.road_condition,
    area_previous_accidents: trafficRule.area_previous_accidents,
    vehicle_condition: driverRule.vehicle_condition,
    bad_weather: weatherRule.bad_weather,
    is_weekend: isWeekend,
    driver_behavior: driverBehavior,
  }
}

function buildSmartMessage(score, weather, traffic, prediction) {
  if (score >= 70) {
    return `High risk from ${weather.toLowerCase()} weather and ${traffic.toLowerCase()} traffic. Slow down and stay alert.`
  }
  if (score >= 35) {
    return `Moderate risk detected for ${weather.toLowerCase()} conditions with ${traffic.toLowerCase()} traffic.`
  }
  return `Safe route detected. ${prediction ? `Model verdict: ${prediction}.` : 'Continue with normal driving.'}`
}

const CAR_ICON = L.divIcon({
  className: 'car-icon-wrapper',
  html: `
    <div style="
      width:34px;
      height:34px;
      border-radius:9999px;
      background:rgba(15,23,42,0.88);
      border:1px solid rgba(148,163,184,0.55);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 10px 24px rgba(15,23,42,0.35);
      backdrop-filter: blur(6px);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12.5L6.2 7.7C6.6 6.9 7.3 6.4 8.2 6.4H15.8C16.7 6.4 17.4 6.9 17.8 7.7L20 12.5V17.2C20 17.8 19.5 18.3 18.9 18.3H17.7C17.1 18.3 16.6 17.8 16.6 17.2V16.6H7.4V17.2C7.4 17.8 6.9 18.3 6.3 18.3H5.1C4.5 18.3 4 17.8 4 17.2V12.5Z" fill="#38BDF8"/>
        <circle cx="8" cy="13.2" r="1.4" fill="#0F172A"/>
        <circle cx="16" cy="13.2" r="1.4" fill="#0F172A"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

const POINT_ICON = (tone) =>
  L.divIcon({
    className: 'point-icon-wrapper',
    html: `<div style="width:16px;height:16px;border-radius:9999px;border:2px solid white;background:${tone};box-shadow:0 4px 14px rgba(15,23,42,0.28);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

function riskMeta(score) {
  if (score <= 30) {
    return {
      band: 'Safe',
      tone: '#22c55e',
      fill: 'rgba(34,197,94,0.22)',
      message: 'Road looks stable. Continue with normal caution.',
    }
  }
  if (score <= 70) {
    return {
      band: 'Medium',
      tone: '#f59e0b',
      fill: 'rgba(245,158,11,0.24)',
      message: 'Moderate risk detected. Keep safe distance and reduce abrupt turns.',
    }
  }
  return {
    band: 'High',
    tone: '#ef4444',
    fill: 'rgba(239,68,68,0.26)',
    message: 'High risk due to weather and traffic pressure. Slow down immediately.',
  }
}

function RoutingMachine({ start, end, onRouteReady }) {
  const map = useMap()
  const controlRef = useRef(null)

  useEffect(() => {
    if (!start || !end) return undefined

    if (controlRef.current) {
      map.removeControl(controlRef.current)
      controlRef.current = null
    }

    const control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
      show: false,
      lineOptions: {
        styles: [
          { color: '#38bdf8', opacity: 0.95, weight: 7 },
          { color: '#e2e8f0', opacity: 0.5, weight: 11 },
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
  }, [end, map, onRouteReady, start])

  return null
}

function PointSelector({ mode, onPick }) {
  useMapEvents({
    click(event) {
      if (!mode) return
      const point = { lat: event.latlng.lat, lng: event.latlng.lng }
      onPick(mode, point)
    },
  })

  return null
}

export default function MapPage() {
  const [startPoint, setStartPoint] = useState(DEFAULT_START)
  const [endPoint, setEndPoint] = useState(DEFAULT_END)
  const [pickMode, setPickMode] = useState('')
  const [routePoints, setRoutePoints] = useState([])
  const [carPosition, setCarPosition] = useState(DEFAULT_START)
  const [carRisk, setCarRisk] = useState(0)
  const [predictionLabel, setPredictionLabel] = useState('Idle')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedWeather, setSelectedWeather] = useState('Clear')
  const [selectedTraffic, setSelectedTraffic] = useState('Light')
  const [selectedDriverBehavior, setSelectedDriverBehavior] = useState('Normal')
  const [riskZones, setRiskZones] = useState([])
  const [manualRedZones, setManualRedZones] = useState([])
  const [panelData, setPanelData] = useState({
    weather: 'Clear',
    traffic: 'Light',
    behavior: 'Normal',
    location: `${DEFAULT_START.lat.toFixed(4)}, ${DEFAULT_START.lng.toFixed(4)}`,
    message: 'Choose start and end points, then press Start Car to begin analysis.',
  })

  const moveIndexRef = useRef(0)
  const tickRef = useRef(0)
  const intervalRef = useRef(null)

  const fetchRiskForPoint = useCallback(async (point) => {
    setIsAnalyzing(true)
    try {
      const payload = buildPredictPayload(point, selectedWeather, selectedTraffic, selectedDriverBehavior)

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`Predict failed: ${response.status}`)

      const result = await response.json()
      const prediction = result?.predictions?.[0] || result?.prediction || {}
      const highProbability = prediction?.probabilities?.High
      const rawScore = Number(
        prediction?.risk_percentage ??
          prediction?.riskPercentage ??
          (typeof highProbability === 'number' ? highProbability * 100 : 0),
      )

      const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0
      const meta = riskMeta(score)
      const weather = selectedWeather
      const traffic = selectedTraffic
      const location = payload.location
      const label = prediction?.prediction || prediction?.label || meta.band

      setCarRisk(score)
      setPredictionLabel(label)
      setPanelData({
        weather,
        traffic,
        behavior: selectedDriverBehavior,
        location,
        message: buildSmartMessage(score, weather, traffic, label),
      })

      setRiskZones((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${point.lat.toFixed(5)}-${point.lng.toFixed(5)}`,
          lat: point.lat,
          lng: point.lng,
          risk: score,
          tone: meta.tone,
          fill: meta.fill,
        },
      ])
    } catch {
      const fallback = selectedWeather === 'Foggy' || selectedWeather === 'Rainy' ? 72 : 35
      const meta = riskMeta(fallback)
      setCarRisk(fallback)
      setPredictionLabel(meta.band)
      setPanelData({
        weather: selectedWeather,
        traffic: selectedTraffic,
        behavior: selectedDriverBehavior,
        location: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
        message: buildSmartMessage(fallback, selectedWeather, selectedTraffic, meta.band),
      })
      setRiskZones((prev) => [
        ...prev,
        {
          id: `${Date.now()}-fallback`,
          lat: point.lat,
          lng: point.lng,
          risk: fallback,
          tone: meta.tone,
          fill: meta.fill,
        },
      ])
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedDriverBehavior, selectedTraffic, selectedWeather])

  const clearMotion = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetSimulation = useCallback(() => {
    clearMotion()
    moveIndexRef.current = 0
    tickRef.current = 0
    setIsRunning(false)
    setCarPosition(startPoint)
    setCarRisk(0)
    setPredictionLabel('Idle')
    setRiskZones([])
    setManualRedZones([])
    setPanelData({
      weather: selectedWeather,
      traffic: selectedTraffic,
      behavior: selectedDriverBehavior,
      location: `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`,
      message: 'Simulation reset. Adjust the route and press Start Car again.',
    })
  }, [clearMotion, selectedDriverBehavior, selectedTraffic, selectedWeather, startPoint])

  const startSimulation = useCallback(() => {
    if (routePoints.length < 2) {
      setPanelData((current) => ({
        ...current,
        message: 'Select both start and end points first.',
      }))
      return
    }

    clearMotion()
    moveIndexRef.current = 0
    tickRef.current = 0
    setRiskZones([])
    setCarPosition(routePoints[0] || startPoint)
    setCarRisk(0)
    setPredictionLabel('Starting')
    setIsRunning(true)
  }, [clearMotion, routePoints, startPoint])

  useEffect(() => {
    if (routePoints.length < 2) {
      setCarPosition(startPoint)
      setIsRunning(false)
      return undefined
    }

    if (!isRunning) {
      setPanelData((current) => ({
        ...current,
        location: `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`,
        message: 'Route ready. Press Start Car to begin prediction.',
      }))
      return undefined
    }

    fetchRiskForPoint(routePoints[0])

    const motionRule = DRIVER_RULES[selectedDriverBehavior] || DRIVER_RULES.Normal
    const lastIndex = routePoints.length - 1

    intervalRef.current = setInterval(() => {
      const nextIndex = Math.min(moveIndexRef.current + MOVE_STEP, lastIndex)
      moveIndexRef.current = nextIndex
      tickRef.current += 1

      const point = routePoints[nextIndex]
      setCarPosition(point)

      const reachedEnd = nextIndex >= lastIndex

      if (reachedEnd || tickRef.current % PREDICT_EVERY === 0) {
        fetchRiskForPoint(point)
      }

      if (reachedEnd) {
        setIsRunning(false)
        clearMotion()
      }
    }, motionRule.intervalMs)

    return () => {
      clearMotion()
    }
  }, [clearMotion, fetchRiskForPoint, isRunning, routePoints, selectedDriverBehavior, startPoint])

  const riskSummary = useMemo(() => riskMeta(carRisk), [carRisk])

  const handlePick = (mode, point) => {
    if (mode === 'danger') {
      setManualRedZones((prev) => [
        ...prev,
        {
          id: `manual-${Date.now()}-${point.lat.toFixed(5)}-${point.lng.toFixed(5)}`,
          lat: point.lat,
          lng: point.lng,
          risk: 95,
        },
      ])
      setPickMode('')
      setPanelData((current) => ({
        ...current,
        location: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
        message: 'Manual red zone added on map.',
      }))
      return
    }

    if (mode === 'start') {
      setStartPoint(point)
      setCarPosition(point)
    }
    if (mode === 'end') {
      setEndPoint(point)
    }
    setPickMode('')
    setIsRunning(false)
    setRiskZones([])
    setPanelData((current) => ({
      ...current,
      location: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
      message: 'Point selected. Confirm the route and press Start Car.',
    }))
  }

  const handleCarDragEnd = useCallback((event) => {
    const marker = event.target
    const position = marker.getLatLng()
    const nextStart = { lat: position.lat, lng: position.lng }

    setStartPoint(nextStart)
    setCarPosition(nextStart)
    setIsRunning(false)
    setRiskZones([])
    setCarRisk(0)
    setPredictionLabel('Idle')
    setPanelData((current) => ({
      ...current,
      location: `${nextStart.lat.toFixed(4)}, ${nextStart.lng.toFixed(4)}`,
      message: 'Car moved. New start point is set. Press Start Car to run from this location.',
    }))
  }, [])

  const carMarkerHandlers = useMemo(
    () => ({
      dragend: handleCarDragEnd,
    }),
    [handleCarDragEnd],
  )

  return (
    <section className="relative h-[calc(100dvh-76px)] w-full overflow-hidden bg-slate-950">
      <MapContainer center={[DEFAULT_START.lat, DEFAULT_START.lng]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RoutingMachine
          start={startPoint}
          end={endPoint}
          onRouteReady={(points) => setRoutePoints(points)}
        />

        <PointSelector mode={pickMode} onPick={handlePick} />

        <Marker position={[endPoint.lat, endPoint.lng]} icon={POINT_ICON('#f43f5e')}>
          <Popup>End Point</Popup>
        </Marker>

        <Marker
          position={[carPosition.lat, carPosition.lng]}
          icon={CAR_ICON}
          draggable={!isRunning}
          eventHandlers={carMarkerHandlers}
        >
          <Popup>Risk: {carRisk}%</Popup>
        </Marker>

        {riskZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={90}
            pathOptions={{ color: zone.tone, fillColor: zone.tone, fillOpacity: 0.22, weight: 2 }}
          >
            <Popup>Risk: {zone.risk}%</Popup>
          </Circle>
        ))}

        {manualRedZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={120}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2 }}
          >
            <Popup>Manual Risk Zone: {zone.risk}%</Popup>
          </Circle>
        ))}
      </MapContainer>

      <aside className="pointer-events-none absolute left-4 top-4 z-800 w-[min(440px,92vw)]">
        <Motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-auto max-h-[calc(100dvh-108px)] overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/72 p-4 text-white shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300">Live Risk Monitor</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Route Intelligence Panel</h2>
              <p className="mt-1 text-sm text-slate-300">Select a route, choose conditions, then start the car.</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{ borderColor: `${riskSummary.tone}55`, backgroundColor: `${riskSummary.tone}20`, color: riskSummary.tone }}
            >
              <FiActivity size={12} />
              {riskSummary.band}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Risk Percentage</p>
              <p className="mt-1 text-3xl font-bold text-white">{carRisk}%</p>
              <p className="mt-1 text-xs text-slate-300">Model verdict: {predictionLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Model Status</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                {isAnalyzing ? <FiLoader className="animate-spin text-cyan-300" size={15} /> : <FiNavigation className="text-cyan-300" size={15} />}
                {isAnalyzing ? 'Analyzing...' : isRunning ? 'Running' : 'Ready'}
              </p>
              <p className="mt-1 text-xs text-slate-300">Backend /predict with trained features</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Weather</p>
              <select
                value={selectedWeather}
                onChange={(event) => {
                  setSelectedWeather(event.target.value)
                  setIsRunning(false)
                  setPanelData((current) => ({ ...current, weather: event.target.value, message: 'Weather updated. Press Start Car to re-run the route.' }))
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                {WEATHER_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-950 text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Traffic</p>
              <select
                value={selectedTraffic}
                onChange={(event) => {
                  setSelectedTraffic(event.target.value)
                  setIsRunning(false)
                  setPanelData((current) => ({ ...current, traffic: event.target.value, message: 'Traffic updated. Press Start Car to re-run the route.' }))
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                {TRAFFIC_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-950 text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 col-span-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-300">Driver Behavior</p>
              <select
                value={selectedDriverBehavior}
                onChange={(event) => {
                  setSelectedDriverBehavior(event.target.value)
                  setIsRunning(false)
                  setPanelData((current) => ({
                    ...current,
                    behavior: event.target.value,
                    message: 'Driver behavior updated. Press Start Car to re-run the route.',
                  }))
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/85 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                {DRIVER_BEHAVIOR_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-950 text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/6 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-300">Location</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-white">
              <FiMapPin size={14} className="text-rose-300" />
              {panelData.location}
            </p>
            <p className="mt-1 text-xs text-slate-300">Driver: {panelData.behavior}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-100">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-rose-300">
              <FiAlertTriangle size={14} />
              Smart Message
            </p>
            <p className="leading-6 text-slate-100">{panelData.message}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickMode('start')}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                pickMode === 'start' ? 'bg-cyan-400 text-slate-950' : 'border border-white/10 bg-white/8 text-white hover:bg-white/14'
              }`}
            >
              Select Start Point
            </button>
            <button
              type="button"
              onClick={() => setPickMode('end')}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                pickMode === 'end' ? 'bg-rose-400 text-slate-950' : 'border border-white/10 bg-white/8 text-white hover:bg-white/14'
              }`}
            >
              Select End Point
            </button>
            <button
              type="button"
              onClick={startSimulation}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <FiPlay size={12} />
              Start Car
            </button>
            <button
              type="button"
              onClick={() => setPickMode('danger')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                pickMode === 'danger'
                  ? 'bg-red-500 text-white'
                  : 'border border-white/10 bg-white/8 text-white hover:bg-white/14'
              }`}
            >
              Add Red Zone
            </button>
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/14"
            >
              <FiRotateCcw size={12} />
              Reset
            </button>
          </div>
        </Motion.div>
      </aside>
    </section>
  )
}