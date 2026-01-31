import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/admins";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin(user.email)) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-2">You do not have permission to view this page.</p>
            <p className="text-gray-500">Your email: <code className="bg-white/10 px-2 py-1 rounded text-orange-400">{user.email}</code></p>
            <p className="text-sm text-gray-600 mt-8 max-w-md text-center">
                Add this email to <code className="text-gray-400">src/utils/admins.js</code> to gain access.
            </p>
            <a href="/" className="mt-8 px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Go Home</a>
        </div>
    );
  }

  return children;
}
