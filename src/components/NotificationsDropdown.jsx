import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function NotificationsDropdown({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10); // Check only last 10 for now

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

  // Handle click outside to close happens in parent usually, 
  // but here we just render the list.

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
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] p-8 text-center">No new notifications</p>
        )}

        {items.map((n) => (
          <div
            key={n.id}
            className={`p-4 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[#252525] transition-colors ${
              !n.is_read ? "bg-[#2a1f1f10] border-l-2 border-l-[var(--primary-green)]" : ""
            }`}
            onClick={() => markAsRead(n.id)}
          >
            <p className="text-sm text-white mb-1">{n.message}</p>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(n.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
