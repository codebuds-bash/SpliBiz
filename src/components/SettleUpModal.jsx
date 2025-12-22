import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast, Icons } from "./UIComponents";

export default function SettleUpModal({ groupId, members, onSuccess, onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  
  // Who is paying? (Default: me)
  const [payerId, setPayerId] = useState(user?.id || "");
  // Who is receiving?
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (user) setPayerId(user.id);
  }, [user]);

  async function handleSettleUp(e) {
    e.preventDefault();
    if (!payerId || !recipientId || !amount) {
        addToast("Please fill all fields", "error");
        return;
    }
    if (payerId === recipientId) {
        addToast("Payer and Recipient cannot be same", "error");
        return;
    }

    setLoading(true);

    try {
        const payerName = members.find(m => m.user_id === payerId)?.name || "Unknown";
        const recipientName = members.find(m => m.user_id === recipientId)?.name || "Unknown";

        // Create "Settlement Expense"
        // Title: "Payer paid Recipient"
        // Payer: PayerId
        // Splits: RecipientId (100%) - This means Recipient "owes" this amount back, canceling debt.
        
        // 1️⃣ Expense Record
        const { data: expense, error: insertError } = await supabase
            .from("expenses")
            .insert({
                group_id: groupId,
                title: `${payerName} paid ${recipientName}`,
                amount: parseFloat(amount),
                created_by: user.id
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 2️⃣ Payment Record
        const { error: payError } = await supabase.from("expense_payments").insert({
            expense_id: expense.id,
            user_id: payerId,
            paid_amount: parseFloat(amount)
        });
        if (payError) throw payError;

        // 3️⃣ Split Record (100% to Recipient)
        const { error: splitError } = await supabase.from("expense_splits").insert({
            expense_id: expense.id,
            user_id: recipientId,
            share: parseFloat(amount)
        });
        if (splitError) throw splitError;

        addToast("Payment recorded!", "success");
        onSuccess?.();
        onClose();

    } catch (error) {
        console.error(error);
        addToast("Error recording payment", "error");
    } finally {
        setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSettleUp} className="space-y-6">
        <div className="flex flex-col gap-4 text-center">
            
            {/* PAYER */}
            <div className="flex items-center gap-2 justify-center">
                 <select 
                    value={payerId} 
                    onChange={e => setPayerId(e.target.value)}
                    className="bg-transparent text-white font-bold border-b border-gray-600 focus:border-white outline-none text-center"
                 >
                    {members.map(m => (
                        <option key={m.user_id} value={m.user_id}>
                            {m.user_id === user?.id ? "You" : m.name}
                        </option>
                    ))}
                 </select>
            </div>

            <p className="text-[var(--text-muted)] text-sm">paid</p>

            {/* RECIPIENT */}
            <div className="flex items-center gap-2 justify-center">
                 <select 
                    value={recipientId} 
                    onChange={e => setRecipientId(e.target.value)}
                    className="bg-transparent text-white font-bold border-b border-gray-600 focus:border-white outline-none text-center"
                 >
                    <option value="">Select recipient</option>
                    {members.filter(m => m.user_id !== payerId).map(m => (
                        <option key={m.user_id} value={m.user_id}>
                            {m.user_id === user?.id ? "You" : m.name}
                        </option>
                    ))}
                 </select>
            </div>


            {/* AMOUNT */}
            <div className="relative w-32 mx-auto mt-2">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white font-bold text-lg">
                    ₹
                 </div>
                 <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent border-b-2 border-[var(--primary-green)] text-white text-3xl font-bold pl-8 py-2 focus:outline-none text-center"
                 />
            </div>
        </div>

        <button disabled={loading} className="btn-primary w-full py-3">
             {loading ? "Recording..." : "Record Payment"}
        </button>
    </form>
  );
}
