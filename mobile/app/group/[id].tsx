import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper, Card } from '../../src/components/UI';
import UserRelationshipGraph from '../../src/components/UserRelationshipGraph';
import { styled } from 'nativewind';

const StyledText = styled(Text);
const StyledView = styled(View);

export default function GroupDetailsScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
        // Parallel Fetch
        const [membersRes, expensesRes] = await Promise.all([
            supabase.from("group_members").select('*, profiles(*)').eq("group_id", id),
            supabase.from("expenses").select('*, expense_payments(*), expense_splits(*)').eq("group_id", id).order("created_at", { ascending: false })
        ]);

        if (membersRes.data) {
            setMembers(membersRes.data.map(d => ({ ...d.profiles, role: d.role, user_id: d.user_id })));
        }
        if (expensesRes.data) {
            setExpenses(expensesRes.data);
        }
    } catch(e) {
        console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const renderHeader = () => (
    <View>
        <StyledView className="flex-row items-center justify-between mb-6">
            <StyledText className="text-2xl font-bold text-white">{name}</StyledText>
            <TouchableOpacity 
                onPress={() => router.push({ 
                    pathname: '/add-expense', 
                    params: { groupId: id, members: JSON.stringify(members) } 
                })}
                className="bg-blue-600 px-4 py-2 rounded-lg"
            >
                <StyledText className="text-white font-bold text-sm">+ Add</StyledText>
            </TouchableOpacity>
        </StyledView>
        <UserRelationshipGraph members={members} expenses={expenses} />
        <StyledText className="text-xl font-bold text-white mb-4">Expenses</StyledText>
    </View>
  );

  // Helper for avatars
  const getMember = (userId) => members.find(m => m.user_id === userId);
  const getAvatarUrl = (userId) => getMember(userId)?.avatar_url || `https://ui-avatars.com/api/?name=${getMember(userId)?.name || 'U'}&background=random`;

  const renderExpense = ({ item }) => {
    const payer = getMember(item.created_by);
    const splitCount = item.expense_splits?.length || 0;
    const cleanSplits = item.expense_splits?.slice(0, 3) || [];

    return (
    <Card className="mb-3">
        <StyledView className="flex-row items-center gap-3">
            {/* Payer Avatar */}
            <StyledView>
                <Image 
                    source={{ uri: getAvatarUrl(item.created_by) }} 
                    className="w-10 h-10 rounded-full border border-gray-600"
                />
            </StyledView>

            <StyledView className="flex-1">
                <StyledText className="text-white font-bold text-base">{item.title}</StyledText>
                <StyledText className="text-gray-400 text-xs">
                    {payer?.name || 'Unknown'} paid ₹{item.amount}
                </StyledText>
            </StyledView>

            {/* Amount & Stack */}
            <StyledView className="items-end gap-1">
                <StyledText className="text-green-400 font-bold text-lg">₹{item.amount}</StyledText>
                
                {/* Stack of Plates */}
                <StyledView className="flex-row items-center">
                    {cleanSplits.map((split, i) => (
                        <Image 
                            key={split.user_id}
                            source={{ uri: getAvatarUrl(split.user_id) }}
                            className={`w-5 h-5 rounded-full border border-gray-800 ${i > 0 ? '-ml-2' : ''}`}
                        />
                    ))}
                    {splitCount > 3 && (
                        <StyledView className="w-5 h-5 rounded-full bg-gray-700 border border-gray-800 items-center justify-center -ml-2">
                           <StyledText className="text-[8px] text-white">+{splitCount - 3}</StyledText>
                        </StyledView>
                    )}
                </StyledView>
            </StyledView>
        </StyledView>
    </Card>
    );
  };

  return (
    <ScreenWrapper>
        <FlatList 
            data={expenses}
            keyExtractor={item => item.id}
            renderItem={renderExpense}
            ListHeaderComponent={renderHeader}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#fff" />}
            contentContainerStyle={{ paddingBottom: 100 }}
        />
    </ScreenWrapper>
  );
}
