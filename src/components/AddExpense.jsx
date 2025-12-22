import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useToast, Icons } from "./UIComponents";
import { useAuth } from "../contexts/AuthContext";

export default function AddExpense({ groupId, members, onAdded, initialData = null }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize form
  useEffect(() => {
    if (initialData) {
        // EDIT MODE
        setTitle(initialData.title);
        setAmount(initialData.amount);
        // Find payer
        const payerId = initialData.expense_payments?.[0]?.user_id || user?.id;
        setPayer(payerId);
        // Find splits
        const splitIds = initialData.expense_splits?.map(s => s.user_id) || [];
        setSelected(splitIds);
    } else if (user) {
        // CREATE MODE
        setPayer(user.id);
        setSelected(members.map(m => m.user_id)); // Default: All
    }
  }, [user, members, initialData]);

  async function submitExpense(e) {
    e.preventDefault();
    if (!title || !amount || !payer || selected.length === 0) {
      addToast("Fill all fields", "error");
      return;
    }

    setLoading(true);

    try {
      let expenseId = initialData?.id;

      if (initialData) {
          // 🛠 UPDATE EXISTING EXPENSE
          // 1. Update basic info
          const { error: updateError } = await supabase
            .from("expenses")
            .update({
                title: title.trim(),
                amount: parseFloat(amount)
            })
            .eq("id", expenseId);
          
          if (updateError) throw updateError;

          // 2. Clear old payments/splits (Easiest way to handle logic change)
          await supabase.from("expense_payments").delete().eq("expense_id", expenseId);
          await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
      } else {
        // ✨ CREATE NEW EXPENSE
        const { data: expense, error: insertError } = await supabase
            .from("expenses")
            .insert({
            group_id: groupId,
            title: title.trim(),
            amount: parseFloat(amount),
            created_by: user.id,
            })
            .select()
            .single();
        
        if (insertError) throw insertError;
        expenseId = expense.id;
      }

      // 3️⃣ Re-insert Payment (single payer)
      const { error: paymentError } = await supabase.from("expense_payments").insert({
        expense_id: expenseId,
        user_id: payer,
        paid_amount: parseFloat(amount),
      });
      if (paymentError) throw paymentError;

      // 4️⃣ Re-insert Equal Splits
      const share = parseFloat(amount) / selected.length;
      const { error: splitError } = await supabase.from("expense_splits").insert(
        selected.map(uid => ({
          expense_id: expenseId,
          user_id: uid,
          share,
        }))
      );
      if (splitError) throw splitError;

      addToast(initialData ? "Expense updated" : "Expense added", "success");
      onAdded?.();
      
      // Cleanup if adding
      if (!initialData) {
        setTitle("");
        setAmount("");
        setSelected(members.map(m => m.user_id));
        setPayer(user.id);
      }

    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const toggleMember = (userId) => {
    setSelected(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId) // uncheck
        : [...prev, userId] // check
    );
  };

  return (
    <form onSubmit={submitExpense} className="space-y-6">
      
      {/* Title & Amount */}
      <div className="space-y-4">
        <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Icons.Receipt className="w-5 h-5" />
             </div>
             <input
                placeholder="Expense Title (e.g. Dinner, Rent)"
                className="input-field pl-10"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
             />
        </div>

        <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] font-bold">
                ₹
             </div>
             <input
                placeholder="0.00"
                type="number"
                step="0.01"
                className="input-field pl-10 text-xl font-semibold"
                value={amount}
                onChange={e => setAmount(e.target.value)}
             />
        </div>
      </div>

      <div className="bg-[var(--bg-body)] p-4 rounded-lg border border-[var(--border-color)]">
          {/* PAID BY */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                Paid By
            </label>
            <select
                className="input-field py-2 text-sm"
                value={payer}
                onChange={e => setPayer(e.target.value)}
            >
                {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                    {m.user_id === user?.id ? "You" : m.name}
                </option>
                ))}
            </select>
          </div>

          {/* SPLIT */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Split Between ({selected.length})
                </label>
                <button 
                    type="button"
                    className="text-xs text-[var(--primary-green)] hover:underline"
                    onClick={() => setSelected(members.map(m => m.user_id))}
                >
                    Select All
                </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {members.map(m => (
                    <div 
                        key={m.user_id} 
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selected.includes(m.user_id) ? "bg-[var(--primary-green)]/10" : "hover:bg-white/5"}`}
                        onClick={() => toggleMember(m.user_id)}
                    >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${selected.includes(m.user_id) ? "bg-[var(--primary-green)] border-[var(--primary-green)]" : "border-[var(--text-muted)]"}`}>
                            {selected.includes(m.user_id) && <Icons.Check className="w-3 h-3 text-black" />}
                        </div>
                        <span className={`text-sm ${selected.includes(m.user_id) ? "text-white font-medium" : "text-[var(--text-muted)]"}`}>
                            {m.user_id === user?.id ? "You" : m.name}
                        </span>
                    </div>
                ))}
            </div>
          </div>
      </div>

      <button disabled={loading} className="btn-primary w-full py-3 text-base flex justify-center items-center gap-2">
        {loading ? "Saving..." : <>{initialData ? <Icons.Pencil /> : <Icons.Plus />} {initialData ? "Update Expense" : "Add Expense"}</>}
      </button>
    </form>
  );
}
