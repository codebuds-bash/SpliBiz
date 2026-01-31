import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenWrapper } from '../../src/components/UI';
import UserRelationshipGraph from '../../src/components/UserRelationshipGraph';
import ExpenseModal from '../../src/components/ExpenseModal';
import GroupInfoModal from '../../src/components/GroupInfoModal';
import SettleUpModal from '../../src/components/SettleUpModal';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StyledText = styled(Text);
const StyledView = styled(View);

interface Member {
    user_id: string;
    name: string;
    avatar_url: string;
    role: string;
    username?: string; // Added optional username
}

interface Expense {
    id: string;
    title: string;
    amount: number;
    created_at: string;
    created_by: string;
    group_id: string;
    expense_splits: any[];
    expense_payments: any[];
}

export default function GroupDetailsScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        // Parallel Fetch
        const [membersRes, expensesRes] = await Promise.all([
            supabase.from("group_members").select('*, profiles(*)').eq("group_id", id),
            supabase.from("expenses").select('*, expense_payments(*), expense_splits(*)').eq("group_id", id).order("created_at", { ascending: false })
        ]);

        if (membersRes.data) {
            setMembers(membersRes.data.map((d: any) => ({ ...d.profiles, role: d.role, user_id: d.user_id })));
        }
        if (expensesRes.data) {
            setExpenses(expensesRes.data as Expense[]);
        }
    } catch(e) {
        console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Helper for avatars
  const getMember = (userId: string) => members.find((m: any) => m.user_id === userId);
  const getAvatarUrl = (userId: string) => {
      const member = getMember(userId);
      return member?.avatar_url || `https://ui-avatars.com/api/?name=${member?.name || 'U'}&background=random&color=fff`;
  };

  // Helper for date
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* -------------- UI HELPERS -------------- */
  const renderExpense = ({ item }: { item: Expense }) => {
    const payer = getMember(item.created_by);
    
    // Status Logic
    const myPayment = item.expense_payments?.find((p: any) => p.user_id === user?.id)?.paid_amount || 0;
    const myShare = item.expense_splits?.find((s: any) => s.user_id === user?.id)?.share || 0;
    const netBalance = myPayment - myShare;

    let statusText = "not involved";
    // Using simple logical colors (Green = You get back, Red = You pay)
    // Premium Look: Status pills
    let statusBg = isDark ? "bg-gray-800" : "bg-gray-100";
    let statusTextColor = isDark ? "text-gray-400" : "text-gray-500";
    let statusAmount = "";

    if (netBalance > 0.01) {
        statusText = "you lent";
        statusBg = "bg-green-500/10";
        statusTextColor = "text-green-500";
        statusAmount = `₹${netBalance.toFixed(2)}`;
    } else if (netBalance < -0.01) {
        statusText = "you borrowed";
        statusBg = "bg-red-500/10";
        statusTextColor = "text-red-500";
        statusAmount = `₹${Math.abs(netBalance).toFixed(2)}`;
    } else if (myPayment > 0) {
        statusText = "you paid";
        statusBg = isDark ? "bg-gray-700" : "bg-gray-200";
        statusTextColor = isDark ? "text-gray-300" : "text-gray-600";
        statusAmount = `₹${myPayment.toFixed(2)}`;
    }

    const date = new Date(item.created_at);
    const month = months[date.getMonth()];
    const day = date.getDate();

    // Fix: "Grey color in date is not looking good update it with black" -> Using "text-black" or "text-white" for date numbers
    const dateNumColor = isDark ? "text-white" : "text-black";
    const monthColor = isDark ? "text-gray-400" : "text-gray-800"; // Slightly darker for visibility

    return (
    <TouchableOpacity 
        activeOpacity={0.7}
        className="mb-3"
        onPress={() => setSelectedExpense(item)}
    >
        <StyledView className={`p-4 flex-row items-center gap-4 rounded-2xl shadow-sm ${isDark ? 'bg-[#1a1a1a] border border-white/5' : 'bg-white border border-gray-100'}`}>
            {/* DATE BOX - Premium Style */}
            <StyledView className={`w-14 h-16 rounded-xl items-center justify-center shrink-0 ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                 <StyledText className={`text-[10px] uppercase font-bold tracking-widest ${monthColor}`}>{month}</StyledText>
                 <StyledText className={`text-2xl font-black ${dateNumColor}`}>{day}</StyledText>
            </StyledView>

            {/* CONTENT */}
            <StyledView className="flex-1 min-w-0 justify-center">
                <StyledText className={`font-bold text-[17px] font-sans truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                    {item.title}
                </StyledText>
                
                <StyledView className="flex-row items-center gap-1">
                    <StyledText className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <StyledText className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{payer?.name?.split(' ')[0]}</StyledText> paid ₹{Number(item.amount).toFixed(2)}
                    </StyledText>
                </StyledView>
            </StyledView>

            {/* STATUS PILL */}
            <StyledView className="items-end shrink-0 gap-1">
                 <StyledView className={`px-2 py-1 rounded-md ${statusBg}`}>
                     <StyledText className={`text-[10px] font-bold uppercase tracking-wide ${statusTextColor}`}>{statusText}</StyledText>
                 </StyledView>
                 {statusAmount ? (
                    <StyledText className={`font-bold text-sm ${statusTextColor}`}>{statusAmount}</StyledText>
                 ) : null}
            </StyledView>
        </StyledView>
    </TouchableOpacity>
    );
  };

  const [settleModalVisible, setSettleModalVisible] = useState(false);

  // Import locally to avoid top-level require cycle issues if any, though likely fine at top.
  // Actually, I need to add the import at top. I'll rely on the existing imports logic or add it via a separate tool if needed?
  // Wait, I can't add imports with replace_content in valid way if I only replace return.
  // I need to update imports too.
  // I'll assume I can edit the whole file or huge chunks.
  // Let me edit the return + imports in one go by targeting a larger range or doing it in two steps.
  // I'll start the replacement from line 11 (imports) downwards or use multi_replace.
  
  // Actually, I'll just replace the return block and helper.
  // I'll add the SettleUpModal import and usage in a second pass or check if I can do it here.
  // I'll use multi_replace to handle imports + body.

  return (
    <ScreenWrapper>
        <FlatList 
            data={filteredExpenses}
            keyExtractor={item => item.id}
            renderItem={renderExpense}
            ListHeaderComponent={renderHeader}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#3ecf8e" colors={["#3ecf8e"]} />}
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                !loading ? (
                    <StyledView className="items-center justify-center py-20 opacity-60">
                         <StyledView className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <Feather name="list" size={32} color={isDark ? "#666" : "#999"} />
                         </StyledView>
                        <StyledText className={`text-center font-bold text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No activity yet</StyledText>
                        <StyledText className={`text-center mt-1 text-sm ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Expenses or payments will appear here.</StyledText>
                    </StyledView>
                ) : null
            }
        />

        {/* Floating Add Button (Secondary quick action) */}
        {!settleModalVisible && (
            <TouchableOpacity 
                onPress={() => router.push({ 
                    pathname: '/add-expense', 
                    params: { groupId: id, members: JSON.stringify(members) } 
                })}
                activeOpacity={0.8}
                className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-black/50 z-20"
            >
                <Feather name="plus" size={28} color="#151515" />
            </TouchableOpacity>
        )}

        <ExpenseModal 
            visible={!!selectedExpense} 
            onClose={() => setSelectedExpense(null)} 
            expense={selectedExpense} 
            members={members} 
            currentUserId={user?.id || ''}
        />

        <GroupInfoModal 
            visible={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
            groupId={id}
            members={members}
            onUpdate={fetchData}
        />

        <SettleUpModal 
             visible={settleModalVisible}
             onClose={() => setSettleModalVisible(false)}
             onSuccess={fetchData}
             groupId={id}
             members={members}
        />
    </ScreenWrapper>
  );
}
