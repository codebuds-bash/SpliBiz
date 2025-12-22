import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Loader } from "../components/UIComponents";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Email + Password login
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast("Signed in successfully", "success");
      const redirectTo = location.state?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  }

  // Google login
  async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) alert(error.message);
}


  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-[400px] card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Sign in to continue to SpliBiz
            </p>
          </div>

          {/* Email + Password */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size="sm" className="text-black" /> 
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-[var(--text-muted)]">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Google Login */}
          <button
            onClick={loginWithGoogle}
            className="w-full border border-gray-700 rounded-md py-2 text-sm text-white hover:bg-gray-800 transition"
          >
            Continue with Google
          </button>

          <p className="text-xs text-[var(--text-muted)] mt-6 text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-white underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
