import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Alert, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { styled } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

// Styled Components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledImage = styled(Image);

// Types
interface Member {
    user_id: string;
    name: string;
    avatar_url?: string; 
}

export default function AddExpenseScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
    
    // --- Data Parsing ---
    let members: Member[] = [];
    try {
        const memParam = Array.isArray(params.members) ? params.members[0] : params.members;
        if (memParam) members = JSON.parse(memParam);
    } catch(e) {}

    // --- State ---
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    // Default to all members selected
    const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.user_id));

    // --- Computed ---
    const perPersonShare = useMemo(() => {
        const total = parseFloat(amount);
        if (isNaN(total) || total <= 0 || selectedMembers.length === 0) return 0;
        return total / selectedMembers.length;
    }, [amount, selectedMembers]);

    // --- Handlers ---
    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(prev => prev.filter(mid => mid !== id));
        } else {
            setSelectedMembers(prev => [...prev, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map(m => m.user_id));
        }
    };

    const addExpense = async () => {
        if (!user) return Alert.alert("Error", "You must be logged in");
        if (!title.trim() || !amount || selectedMembers.length === 0) {
            return Alert.alert("Missing Info", "Please enter details and select at least one person.");
        }

        setLoading(true);
        try {
            const totalAmount = parseFloat(amount);
            
            // 1. Create Expense
            const { data: expense, error } = await supabase
                .from("expenses")
                .insert({
                    group_id: groupId,
                    title: title.trim(),
                    amount: totalAmount,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Add Payer (You paid 100%)
            await supabase.from("expense_payments").insert({
                expense_id: expense.id,
                user_id: user.id,
                paid_amount: totalAmount
            });

            // 3. Add Splits
            const splitAmount = totalAmount / selectedMembers.length;
            const splits = selectedMembers.map(uid => ({
                expense_id: expense.id,
                user_id: uid,
                share: splitAmount
            }));
            
            await supabase.from("expense_splits").insert(splits);
            router.back();
        } catch(e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to add expense");
        }
        setLoading(false);
    };

    return (
        <StyledView className={`flex-1 pt-12 ${isDark ? 'bg-dark-background' : 'bg-background'}`}>
            {/* Header */}
            <StyledView className="flex-row items-center justify-between px-4 mb-6">
                <TouchableOpacity onPress={() => router.back()} className={`w-10 h-10 items-center justify-center rounded-full border ${isDark ? 'bg-[#21262d] border-dark-border' : 'bg-surface border-border'}`}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "#0f172a"} />
                </TouchableOpacity>
                <StyledText className={`font-bold text-lg ${isDark ? 'text-white' : 'text-main'}`}>New Expense</StyledText>
                <StyledView className="w-10" /> 
            </StyledView>

            <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
                
                {/* 1. Input Section (Hero) */}
                <StyledView className={`border rounded-3xl p-6 mb-6 shadow-lg ${isDark ? 'bg-dark-surface border-dark-border shadow-black/50' : 'bg-surface border-border shadow-black/10'}`}>
                    {/* Amount Input */}
                    <StyledView className="flex-row justify-center items-center mb-6">
                        <StyledText className={`text-4xl font-light mr-1 ${isDark ? 'text-gray-500' : 'text-muted'}`}>₹</StyledText>
                        <StyledInput 
                            placeholder="0" 
                            placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                            value={amount} 
                            onChangeText={setAmount} 
                            keyboardType="numeric"
                            className={`text-5xl font-bold text-center min-w-[100px] ${isDark ? 'text-white' : 'text-main'}`}
                            selectionColor="#3ecf8e"
                        />
                    </StyledView>

                    {/* Description Input */}
                    <StyledView className={`flex-row items-center rounded-xl px-4 py-3 border focus:border-green-500/50 ${isDark ? 'bg-dark-background border-dark-border' : 'bg-background border-border'}`}>
                        <Ionicons name="receipt-outline" size={20} color={isDark ? "#9ca3af" : "#64748b"} style={{ marginRight: 10 }} />
                        <StyledInput 
                            placeholder="What's this for? (e.g. Dinner)" 
                            value={title} 
                            onChangeText={setTitle} 
                            placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                            className={`flex-1 text-base font-medium ${isDark ? 'text-white' : 'text-main'}`}
                            selectionColor="#3ecf8e"
                        />
                    </StyledView>
                </StyledView>

                {/* 2. Split Section */}
                <StyledView className="mb-24">
                    <StyledView className="flex-row items-center justify-between mb-4 px-1">
                        <StyledText className={`font-medium ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Split with</StyledText>
                        <TouchableOpacity onPress={toggleSelectAll}>
                            <StyledText className="text-primary font-bold text-sm">
                                {selectedMembers.length === members.length ? "Deselect All" : "Select All"}
                            </StyledText>
                        </TouchableOpacity>
                    </StyledView>

                    {/* Member List */}
                    {members.map((member) => {
                        const isSelected = selectedMembers.includes(member.user_id);
                        return (
                            <TouchableOpacity 
                                key={member.user_id} 
                                onPress={() => toggleMember(member.user_id)}
                                activeOpacity={0.7}
                            >
                                <StyledView className={`flex-row items-center p-3 mb-3 rounded-2xl border ${isSelected ? 'bg-green-500/10 border-green-500/30' : (isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border')}`}>
                                    
                                    {/* Avatar */}
                                    <StyledView className={`w-10 h-10 rounded-full border overflow-hidden items-center justify-center mr-3 ${isDark ? 'bg-[#21262d] border-dark-border' : 'bg-gray-100 border-border'}`}>
                                        {member.avatar_url ? (
                                            <StyledImage source={{ uri: member.avatar_url }} className="w-full h-full" resizeMode="cover" />
                                        ) : (
                                            <StyledText className={`font-bold text-xs ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </StyledText>
                                        )}
                                    </StyledView>

                                    {/* Name & Cost */}
                                    <StyledView className="flex-1">
                                        <StyledText className={`font-bold text-base ${isSelected ? (isDark ? 'text-white' : 'text-main') : (isDark ? 'text-dark-muted' : 'text-muted')}`}>
                                            {member.name}
                                        </StyledText>
                                        {isSelected && perPersonShare > 0 && (
                                            <StyledText className="text-green-500 text-xs mt-0.5">
                                                owes ₹{perPersonShare.toFixed(0)}
                                            </StyledText>
                                        )}
                                    </StyledView>

                                    {/* Custom Checkbox */}
                                    <StyledView className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-primary border-primary' : (isDark ? 'border-gray-600' : 'border-gray-400')}`}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                    </StyledView>
                                </StyledView>
                            </TouchableOpacity>
                        );
                    })}
                </StyledView>

            </ScrollView>

            {/* Bottom Action Bar (Floating) */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                className={`absolute bottom-0 w-full p-4 border-t ${isDark ? 'bg-dark-background/90 border-dark-border' : 'bg-background/90 border-border'}`}
            >
                <TouchableOpacity 
                    onPress={addExpense}
                    disabled={loading}
                    className="w-full bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-black/20"
                >
                    {loading ? (
                         <StyledText className="text-white font-bold text-lg">Saving...</StyledText>
                    ) : (
                        <StyledView className="flex-row items-center">
                            <Ionicons name="add-circle-outline" size={24} color="white" style={{ marginRight: 8 }} />
                            <StyledText className="text-white font-bold text-lg">Save Expense</StyledText>
                        </StyledView>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </StyledView>
    );
}
