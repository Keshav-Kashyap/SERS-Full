/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: '#0b0f14',
                slate: '#1b2430',
                mist: '#f3f6fb',
                cyan: '#08b6d8',
                sky: '#0ea5e9',
            },
            boxShadow: {
                premium: '0 10px 28px rgba(11, 15, 20, 0.1)',
            },
            fontFamily: {
                display: ['Sora', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
            },
            backgroundImage: {
                'impact-gradient':
                    'radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.2), transparent 45%), linear-gradient(180deg, #0a1019 0%, #060b12 100%)',
            },
        },
    },
    plugins: [],
}
