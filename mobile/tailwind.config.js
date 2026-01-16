module.exports = {
  darkMode: 'class',
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light Mode (Default)
        background: "#ffffff",
        surface: "#f8fafc", // slate-50
        border: "#e2e8f0", // slate-200
        muted: "#64748b", // slate-500
        main: "#0f172a", // slate-900 (Text)
        
        // Dark Mode (Spotify Dark)
        "dark-background": "#121212",
        "dark-surface": "#212121",
        "dark-border": "#535353",
        "dark-muted": "#b3b3b3",
        "dark-main": "#ffffff",

        primary: "#1db954",
        "primary-hover": "#1aa34a",
        "primary-dark": "#1aa34a", 
      },
      fontFamily: {
        sans: ["Outfit-Regular", "System"],
        bold: ["Outfit-Bold", "System"],
        medium: ["Outfit-Medium", "System"],
      }
    },
  },
  plugins: [],
}
