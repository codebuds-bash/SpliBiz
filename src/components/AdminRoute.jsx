import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/admins";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // We now ignore the Supabase user state for this route and check our critical flag
  const isSuperAdmin = localStorage.getItem("super_admin_session") === "true";

  if (!isSuperAdmin) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
}
