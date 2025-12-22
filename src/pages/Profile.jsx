import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";


export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);

      // 1️⃣ Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!cancelled) {
          setError("Not authenticated");
          setLoading(false);
        }
        return;
      }

      // 2️⃣ Fetch ONLY this user's profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // safer than .single()

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md card">
          <h1 className="text-2xl font-bold text-white mb-6">
            Your Profile
          </h1>

          {loading ? (
            <div className="flex justify-center py-8 text-white">
              Loading...
            </div>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : !profile ? (
            <p className="text-red-400">Profile data not found.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="text-white text-lg font-medium">
                  {profile.name || "N/A"}
                </div>
              </div>

              <div className="border-t border-[var(--border-color)]" />

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Username
                </label>
                <div className="text-white text-lg font-medium font-mono">
                  @{profile.username || "unknown"}
                </div>
              </div>

              <div className="border-t border-[var(--border-color)]" />

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Email
                </label>
                <div className="text-white text-sm">
                  {profile.email || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
