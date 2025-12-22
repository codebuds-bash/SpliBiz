import { supabase } from "../supabaseClient";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Loader } from "../components/UIComponents";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  async function createGroup(e) {
    e.preventDefault();
    setLoading(true);

    // 1️⃣ Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      addToast("User not authenticated", "error");
      setLoading(false);
      return;
    }

    // 2️⃣ Create Group & Select ID immediately
    const { data: group, error: insertError } = await supabase
      .from("groups")
      .insert({
        name,
        type: "flat",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      addToast("Error creating group: " + insertError.message, "error");
      setLoading(false);
      return;
    }

    // 3️⃣ Add creator as group member (REQUIRED)
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin"
      });

    if (memberError) {
      addToast("Error adding member: " + memberError.message, "error");
      setLoading(false);
      return; // Stop here if member add fails
    }

    addToast("Group created successfully!", "success");
    navigate(`/group/${group.id}`);
    
    setLoading(false);


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
                className="btn-primary disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size="sm" className="text-black" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
