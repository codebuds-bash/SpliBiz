import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { 
  FiUsers, FiLayers, FiDollarSign, FiTrash2, FiActivity, FiSearch, FiRefreshCw, FiTrendingUp 
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
      
      // Note: If the relationship name is different, we might fallback to simple select.
      // But let's try to be robust.

      // 3. Fetch Recent Expenses (limit 50 for performance)
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*, groups(name), profiles(full_name)")
        .order('created_at', { ascending: false })
        .limit(50);
      
      // 4. Construct Activity Log
      // Combining recent users, groups, and expenses into a single timeline
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
      // Don't breakdown completely on minor errors, but show alert
      setError(err.message);
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

  // Calc Stats
  const totalMoneyTracked = (data.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-green-500/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500 text-black uppercase tracking-wider">God Mode</span>
                </div>
                <p className="text-gray-500 text-sm">Real-time monitoring and management console.</p>
            </div>
            <div className="flex items-center gap-3">
                 <div className="relative group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search system..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#111] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-green-500/50 w-64 transition-all"
                    />
                 </div>
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white border border-white/10 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </header>

        {error && (
            <div className="p-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-lg mb-8 text-sm">
                <strong>System Warning:</strong> {error}
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard 
                label="Total Users" 
                value={data.users.length} 
                trend="+12% this week" // Mock trend
                icon={<FiUsers />} 
                color="blue" 
            />
            <StatCard 
                label="Total Groups" 
                value={data.groups.length} 
                trend="Active & Growing" 
                icon={<FiLayers />} 
                color="green" 
            />
            <StatCard 
                label="Total Volume" 
                value={`$${totalMoneyTracked.toLocaleString()}`} 
                trend="All-time tracked" 
                icon={<FiDollarSign />} 
                color="amber" 
            />
             <StatCard 
                label="System Health" 
                value="99.9%" 
                trend="Operational" 
                icon={<FiActivity />} 
                color="purple" 
            />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Lists */}
            <div className="lg:col-span-2 space-y-8">
                {/* Tabs Config */}
                <div className="flex gap-1 bg-[#111] p-1 rounded-lg w-fit border border-white/5">
                    {['overview', 'users', 'groups'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                activeTab === tab 
                                ? 'bg-[#222] text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="bg-[#111] rounded-xl border border-white/5 shadow-inner overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white">Registered Users</h3>
                            <span className="text-xs text-gray-500">{filteredUsers.length} records</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] uppercase text-gray-500 font-bold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-3">User Details</th>
                                        <th className="px-6 py-3">Joined</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{u.full_name || "Unknown"}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{u.email || "No Email"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-400 text-xs">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded transition-all"
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
                    <div className="bg-[#111] rounded-xl border border-white/5 shadow-inner overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white">Active Groups</h3>
                            <span className="text-xs text-gray-500">{filteredGroups.length} records</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                           <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] uppercase text-gray-500 font-bold sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-3">Group Name</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Created</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredGroups.map(g => (
                                        <tr key={g.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-3 font-medium text-white">{g.name}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wide text-gray-400">
                                                    {g.type || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-400 text-xs">
                                                {new Date(g.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button 
                                                    onClick={() => handleDeleteGroup(g.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded transition-all"
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
                     <div className="bg-[#111] rounded-xl border border-white/5 p-8 text-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20">
                         <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-800 rounded-2xl mx-auto mb-6 shadow-2xl shadow-green-900/50 flex items-center justify-center text-white text-2xl">
                                <FiActivity />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Central Command</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                You have full read/write access to the database. Use the tabs above to manage users and groups. 
                                <br/><br/>
                                ⚠️ <strong>Caution:</strong> Actions taken here are irreversible.
                            </p>
                            <button 
                                onClick={() => setActiveTab('users')} 
                                className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Manage Users
                            </button>
                         </div>
                     </div>
                )}

            </div>

            {/* Right Col: Activity Feed */}
            <div className="space-y-6">
                <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[700px]">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <FiTrendingUp className="text-green-500" /> Live Feed
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {data.activityLog.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 text-xs">No recent activity found.</div>
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

function StatCard({ label, value, trend, icon, color }) {
    const colors = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        green: "text-green-400 bg-green-500/10 border-green-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };

    return (
        <div className={`p-5 rounded-xl border bg-[#111] relative overflow-hidden group`}>
             <div className="flex justify-between items-start mb-4">
                 <div>
                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{label}</p>
                     <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                 </div>
                 <div className={`p-2.5 rounded-lg ${colors[color]} transition-transform group-hover:scale-110`}>
                     {icon}
                 </div>
             </div>
             <div className="text-xs text-gray-500 flex items-center gap-1">
                 <span className="text-green-500 font-medium">{trend}</span>
             </div>
        </div>
    );
}

function ActivityItem({ item }) {
    const { type, date, data } = item;
    
    let content = null;
    let icon = null;
    let color = "bg-gray-800";

    switch(type) {
        case 'user_join':
            icon = <FiUsers className="text-blue-400" />;
            color = "border-l-2 border-blue-500";
            content = (
                <div>
                    <span className="text-blue-400 font-bold text-xs uppercase">New User</span>
                    <p className="text-sm text-gray-300">
                        <span className="text-white font-medium">{data.full_name || "Someone"}</span> joined the platform.
                    </p>
                </div>
            );
            break;
        case 'group_create':
            icon = <FiLayers className="text-green-400" />;
            color = "border-l-2 border-green-500";
            content = (
                <div>
                    <span className="text-green-400 font-bold text-xs uppercase">New Group</span>
                    <p className="text-sm text-gray-300">
                        <span className="text-white font-medium">{data.name}</span> was created.
                    </p>
                </div>
            );
            break;
        case 'expense_log':
            icon = <FiDollarSign className="text-amber-400" />;
            color = "border-l-2 border-amber-500";
            content = (
                <div>
                    <span className="text-amber-400 font-bold text-xs uppercase">Expense</span>
                    <p className="text-sm text-gray-300">
                        <span className="text-white font-medium">${data.amount}</span> added in <span className="opacity-75">{data.groups?.name || 'Unknown Group'}</span>.
                    </p>
                </div>
            );
            break;
    }

    return (
        <div className={`pl-4 relative ${color}`}>
            <div className="text-[10px] text-gray-600 mb-1 font-mono">{new Date(date).toLocaleString()}</div>
            {content}
        </div>
    );
}
