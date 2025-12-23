import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "./UIComponents";

export default function SpendingInsights({ expenses, members }) {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'month'

  const filteredExpenses = useMemo(() => {
    if (timeFilter === "all") return expenses;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(e => {
      const d = new Date(e.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses, timeFilter]);

  // Calculations
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // My Share Calculation (Cost)
  const myTotalShare = filteredExpenses.reduce((sum, e) => {
    const mySplit = e.expense_splits?.find(s => s.user_id === user?.id);
    return sum + (mySplit?.share || 0);
  }, 0);

  // Spending per member (Share)
  const memberSpending = useMemo(() => {
    const map = {};
    members.forEach(m => { map[m.user_id] = 0; });
    
    filteredExpenses.forEach(e => {
       e.expense_splits?.forEach(s => {
          if (map[s.user_id] !== undefined) {
              map[s.user_id] += Number(s.share);
          }
       });
    });

    return Object.entries(map)
      .map(([id, amount]) => ({
        id,
        amount,
        member: members.find(m => m.user_id === id)
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, members]);

  const maxSpending = Math.max(...memberSpending.map(m => m.amount), 1);

  return (
    <div className="card space-y-6 animate-fade-in-up delay-100">
      
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold text-white flex items-center gap-2">
           <span className="p-1.5 bg-green-500/20 rounded text-green-400"><Icons.Receipt className="w-4 h-4" /></span>
           Spending Insights
         </h3>
         <select 
           value={timeFilter}
           onChange={(e) => setTimeFilter(e.target.value)}
           className="bg-[#2a2a2a] border border-[var(--border-color)] text-xs text-white rounded px-2 py-1 outline-none focus:border-[var(--primary-green)]"
         >
           <option value="all">All Time</option>
           <option value="month">This Month</option>
         </select>
      </div>

      {/* Big Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
           <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Group Total</p>
           <p className="text-2xl font-bold text-white">₹{totalSpent.toFixed(0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--primary-green)]/10 to-emerald-500/10 border border-[var(--primary-green)]/20">
           <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Your Share</p>
           <p className="text-2xl font-bold text-[var(--primary-green)]">₹{myTotalShare.toFixed(0)}</p>
        </div>
      </div>

      {/* Bar Chart: Spending (Share) Distribution */}
      <div>
         <h4 className="text-sm font-medium text-white mb-4">Share Distribution</h4>
         <div className="space-y-3">
           {memberSpending.map((item) => {
             const isMe = item.id === user?.id;
             const percent = (item.amount / maxSpending) * 100;
             
             return (
               <div key={item.id} className="group">
                 <div className="flex justify-between text-xs mb-1">
                   <span className={`font-medium ${isMe ? 'text-[var(--primary-green)]' : 'text-gray-300'}`}>
                     {item.member?.name || "Unknown"} {isMe && "(You)"}
                   </span>
                   <span className="text-gray-400">₹{item.amount.toFixed(0)}</span>
                 </div>
                 <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isMe ? 'bg-[var(--primary-green)]' : 'bg-gray-600 group-hover:bg-gray-500'
                     }`}
                     style={{ width: `${percent}%` }}
                   />
                 </div>
               </div>
             );
           })}
         </div>
      </div>

    </div>
  );
}
