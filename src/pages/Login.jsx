import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../components/UIComponents";
import { FcGoogle } from "react-icons/fc";

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
      
      // Check for pending join
      const joinToken = localStorage.getItem("join_token");
      if (joinToken) {
        // Clear token and redirect to join page
        localStorage.removeItem("join_token");
        navigate(`/join?token=${joinToken}`, { replace: true });
      } else {
        const redirectTo = location.state?.from || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    }
  }

  // Google login
  async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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

          

          
          <button
            onClick={loginWithGoogle}
            className="flex items-center justify-center w-full border border-gray-700 rounded-md py-2 text-sm text-white hover:bg-gray-800 transition"
          >
            <FcGoogle className="text-xl mr-2" />
            Continue with Google
          </button>

          
        </div>
      </div>
    </div>
  );
}
