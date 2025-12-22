import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ensureProfile } from "../utils/ensureProfile";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const joinToken = localStorage.getItem("join_token");

  useEffect(() => {
    // If loading, do nothing yet
    if (loading) return;

    // 1️⃣ Handle Join Token Redirect (ONLY if authenticated)
    if (user && joinToken) {
        navigate(`/join?token=${joinToken}`, { replace: true });
        return;
    }
    
    // 2️⃣ Profile Check (Skip if already on complete-profile)
    if (user && location.pathname !== "/complete-profile") {
        ensureProfile(user, navigate);
    }
  }, [user, loading, navigate, location.pathname, joinToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-body)]">
        <div className="text-white">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
