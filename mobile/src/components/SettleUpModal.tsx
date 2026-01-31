import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

interface SettleUpModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    groupId: string;
    members: any[];
}

export default function SettleUpModal({ visible, onClose, onSuccess, groupId, members }: SettleUpModalProps) {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    const [payerId, setPayerId] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [amount, setAmount] = useState("");

    // Initialize payer as current user when modal opens
    useEffect(() => {
        if (visible && user) {
            setPayerId(user.id);
            setRecipientId("");
            setAmount("");
        }
    }, [visible, user]);

    const handleSettleUp = async () => {
        if (!payerId || !recipientId || !amount) {
            Alert.alert("Missing Fields", "Please fill all fields");
            return;
        }
        if (payerId === recipientId) {
            Alert.alert("Invalid Selection", "Payer and Recipient cannot be the same");
            return;
        }

        setLoading(true);
        try {
            const payerName = members.find(m => m.user_id === payerId)?.name || "Unknown";
            const recipientName = members.find(m => m.user_id === recipientId)?.name || "Unknown";

            // 1. Create Expense
            const { data: expense, error: insertError } = await supabase
                .from("expenses")
                .insert({
                    group_id: groupId,
                    title: `${payerName} paid ${recipientName}`,
                    amount: parseFloat(amount),
                    created_by: user?.id
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Payment Record
            const { error: payError } = await supabase.from("expense_payments").insert({
                expense_id: expense.id,
                user_id: payerId,
                paid_amount: parseFloat(amount)
            });
            if (payError) throw payError;

            // 3. Split Record (100% to Recipient)
            const { error: splitError } = await supabase.from("expense_splits").insert({
                expense_id: expense.id,
                user_id: recipientId,
                share: parseFloat(amount)
            });
            if (splitError) throw splitError;

            Alert.alert("Success", "Payment recorded successfully!");
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.message || "Failed to record payment");
        } finally {
            setLoading(false);
        }
    };

    const getMemberName = (id: string) => {
        if (id === user?.id) return "You";
        return members.find(m => m.user_id === id)?.name || "Unknown";
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                 {/* Backdrop */}
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={onClose}
                    className="absolute inset-0 bg-black/60"
                />

                <StyledView className={`w-full rounded-t-3xl overflow-hidden ${isDark ? 'bg-dark-surface' : 'bg-surface'} max-h-[85%]`}>
                    {/* Header */}
                    <StyledView className={`flex-row items-center justify-between p-5 border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                        <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
                             <Feather name="x" size={24} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                        <StyledText className={`text-lg font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>Settle Up</StyledText>
                        <View className="w-8" />
                    </StyledView>

                    {/* Content */}
                    <StyledView className="p-6 space-y-6">
                        
                        {/* Payer Selection */}
                        <StyledView className="items-center">
                            <StyledText className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paying</StyledText>
                            <StyledView className="flex-row flex-wrap justify-center gap-2">
                                {members.map(m => (
                                    <TouchableOpacity
                                        key={`payer-${m.user_id}`}
                                        onPress={() => setPayerId(m.user_id)}
                                        className={`px-4 py-2 rounded-full border ${
                                            payerId === m.user_id 
                                                ? 'bg-green-500 border-green-500' 
                                                : isDark ? 'border-gray-700 bg-white/5' : 'border-gray-300 bg-gray-50'
                                        }`}
                                    >
                                        <StyledText className={`font-bold ${payerId === m.user_id ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {getMemberName(m.user_id)}
                                        </StyledText>
                                    </TouchableOpacity>
                                ))}
                            </StyledView>
                        </StyledView>

                        <Feather name="arrow-down" size={24} color={isDark ? "#444" : "#ccc"} style={{ alignSelf: 'center' }} />

                        {/* Recipient Selection */}
                        <StyledView className="items-center">
                            <StyledText className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>To</StyledText>
                             <StyledView className="flex-row flex-wrap justify-center gap-2">
                                {members.filter(m => m.user_id !== payerId).map(m => (
                                    <TouchableOpacity
                                        key={`recip-${m.user_id}`}
                                        onPress={() => setRecipientId(m.user_id)}
                                        className={`px-4 py-2 rounded-full border ${
                                            recipientId === m.user_id 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : isDark ? 'border-gray-700 bg-white/5' : 'border-gray-300 bg-gray-50'
                                        }`}
                                    >
                                        <StyledText className={`font-bold ${recipientId === m.user_id ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {getMemberName(m.user_id)}
                                        </StyledText>
                                    </TouchableOpacity>
                                ))}
                            </StyledView>
                        </StyledView>

                        {/* Amount Input */}
                        <StyledView className="items-center mt-4">
                             <StyledView className="flex-row items-center justify-center">
                                <StyledText className={`text-3xl font-bold mr-1 ${isDark ? 'text-white' : 'text-main'}`}>₹</StyledText>
                                <StyledTextInput 
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0.00"
                                    placeholderTextColor={isDark ? "#555" : "#ccc"}
                                    keyboardType="numeric"
                                    className={`text-4xl font-black min-w-[100px] text-center ${isDark ? 'text-white' : 'text-main'}`}
                                />
                             </StyledView>
                        </StyledView>


                        {/* Action Button */}
                         <TouchableOpacity
                            onPress={handleSettleUp}
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl flex-row items-center justify-center mt-6 ${loading ? 'opacity-70' : ''}`}
                            style={{ backgroundColor: '#3ecf8e' }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <StyledText className="text-white font-bold text-lg">Record Payment</StyledText>
                            )}
                        </TouchableOpacity>

                         <View className="h-8" />
                    </StyledView>
                </StyledView>
            </View>
        </Modal>
    );
}
