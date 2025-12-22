import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { supabase } from "./supabaseClient";

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") {
    // 🔥 Remove OAuth tokens from URL (Vercel fix)
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search
    );
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
