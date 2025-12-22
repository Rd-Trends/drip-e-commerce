import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.13 0.028 261.692)',
        'primary-foreground': 'oklch(1 0 0)',
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.13 0.028 261.692)',
        muted: 'oklch(0.96 0.004 261.692)',
        'muted-foreground': 'oklch(0.47 0.013 261.692)',
        border: 'oklch(0.9 0.006 261.692)',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
      },
    },
  },
}

export default config
