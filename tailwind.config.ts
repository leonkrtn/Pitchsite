import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          royal: '#1D4ED8',
          light: '#EFF6FF',
        },
        ink: '#0F172A',
        muted: '#64748B',
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      animation: {
        'count-up': 'countUp 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
      },
      keyframes: {
        countUp: {
          from: { clipPath: 'inset(100% 0 0 0)', opacity: '0' },
          to: { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
