import { supabase } from "../supabaseClient";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../components/UIComponents";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

async function createGroup(e) {
  e.preventDefault();
  setLoading(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // INSERT + SELECT is now SAFE
    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        type: "flat",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Add creator as admin
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) throw memberError;

    addToast("Group created successfully!", "success");
    navigate(`/group/${group.id}`);
  } catch (err) {
    console.error(err);
    addToast(err.message || "Failed to create group", "error");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md card">
          <h1 className="text-2xl font-bold text-white mb-6">
            Create New Group
          </h1>

          <form onSubmit={createGroup}>
            <div className="mb-6">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                Group Name
              </label>
              <input
                placeholder="e.g. Summer Trip 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
