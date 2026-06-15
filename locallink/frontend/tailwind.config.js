/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "#2d7a3a", light: "#3da84e", dark: "#1e5228", 50: "#f0fdf4", 100: "#dcfce7" },
        secondary: { DEFAULT: "#f97316", light: "#fb923c", dark: "#ea6c0a", 50: "#fff7ed", 100: "#ffedd5" },
        accent:    { DEFAULT: "#fbbf24", light: "#fcd34d", dark: "#f59e0b" },
        earth:     { DEFAULT: "#92400e", light: "#b45309" },
        fresh:     { DEFAULT: "#dcfce7" },
        slate:     { 850: "#1a1a2e" },
      },
      fontFamily: {
        sans:    ["'Inter'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
      },
      boxShadow: {
        card:  "0 2px 16px 0 rgba(45,122,58,0.10)",
        pop:   "0 8px 32px 0 rgba(45,122,58,0.18)",
        soft:  "0 2px 8px rgba(0,0,0,0.06)",
        glow:  "0 0 24px rgba(45,122,58,0.15)",
        glass: "0 8px 32px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in':   'scaleIn 0.3s ease-out forwards',
        'bounce-in':  'bounceIn 0.5s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s ease infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                                        '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(16px)' },          '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-12px)' },         '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.9)' },                '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceIn:  { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' },                                    '50%': { opacity: '0.7' } },
        float:     { '0%, 100%': { transform: 'translateY(0)' },                      '50%': { transform: 'translateY(-8px)' } },
        shimmer:   { '0%': { backgroundPosition: '200% 0' },                          '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};
