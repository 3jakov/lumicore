/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark surface scale
        'surface-0': '#0a0a0a',
        'surface-1': '#141414',
        'surface-2': '#1e1e1e',
        'surface-card': '#1a1a1a',
        // Text
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        // Borders
        'border-subtle': '#262626',
        'border-strong': '#404040',
        // Accent (amber — matches Remato worker tone)
        'accent-400': '#fbbf24',
        'accent-500': '#f59e0b',
        'accent-600': '#d97706',
        // Timer states
        'timer-active': '#22c55e',
        'timer-stop': '#ef4444',
      },
    },
  },
  plugins: [],
};
