import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function GroupBalances({ groupId, members, refreshTrigger }) {
  const { user } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateBalances();
  }, [groupId, refreshTrigger, members]);

  async function calculateBalances() {
    try {
      setLoading(true);

      // Fetch ALL expenses for this group to calculate totals
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select(`
          id,
          amount,
          expense_payments (user_id, paid_amount),
          expense_splits (user_id, share)
        `)
        .eq("group_id", groupId);

      if (error) throw error;

      // Calculate Net Balance for each member
      // Balance = Total Paid - Total Share
      // +ve = Owed (Get back)
      // -ve = Owes (Pay)

      const bal = {};
      members.forEach(m => {
        bal[m.user_id] = 0;
      });

      expenses?.forEach(exp => {
        // Add payments
        exp.expense_payments?.forEach(p => {
            if (bal[p.user_id] !== undefined) {
                bal[p.user_id] += Number(p.paid_amount);
            }
        });

        // Subtract splits
        exp.expense_splits?.forEach(s => {
            if (bal[s.user_id] !== undefined) {
                bal[s.user_id] -= Number(s.share);
            }
        });
      });

      setBalances(bal);

    } catch (error) {
      console.error("Error calculating balances:", error);
    } finally {
      setLoading(false);
    }
  }

  const getMemberName = (id) => members.find(m => m.user_id === id)?.name || "Unknown";
  const getMemberAvatar = (id) => members.find(m => m.user_id === id)?.avatar_url;

  const sortedMemberIds = Object.keys(balances).sort((a, b) => balances[b] - balances[a]); // Highest +ve first

  if (loading) return <div className="text-sm text-[var(--text-muted)] animate-pulse">Calculating balances...</div>;

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
