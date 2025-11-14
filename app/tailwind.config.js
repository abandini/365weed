/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep forest palette
        forest: {
          950: '#0a1f14',
          900: '#0d2818',
          800: '#0f3a26',
          700: '#1a4d2e',
          600: '#2d5a3d',
          500: '#3d6b4a',
        },
        // Cannabis bright greens
        cannabis: {
          DEFAULT: '#4ade80',
          light: '#7bed9f',
          bright: '#22c55e',
          glow: '#86efac',
        },
        // Amber/orange accents
        amber: {
          DEFAULT: '#fb923c',
          light: '#fbbf24',
          warm: '#f97316',
          deep: '#ea580c',
        },
        // Earth tones
        earth: {
          brown: '#78350f',
          clay: '#854d0e',
          sand: '#a16207',
        },
        // Legacy support
        primary: '#4ade80',
        'primary-light': '#7bed9f',
        'primary-dark': '#1a4d2e',
      },
      fontFamily: {
        display: ['Righteous', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
        handwritten: ['Patrick Hand', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hemp-texture': "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"hemp\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M0 10 Q5 5 10 10 T20 10\" stroke=\"%231a4d2e\" stroke-width=\"0.5\" fill=\"none\" opacity=\"0.1\"/%3E%3Cpath d=\"M10 0 Q5 5 10 10 T10 20\" stroke=\"%231a4d2e\" stroke-width=\"0.5\" fill=\"none\" opacity=\"0.1\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100\" height=\"100\" fill=\"url(%23hemp)\"/%3E%3C/svg%3E')",
        'leaf-pattern': "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%234ade80\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M40 0C35 10 30 15 25 15 30 15 35 20 40 30 45 20 50 15 55 15 50 15 45 10 40 0zM20 40C25 35 25 30 25 25 25 30 30 30 35 40 30 40 25 45 20 50 20 45 20 40 20 40zM60 40C55 35 55 30 55 25 55 30 50 30 45 40 50 40 55 45 60 50 60 45 60 40 60 40z\"/%3E%3C/g%3E%3C/svg%3E')",
        'organic-gradient': 'linear-gradient(135deg, #0f3a26 0%, #1a4d2e 50%, #0a1f14 100%)',
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(74, 222, 128, 0.3)',
        'glow-amber': '0 0 30px rgba(251, 146, 60, 0.3)',
        'glow-green-lg': '0 0 50px rgba(74, 222, 128, 0.4)',
        'organic': '0 10px 40px rgba(26, 77, 46, 0.3)',
        'lifted': '0 20px 60px rgba(10, 31, 20, 0.6)',
      },
      dropShadow: {
        'glow-green': '0 0 20px rgba(74, 222, 128, 0.6)',
        'glow-amber': '0 0 20px rgba(251, 146, 60, 0.6)',
      },
      animation: {
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-medium': 'floatMedium 6s ease-in-out infinite',
        'float-fast': 'floatFast 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'leaf-fall': 'leafFall 15s linear infinite',
        'fade-in': 'fadeIn 1s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        floatMedium: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-3deg)' },
        },
        floatFast: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        leafFall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
