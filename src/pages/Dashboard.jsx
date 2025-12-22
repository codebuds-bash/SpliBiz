import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast, Modal, Icons, Loader } from "../components/UIComponents";

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newName, setNewName] = useState("");
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      addToast("Error fetching groups: " + error.message, "error");
    } else {
      setGroups(data || []);
    }
    setLoading(false);
  }

  // --- Delete Handlers ---
  const openDeleteModal = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    const { error } = await supabase.from("groups").delete().eq("id", selectedGroup.id);
    
    if (error) {
      addToast("Failed to delete group: " + error.message, "error");
    } else {
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      addToast("Group deleted successfully", "success");
      setIsDeleteModalOpen(false);
      setSelectedGroup(null);
    }
  };

  // --- Rename Handlers ---
  const openRenameModal = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroup(group);
    setNewName(group.name);
    setIsRenameModalOpen(true);
  };

  const confirmRename = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !newName.trim() || newName === selectedGroup.name) {
      setIsRenameModalOpen(false);
      return;
    }

    const { error } = await supabase
      .from("groups")
      .update({ name: newName.trim() })
      .eq("id", selectedGroup.id);

    if (error) {
      addToast("Failed to rename group: " + error.message, "error");
    } else {
      setGroups(prev => prev.map(g => (g.id === selectedGroup.id ? { ...g, name: newName.trim() } : g)));
      addToast("Group renamed successfully", "success");
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
          <Link to="/create-group" className="btn-primary">
            New Group
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size="lg" />
          </div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-16 border-dashed border-2 bg-transparent">
            <h3 className="text-lg font-medium text-white mb-2">No groups yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Create a group to start tracking expenses.</p>
            <Link to="/create-group" className="btn-secondary">
              Create a Group
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(g => (
              <Link key={g.id} to={`/group/${g.id}`} className="card hover:border-[var(--primary-green)] transition-all group relative block">
                <div className="h-2 w-full absolute top-0 left-0 bg-gradient-to-r from-[var(--primary-green)] to-[#249c6e] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mt-2">
                  <h3 className="text-xl font-semibold text-white truncate pr-2">{g.name}</h3>
                  
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => openRenameModal(e, g)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                      title="Rename"
                    >
                      <Icons.Pencil />
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(e, g)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition"
                      title="Delete"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-[var(--text-muted)] mt-4">
                  <span>{g.type || 'Flat'}</span>
                  <span className="font-mono text-xs opacity-50">ID: {g.id.slice(0, 4)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Group">
        <form onSubmit={confirmRename}>
          <div className="mb-6">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
              Group Name
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsRenameModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Group">
        <div className="flex flex-col items-center text-center mb-6">
          <Icons.Warning />
          <p className="text-white mt-4">
            Are you sure you want to delete <span className="font-bold text-[var(--primary-green)]">"{selectedGroup?.name}"</span>?
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            This action cannot be undone. All expenses and history will be lost.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded transition-colors">
            Delete Group
          </button>
        </div>
      </Modal>
    </div>
  );
}
