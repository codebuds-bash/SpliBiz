import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Icons, Modal } from "./UIComponents";
import { useAuth } from "../contexts/AuthContext";

export default function ExpenseList({ expenses, loading, members, onEdit, onRefresh }) {
  const { user } = useAuth();
  const [selectedExpense, setSelectedExpense] = useState(null);
  
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

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
        <Icons.Receipt />
        <p className="mt-2 text-sm">No expenses yet</p>
      </div>
    );
  }

  return (
    <>
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

                <div className="min-w-0 max-w-[120px] sm:max-w-xs">
                  <h4 className="text-white font-medium text-base truncate">{expense.title}</h4>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    <span className="font-medium text-white">{payerName}</span> paid <span className="text-white font-medium">₹{Number(expense.amount).toFixed(2)}</span>
                  </p>
                </div>

                 {/* SPLIT STACK */}
                 <div 
                    className="hidden sm:flex -space-x-3 items-center pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpense(expense);
                    }}
                 >
                   {expense.expense_splits?.map(split => members.find(m => m.user_id === split.user_id)).filter(Boolean).slice(0, 4).map((m, i) => (
                      <div key={m.user_id} className="relative z-[0] hover:z-10 transition-transform hover:scale-110" style={{ zIndex: i }}>
                          {m.avatar_url ? (
                              <img 
                                  src={m.avatar_url} 
                                  className="w-8 h-8 rounded-full border-2 border-[#1e1e1e] object-cover"
                                  title={m.name}
                              />
                          ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-[#1e1e1e] bg-[var(--primary-green)]/20 text-[var(--primary-green)] flex items-center justify-center text-[10px] font-bold" title={m.name}>
                                  {m.name?.substring(0, 2).toUpperCase()}
                              </div>
                          )}
                      </div>
                   ))}
                   {(expense.expense_splits?.length || 0) > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#1e1e1e] bg-[#2a2a2a] text-gray-400 flex items-center justify-center text-[10px] font-bold z-10">
                          +{expense.expense_splits.length - 4}
                      </div>
                   )}
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
                                  onRefresh?.();
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

      <Modal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title="Split Details"
      >
        {selectedExpense && (
            <div className="space-y-4">
               <div>
                  <h4 className="text-lg font-bold text-white">{selectedExpense.title}</h4>
                  <p className="text-[var(--text-muted)] text-sm">
                      Total: <span className="text-white font-medium">₹{Number(selectedExpense.amount).toFixed(2)}</span>
                  </p>
               </div>

               <div className="bg-[#2a2a2a] rounded-lg p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {selectedExpense.expense_splits?.map((split) => {
                        const member = members.find(m => m.user_id === split.user_id);
                        if (!member) return null; // Should not happen often
                        return (
                            <div key={split.user_id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[var(--primary-green)]/20 text-[var(--primary-green)] flex items-center justify-center font-bold text-xs">
                                                {member.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{member.name}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                            {split.user_id === user?.id ? "You" : "Member"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-bold block">₹{Number(split.share).toFixed(2)}</span>
                                    <span className="text-[10px] text-[var(--text-muted)]">share</span>
                                </div>
                            </div>
                        )
                    })}
               </div>
               
               <div className="pt-2 border-t border-[var(--border-color)]">
                    <p className="text-center text-xs text-[var(--text-muted)]">
                        Paid by <span className="text-white font-medium">{
                             selectedExpense.expense_payments?.[0]?.user_id === user?.id 
                                ? "You" 
                                : members.find(m => m.user_id === selectedExpense.expense_payments?.[0]?.user_id)?.name
                        }</span>
                    </p>
               </div>
            </div>
        )}
      </Modal>
    </>
  );
}
