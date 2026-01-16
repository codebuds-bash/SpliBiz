import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenWrapper } from '../src/components/UI';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const StyledText = styled(Text);
const StyledView = styled(View);

interface Notification {
    id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
    group_id?: string;
    user_id: string;
    actor?: {
        name: string;
        avatar_url: string;
    };
    group?: {
        name: string;
    };
}

export default function NotificationsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from("notifications")
                .select(`
                  *,
                  actor:profiles!notifications_actor_id_fkey (
                    name,
                    avatar_url
                  ),
                  group:groups (
                    name
                  )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            // @ts-ignore
            setNotifications(data || []);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);
            
            if (error) throw error;

            setNotifications(prev =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (e) {
            console.error(e);
        }
    };

    const handleInvite = async (notification: Notification, accept: boolean) => {
        try {
            if (accept) {
                // Add to group
                const { error: joinError } = await supabase
                    .from("group_members")
                    .insert({
                        group_id: notification.group_id,
                        user_id: notification.user_id,
                        role: 'member' // Default role
                    });
                
                if (joinError) {
                    // Ignore if unique violation (already member)
                    if (joinError.code !== '23505') throw joinError;
                }
                Alert.alert("Success", `Joined group "${notification.group?.name}"`);
            } else {
                Alert.alert("Info", "Invite rejected");
            }
    
            // Delete notification
            await supabase.from("notifications").delete().eq("id", notification.id);
            
            // Remove from list
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
        } catch (err: any) {
            console.error(err);
            Alert.alert("Error", "Failed to process invite: " + err.message);
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <StyledView className={`p-4 border-b border-white/5 ${!item.is_read ? 'bg-green-500/5' : ''}`}>
             <StyledView className="flex-row items-start gap-4">
                {/* Avatar */}
                <StyledView className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center overflow-hidden">
                    {item.actor?.avatar_url ? (
                        <Image source={{ uri: item.actor.avatar_url }} className="w-full h-full" />
                    ) : (
                        <StyledText className="text-white font-bold">{item.actor?.name?.[0] || "?"}</StyledText>
                    )}
                </StyledView>

                {/* Content */}
                <StyledView className="flex-1">
                    <StyledText className="text-white text-sm font-sans mb-1">
                        <StyledText className="font-bold">{item.actor?.name || "Someone"}</StyledText> {item.message}
                    </StyledText>
                    <StyledText className="text-muted text-[10px] font-sans mb-2">
                        {new Date(item.created_at).toLocaleString()}
                    </StyledText>

                    {/* Actions */}
                    {item.type === 'invite' && (
                        <StyledView className="flex-row gap-2 mt-1">
                            <TouchableOpacity 
                                onPress={() => handleInvite(item, true)}
                                className="bg-primary px-3 py-1.5 rounded-lg"
                            >
                                <StyledText className="text-black font-bold text-xs">Accept</StyledText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => handleInvite(item, false)}
                                className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg"
                            >
                                <StyledText className="text-red-400 font-bold text-xs">Reject</StyledText>
                            </TouchableOpacity>
                        </StyledView>
                    )}

                     {/* Mark as read button */}
                     {!item.is_read && item.type !== 'invite' && (
                        <TouchableOpacity onPress={() => markAsRead(item.id)} className="mt-2">
                            <StyledText className="text-primary text-xs underline">Mark as read</StyledText>
                        </TouchableOpacity>
                     )}
                </StyledView>

                {!item.is_read && <StyledView className="w-2 h-2 rounded-full bg-primary mt-2" />}
             </StyledView>
        </StyledView>
    );

    return (
        <ScreenWrapper>
             <StyledView className="flex-row items-center justify-between mb-6 pt-2">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
                >
                    <Feather name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <StyledText className="text-xl font-bold text-white font-sans">Notifications</StyledText>
                <StyledView className="w-10" /> 
            </StyledView>

            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={renderNotification}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor="#3ecf8e" colors={["#3ecf8e"]} />}
                ListEmptyComponent={
                    !loading ? (
                        <StyledView className="items-center justify-center py-20 opacity-50">
                            <Feather name="bell-off" size={40} color="#444" />
                            <StyledText className="text-gray-400 text-center mt-4 font-sans">No notifications</StyledText>
                        </StyledView>
                    ) : null
                }
            />
        </ScreenWrapper>
    );
}
