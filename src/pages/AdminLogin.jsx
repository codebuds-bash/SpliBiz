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

    const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === ADMIN_USER && password === ADMIN_PASS) {
        localStorage.setItem("super_admin_session", "true");
        localStorage.setItem("super_admin_email", email);
        addToast("Welcome back, Admin.", "success");
        navigate("/admin-dashboard");
    } else {
        addToast("Invalid credentials", "error");
        setPassword("");
        setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-[var(--bg-body)] flex flex-col items-center justify-center p-4">
        
        {/* Simple modern card */}
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl">
            <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-[var(--primary-green)]/10 text-[var(--primary-green)]">
                    <FiLock className="w-6 h-6" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">
                Admin Access
            </h1>
            <p className="text-center text-[var(--text-muted)] text-sm mb-8">
                Sign in to manage the splibiz platform.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                   <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block uppercase tracking-wider">Email Address</label>
                   <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field w-full"
                        placeholder="admin@splibiz.com"
                        required
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block uppercase tracking-wider">Password</label>
                   <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field w-full"
                        placeholder="••••••••"
                        required
                   />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-2 py-3 flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <>
                            <FiCpu className="animate-spin" /> Authenticating...
                        </>
                    ) : (
                        <span>Sign In</span>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button onClick={() => navigate('/')} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                    Back to Home
                </button>
            </div>
      </div>
    </div>
  );
}
