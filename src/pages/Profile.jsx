import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Loader } from "../components/UIComponents";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .single()
      .then(res => {
        setProfile(res.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md card">
          <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
