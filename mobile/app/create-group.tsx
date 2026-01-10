import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenWrapper, Input, Button } from '../src/components/UI';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';

const StyledText = styled(Text);

export default function CreateGroupScreen() {
  const router = useRouter(); 
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const createGroup = async () => {
    if (!name.trim()) return Alert.alert("Error", "Group name is required");
    
    setLoading(true);
    try {
        const { data: group, error } = await supabase
            .from("groups")
            .insert({
                name: name.trim(),
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-add creator as admin
        const { error: memberError } = await supabase
            .from("group_members")
            .insert({
                group_id: group.id,
                user_id: user.id,
                role: "admin"
            });
        
        if (memberError) throw memberError;

        router.back();
    } catch(e) {
        Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <ScreenWrapper>
        <StyledText className="text-2xl font-bold text-white mb-6">Create New Group</StyledText>
        <Input 
            placeholder="Group Name (e.g. Trip to Goa)" 
            value={name} 
            onChangeText={setName} 
        />
        <Button 
            title="Create Group" 
            onPress={createGroup} 
            loading={loading}
        />
        <View className="mt-4">
            <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
    </ScreenWrapper>
  );
}
