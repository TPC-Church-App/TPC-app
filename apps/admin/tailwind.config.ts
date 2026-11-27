// apps/admin/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable fallbacks (kept from your original)
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // ===== TPC Brand Palette =====
        brand: {
          gold: '#C9A24A',
          goldDark: '#B08E3E',
          goldLight: '#E4C77A',
          goldSoft: '#F5EAD0', // for soft gold badges/tints
          ivory: '#FFF8EC',
          ivoryAlt: '#FDF9F0',
          charcoal: '#1F1F1F',
          navy: '#161B29',
        },
        surface: '#FFFFFF',
        success: {
          soft: '#E6F4EA',
          text: '#1E7A3E',
        },
        warning: {
          soft: '#FEF4D6',
          text: '#8A6A00',
        },
        danger: {
          soft: '#FDECEC',
          text: '#B42318',
        },
        info: {
          soft: '#E7EEFB',
          text: '#1E4FA8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        'card-lg': '0 8px 24px rgba(16,24,40,0.08)',
        gold: '0 8px 24px rgba(201,162,74,0.25)',
        'gold-sm': '0 4px 12px rgba(201,162,74,0.20)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(90deg, #C9A24A 0%, #B08E3E 100%)',
        'ivory-gradient':
          'linear-gradient(135deg, #FFF8EC 0%, #FDF3DD 50%, #F5EAD0 100%)',
        'sidebar-glow':
          'radial-gradient(1200px 400px at -10% 0%, rgba(201,162,74,0.10), transparent 60%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
