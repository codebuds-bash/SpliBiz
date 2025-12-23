import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Modal, Icons } from "../components/UIComponents";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (user) {
        Promise.all([fetchGroups(), fetchRecentActivity()]).then(() => setLoading(false));
    }
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

    // setLoading(false); handled in useEffect
  }

  async function fetchRecentActivity() {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
            id, title, amount, created_at, group_id, created_by,
            groups (name)
        `)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (!error && data) {
          setRecentActivity(data);
      }
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* WELCOME HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-[var(--text-muted)]">Welcome back, get an overview of your shared expenses.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsJoinModalOpen(true)} className="btn-secondary flex items-center gap-2">
              <Icons.Plus className="w-4 h-4" /> Join Group
            </button>
            <Link to="/create-group" className="btn-primary flex items-center gap-2">
              <Icons.Plus className="w-4 h-4" /> New Group
            </Link>
          </div>
        </div>

        {/* STATS ROW */}
        {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="glass-panel p-5 rounded-xl border border-[var(--primary-green)]/20 bg-[var(--primary-green)]/5">
                    <p className="text-xs text-[var(--primary-green)] font-bold uppercase tracking-wider mb-1">Active Groups</p>
                    <p className="text-2xl font-bold text-white">{groups.length}</p>
                </div>
                {/* Placeholder stats for future - could be 'Total Owed' etc */}
                <div className="glass-panel p-5 rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">Recent Activity</p>
                    <p className="text-2xl font-bold text-white">{recentActivity.length}</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* MAIN CONTENT: GROUPS */}
            <div className="lg:col-span-2">
                 <h2 className="text-xl font-bold text-white mb-6">Your Groups</h2>
                
                {loading ? (
                    <div className="flex justify-center py-20 text-white animate-pulse">Loading groups...</div>
                ) : groups.length === 0 ? (
                    <div className="card text-center py-16 border-dashed border-2 bg-transparent">
                        <Icons.Home className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-white mb-2">No groups yet</h3>
                        <p className="text-[var(--text-muted)] mb-6">Create or join a group to start splitting bills.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.map(g => (
                        <Link
                            key={g.id}
                            to={`/group/${g.id}`}
                            className="card group relative cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            
                            <div className="relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white font-bold text-lg">
                                        {g.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span
                                        className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold tracking-wider border
                                            ${g.role === "admin"
                                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                            }`}
                                    >
                                        {g.role}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 truncate">{g.name}</h3>
                                <p className="text-xs text-[var(--text-muted)] mb-4">{g.type || 'Group Expense'}</p>

                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)]">
                                        Active
                                    </span>
                                    {/* ADMIN ACTIONS */}
                                    {g.role === "admin" && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => openRenameModal(e, g)}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                title="Rename"
                                            >
                                                <Icons.Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => openDeleteModal(e, g)}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Icons.Trash className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* SIDEBAR: RECENT ACTIVITY */}
            <div className="lg:col-span-1 space-y-8">
                <div>
                   <h2 className="text-xl font-bold text-white mb-6">Global Activity</h2>
                   {recentActivity.length === 0 ? (
                       <p className="text-[var(--text-muted)] text-sm italic">No recent activity across your groups.</p>
                   ) : (
                       <div className="space-y-4">
                           {recentActivity.map(activity => (
                               <div key={activity.id} className="glass-panel p-4 rounded-xl flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-[var(--bg-body)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                                       <Icons.Receipt className="w-5 h-5 text-[var(--text-muted)]" />
                                   </div>
                                   <div className="min-w-0 flex-1">
                                       <h4 className="text-white font-medium text-sm truncate">{activity.title}</h4>
                                       <p className="text-xs text-[var(--text-muted)] truncate">
                                           in <span className="text-white">{activity.groups?.name || 'Unknown Group'}</span>
                                       </p>
                                   </div>
                                   <div className="text-right shrink-0">
                                       <p className="text-white font-bold text-sm">₹{Number(activity.amount).toFixed(0)}</p>
                                       <p className="text-[10px] text-[var(--text-muted)]">
                                           {new Date(activity.created_at).toLocaleDateString()}
                                       </p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>

                <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-green)]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                    <h3 className="text-lg font-bold text-white mb-2 relative z-10">Quick Tips</h3>
                    <ul className="text-sm text-[var(--text-muted)] space-y-2 relative z-10 list-disc list-inside">
                        <li>Settle up regularly to keep balances simple.</li>
                        <li>Add descriptive titles to your expenses.</li>
                        <li>Invite friends using the share link in Group Details.</li>
                    </ul>
                </div>
            </div>

        </div>
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
