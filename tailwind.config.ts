import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      primary:   { DEFAULT: '#7C3AED', hover: '#6D28D9', light: '#EDE9FE' },
      cta:       { DEFAULT: '#10B981', hover: '#059669'  },
      surface:   '#FFFFFF',
      background:'#F8FAFC',
      border:    '#E5E7EB',
      muted:     '#64748B',
      'text-main':'#0F172A',
    },
    borderRadius: { xl2: '20px', xl3: '24px' },
  }},
  plugins: [],
}
export default config
