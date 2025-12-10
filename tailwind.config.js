/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        colors: {
            text: {
                DEFAULT: '#faf6e9',
                muted: '#a8a28f',
                dark: '#0b0902',
            },
            background: {
                DEFAULT: '#0b0902',
                card: '#1a1708',
                elevated: '#252112',
            },
            primary: {
                DEFAULT: '#e6d58a',
                hover: '#d4c47a',
                dark: '#8b7d4a',
            },
            secondary: {
                DEFAULT: '#1f9180',
                hover: '#178070',
                light: '#2ab19d',
            },
            accent: {
                DEFAULT: '#4592d7',
                hover: '#3580c5',
                light: '#6aa8e2',
            },

            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
        },

        fontFamily: {
            sans: ['Noto Sans', 'system-ui', 'sans-serif'],
        },

        boxShadow: {
            'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
            'elevated': '0 8px 30px rgba(0, 0, 0, 0.4)',
            'glow-primary': '0 0 20px rgba(230, 213, 138, 0.3)',
            'glow-accent': '0 0 20px rgba(69, 146, 215, 0.3)',
        },
    },
    plugins: [],
}
