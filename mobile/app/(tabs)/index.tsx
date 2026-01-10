import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenWrapper, Card } from '../../src/components/UI';
import { styled } from 'nativewind';

const StyledText = styled(Text);
const StyledView = styled(View);

interface Group {
    id: string;
    name: string;
    created_at: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter(); // Use expo router
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
        if (!user) return;
        
        // Fetch groups where user is a member
        const { data, error } = await supabase
            .from("group_members")
            .select(`
                group_id,
                groups (
                    id,
                    name,
                    created_at
                )
            `)
            .eq("user_id", user.id);

        if (error) throw error;
        
        // Flatten structure - handle case where groups is returned as array or object
        // @ts-ignore
        const formattedGroups = data.map(item => Array.isArray(item.groups) ? item.groups[0] : item.groups).filter(Boolean) as Group[];
        setGroups(formattedGroups);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [user])
  );

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id, name: item.name } })}>
      <Card className="mb-4 flex-row items-center justify-between">
         <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 rounded-full bg-gradient-to-r bg-blue-500/20 items-center justify-center border border-blue-500/30">
                <StyledText className="text-blue-400 font-bold text-lg">
                    {item.name.substring(0, 2).toUpperCase()}
                </StyledText>
            </StyledView>
            <StyledView>
                <StyledText className="text-white font-bold text-lg">{item.name}</StyledText>
                <StyledText className="text-gray-500 text-xs">Tap to view details</StyledText>
            </StyledView>
         </StyledView>
         <StyledText className="text-gray-600">›</StyledText>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <StyledView className="flex-row items-center justify-between mb-6">
         <StyledView>
            <StyledText className="text-3xl font-bold text-white">Dashboard</StyledText>
            <StyledText className="text-gray-400">Your Active Groups</StyledText>
         </StyledView>
         <TouchableOpacity 
            onPress={() => router.push('/create-group')}
            className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
         >
            <StyledText className="text-white text-2xl font-light pb-1">+</StyledText>
         </TouchableOpacity>
      </StyledView>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderGroup}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGroups} tintColor="#fff" />}
        ListEmptyComponent={
            !loading ? (
                <StyledView className="items-center justify-center mt-20 opacity-50">
                    <StyledText className="text-gray-400 text-center">No groups found.</StyledText>
                    <StyledText className="text-gray-600 text-center mt-2">Create one to get started!</StyledText>
                </StyledView>
            ) : null
        }
      />
    </ScreenWrapper>
  );
}
