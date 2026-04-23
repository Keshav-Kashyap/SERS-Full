export const ROUTE_LENGTH_METERS = 1000

export const WEATHER_OPTIONS = ['Clear', 'Rainy', 'Foggy', 'Cloudy']
export const TRAFFIC_OPTIONS = ['Light', 'Moderate', 'Heavy']
export const DRIVER_BEHAVIOR_OPTIONS = ['Cautious', 'Normal', 'Aggressive']

export const DRIVER_RULES = {
  Cautious: { speedDelta: -14, vehicle_condition: 'good' },
  Normal: { speedDelta: 0, vehicle_condition: 'good' },
  Aggressive: { speedDelta: 18, vehicle_condition: 'poor' },
}

export const WEATHER_RULES = {
  Clear: { rain: 0, fog: 0, visibility: 220, road_condition: 'good', bad_weather: 0 },
  Rainy: { rain: 1, fog: 0, visibility: 28, road_condition: 'wet', bad_weather: 1 },
  Foggy: { rain: 0, fog: 1, visibility: 10, road_condition: 'slippery', bad_weather: 1 },
  Cloudy: { rain: 0, fog: 0, visibility: 100, road_condition: 'wet', bad_weather: 0 },
}

export const TRAFFIC_RULES = {
  Light: { traffic_density: 12, speed_limit: 72, is_rush_hour: 0, area_previous_accidents: 1 },
  Moderate: { traffic_density: 60, speed_limit: 50, is_rush_hour: 1, area_previous_accidents: 3 },
  Heavy: { traffic_density: 96, speed_limit: 34, is_rush_hour: 1, area_previous_accidents: 6 },
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function lerp(start, end, t) {
  return start + (end - start) * t
}

function getRampProgress(route, distanceM, isSevereConditionSet) {
  const startM = isSevereConditionSet ? 20 : 40
  const endM = isSevereConditionSet ? 180 : 280
  const span = Math.max(1, endM - startM)

  return clamp01((distanceM - startM) / span)
}

function blendPayload(base, target, progress) {
  if (progress <= 0) return base
  if (progress >= 1) return target

  const blended = { ...base }

  Object.keys(target).forEach((key) => {
    const baseValue = base[key]
    const targetValue = target[key]

    if (typeof baseValue === 'number' && typeof targetValue === 'number') {
      blended[key] = Math.round(lerp(baseValue, targetValue, progress))
      return
    }

    blended[key] = progress >= 0.6 ? targetValue : baseValue
  })

  return blended
}

export const DEMO_ROADS = [
  {
    id: 'delhi-nh48',
    city: 'Delhi',
    road: 'Ring Road (AIIMS to Kashmere Gate)',
    mapImage: '/maps/delhi-nh48.png',
    uiArea: 'Ring Road, New Delhi',
    gps: { lat: '28.6139° N', lng: '77.2090° E' },
    startPoint: { lat: 28.5672, lng: 77.2091 },
    endPoint: { lat: 28.6672, lng: 77.2288 },
    realRoute: [
      { lat: 28.5676, lng: 77.1065 },
      { lat: 28.5782, lng: 77.1284 },
      { lat: 28.5901, lng: 77.1542 },
      { lat: 28.6033, lng: 77.1787 },
      { lat: 28.6175, lng: 77.1981 },
      { lat: 28.6298, lng: 77.2218 },
    ],
    modelLocation: 'Noida',
    profile: 'high',
    triggerAtM: 650,
    context: {
      weather: 'Rain + Fog',
      traffic: 'Dense traffic',
      driver: 'Distracted / late braking',
    },
  },
  {
    id: 'mumbai-eew',
    city: 'Mumbai',
    road: 'Eastern Express Highway (Sion to Mulund)',
    mapImage: '/maps/mumbai-eew.png',
    uiArea: 'EEH, Mumbai',
    gps: { lat: '19.0760° N', lng: '72.8777° E' },
    startPoint: { lat: 19.0475, lng: 72.8656 },
    endPoint: { lat: 19.1710, lng: 72.9564 },
    realRoute: [
      { lat: 19.0634, lng: 72.8847 },
      { lat: 19.0731, lng: 72.8928 },
      { lat: 19.0833, lng: 72.9005 },
      { lat: 19.0926, lng: 72.9087 },
      { lat: 19.1019, lng: 72.9165 },
      { lat: 19.1122, lng: 72.9254 },
    ],
    modelLocation: 'Meerut',
    profile: 'medium',
    triggerAtM: 700,
    context: {
      weather: 'Cloudy',
      traffic: 'Mixed flow',
      driver: 'Normal / attentive',
    },
  },
  {
    id: 'lucknow-ashpath',
    city: 'Lucknow',
    road: 'Shaheed Path (Ahimamau to Gomti Nagar)',
    mapImage: '/maps/lucknow-ashpath.png',
    uiArea: 'Shaheed Path, Lucknow',
    gps: { lat: '26.8467° N', lng: '80.9462° E' },
    startPoint: { lat: 26.7702, lng: 80.9064 },
    endPoint: { lat: 26.8732, lng: 81.0084 },
    realRoute: [
      { lat: 26.8211, lng: 80.9369 },
      { lat: 26.8334, lng: 80.9471 },
      { lat: 26.8451, lng: 80.9564 },
      { lat: 26.8564, lng: 80.9659 },
      { lat: 26.8673, lng: 80.9748 },
      { lat: 26.8783, lng: 80.9828 },
    ],
    modelLocation: 'Lucknow',
    profile: 'low',
    triggerAtM: 900,
    context: {
      weather: 'Clear',
      traffic: 'Light traffic',
      driver: 'Normal / attentive',
    },
  },
]

export function buildPredictionPayload(route, distanceM, weather = 'Clear', traffic = 'Light', driverBehavior = 'Normal') {
  const weatherRule = WEATHER_RULES[weather] || WEATHER_RULES.Clear
  const trafficRule = TRAFFIC_RULES[traffic] || TRAFFIC_RULES.Light
  const driverRule = DRIVER_RULES[driverBehavior] || DRIVER_RULES.Normal
  const isSevereConditionSet = (weather === 'Rainy' || weather === 'Foggy') && traffic === 'Heavy' && driverBehavior === 'Aggressive'

  const defaultSpeed = Math.max(18, trafficRule.speed_limit + driverRule.speedDelta + (weatherRule.bad_weather ? 16 : -6))

  const base = {
    location: route.modelLocation,
    speed: defaultSpeed,
    speed_limit: trafficRule.speed_limit,
    rain: weatherRule.rain,
    fog: weatherRule.fog,
    visibility: weatherRule.visibility,
    traffic_density: trafficRule.traffic_density,
    time_of_day: 'evening',
    day_type: 'Tuesday',
    is_rush_hour: trafficRule.is_rush_hour,
    road_condition: weatherRule.road_condition,
    area_previous_accidents: trafficRule.area_previous_accidents,
    vehicle_condition: driverRule.vehicle_condition,
    bad_weather: weatherRule.bad_weather,
    is_weekend: 0,
  }

  if (isSevereConditionSet) {
    const severeTarget = {
      ...base,
      speed: 118,
      speed_limit: 32,
      rain: 1,
      fog: weather === 'Foggy' ? 1 : 0,
      visibility: weather === 'Foggy' ? 6 : 18,
      traffic_density: 98,
      time_of_day: 'night',
      day_type: 'Monday',
      is_rush_hour: 1,
      road_condition: 'slippery',
      area_previous_accidents: 18,
      vehicle_condition: 'poor',
      bad_weather: 1,
      is_weekend: 0,
    }

    return blendPayload(base, severeTarget, getRampProgress(route, distanceM, true))
  }

  if (route.profile === 'high') {
    const highTarget = {
      ...base,
      speed: 112,
      speed_limit: 65,
      rain: 1,
      fog: 1,
      visibility: 8,
      traffic_density: 88,
      time_of_day: 'night',
      day_type: 'Monday',
      is_rush_hour: 1,
      road_condition: 'slippery',
      area_previous_accidents: 16,
      vehicle_condition: 'poor',
      bad_weather: 1,
      is_weekend: 0,
    }

    return blendPayload(base, highTarget, getRampProgress(route, distanceM, false))
  }

  if (route.profile === 'medium') {
    const mediumTarget = {
      ...base,
      speed: 92,
      speed_limit: 45,
      rain: 1,
      fog: 1,
      visibility: 28,
      traffic_density: 85,
      time_of_day: 'evening',
      day_type: 'Friday',
      is_rush_hour: 1,
      road_condition: 'slippery',
      area_previous_accidents: 14,
      vehicle_condition: 'poor',
      bad_weather: 1,
      is_weekend: 0,
    }

    return blendPayload(base, mediumTarget, getRampProgress(route, distanceM, false))
  }

  const lowTarget = {
    ...base,
    speed: 48,
    speed_limit: 60,
    rain: 0,
    fog: 0,
    visibility: 180,
    traffic_density: 18,
    time_of_day: 'morning',
    day_type: 'Wednesday',
    is_rush_hour: 0,
    road_condition: 'good',
    area_previous_accidents: 1,
    vehicle_condition: 'good',
    bad_weather: 0,
    is_weekend: 0,
  }

  return blendPayload(base, lowTarget, getRampProgress(route, distanceM, false))
}

export function getRoadProbabilities(selectedRoadId) {
  return DEMO_ROADS.map((item) => {
    const chance = item.profile === 'high' ? 82 : item.profile === 'medium' ? 54 : 22
    const tone = item.profile === 'high' ? 'bg-rose-500' : item.profile === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
    return {
      road: `${item.city} · ${item.road}`,
      chance: item.id === selectedRoadId ? chance : Math.max(chance - 10, 8),
      tone,
    }
  })
}
