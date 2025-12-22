import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader } from "./UIComponents";
import { ensureProfile } from "../utils/ensureProfile";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  const joinToken = localStorage.getItem("join_token");

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // 1️⃣ Get session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
        }

        // 2️⃣ Handle Join Token Redirect (ONLY if authenticated)
        // If we redirect, we don't strictly need to unset loading, as unmount happens.
        // But for safety, we process this.
        if (session?.user && joinToken) {
          navigate(`/join?token=${joinToken}`, { replace: true });
          return;
        }

        // 3️⃣ Profile Check
        if (session?.user) {
           await ensureProfile(session.user, navigate);
        }

      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    checkAuth();

    // 4️⃣ Listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        // Only trigger profile check if we have a session
        if (session?.user) {
            await ensureProfile(session.user, navigate);
        }
        setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 3️⃣ While auth is resolving
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-body)]">
        <Loader size="lg" />
      </div>
    );
  }

  // 4️⃣ Not authenticated
  if (!session) return <Navigate to="/login" replace />;

  // 5️⃣ Authenticated
  return children;
}
