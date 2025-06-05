/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // React 컴포넌트 파일 경로
    "./public/index.html"      // public/index.html (필요한 경우)
  ],
  theme: {
    extend: {
      fontFamily: {
        gaegu: ['Gaegu', 'cursive'], // 'Gaegu' 폰트 추가
      },
    },
  },
  plugins: [],
}