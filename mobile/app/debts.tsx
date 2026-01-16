import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { ScreenWrapper } from '../src/components/UI';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);

interface Debt {
    userId: string;
    userName: string;
    avatarUrl?: string;
    amount: number;
}

export default function DebtsScreen() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDebts();
    }, [user]);

    const fetchDebts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch splits
            // We select 'share', and the related expense details.
            // We use 'profiles' to get the creator's details.
            // If explicit FK alias is needed, we might need to adjust, 
            // but usually 'profiles' works if it's the only FK to profiles.
            const { data: splitData, error: splitError } = await supabase
                .from('expense_splits')
                .select(`
                    amount:share,
                    expense:expenses (
                        id,
                        title,
                        created_by,
                        profiles:created_by (
                            id,
                            name,
                            avatar_url
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (splitError) {
                console.error('Error fetching debts:', splitError);
                throw splitError;
            }

            console.log('Debts Data:', splitData?.length);

            const debtMap: Record<string, Debt> = {};

            // @ts-ignore
            splitData?.forEach((split: any) => {
                // Ensure expense and profile exist
                const expenseStub = split.expense;
                const creditor = expenseStub?.profiles;
                
                if (expenseStub && creditor && creditor.id !== user.id) {
                     if (!debtMap[creditor.id]) {
                        debtMap[creditor.id] = {
                            userId: creditor.id,
                            userName: creditor.name || 'Unknown',
                            avatarUrl: creditor.avatar_url,
                            amount: 0
                        };
                    }
                    // Add share amount
                    debtMap[creditor.id].amount += parseFloat(split.amount || 0);
                }
            });

            setDebts(Object.values(debtMap));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderDebtItem = ({ item }: { item: Debt }) => (
        <TouchableOpacity 
            activeOpacity={0.7}
            className={`flex-row items-center justify-between p-4 mb-3 border rounded-xl ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}
        >
            <StyledView className="flex-row items-center gap-3">
                <Image 
                    source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${item.userName}&background=random` }} 
                    className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
                />
                <StyledView>
                    <StyledText className={`font-bold text-base font-sans ${isDark ? 'text-white' : 'text-main'}`}>
                        {item.userName}
                    </StyledText>
                    <StyledText className={`text-xs font-sans ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        you owe
                    </StyledText>
                </StyledView>
            </StyledView>

            <StyledView className="items-end">
                <StyledText className={`font-bold text-lg font-sans ${isDark ? 'text-white' : 'text-main'}`}>
                    ₹{item.amount.toFixed(0)}
                </StyledText>
                <StyledText className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 mt-1`}>
                    Unsettled
                </StyledText>
            </StyledView>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            {/* Header */}
            <StyledView className="flex-row items-center justify-between mb-6">
                 <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${isDark ? 'bg-dark-surface' : 'bg-surface'} border ${isDark ? 'border-dark-border' : 'border-border'}`}>
                     <Feather name="arrow-left" size={24} color={isDark ? "white" : "black"} />
                 </TouchableOpacity>
                 <StyledText className={`text-xl font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>
                     Total Owed
                 </StyledText>
                 <StyledView className="w-10" />
            </StyledView>

            {loading ? (
                <ActivityIndicator size="large" color="#3ecf8e" className="mt-10" />
            ) : (
                <FlatList
                    data={debts}
                    keyExtractor={item => item.userId}
                    renderItem={renderDebtItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        <StyledView className="items-center justify-center py-20 opacity-60">
                            <Feather name="check-circle" size={48} color="#3ecf8e" />
                            <StyledText className={`text-center mt-4 font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>
                                You're all settled up!
                            </StyledText>
                            <StyledText className={`text-sm text-center ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
                                You don't owe anyone anything right now.
                            </StyledText>
                        </StyledView>
                    }
                />
            )}
        </ScreenWrapper>
    );
}
