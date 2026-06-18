import type { Config } from 'tailwindcss'

// Palette mirrored exactly from python/FailModeAtlas (tailwind.config.ts +
// app/globals.css). Do not introduce new colors here; the two projects share
// one design system.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        surface: '#FFFFFF',
        muted: '#F2F0EB',
        primary: '#1A1915',
        secondary: '#5C5A54',
        faint: '#8A8880',
        accent: '#C2411C',
        border: '#E4E2DB',
      },
      fontFamily: {
        sans: ['var(--font-sora)', 'sans-serif'],
        serif: ['var(--font-lora)', 'serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      maxWidth: {
        prose: '720px',
        wide: '960px',
        full: '1100px',
      },
    },
  },
  plugins: [],
}

export default config
