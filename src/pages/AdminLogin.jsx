import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/UIComponents";
import { FiLock, FiCpu } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    // Hardcoded credentials check from .env
    const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === ADMIN_USER && password === ADMIN_PASS) {
        // SUCCESS: Set a special local storage flag
        // We aren't using Supabase auth for this specific super-admin mode anymore
        localStorage.setItem("super_admin_session", "true");
        localStorage.setItem("super_admin_email", email);
        
        addToast("Welcome, Creator.", "success");
        navigate("/admin-dashboard");
    } else {
        addToast("Invalid System Credentials", "error");
        setPassword("");
        setLoading(false);
    }
  }
  
  // ... render ...

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
                Enter Credentials
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                   <label className="text-xs text-green-500 mb-1 block uppercase">Admin Email</label>
                   <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black border border-green-500/30 rounded p-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder-gray-700"
                        placeholder="admin@splibiz.com"
                   />
                </div>
                <div>
                   <label className="text-xs text-green-500 mb-1 block uppercase">Passphrase</label>
                   <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-green-500/30 rounded p-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder-gray-700"
                        placeholder="••••••••"
                   />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative flex items-center justify-center gap-3 bg-green-600 text-black font-bold py-4 px-6 rounded-lg hover:bg-green-500 transition-all active:scale-95 disabled:opacity-50 mt-6"
                >
                    {loading ? (
                    <FiCpu className="animate-spin text-xl" />
                    ) : (
                        <span>AUTHENTICATE</span>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button onClick={() => navigate('/')} className="text-xs text-gray-600 hover:text-green-500 transition-colors">
                    &lt; RETURN TO MAIN TERMINAL
                </button>
            </div>
      </div>
    </div>
  );
}
