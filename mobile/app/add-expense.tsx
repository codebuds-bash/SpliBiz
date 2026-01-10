import React, { useState, useEffect } from 'react';
import { View, Text, Switch, FlatList, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenWrapper, Input, Button, Card } from '../src/components/UI';
import { styled } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';

const StyledText = styled(Text);
const StyledView = styled(View);

export default function AddExpenseScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
    
    let members = [];
    try {
        const memParam = Array.isArray(params.members) ? params.members[0] : params.members;
        if (memParam) members = JSON.parse(memParam);
    } catch(e) {}
    
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Split Logic (Simplified: Equal split among selected)
    const [selectedMembers, setSelectedMembers] = useState(members.map(m => m.user_id));

    const toggleMember = (id) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(mid => mid !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    const addExpense = async () => {
        if (!title || !amount || selectedMembers.length === 0) {
            return Alert.alert("Error", "Please fill all fields and select at least one person.");
        }

        setLoading(true);
        try {
            const totalAmount = parseFloat(amount);
            
            // 1. Create Expense
            const { data: expense, error } = await supabase
                .from("expenses")
                .insert({
                    group_id: groupId,
                    title: title,
                    amount: totalAmount,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Add Payer (Assuming 'You' paid full - simplified for mobile mvp)
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
            Alert.alert("Error", e.message);
        }
        setLoading(false);
    };

    return (
        <ScreenWrapper>
             <StyledText className="text-xl font-bold text-white mb-4">Add Expense</StyledText>
             
             <Input placeholder="Description" value={title} onChangeText={setTitle} />
             <Input placeholder="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />

             <StyledText className="text-gray-400 mb-2 mt-4">Split with:</StyledText>
             <StyledView className="flex-1 mb-4">
                 <FlatList 
                    data={members}
                    keyExtractor={item => item.user_id}
                    renderItem={({ item }) => {
                        const isSelected = selectedMembers.includes(item.user_id);
                        return (
                            <Card className={`mb-2 flex-row items-center justify-between py-3 ${isSelected ? 'border-green-500/50' : 'border-transparent'}`}>
                                <StyledText className={`font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {item.name}
                                </StyledText>
                                <Switch 
                                    value={isSelected} 
                                    onValueChange={() => toggleMember(item.user_id)}
                                    trackColor={{ false: "#333", true: "#4ade80" }}
                                />
                            </Card>
                        )
                    }}
                 />
             </StyledView>

             <Button title="Save Expense" onPress={addExpense} loading={loading} />
             <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        </ScreenWrapper>
    );
}
