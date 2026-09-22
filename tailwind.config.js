/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
    './resources/**/*.jsx',
    './resources/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f5ede0',
          300: '#ecdfc8',
          400: '#dec9a6',
          500: '#cbb07e',
          600: '#b89863',
          700: '#9a7c51',
          800: '#7e6544',
          900: '#664f38',
        },
        ink: {
          50: '#f6f6f5',
          100: '#e7e7e5',
          200: '#d0d0cd',
          300: '#a9a9a4',
          400: '#7a7a73',
          500: '#5a5a52',
          600: '#44443d',
          700: '#33332e',
          800: '#22221f',
          900: '#151513',
        },
        accent: {
          50: '#fef5ee',
          100: '#fde6d3',
          200: '#fac9a6',
          300: '#f6a269',
          400: '#f17a35',
          500: '#e85d1b',
          600: '#c94913',
          700: '#a33913',
          800: '#822f16',
          900: '#6a2916',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        error: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
