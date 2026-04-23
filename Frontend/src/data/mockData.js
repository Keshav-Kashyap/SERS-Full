import {
    FiAlertTriangle,
    FiBell,
    FiMapPin,
    FiMic,
    FiPhoneCall,
    FiShield,
    FiTarget,
} from 'react-icons/fi'
import { GiArtificialHive, GiRadarSweep } from 'react-icons/gi'
import { MdOutlineTraffic } from 'react-icons/md'

export const problemPoints = [
    {
        title: 'No prediction system',
        text: "Current technology only reacts after accidents happen. There's no early warning.",
        icon: FiAlertTriangle,
    },
    {
        title: 'Precious seconds lost',
        text: 'Every moment counts. Automatic detection beats manual reporting by critical seconds.',
        icon: FiPhoneCall,
    },
    {
        title: 'Victims are helpless',
        text: 'Severe injuries prevent self-rescue. Automated response saves lives when action is impossible.',
        icon: MdOutlineTraffic,
    },
]

export const howItWorksSteps = [
    {
        title: 'Predict',
        detail: 'AI analyzes driving patterns, location history, and road conditions to identify risk zones and behaviors.',
        icon: GiArtificialHive,
    },
    {
        title: 'Prevent',
        detail: 'Real-time alerts notify drivers of danger ahead, enabling them to take corrective action.',
        icon: FiShield,
    },
    {
        title: 'Respond',
        detail: 'When an accident is detected, automatic SOS to first responders with precise location.',
        icon: FiBell,
    },
]

export const aiFeatureCards = [
    {
        title: 'Behavioral Pattern Recognition',
        description: "AI learns driving signatures—acceleration, braking, lane changes—to detect abnormal behavior before impact.",
        icon: GiArtificialHive,
    },
    {
        title: 'Risk Zone Intelligence',
        description: 'Predictive mapping identifies accident hotspots using real-time traffic, weather, and historical data.',
        icon: FiMapPin,
    },
    {
        title: 'Impact Decision Engine',
        description: 'Advanced confidence scoring determines accident probability and triggers preventive alerts or automatic response.',
        icon: FiTarget,
    },
]

export const systemFeatures = [
    'Predictive risk alerts',
    'Automatic accident detection',
    '10-second human override',
    'Real-time location precision',
    'Nearest emergency routing',
    'Emergency responder integration',
]

export const gpsLocation = {
    latitude: '23.0225 N',
    longitude: '72.5714 E',
    area: 'Navrangpura Corridor, Ahmedabad',
}

export const mapZones = [
    { id: 1, cx: 78, cy: 58, r: 20, level: 'High' },
    { id: 2, cx: 170, cy: 120, r: 16, level: 'High' },
    { id: 3, cx: 260, cy: 72, r: 24, level: 'Medium' },
]
