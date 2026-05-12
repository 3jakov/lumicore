import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--color-surface-0)',
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          inverse: 'var(--color-surface-inverse)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        brand: {
          50: '#f5f7ef',
          100: '#e5ecd5',
          200: '#ccd8af',
          300: '#b1c188',
          400: '#96ab66',
          500: '#7d914a',
          600: '#62743a',
          700: '#49572d',
          800: '#313a1f',
          900: '#1c2213',
        },
        accent: {
          50: '#eff8f7',
          100: '#d7edeb',
          200: '#b0ddd8',
          300: '#82c8c0',
          400: '#58aea7',
          500: '#3c8f89',
          600: '#2e706d',
          700: '#265956',
          800: '#214947',
          900: '#1d3d3b',
        },
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        shell: '0 24px 60px rgba(18, 24, 18, 0.12)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;
