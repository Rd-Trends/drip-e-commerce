import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.141 0.005 285.823)',
        card: 'oklch(1 0 0)',
        'card-foreground': 'oklch(0.141 0.005 285.823)',
        popover: 'oklch(1 0 0)',
        'popover-foreground': 'oklch(0.141 0.005 285.823)',
        primary: 'oklch(0.488 0.243 264.376)',
        'primary-foreground': 'oklch(0.97 0.014 254.604)',
        secondary: 'oklch(0.967 0.001 286.375)',
        'secondary-foreground': 'oklch(0.21 0.006 285.885)',
        muted: 'oklch(0.967 0.001 286.375)',
        'muted-foreground': 'oklch(0.552 0.016 285.938)',
        accent: 'oklch(0.967 0.001 286.375)',
        'accent-foreground': 'oklch(0.21 0.006 285.885)',
        destructive: 'oklch(0.577 0.245 27.325)',
        border: 'oklch(0.92 0.004 286.32)',
        input: 'oklch(0.92 0.004 286.32)',
        ring: 'oklch(0.705 0.015 286.067)',
      },
      borderRadius: {
        lg: '0.625rem',
        md: 'calc(0.625rem - 2px)',
        sm: 'calc(0.625rem - 4px)',
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
