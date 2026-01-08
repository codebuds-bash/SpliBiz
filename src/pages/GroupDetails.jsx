import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Navbar from "../components/Navbar";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";
import GroupBalances from "../components/GroupBalances";
import SettleUpModal from "../components/SettleUpModal";
import SpendingInsights from "../components/SpendingInsights"; // New Import
import UserRelationshipGraph from "../components/UserRelationshipGraph";
import { useGroupBalances } from "../hooks/useGroupBalances";
import { useToast, Icons, Modal } from "../components/UIComponents";

export default function GroupDetails() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Expenses State (Lifted from ExpenseList)
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [refreshExpensesTrigger, setRefreshExpensesTrigger] = useState(0);

  // Balances Hook
  const { balances: groupBalances } = useGroupBalances(expenses, members);
  const loadingBalances = loadingExpenses;

  const [username, setUsername] = useState("");
  const [inviteToken, setInviteToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  /* ---------------- FETCH GROUP ---------------- */
  useEffect(() => {
    supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setGroup(data));
  }, [id]);

  /* ---------------- FETCH MEMBERS ---------------- */
  async function fetchMembers() {
    setLoadingMembers(true);

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        user_id,
        role,
        profiles (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("group_id", id);

    if (error) {
      console.error("Fetch members error:", error);
      setMembers([]);
    } else {
      setMembers(
        data.map(row => ({
          ...row.profiles,
          role: row.role,
          user_id: row.user_id
        }))
      );
    }

    setLoadingMembers(false);
  }

  useEffect(() => {
    fetchMembers();
  }, [id]);

  /* ---------------- FETCH EXPENSES ---------------- */
  async function fetchExpenses() {
    try {
      setLoadingExpenses(true);
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
        .eq("group_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoadingExpenses(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, [id, refreshExpensesTrigger]);

  /* ---------------- SEARCH USERS ---------------- */
  const isAdmin = members.some(
    m => m.user_id === currentUserId && m.role === "admin"
  );

  async function searchUsers(query) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, name, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(5);

    setSearchResults(data || []);
  }

  function selectUser(user) {
    setUsername(user.username);
    setSearchResults([]);
  }

  /* ---------------- ADD MEMBER ---------------- */
  async function addByUsername() {
    if (!username.trim()) return;

    const { error } = await supabase.rpc("add_member_by_username", {
      p_group_id: id,
      p_username: username.trim()
    });

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast(`@${username} added to group`, "success");
      setUsername("");
      setSearchResults([]);
      fetchMembers();
    }
  }

  /* ---------------- REMOVE MEMBER (ADMIN ONLY) ---------------- */
  async function removeMember(userId) {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", userId);

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast("Member removed", "success");
      fetchMembers();
    }
  }

  /* ---------------- INVITE ---------------- */
  async function generateInvite() {
    const token = crypto.randomUUID();

    const { error } = await supabase.from("group_invites").insert({
      group_id: id,
      invite_token: token
    });

    if (!error) setInviteToken(token);
  }

  /* ---------------- AVATAR ---------------- */
  const getAvatar = (member) => {
    if (member.avatar_url) {
      return (
        <img
          src={member.avatar_url}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }


    return (
      <div className="w-10 h-10 rounded-full bg-green-500/20 
                      text-green-500 flex items-center justify-center font-bold uppercase text-sm">
        {(member.username || "?").slice(0, 2)}
      </div>
    );
  };
  
  // Handlers
  const handleEditExpense = (expense) => {
      setExpenseToEdit(expense);
      setIsExpenseModalOpen(true);
  };

  const closeModal = () => {
      setIsExpenseModalOpen(false);
      setExpenseToEdit(null);
  }
  
  const triggerRefresh = () => setRefreshExpensesTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* HEADER */}
        <Link to="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white mb-3 block">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-400 to-green-400 w-2 h-8 rounded-full"></span>
              {group?.name || "Loading..."}
            </h1>
            <div className="flex gap-3">
                 <button 
                   onClick={() => setIsSettleModalOpen(true)}
                   className="btn-secondary flex items-center gap-2"
                 >
                    Settle Up
                 </button>
                 <button 
                   onClick={() => setIsExpenseModalOpen(true)}
                   className="btn-primary flex items-center gap-2"
                 >
                    <Icons.Plus /> Add Expense
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: EXPENSES (Wide) */}
            <div className="lg:col-span-8">
                <h3 className="text-xl font-semibold text-white mb-4">Expenses</h3>
                <div className="bg-[#151515] border border-[var(--border-color)] rounded-xl p-2 h-[500px] lg:h-[600px] overflow-y-auto custom-scrollbar">
                    <ExpenseList 
                        expenses={expenses}
                        loading={loadingExpenses}
                        members={members} 
                        onEdit={handleEditExpense} 
                        onRefresh={triggerRefresh}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* 📊 NEW SPENDING INSIGHTS */}
                <SpendingInsights expenses={expenses} members={members} />

                {/* 🕸️ RELATIONSHIP GRAPH */}
                <UserRelationshipGraph members={members} balances={groupBalances} />

                {/* 📊 BALANCES */}
                <GroupBalances 
                    groupId={id} 
                    members={members} 
                    balances={groupBalances}
                    loading={loadingBalances}
                />

                {/* MEMBERS */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Members ({members.length})
                  </h3>

                  <div className="flex flex-col gap-2">
                    {members.map(member => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-3 bg-white/5 border border-[var(--border-color)] px-3 py-2 rounded-lg"
                      >
                        {getAvatar(member)}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">
                            {member.name || "Unnamed"}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            @{member.username}
                          </p>
                        </div>

                         {/* REMOVE BUTTON (ADMIN ONLY) */}
                         {isAdmin && member.user_id !== currentUserId && (
                          <button
                            onClick={() => removeMember(member.user_id)}
                            className="ml-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ADD MEMBER */}
                <div className="card">
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                      Add Members
                    </h3>

                    <div className="relative">
                      <div className="flex gap-2 mb-2">
                        <input
                          placeholder="Username..."
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (e.target.value.length > 2) {
                              searchUsers(e.target.value);
                            } else {
                              setSearchResults([]);
                            }
                          }}
                          className="input-field py-1 text-sm bg-black/30"
                        />
                        <button onClick={addByUsername} className="btn-secondary py-1 text-sm">
                          Add
                        </button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-[#1c1c1c] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-xl">
                          {searchResults.map(user => (
                            <div
                              key={user.id}
                              onClick={() => selectUser(user)}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer"
                            >
                              {getAvatar(user)}
                              <div>
                                <p className="text-sm text-white">{user.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {inviteToken ? (
                        <div className="mt-4">
                            <input 
                                readOnly
                                value={`${window.location.origin}/join?token=${inviteToken}`}
                                className="input-field text-xs mb-2 bg-black/30"
                            />
                            <button
                                className="w-full btn-secondary text-xs py-1"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join?token=${inviteToken}`);
                                    addToast("Link copied", "success");
                                }}
                            >
                                Copy Link
                            </button>
                        </div>
                    ) : (
                        <button onClick={generateInvite} className="w-full btn-secondary text-xs py-1 mt-2">
                            Generate Invite Link
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      <Modal 
         isOpen={isExpenseModalOpen} 
         onClose={closeModal} 
         title={expenseToEdit ? "Edit Expense" : "Add New Expense"}
      >
        <AddExpense 
            groupId={id} 
            members={members}
            initialData={expenseToEdit} 
            onAdded={() => {
                closeModal();
                setRefreshExpensesTrigger(prev => prev + 1);
            }} 
        />
      </Modal>

      {/* SETTLE UP MODAL */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title="Settle Up"
      >
        <SettleUpModal 
             groupId={id}
             members={members}
             onClose={() => setIsSettleModalOpen(false)}
             onSuccess={() => setRefreshExpensesTrigger(prev => prev + 1)}
        />
      </Modal>

    </div>
  );
}
