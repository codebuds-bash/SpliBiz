import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader } from "./UIComponents";
import { ensureProfile } from "../utils/ensureProfile";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1️⃣ Get initial session (important for Google OAuth)
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);

      if (data.session?.user) {
        await ensureProfile(data.session.user, navigate);
      }

      setLoading(false);
    });

    // 2️⃣ Listen for auth changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await ensureProfile(session.user, navigate);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
