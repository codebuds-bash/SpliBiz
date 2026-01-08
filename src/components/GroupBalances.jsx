import { useAuth } from "../contexts/AuthContext";

export default function GroupBalances({ groupId, members, balances, loading }) {
  const { user } = useAuth();

  const getMemberName = (id) => members.find(m => m.user_id === id)?.name || "Unknown";
  const getMemberAvatar = (id) => members.find(m => m.user_id === id)?.avatar_url;

  if (loading) return <div className="text-sm text-[var(--text-muted)] animate-pulse">Calculating balances...</div>;

  const sortedMemberIds = Object.keys(balances || {}).sort((a, b) => balances[b] - balances[a]); // Highest +ve first

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold text-white">Balances</h3>
      
      <div className="space-y-3">
        {sortedMemberIds.map(userId => {
          const balance = balances[userId] || 0;
          if (Math.abs(balance) < 0.01) return null; // Hide settled

          const isOwed = balance > 0;
          const isYou = userId === user?.id;

          return (
            <div key={userId} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                 {getMemberAvatar(userId) ? (
                    <img src={getMemberAvatar(userId)} className="w-8 h-8 rounded-full object-cover" />
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {getMemberName(userId).substring(0, 2).toUpperCase()}
                    </div>
                 )}
                 <div>
                    <p className={`text-sm font-medium ${isYou ? "text-yellow-400" : "text-white"}`}>
                        {isYou ? "You" : getMemberName(userId)}
                    </p>
                 </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-bold uppercase block tracking-wider ${isOwed ? "text-[var(--primary-green)]" : "text-red-400"}`}>
                    {isOwed ? "gets back" : "owes"}
                </span>
                <span className={`text-sm font-bold ${isOwed ? "text-[var(--primary-green)]" : "text-red-400"}`}>
                    ₹{Math.abs(balance).toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}

        {Object.values(balances).every(b => Math.abs(b) < 0.01) && (
            <div className="text-center text-[var(--text-muted)] text-sm py-4">
                All settled up! 🎉
            </div>
        )}
      </div>
    </div>
  );
}

