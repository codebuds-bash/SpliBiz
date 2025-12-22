import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Icons } from "./UIComponents";
import NotificationsDropdown from "./NotificationsDropdown";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setCount(count || 0);
    }

    fetchUnread();

    // Optional: Realtime subscription could go here
    const channel = supabase
      .channel("notifications_bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchUnread() // Refresh on new notification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="relative cursor-pointer text-[var(--text-muted)] hover:text-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icons.Bell className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>

      {isOpen && <NotificationsDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
