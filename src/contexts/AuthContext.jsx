import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { ensureProfile } from "../utils/ensureProfile";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile
  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Fetch profile immediately
            const p = await fetchProfile(session.user.id);
            // Ensure profile exists if missing
            if (!p) {
                await ensureProfile(session.user); 
                await fetchProfile(session.user.id);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        if (user?.id !== session.user.id) {
            // New user, fetch profile
            fetchProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    refreshProfile: async () => {
        if (user) await fetchProfile(user.id);
    },
    signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
