/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        screens: {
            sm: "640px",
            md: "768px",
            lg: "1024px",
        },
        extend: {
        colors: {
            primary: {
            DEFAULT: '#a92d2d',
            dark: '#8b2424',
            }
        },
        backdropBlur: {
            xs: '2px',
        }
        },
    },
    plugins: [],
}
