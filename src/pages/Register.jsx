import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Loader } from "../components/UIComponents";
import { FcGoogle } from "react-icons/fc";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // stored in auth.user_metadata
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      addToast(error.message, "error");
      return;
    }

    addToast(
      "Registration successful! Please check your email to verify your account.",
      "success"
    );

    // DO NOT navigate automatically
    // User must verify email first
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-[400px] card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Create an account
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Join SpliBiz to manage expenses
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size="sm" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-[var(--text-muted)]">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <button
            onClick={loginWithGoogle}
            className="flex items-center justify-center w-full border border-gray-700 rounded-md py-2 text-sm text-white hover:bg-gray-800"
          > <FcGoogle className="text-xl mr-2" />
            Sign up with Google
          </button>

          <p className="text-xs text-[var(--text-muted)] mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-white underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
