import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fio: {
          bg: '#0b0b12',
          surface: '#13131f',
          border: '#232336',
          text: '#eeeef5',
          muted: '#7e7e99',
          accent: '#a78bfa',
          'accent-hover': '#c4b5fd',
          pink: '#f472b6',
          cyan: '#22d3ee',
          lime: '#a3e635',
          orange: '#fb923c',
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#fb7185',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'wiggle': 'wiggle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 4s ease infinite',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
