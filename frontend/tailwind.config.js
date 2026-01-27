/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'customBrown': '#c36d51',
        'brickRed': '#ad3614',
        'darkBrickRed': '#672727',
        'burntBrick': '#631d0c',
      },
    },
  },
  plugins: [],
}