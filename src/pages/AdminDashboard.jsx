import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { 
  FiUsers, FiLayers, FiDollarSign, FiTrash2, FiActivity, FiSearch, FiRefreshCw, FiTrendingUp, FiUnlock 
} from "react-icons/fi";

export default function AdminDashboard() {
  const [data, setData] = useState({
    users: [],
    groups: [],
    expenses: [],
    activityLog: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order('created_at', { ascending: false });
      if (usersError) throw usersError;

      // 2. Fetch Groups with owner info
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("*, profiles!groups_created_by_fkey(full_name)")
        .order('created_at', { ascending: false });
      
      // 3. Fetch Recent Expenses (limit 50)
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*, groups(name), profiles(full_name)")
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Calculate Activity Log
      const activities = [
        ...(users || []).map(u => ({ type: 'user_join', date: u.created_at, data: u })),
        ...(groups || []).map(g => ({ type: 'group_create', date: g.created_at, data: g })),
        ...(expenses || []).map(e => ({ type: 'expense_log', date: e.created_at, data: e }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

      setData({ 
        users: users || [], 
        groups: groups || [], 
        expenses: expenses || [],
        activityLog: activities
      });

    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err.message + ". If you see empty lists, it likely means RLS policies are preventing access.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("CRITICAL: Deleting a user can break groups and balances. Continue?")) return;
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        setData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    } catch (err) {
        alert("Failed to delete: " + err.message);
    }
  };

  const handleDeleteGroup = async (id) => {
     if (!window.confirm("Are you sure? This will delete all expenses in the group.")) return;
     try {
         const { error } = await supabase.from('groups').delete().eq('id', id);
         if (error) throw error;
         setData(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== id) }));
     } catch (err) {
         alert("Failed to delete: " + err.message);
     }
  };

  // Filtered Lists
  const filteredUsers = data.users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredGroups = data.groups.filter(g => 
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMoneyTracked = (data.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <FiUnlock className="text-[var(--primary-green)]" /> Admin Stats
                </h1>
                <p className="text-[var(--text-muted)]">Manage users, groups, and monitor system activity.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 <div className="relative group flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search users or groups..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-panel py-2.5 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:border-[var(--primary-green)]/50 w-full md:w-64 transition-all"
                    />
                 </div>
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="btn-secondary px-4 py-2 flex items-center justify-center gap-2"
                >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>
        </div>

        {error && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-xl mb-8 text-sm flex items-start gap-3">
               <FiActivity className="mt-0.5 shrink-0" />
               <div>
                 <strong>Data Access Warning:</strong> {error}
                 <p className="mt-1 opacity-80 text-xs">Since you logged in via the secret admin pass, ensure your database RLS policies allow reading this data.</p>
               </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard 
                label="Users" 
                value={data.users.length} 
                icon={<FiUsers />} 
            />
            <StatCard 
                label="Groups" 
                value={data.groups.length} 
                icon={<FiLayers />} 
            />
            <StatCard 
                label="Expenses" 
                value={data.expenses.length} 
                icon={<FiActivity />} 
            />
            <StatCard 
                label="Total Volume" 
                value={`$${totalMoneyTracked.toLocaleString()}`} 
                icon={<FiDollarSign />} 
                isGreen
            />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Lists */}
            <div className="lg:col-span-2 space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-white/5 pb-2">
                    {['overview', 'users', 'groups'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab 
                                ? 'bg-[var(--primary-green)]/10 text-[var(--primary-green)]' 
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="glass-panel overflow-hidden rounded-xl">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{u.full_name || "Unknown"}</div>
                                                        <div className="text-xs text-[var(--text-muted)] font-mono">{u.email || "No Email"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="opacity-50 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                    title="Delete User"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="glass-panel overflow-hidden rounded-xl">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                           <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4">Group</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredGroups.map(g => (
                                        <tr key={g.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-white">{g.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                                                    {g.type || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                                                {new Date(g.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteGroup(g.id)}
                                                    className="opacity-50 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                     <div className="glass-panel p-10 rounded-xl text-center">
                         <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-[var(--primary-green)]/10 rounded-2xl mx-auto mb-6 flex items-center justify-center text-[var(--primary-green)] text-2xl">
                                <FiActivity />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                                Select a category above to view detailed records. 
                                <br/>
                                As an admin, you have permission to delete content.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setActiveTab('users')} className="btn-primary">
                                    Manage Users
                                </button>
                                 <button onClick={() => setActiveTab('groups')} className="btn-secondary">
                                    Manage Groups
                                </button>
                            </div>
                         </div>
                     </div>
                )}

            </div>

            {/* Right Col: Activity Feed */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-xl h-[700px] flex flex-col">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <FiTrendingUp className="text-[var(--primary-green)]" /> Live Feed
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {data.activityLog.length === 0 ? (
                            <div className="text-center text-[var(--text-muted)] py-10 text-xs italic">
                                No activity found (Check RLS).
                            </div>
                        ) : (
                            data.activityLog.map((item, i) => (
                                <ActivityItem key={i} item={item} />
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}

// Sub-components

function StatCard({ label, value, icon, isGreen }) {
    return (
        <div className="glass-panel p-5 rounded-xl border border-white/5 relative overflow-hidden group">
             <div className="flex justify-between items-start mb-2">
                 <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">{label}</p>
                 <div className={`p-2 rounded-lg ${isGreen ? 'bg-[var(--primary-green)]/10 text-[var(--primary-green)]' : 'bg-white/5 text-white'} transition-transform group-hover:scale-110`}>
                     {icon}
                 </div>
             </div>
             <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
    );
}

function ActivityItem({ item }) {
    const { type, date, data } = item;
    
    let content = null;
    let color = "border-gray-700";

    switch(type) {
        case 'user_join':
            color = "border-blue-500";
            content = (
                <div>
                    <span className="text-blue-400 font-bold text-[10px] uppercase">New User</span>
                    <p className="text-sm text-[var(--text-muted)]">
                        <span className="text-white font-medium">{data.full_name || "Someone"}</span> joined.
                    </p>
                </div>
            );
            break;
        case 'group_create':
            color = "border-[var(--primary-green)]";
            content = (
                <div>
                    <span className="text-[var(--primary-green)] font-bold text-[10px] uppercase">New Group</span>
                    <p className="text-sm text-[var(--text-muted)]">
                        <span className="text-white font-medium">{data.name}</span> created.
                    </p>
                </div>
            );
            break;
        case 'expense_log':
            color = "border-amber-500";
            content = (
                <div>
                    <span className="text-amber-400 font-bold text-[10px] uppercase">Expense</span>
                    <p className="text-sm text-[var(--text-muted)]">
                        <span className="text-white font-medium">${data.amount}</span> added in <span className="opacity-75">{data.groups?.name || 'Group'}</span>.
                    </p>
                </div>
            );
            break;
    }

    return (
        <div className={`pl-4 relative border-l-2 ${color}`}>
            <div className="text-[10px] text-gray-500 mb-1 font-mono">{new Date(date).toLocaleString()}</div>
            {content}
        </div>
    );
}
