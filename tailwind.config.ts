/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern Islamic Corporate Color Palette
        'islamic': {
          'primary': '#2D5A3D',     // Forest Green - trust & stability
          'secondary': '#C4A746',   // Gold - prosperity & wisdom
          'accent': '#1A4B2F',      // Darker green for depth
          'light': '#E8F5E8',       // Light green background
          'cream': '#FBF8F1',       // Warm cream
        },
        'corporate': {
          'dark': '#2C3E50',        // Professional dark text
          'gray': '#7F8C8D',        // Muted gray
          'light': '#ECF0F1',       // Light background
          'white': '#FFFFFF',       // Pure white
        },
        // Keep legacy colors for backward compatibility
        'ksu-yellow': '#C4A746',    // Updated to gold
        'ksu-orange': '#E67E22',
        'ksu-red': '#E74C3C',
        'ksu-green': '#2D5A3D',     // Updated to islamic primary
        'ksu-blue': '#3498DB',
        primary: {
          50: '#E8F5E8',
          100: '#C4E6C4',
          200: '#9DD49D',
          300: '#75C175',
          400: '#58B158',
          500: '#2D5A3D',
          600: '#285237',
          700: '#22472F',
          800: '#1C3C27',
          900: '#13291B',
        },
      },
      fontFamily: {
        'heading': ['Poppins', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'arabic': ['Amiri', 'serif'],
      },
      backgroundImage: {
        'islamic-pattern': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDQ1LCA5MCwgNjEsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')",
        'gradient-islamic': 'linear-gradient(135deg, #2D5A3D 0%, #1A4B2F 100%)',
        'gradient-gold': 'linear-gradient(135deg, #C4A746 0%, #B8941F 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
