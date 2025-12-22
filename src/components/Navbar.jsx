import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { Icons } from "./UIComponents";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
  }

  // Get user initials or avatar
  const getAvatar = () => {
    if (!user) return null;
    const { user_metadata } = user;
    if (user_metadata?.avatar_url) {
      return (
        <img 
          src={user_metadata.avatar_url} 
          alt="Profile" 
          className="w-8 h-8 rounded-full border border-[var(--border-color)]"
        />
      );
    }
    // Fallback to initials
    const name = user_metadata?.full_name || user.email || "U";
    const initial = name.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--primary-green)] text-black flex items-center justify-center font-bold text-sm">
        {initial}
      </div>
    );
  };

  return (
    <nav className="border-b border-[var(--border-color)] bg-[var(--bg-body)] relative z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 z-50">
          <svg className="h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
          </svg>
          <Link to="/" className="text-xl font-bold flex items-center gap-2 text-white" onClick={() => setMenuOpen(false)}>
            SpliBiz
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-4 items-center text-sm font-medium">
          {!user ? (
            <>
              <Link to="/login" className="text-[var(--text-muted)] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary py-1.5 px-3 text-sm">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />
              <Link to="/dashboard" className="text-[var(--text-muted)] hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors">
                {getAvatar()}
              </Link>
              <button onClick={logout} className="btn-secondary py-1.5 px-3 text-sm">
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-white z-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-[#1c1c1c] z-40 flex flex-col items-center justify-center gap-8 md:hidden animate-in fade-in duration-200">
          {!user ? (
            <>
              <Link 
                to="/login" 
                className="text-xl text-[var(--text-muted)] hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="btn-primary py-3 px-8 text-lg"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 mb-4">
                {getAvatar()}
                <span className="text-white font-medium">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <Link 
                to="/dashboard" 
                className="text-xl text-[var(--text-muted)] hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                className="text-xl text-[var(--text-muted)] hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button 
                onClick={logout} 
                className="text-xl text-red-500 hover:text-red-400"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
