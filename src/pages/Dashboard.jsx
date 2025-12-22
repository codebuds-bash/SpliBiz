import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Modal, Icons } from "../components/UIComponents";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newName, setNewName] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const navigate = useNavigate();
  const { addToast } = useToast();

  /* ---------------- FETCH GROUPS (CREATED + JOINED) ---------------- */
  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  async function fetchGroups() {
    setLoading(true);

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        role,
        groups (
          id,
          name,
          type,
          created_at
        )
      `)
      .eq("user_id", user.id) // 🔥 Only my memberships
      .order("created_at", { foreignTable: "groups", ascending: false });

    if (error) {
      addToast("Error fetching groups: " + error.message, "error");
      setGroups([]);
    } else {
      setGroups(
        data.map(row => ({
          ...row.groups,
          role: row.role,
        }))
      );
    }

    setLoading(false);
  }

  /* ---------------- JOIN GROUP ---------------- */
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!inviteLink.trim()) return;

    let token = inviteLink.trim();
    if (token.includes("token=")) {
      token = token.split("token=")[1];
    }

    navigate(`/join?token=${token}`);
  };

  /* ---------------- DELETE ---------------- */
  const openDeleteModal = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", selectedGroup.id);

    if (error) {
      addToast(error.message, "error");
    } else {
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      addToast("Group deleted", "success");
      setIsDeleteModalOpen(false);
      setSelectedGroup(null);
    }
  };

  /* ---------------- RENAME ---------------- */
  const openRenameModal = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroup(group);
    setNewName(group.name);
    setIsRenameModalOpen(true);
  };

  const confirmRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const { error } = await supabase
      .from("groups")
      .update({ name: newName.trim() })
      .eq("id", selectedGroup.id);

    if (error) {
      addToast(error.message, "error");
    } else {
      setGroups(prev =>
        prev.map(g =>
          g.id === selectedGroup.id ? { ...g, name: newName.trim() } : g
        )
      );
      addToast("Group renamed", "success");
      setIsRenameModalOpen(false);
      setSelectedGroup(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Groups</h1>
          <div className="flex gap-3">
            <button onClick={() => setIsJoinModalOpen(true)} className="btn-secondary">
              Join Group
            </button>
            <Link to="/create-group" className="btn-primary">
              New Group
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-white">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-16 border-dashed border-2 bg-transparent">
            <h3 className="text-lg font-medium text-white mb-2">No groups yet</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Create or join a group to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(g => (
              <Link
                key={g.id}
                to={`/group/${g.id}`}
                className="card hover:border-[var(--primary-green)] transition-all group relative"
              >
                {/* ROLE TAG */}
                <span
                  className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium
                    ${g.role === "admin"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                    }`}
                >
                  {g.role === "admin" ? "Admin" : "Member"}
                </span>

                <h3 className="text-xl font-semibold text-white truncate">
                  {g.name}
                </h3>

                <div className="flex justify-between items-center text-sm text-[var(--text-muted)] mt-4">
                  <span>{g.type || "Flat"}</span>
                  <span className="font-mono text-xs opacity-50">
                    ID: {g.id.slice(0, 4)}
                  </span>
                </div>

                {/* ADMIN ACTIONS */}
                {g.role === "admin" && (
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => openRenameModal(e, g)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    >
                      <Icons.Pencil />
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(e, g)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* RENAME MODAL */}
      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Group">
        <form onSubmit={confirmRename}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="input-field mb-6"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsRenameModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Group">
        <p className="text-white mb-6">
          Are you sure you want to delete <b>{selectedGroup?.name}</b>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={confirmDelete} className="bg-red-600 px-4 py-2 rounded text-white">
            Delete
          </button>
        </div>
      </Modal>

      {/* JOIN GROUP MODAL */}
      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Join Group">
        <form onSubmit={handleJoinSubmit}>
          <input
            value={inviteLink}
            onChange={e => setInviteLink(e.target.value)}
            className="input-field mb-6"
            placeholder="Invite link or token"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsJoinModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
