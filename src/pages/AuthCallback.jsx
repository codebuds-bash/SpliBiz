import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // 1️⃣ Let Supabase parse the URL hash & restore session
      // Add timeout to prevent hanging on "Verifying..."
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Verification timed out")), 8000)
      );

      let data, error;
      try {
          const result = await Promise.race([
              supabase.auth.getSession(),
              timeoutPromise
          ]);
          data = result.data;
          error = result.error;
      } catch (err) {
          console.error("Auth callback race error:", err);
          error = err;
      }

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login", { replace: true });
        return;
      }

      if (data.session) {
        // 2️⃣ Clean the URL (remove #access_token)
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // 3️⃣ Check for pending join or go to dashboard
        const joinToken = localStorage.getItem("join_token");
        if (joinToken) {
           localStorage.removeItem("join_token");
           navigate(`/join?token=${joinToken}`, { replace: true });
        } else {
           navigate("/dashboard", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-body)]">
      <div className="text-white">Verifying...</div>
    </div>
  );
}
