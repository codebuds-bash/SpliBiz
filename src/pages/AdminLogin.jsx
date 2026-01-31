import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/UIComponents";
import { FiLock, FiCpu } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  async function handleLogin() {
    setLoading(true);
    // We set the redirect to go back to admin dashboard
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/admin-dashboard`,
        },
    });

    if (error) {
        addToast(error.message, "error");
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        {/* Background Grid */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ 
                backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }}
        />

        <div className="relative z-10 w-full max-w-md bg-[#111] border border-green-500/30 p-8 rounded-xl shadow-2xl shadow-green-500/10">
            <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                    <FiLock className="w-8 h-8 text-green-500" />
                </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tighter">
                <span className="text-green-500">SYSTEM</span> ACCESS
            </h1>
            <p className="text-center text-gray-500 text-xs mb-8 uppercase tracking-widest">
                Restricted Area. Authorized Personnel Only.
            </p>

            <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-lg hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? (
                   <FiCpu className="animate-spin text-xl" />
                ) : (
                    <>
                        <FcGoogle className="text-2xl" />
                        <span>AUTHENTICATE WITH GOOGLE</span>
                    </>
                )}
            </button>

            <div className="mt-8 text-center">
                <button onClick={() => navigate('/')} className="text-xs text-gray-600 hover:text-green-500 transition-colors">
                    &lt; RETURN TO MAIN TERMINAL
                </button>
            </div>
      </div>
    </div>
  );
}
