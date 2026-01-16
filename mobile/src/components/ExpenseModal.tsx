import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from './UI';
import { useTheme } from '../contexts/ThemeContext';

const StyledView = styled(View);
const StyledText = styled(Text);

interface ExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    expense: any;
    members: any[];
    currentUserId: string;
}

export default function ExpenseModal({ visible, onClose, expense, members, currentUserId }: ExpenseModalProps) {
    const { isDark } = useTheme();
    if (!expense) return null;

    const getMember = (userId: string) => members.find(m => m.user_id === userId);
    const getAvatarUrl = (userId: string) => {
        const member = getMember(userId);
        return member?.avatar_url || `https://ui-avatars.com/api/?name=${member?.name || 'U'}&background=random&color=fff`;
    };

    const payer = getMember(expense.created_by);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <StyledView className="flex-1 bg-black/80 justify-end">
                <StyledView className={`rounded-t-3xl h-[60%] border-t ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                    {/* Header */}
                    <StyledView className={`flex-row items-center justify-between p-4 border-b ${isDark ? 'border-dark-border' : 'border-border'}`}>
                         <StyledView>
                            <StyledText className={`font-bold text-xl font-sans ${isDark ? 'text-white' : 'text-main'}`}>{expense.title}</StyledText>
                            <StyledText className={`text-sm font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
                                Total: <StyledText className={`font-bold ${isDark ? 'text-white' : 'text-main'}`}>₹{Number(expense.amount).toFixed(2)}</StyledText>
                            </StyledText>
                         </StyledView>
                         <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                             <Feather name="x" size={20} color={isDark ? "white" : "#0f172a"} />
                         </TouchableOpacity>
                    </StyledView>

                    <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Splits List */}
                        <StyledText className={`font-bold mb-3 font-sans ${isDark ? 'text-white' : 'text-main'}`}>Split Details</StyledText>
                        <StyledView className={`rounded-xl p-2 mb-6 ${isDark ? 'bg-dark-background' : 'bg-background'}`}>
                            {expense.expense_splits?.map((split: any) => {
                                const member = getMember(split.user_id);
                                if (!member) return null;
                                return (
                                    <StyledView key={split.user_id} className={`flex-row items-center justify-between p-3 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                        <StyledView className="flex-row items-center gap-3">
                                            <Image 
                                                source={{ uri: getAvatarUrl(split.user_id) }} 
                                                className={`w-8 h-8 rounded-full ${isDark ? 'bg-dark-surface' : 'bg-white border border-gray-100'}`}
                                            />
                                            <StyledView>
                                                <StyledText className={`font-medium text-sm font-sans ${isDark ? 'text-white' : 'text-main'}`}>{member.name}</StyledText>
                                                <StyledText className={`text-[10px] font-bold uppercase ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
                                                    {split.user_id === currentUserId ? "YOU" : "MEMBER"}
                                                </StyledText>
                                            </StyledView>
                                        </StyledView>
                                        <StyledView className="items-end">
                                            <StyledText className={`font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>₹{Number(split.share).toFixed(2)}</StyledText>
                                            <StyledText className={`text-[10px] font-sans lowercase ${isDark ? 'text-dark-muted' : 'text-muted'}`}>share</StyledText>
                                        </StyledView>
                                    </StyledView>
                                );
                            })}
                        </StyledView>

                         {/* Paid details */}
                        <StyledView className={`flex-row items-center justify-center p-4 rounded-xl border ${isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'}`}>
                             <StyledText className="text-primary text-xs font-sans">
                                Paid by <StyledText className="font-bold">{payer?.name || 'Unknown'}</StyledText>
                             </StyledText>
                             <StyledText className="text-primary font-bold ml-2">₹{Number(expense.amount).toFixed(2)}</StyledText>
                        </StyledView>
                    </ScrollView>
                </StyledView>
            </StyledView>
        </Modal>
    );
}
