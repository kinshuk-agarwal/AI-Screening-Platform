/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: "#1D9E75"
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                heading: ['"Syne"', 'sans-serif']
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}
