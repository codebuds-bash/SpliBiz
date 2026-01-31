import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/admins";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (!user || !isAdmin(user.email)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
