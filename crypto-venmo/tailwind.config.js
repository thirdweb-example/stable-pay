/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        venmo: {
          blue: '#3D95CE',
          darkBlue: '#2B7CB3',
          lightBlue: '#E8F4F8',
          gray: '#8E8E93',
          lightGray: '#F2F2F7',
          green: '#34C759',
          red: '#FF3B30',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 12px rgba(61, 149, 206, 0.3)',
      }
    },
  },
  plugins: [],
}
