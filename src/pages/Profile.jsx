import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../components/UIComponents";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState(null);

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!cancelled) navigate("/login");
        return;
      }

      // 1. Avatar from Auth Metadata
      if (user.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
      }

      // 2. Fetch Profile
      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // 3. Fetch Groups
      const groupsPromise = supabase
        .from("group_members")
        .select(`
          role,
          groups (
            id,
            name
          )
        `)
        .eq("user_id", user.id);

      const [profileResponse, groupsResponse] = await Promise.all([profilePromise, groupsPromise]);

      if (cancelled) return;

      // Handle Profile
      if (profileResponse.error) {
        addToast(profileResponse.error.message, "error");
      } else {
        setProfile(profileResponse.data);
        if (profileResponse.data?.avatar_url) {
          setUserAvatar(profileResponse.data.avatar_url);
        }
      }

      // Handle Groups
      if (groupsResponse.error) {
        console.error("Error fetching groups", groupsResponse.error);
      } else {
        const formattedGroups = groupsResponse.data.map(item => ({
          ...item.groups,
          role: item.role
        }));
        setUserGroups(formattedGroups);
      }

      setLoading(false);
    }

    fetchData();

    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) addToast(error.message, "error");
    else navigate("/");
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.name || "User";
  const displayUsername = profile?.username || "username";
  const displayEmail = profile?.email;

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex justify-center items-start min-h-[calc(100vh-80px)]">
        
        {loading ? (
           <div className="flex flex-col items-center gap-4 mt-20 animate-pulse">
             <div className="w-24 h-24 bg-gray-700 rounded-full" />
             <div className="h-8 w-48 bg-gray-700 rounded" />
             <div className="h-4 w-64 bg-gray-700 rounded" />
           </div>
        ) : (
          <div className="w-full max-w-lg relative">
            
            {/* Background Decor */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-blob mix-blend-screen pointer-events-none" />
            <div className="absolute top-20 -right-10 w-72 h-72 bg-[var(--primary-green)]/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none" />

            {/* Profile Card */}
            <div className="glass-panel rounded-2xl p-8 relative z-10 animate-fade-in-up">
              
              {/* Header / Avatar */}
              <div className="flex flex-col items-center mb-8 -mt-16">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[var(--primary-green)] to-blue-500 shadow-2xl">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border-4 border-[#1c1c1c] bg-[#1c1c1c]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1c1c1c] flex items-center justify-center relative overflow-hidden text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                      <span className="text-4xl font-bold">
                        {getInitials(displayName || displayEmail)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <p className="text-[var(--text-muted)] font-mono">@{displayUsername}</p>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold ml-1">
                    Display Name
                  </label>
                  <div className="p-3 text-lg font-medium border-b border-white/5">
                    {displayName}
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold ml-1">
                    Username
                  </label>
                  <div className="p-3 text-lg font-medium border-b border-white/5 font-mono text-[var(--primary-green)]">
                    @{displayUsername}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 opacity-60">
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold ml-1">
                    Email Address
                  </label>
                  <div className="p-3 text-base text-gray-400 border-b border-white/5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {displayEmail || "N/A"}
                  </div>
                </div>

              </div>
            </div>

            {/* Groups Section */}
            <div className="mt-8 animate-fade-in-up delay-100 relative z-10">
               <h3 className="text-lg font-bold mb-4 px-1">Associated Groups</h3>
               {userGroups.length === 0 ? (
                 <p className="text-[var(--text-muted)] text-sm px-1">You are not a member of any groups.</p>
               ) : (
                 <div className="space-y-3">
                   {userGroups.map(group => (
                     <div key={group.id} className="glass-panel p-4 rounded-xl flex justify-between items-center transition-transform hover:scale-[1.02] cursor-default">
                        <span className="font-medium text-white">{group.name}</span>
                        <span 
                          className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider border
                            ${group.role === 'admin' 
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                        >
                          {group.role}
                        </span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Logout Option */}
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleLogout}
                className="text-[var(--text-muted)] hover:text-red-400 text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out from all devices
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
