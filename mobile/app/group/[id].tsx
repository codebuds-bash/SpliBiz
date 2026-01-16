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

  const renderExpense = ({ item }: { item: Expense }) => {
    const payer = getMember(item.created_by);
    
    // Status Logic
    const myPayment = item.expense_payments?.find((p: any) => p.user_id === user?.id)?.paid_amount || 0;
    const myShare = item.expense_splits?.find((s: any) => s.user_id === user?.id)?.share || 0;
    const netBalance = myPayment - myShare;

    let statusText = "not involved";
    let statusColor = isDark ? "text-gray-500" : "text-muted";
    let statusAmount = "";

    if (netBalance > 0.01) {
        statusText = "you lent";
        statusColor = isDark ? "text-green-400" : "text-green-500";
        statusAmount = `₹${netBalance.toFixed(2)}`;
    } else if (netBalance < -0.01) {
        statusText = "you borrowed";
        statusColor = isDark ? "text-red-400" : "text-red-500";
        statusAmount = `₹${Math.abs(netBalance).toFixed(2)}`;
    } else if (myPayment > 0) {
        statusText = "you paid";
        statusColor = isDark ? "text-gray-400" : "text-muted";
        statusAmount = `₹${myPayment.toFixed(2)}`;
    }

    const date = new Date(item.created_at);
    const month = months[date.getMonth()];
    const day = date.getDate();

    return (
    <TouchableOpacity 
        activeOpacity={0.7}
        className="mb-3"
        onPress={() => setSelectedExpense(item)}
    >
        <StyledView className={`p-3 flex-row items-center gap-3 rounded-xl border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
            {/* DATE BOX */}
            <StyledView className={`w-12 h-14 rounded-lg items-center justify-center border shrink-0 ${isDark ? 'bg-background/50 border-white/5' : 'bg-white border-border'}`}>
                 <StyledText className={`text-[10px] uppercase font-bold ${isDark ? 'text-dark-muted' : 'text-muted'}`}>{month}</StyledText>
                 <StyledText className={`text-lg font-bold ${isDark ? 'text-white' : 'text-main'}`}>{day}</StyledText>
            </StyledView>

            <StyledView className="flex-1 min-w-0">
                <StyledText className={`font-bold text-base font-sans truncate ${isDark ? 'text-white' : 'text-main'}`} numberOfLines={1}>
                    {item.title}
                </StyledText>
                <StyledText className={`text-xs font-sans truncate ${isDark ? 'text-dark-muted' : 'text-muted'}`} numberOfLines={1}>
                    <StyledText className={`font-medium ${isDark ? 'text-white' : 'text-main'}`}>{payer?.name || 'Unknown'}</StyledText> paid <StyledText className={`font-bold ${isDark ? 'text-white' : 'text-main'}`}>₹{Number(item.amount).toFixed(2)}</StyledText>
                </StyledText>
            </StyledView>

            {/* STATUS */}
            <StyledView className="items-end shrink-0 pl-2">
                 <StyledText className={`text-[10px] font-bold uppercase ${statusColor}`}>{statusText}</StyledText>
                 {statusAmount ? (
                    <StyledText className={`font-bold ${statusColor}`}>{statusAmount}</StyledText>
                 ) : null}
            </StyledView>
        </StyledView>
    </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="mb-6">
        {/* Header Bar */}
        <StyledView className="flex-row items-center justify-between mb-6 pt-2">
            <TouchableOpacity 
                onPress={() => router.back()}
                className={`w-10 h-10 rounded-full border items-center justify-center ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}
            >
                <Feather name="arrow-left" size={20} color={isDark ? "white" : "#0f172a"} />
            </TouchableOpacity>
            
            <StyledText className={`text-xl font-bold font-sans truncate max-w-[200px] ${isDark ? 'text-white' : 'text-main'}`}>{name}</StyledText>
            
            <TouchableOpacity 
                onPress={() => setShowGroupInfo(true)}
                className={`w-10 h-10 rounded-full border items-center justify-center ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}
            >
                <Feather name="info" size={20} color={isDark ? "#888" : "#64748b"} />
            </TouchableOpacity>
        </StyledView>

        {/* Graph Section */}
        {members.length > 0 && (
            <StyledView className="mb-8">
                <UserRelationshipGraph members={members} expenses={expenses} />
            </StyledView>
        )}

        {/* Expenses Header */}
        <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className={`text-lg font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>Expenses</StyledText>
            <StyledView className={`px-3 py-1 rounded-full border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                <StyledText className={`text-xs font-sans font-bold ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Total: {expenses.length}</StyledText>
            </StyledView>
        </StyledView>
    </View>
  );

  return (
    <ScreenWrapper>
        <FlatList 
            data={expenses}
            keyExtractor={item => item.id}
            renderItem={renderExpense}
            ListHeaderComponent={renderHeader}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#3ecf8e" colors={["#3ecf8e"]} />}
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                !loading ? (
                    <StyledView className="items-center justify-center py-10 opacity-50">
                        <Feather name="dollar-sign" size={40} color={isDark ? "#444" : "#cbd5e1"} />
                        <StyledText className={`text-center mt-4 font-sans ${isDark ? 'text-gray-400' : 'text-muted'}`}>No expenses yet.</StyledText>
                        <StyledText className={`text-center mt-1 text-sm font-sans ${isDark ? 'text-gray-600' : 'text-muted'}`}>Add one to start splitting!</StyledText>
                    </StyledView>
                ) : null
            }
        />

        {/* FAB */}
        <TouchableOpacity 
            onPress={() => router.push({ 
                pathname: '/add-expense', 
                params: { groupId: id, members: JSON.stringify(members) } 
            })}
            activeOpacity={0.8}
            className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-black/50"
        >
            <Feather name="plus" size={28} color="#151515" />
        </TouchableOpacity>

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
    </ScreenWrapper>
  );
}
