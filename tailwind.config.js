/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        ui: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lora', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#FFFEFC',
          soft: '#F6F5F1',
          canvas: '#F0EDE6',
          header: '#FAFAF5',
        },
        ink: {
          1: '#1F1C18',
          2: '#595149',
          3: '#9B9286',
        },
        lvl: {
          border: '#D9D8D5',
          mustard: '#F5C518',
          'mustard-edge': '#D0A300',
          'mustard-soft': '#FFF8D8',
          blue: '#3B82C4',
          green: '#19A974',
          red: '#E63946',
        },
      },
      borderRadius: {
        window: '14px',
        modal: '18px',
      },
      boxShadow: {
        'paper-sm': '0 1px 3px rgba(45,34,18,.06), 0 1px 1px rgba(45,34,18,.04)',
        'paper-md': '0 4px 14px rgba(45,34,18,.07), 0 1px 3px rgba(45,34,18,.05)',
        'paper-lg': '0 12px 40px rgba(45,34,18,.09), 0 2px 8px rgba(45,34,18,.05)',
        'paper-xl': '0 24px 70px rgba(45,34,18,.13), 0 4px 14px rgba(45,34,18,.07)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
