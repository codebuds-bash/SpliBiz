import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useToast, Icons } from "./UIComponents";

export default function NotificationsDropdown({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey (
            name,
            avatar_url
          ),
          group:groups (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
          console.error("Notifications error:", error);
      }

      setItems(data || []);
      setLoading(false);
    }

    load();
  }, []);

  async function markAsRead(id) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function handleInvite(notification, accept) {
    try {
        if (accept) {
            // Add to group
            const { error: joinError } = await supabase
                .from("group_members")
                .insert({
                    group_id: notification.group_id,
                    user_id: notification.user_id,
                    role: 'member' // Default role
                });
            
            if (joinError) {
                // Ignore if unique violation (already member)
                if (joinError.code !== '23505') throw joinError;
            }
            addToast(`Joined group "${notification.group?.name}"`, "success");
        } else {
            addToast("Invite rejected", "info");
        }

        // Mark as read (or delete?) - Let's just delete the invite notification to clean up
        await supabase.from("notifications").delete().eq("id", notification.id);
        
        // Remove from list
        setItems(prev => prev.filter(n => n.id !== notification.id));

    } catch (err) {
        console.error(err);
        addToast("Failed to process invite", "error");
    }
  }

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-80 bg-[#1c1c1c] border border-[var(--border-color)] rounded-xl shadow-lg p-4 text-center">
        <span className="text-[var(--text-muted)] text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-[#1c1c1c] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[#141414]">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <button onClick={onClose}><Icons.Close className="w-4 h-4 text-[var(--text-muted)]" /></button>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] p-8 text-center">No new notifications</p>
        )}

        {items.map((n) => (
          <div
            key={n.id}
            className={`p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[#252525] transition-colors ${
              !n.is_read ? "bg-[#2a1f1f10] border-l-2 border-l-[var(--primary-green)]" : ""
            }`}
          >
            <div className="flex gap-3 items-start">
                 {/* Avatar */}
                 <div className="shrink-0">
                    {n.actor?.avatar_url ? (
                        <img src={n.actor.avatar_url} className="w-8 h-8 rounded-full bg-gray-700 object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-green)] text-black flex items-center justify-center font-bold text-xs">
                            {n.actor?.name?.[0] || "?"}
                        </div>
                    )}
                 </div>
                 
                 {/* Content */}
                 <div className="flex-1 min-w-0">
                     <p className="text-sm text-white mb-1">
                        <span className="font-semibold">{n.actor?.name || "Someone"}</span> {n.message}
                     </p>
                     <span className="text-xs text-[var(--text-muted)] block mb-2">
                        {new Date(n.created_at).toLocaleString()}
                     </span>

                     {/* Actions for Invite */}
                     {n.type === 'invite' && (
                         <div className="flex gap-2 mt-2">
                             <button 
                                onClick={() => handleInvite(n, true)}
                                className="bg-[var(--primary-green)] text-black text-xs font-semibold px-3 py-1 rounded hover:opacity-90 transition-opacity"
                             >
                                Accept
                             </button>
                             <button 
                                onClick={() => handleInvite(n, false)}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                             >
                                Reject
                             </button>
                         </div>
                     )}

                     {/* Mark read action for non-invites if not read */}
                     {!n.is_read && n.type !== 'invite' && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="text-[10px] text-[var(--text-muted)] hover:text-white underline mt-1"
                         >
                            Mark as read
                         </button>
                     )}
                 </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
