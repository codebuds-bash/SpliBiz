import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenWrapper } from '../../src/components/UI';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StyledText = styled(Text);
const StyledView = styled(View);
const StyledTouchable = styled(TouchableOpacity);

interface Group {
    id: string;
    name: string;
    created_at: string;
    role?: string;
    type?: string;
}

interface Activity {
    id: string;
    title: string;
    amount: number;
    created_at: string;
    groups: {
        name: string;
    };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalOwe, setTotalOwe] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (!user) return;
        
        // 1. Fetch Groups
        const { data: groupData, error: groupError } = await supabase
            .from("group_members")
            .select(`
                role,
                groups (
                    id,
                    name,
                    created_at,
                    type
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { foreignTable: "groups", ascending: false });

        if (groupError) throw groupError;
        
        const formattedGroups = groupData.map((item: any) => ({
            ...item.groups,
            role: item.role
        })) as Group[];
        setGroups(formattedGroups);

        // 1.5 Fetch Total Owe (sum of all splits assigned to me)
        const { data: splitData } = await supabase
            .from('expense_splits')
            .select('share')
            .eq('user_id', user.id);
        
        if (splitData) {
            console.log('Total Splits Found:', splitData.length);
            // @ts-ignore
            const total = splitData.reduce((sum, item) => sum + parseFloat(item.share || 0), 0);
            console.log('Calculated Total Owe:', total);
            setTotalOwe(total);
        } else {
            console.log('No splits found or error');
        }

        // 2. Fetch User Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
        
        if (profileData?.name) {
            setUserName(profileData.name);
        }

        // 3. Fetch Recent Activity
        const { data: activityData, error: activityError } = await supabase
            .from("expenses")
            .select(`
                id, title, amount, created_at, group_id, created_by,
                groups (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (activityData) {
            // @ts-ignore
            setActivities(activityData);
        }

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id, name: item.name } })}
        className="mb-3"
    >
      <StyledView className={`${isDark ? 'bg-dark-surface' : 'bg-surface'} border ${isDark ? 'border-dark-border' : 'border-border'} rounded-xl p-4 flex-row items-center justify-between`}>
         <StyledView className="flex-row items-center flex-1 gap-3">
            {/* Group Icon Placeholder */}
            <LinearGradient
                colors={['rgba(62, 207, 142, 0.1)', 'rgba(62, 207, 142, 0.05)']}
                className="w-12 h-12 rounded-xl items-center justify-center border border-primary/20"
            >
                <StyledText className="text-primary font-bold text-lg font-sans">
                    {item.name.substring(0, 1).toUpperCase()}
                </StyledText>
            </LinearGradient>

            <StyledView className="flex-1">
                <StyledView className="flex-row items-center gap-2 mb-1">
                    <StyledText className={`${isDark ? 'text-white' : 'text-main'} font-bold text-base font-sans truncate`} numberOfLines={1}>
                        {item.name}
                    </StyledText>
                    {item.role === 'admin' && (
                        <StyledView className="bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                            <StyledText className="text-yellow-500 text-[10px] font-bold uppercase">ADMIN</StyledText>
                        </StyledView>
                    )}
                </StyledView>
                <StyledText className={`${isDark ? 'text-dark-muted' : 'text-muted'} text-xs font-sans`}>
                    {item.type || 'Group Expense'}
                </StyledText>
            </StyledView>
         </StyledView>
         <Feather name="chevron-right" size={20} color={isDark ? "#666" : "#94a3b8"} />
      </StyledView>
    </TouchableOpacity>
  );

  const ListFooter = () => (
      <View className="mt-6 mb-24 px-1">
          {activities.length > 0 && (
              <StyledView className="mb-8">
                  <StyledText className={`text-lg font-bold mb-4 font-sans ${isDark ? 'text-white' : 'text-main'}`}>Recent Activity</StyledText>
                  {activities.map(activity => (
                      <StyledView key={activity.id} className={`border rounded-xl p-4 mb-3 flex-row items-center justify-between ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                          <StyledView className="flex-row items-center gap-4 flex-1">
                              <StyledView className={`w-10 h-10 rounded-full border items-center justify-center shrink-0 ${isDark ? 'bg-dark-background border-dark-border' : 'bg-background border-border'}`}>
                                  <Ionicons name="receipt-outline" size={18} color={isDark ? "#666" : "#94a3b8"} />
                              </StyledView>
                              <StyledView className="flex-1">
                                  <StyledText className={`font-bold text-sm font-sans truncate ${isDark ? 'text-white' : 'text-main'}`} numberOfLines={1}>
                                    {activity.title}
                                  </StyledText>
                                  <StyledText className={`text-xs font-sans truncate ${isDark ? 'text-dark-muted' : 'text-muted'}`} numberOfLines={1}>
                                      in <StyledText className={isDark ? 'text-white' : 'text-main'}>{activity.groups?.name}</StyledText>
                                  </StyledText>
                              </StyledView>
                          </StyledView>
                          
                          <StyledView className="items-end shrink-0 ml-2">
                              <StyledText className={`font-bold text-sm font-sans ${isDark ? 'text-white' : 'text-main'}`}>₹{Number(activity.amount).toFixed(0)}</StyledText>
                              <StyledText className={`text-[10px] font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
                                  {new Date(activity.created_at).toLocaleDateString()}
                              </StyledText>
                          </StyledView>
                      </StyledView>
                  ))}
              </StyledView>
          )}
      </View>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderGroupCard}
        ListHeaderComponent={
          <View className="mb-6">
              {/* Header */}
              <StyledView className="flex-row items-center justify-between mb-8 mt-2">
                 <StyledView>
                    <StyledText className={`text-3xl font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>Dashboard</StyledText>
                    <StyledText className={`font-sans text-base ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Welcome back {userName || user?.email?.split('@')[0]}</StyledText>
                 </StyledView>
                 <StyledView className="flex-row gap-3">
                    <TouchableOpacity 
                        onPress={() => router.push('/notifications')}
                        className={`w-10 h-10 rounded-full border items-center justify-center ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}
                    >
                        <Feather name="bell" size={20} color={isDark ? "white" : "#0f172a"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push('/(tabs)/profile')}
                        className={`w-10 h-10 rounded-full border items-center justify-center ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}
                    >
                        <Feather name="user" size={20} color={isDark ? "white" : "#0f172a"} />
                    </TouchableOpacity>
                 </StyledView>
              </StyledView>
    
              {/* Stats Cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 gap-3 pr-4">
                  <LinearGradient
                    colors={['rgba(62, 207, 142, 0.15)', 'rgba(62, 207, 142, 0.05)']}
                    className="w-40 p-4 rounded-xl border border-primary/20 mr-3"
                  >
                      <StyledText className="text-primary text-xs font-bold uppercase mb-1 font-sans">Active Groups</StyledText>
                      <StyledText className={`text-2xl font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>{groups.length}</StyledText>
                  </LinearGradient>
                  
                  <StyledView className={`w-40 p-4 rounded-xl border mr-3 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                      <StyledText className={`text-xs font-bold uppercase mb-1 font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Total Owed</StyledText>
                      <StyledText className={`text-2xl font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>₹0</StyledText>
                  </StyledView>
                  
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => {
                        console.log('Navigating to debts...');
                        router.push('/debts');
                    }}
                  >
                    <StyledView className={`w-40 p-4 rounded-xl border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                        <StyledText className={`text-xs font-bold uppercase mb-1 font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Total Owe</StyledText>
                        <StyledText className={`text-2xl font-bold font-sans ${isDark ? 'text-white' : 'text-main'}`}>
                            ₹{totalOwe.toFixed(0)}
                        </StyledText>
                    </StyledView>
                  </TouchableOpacity>
              </ScrollView>
    
              <StyledText className={`text-xl font-bold mb-4 font-sans ${isDark ? 'text-white' : 'text-main'}`}>Your Groups</StyledText>
          </View>
        }
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        extraData={{ totalOwe, groups, loading, isDark }}
        refreshControl={
            <RefreshControl 
                refreshing={loading} 
                onRefresh={fetchData} 
                tintColor="#1db954" 
                colors={["#1db954"]} 
            />
        }
        ListEmptyComponent={
            !loading ? (
                <StyledView className="items-center justify-center py-10 opacity-70">
                    <Feather name="folder" size={40} color={isDark ? "#b3b3b3" : "#cbd5e1"} />
                    <StyledText className={`text-center mt-4 font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>No groups found.</StyledText>
                    <StyledText className={`text-center mt-1 text-sm font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Create one to get started!</StyledText>
                </StyledView>
            ) : null
        }
      />

    
      <TouchableOpacity 
        onPress={() => router.push('/create-group')}
        activeOpacity={0.8}
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-black/50"
      >
        <Feather name="plus" size={28} color="#151515" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
