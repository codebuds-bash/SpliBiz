import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Loader, useToast } from "../components/UIComponents";

export default function CompleteProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .single();

      // Auto-fill name from Google if missing
      if (!profile?.name && user.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      } else {
        setName(profile?.name || "");
      }

      // If already completed → skip
      if (profile?.username) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      addToast("Not authenticated", "error");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        username: username.trim(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      if (error.message.includes("duplicate")) {
        addToast("Username already taken", "error");
      } else {
        addToast(error.message, "error");
      }
      return;
    }

    addToast("Profile completed 🎉", "success");
    navigate("/dashboard", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-body)]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-[420px] card">
          <h1 className="text-2xl font-bold text-white mb-2">
            Complete your profile
          </h1>

          <p className="text-sm text-[var(--text-muted)] mb-6">
            Just one last step before you start using SpliBiz
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="input-field"
                placeholder="unique_username"
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                This will be used to add you to groups
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader size="sm" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
