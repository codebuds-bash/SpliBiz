import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Icons } from "./UIComponents";
import { useAuth } from "../contexts/AuthContext";

export default function ExpenseList({ groupId, refreshTrigger, members, onEdit }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [groupId, refreshTrigger]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          id,
          title,
          amount,
          created_at,
          created_by,
          expense_payments (
            user_id,
            paid_amount
          ),
          expense_splits (
            user_id,
            share
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  // Get Avatar Helper
  const getAvatar = (userId) => {
    const member = members.find(m => m.user_id === userId);
    if (member?.avatar_url) {
      return <img src={member.avatar_url} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--primary-green)]/20 text-[var(--primary-green)] flex items-center justify-center font-bold text-sm border border-[var(--primary-green)]/30">
        {(member?.username || "?").substring(0, 2).toUpperCase()}
      </div>
    );
  };
  
  const getMemberName = (userId) => {
      const member = members.find(m => m.user_id === userId);
      return member?.name || "Unknown";
  }

  if (loading) return <div className="text-center text-[var(--text-muted)] py-8">Loading expenses...</div>;

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
        <Icons.Receipt />
        <p className="mt-2 text-sm">No expenses yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        // Who paid?
        const payerId = expense.expense_payments?.[0]?.user_id;
        const payerName = payerId === user?.id ? "You" : getMemberName(payerId);
        
        // My Logic
        const myPayment = expense.expense_payments?.find(p => p.user_id === user?.id)?.paid_amount || 0;
        const myShare = expense.expense_splits?.find(s => s.user_id === user?.id)?.share || 0;
        const netBalance = myPayment - myShare; // +ve means I lent, -ve means I borrowed

        let statusText = "not involved";
        let statusColor = "text-[var(--text-muted)]";
        let statusAmount = "";

        if (netBalance > 0.01) {
            statusText = "you lent";
            statusColor = "text-[var(--primary-green)]";
            statusAmount = `₹${netBalance.toFixed(2)}`;
        } else if (netBalance < -0.01) {
             statusText = "you borrowed";
             statusColor = "text-red-400";
             statusAmount = `₹${Math.abs(netBalance).toFixed(2)}`;
        } else if (myPayment > 0) {
             statusText = "you paid"; // Settled exactly
             statusColor = "text-[var(--text-muted)]";
             statusAmount = `₹${myPayment.toFixed(2)}`;
        }

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-[var(--border-color)] rounded-xl hover:border-[var(--primary-green)] transition-all group"
          >
            <div className="flex items-center gap-4">
              {/* DATE */}
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#2a2a2a] rounded-lg text-[var(--text-muted)] font-medium text-xs shrink-0">
                 <span className="text-[10px] uppercase opacity-70">
                    {new Date(expense.created_at).toLocaleString('default', { month: 'short' })}
                 </span>
                 <span className="text-lg font-bold text-white">
                    {new Date(expense.created_at).getDate()}
                 </span>
              </div>
              
               {/* CREATOR AVATAR */}
               <div className="shrink-0">
                    {getAvatar(expense.created_by)}
               </div>

              <div className="min-w-0">
                <h4 className="text-white font-medium text-base truncate">{expense.title}</h4>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  <span className="font-medium text-white">{payerName}</span> paid <span className="text-white font-medium">₹{Number(expense.amount).toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                 <span className={`text-[10px] uppercase font-bold tracking-wider block ${statusColor}`}>
                    {statusText}
                 </span>
                 {statusAmount && (
                    <p className={`font-bold ${statusColor}`}>{statusAmount}</p>
                 )}
              </div>

              {/* ACTIONS (Only for creator) */}
              {user?.id === expense.created_by && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(expense);
                        }}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                        title="Edit Expense"
                    >
                        <Icons.Pencil />
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("Delete this expense?")) {
                            const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
                            if (error) {
                                console.error(error); 
                                alert("Failed to delete");
                            } else {
                                fetchExpenses();
                            }
                            }
                        }}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                        title="Delete Expense"
                    >
                        <Icons.Trash />
                    </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
