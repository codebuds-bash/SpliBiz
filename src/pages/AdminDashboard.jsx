import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { FiUsers, FiLayers, FiDollarSign, FiTrash2, FiActivity } from "react-icons/fi";
import { useTheme } from "../components/UIComponents"; // Assuming you have this or standard styled components

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*");
      
      if (usersError) throw usersError;

      // Fetch Groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*, profiles(full_name)"); // Join if possible, otherwise just raw

      if (groupsError) throw groupsError;

      setUsers(usersData || []);
      setGroups(groupsData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this user? This is irreversible.")) return;
    try {
        // Delete from auth and profiles is tricky from client without service role. 
        // We will try deleting from profiles which might cascade or fail.
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== id));
    } catch (err) {
        alert("Failed to delete user: " + err.message);
    }
  };

  const handleDeleteGroup = async (id) => {
     if (!window.confirm("Are you sure?")) return;
     try {
         const { error } = await supabase.from('groups').delete().eq('id', id);
         if (error) throw error;
         setGroups(groups.filter(g => g.id !== id));
     } catch (err) {
         alert("Failed to delete group: " + err.message);
     }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Creator Dashboard</h1>
                <p className="text-gray-500">Welcome back, Boss. You have full control.</p>
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10">
                Refresh Data
            </button>
        </header>

        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-8">
                <strong>Error:</strong> {error} <br/>
                <span className="text-xs opacity-75">Note: You may need to update RLS policies in Supabase to allow your admin account to see all data.</span>
            </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-[#1c1c1c] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400"><FiUsers className="w-6 h-6" /></div>
                    <span className="text-gray-400">Total Users</span>
                </div>
                <div className="text-4xl font-bold text-white">{users.length}</div>
            </div>
            <div className="p-6 rounded-xl bg-[#1c1c1c] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-[var(--primary-green)]/20 text-[var(--primary-green)]"><FiLayers className="w-6 h-6" /></div>
                    <span className="text-gray-400">Total Groups</span>
                </div>
                <div className="text-4xl font-bold text-white">{groups.length}</div>
            </div>
            <div className="p-6 rounded-xl bg-[#1c1c1c] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400"><FiActivity className="w-6 h-6" /></div>
                    <span className="text-gray-400">System Status</span>
                </div>
                <div className="text-xl font-bold text-green-400">Operational</div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-8">
            {['overview', 'users', 'groups'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-[var(--primary-green)]' : 'text-gray-500 hover:text-white'}`}
                >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary-green)]" />}
                </button>
            ))}
        </div>

        {activeTab === 'users' && (
            <div className="bg-[#1c1c1c] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Full Name</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs opacity-50">{u.id.substring(0, 8)}...</td>
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                    {u.avatar_url && <img src={u.avatar_url} className="w-6 h-6 rounded-full" />}
                                    {u.full_name || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{new Date(u.updated_at || Date.now()).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'groups' && (
            <div className="bg-[#1c1c1c] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Group Name</th>
                            <th className="px-6 py-4">Created By</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {groups.map(g => (
                            <tr key={g.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{g.name}</td>
                                <td className="px-6 py-4 text-gray-400">{g.created_by?.substring(0, 8) || 'Unknown'}...</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded bg-white/10 text-xs">{g.type || 'General'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteGroup(g.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {(activeTab === 'overview') && (
            <div className="text-center py-20 text-gray-600">
                <p>Select a tab to manage resources.</p>
            </div>
        )}

      </div>
    </div>
  );
}
