import { useMemo } from "react";

/**
 * Calculates net balances for group members based on expenses.
 * Does NOT fetch data; relies on parent passing the expenses list.
 */
export function useGroupBalances(expenses, members) {
  const balances = useMemo(() => {
    const bal = {};
    
    // Initialize 0 for known members
    members.forEach((m) => {
      bal[m.user_id] = 0;
    });

    if (!expenses) return bal;

    expenses.forEach((exp) => {
      // Add payments (User paid this much, so they are owed this much)
      exp.expense_payments?.forEach((p) => {
        if (bal[p.user_id] !== undefined) {
          bal[p.user_id] += Number(p.paid_amount);
        }
      });

      // Subtract splits (User's share is this much, so they owe this much)
      exp.expense_splits?.forEach((s) => {
        if (bal[s.user_id] !== undefined) {
          bal[s.user_id] -= Number(s.share);
        }
      });
    });

    return bal;
  }, [expenses, members]);

  return { balances, loading: false }; // Loading is now determined by expenses availability in parent
}
