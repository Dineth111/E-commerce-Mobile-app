/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary rose/pink accent
        primary: {
          DEFAULT: '#E91E8C',
          50: '#FDE9F4',
          100: '#FBD3E9',
          200: '#F7A7D3',
          300: '#F37BBD',
          400: '#EF4FA7',
          500: '#E91E8C',
          600: '#C01870',
          700: '#901256',
          800: '#600C3A',
          900: '#30061D',
        },
        // Dark mode backgrounds
        background: '#0A0A0F',
        surface: '#141419',
        surface2: '#1E1E28',
        border: '#2A2A35',
        // Text
        foreground: '#F0F0F5',
        muted: '#8B8B9A',
        // States
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        'inter': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
