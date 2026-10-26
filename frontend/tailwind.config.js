/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: '#090a0f',
          surface: '#11131c',
          card: '#161824',
          subtle: '#1b1e2c',
          border: '#25293d',
          'border-focus': '#4f46e5',
          text: '#f3f4f8',
          muted: '#8e95ac',
          faint: '#525870',
          accent: '#8b5cf6',
          'accent-hover': '#7c3aed',
          'accent-glow': 'rgba(139, 92, 246, 0.15)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace', 'ui-monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
