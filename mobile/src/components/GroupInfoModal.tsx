import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Image, Share, Alert, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledImage = styled(Image);

interface GroupInfoModalProps {
    visible: boolean;
    onClose: () => void;
    groupId: string;
    members: any[];
    onUpdate: () => void;
}

export default function GroupInfoModal({ visible, onClose, groupId, members, onUpdate }: GroupInfoModalProps) {
    const { isDark } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState('');

    const handleSearch = async (text: string) => {
        setSearchTerm(text);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, name, username, avatar_url')
            .ilike('username', `%${text}%`)
            .limit(5);
        
        // Filter out existing members
        const memberIds = members.map(m => m.user_id);
        const filtered = data?.filter(u => !memberIds.includes(u.id)) || [];
        
        setSearchResults(filtered);
        setSearching(false);
    };

    const addMember = async (userId: string) => {
        setAdding(userId);
        try {
            await supabase.from('group_members').insert({
                group_id: groupId,
                user_id: userId,
                role: 'member'
            });
            Alert.alert("Success", "Member added!");
            setSearchTerm('');
            setSearchResults([]);
            onUpdate();
        } catch(e) {
            Alert.alert("Error", "Failed to add member");
        }
        setAdding('');
    };

    const shareInvite = async () => {
         try {
             await Share.share({
                 message: `Join my group on SpliBiz! Use code: ${groupId.substring(0,6)}`,
             });
         } catch(e) {}
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <StyledView className="flex-1 justify-end bg-black/80">
                <StyledView className={`h-[85%] rounded-t-3xl overflow-hidden ${isDark ? 'bg-dark-background' : 'bg-background'}`}>
                    
                    {/* Header */}
                    <StyledView className={`flex-row items-center justify-between p-6 border-b ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                        <StyledText className={`text-xl font-bold ${isDark ? 'text-white' : 'text-main'}`}>Group Info</StyledText>
                        <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-dark-border' : 'bg-gray-100'}`}>
                            <Feather name="x" size={20} color={isDark ? "#c9d1d9" : "#000"} />
                        </TouchableOpacity>
                    </StyledView>

                    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
                        
                        {/* Add Member Section */}
                        <StyledView className="mb-8">
                            <StyledText className={`text-xs font-bold uppercase mb-3 ml-1 ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Add People</StyledText>
                            <StyledView className={`flex-row items-center rounded-xl border px-4 py-3 mb-2 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                                <Feather name="search" size={18} color={isDark ? "#8b949e" : "#64748b"} style={{ marginRight: 10 }} />
                                <StyledInput 
                                    placeholder="Search by username..." 
                                    placeholderTextColor={isDark ? "#484f58" : "#94a3b8"}
                                    value={searchTerm}
                                    onChangeText={handleSearch}
                                    className={`flex-1 text-base ${isDark ? 'text-white' : 'text-main'}`}
                                />
                                {searching && <ActivityIndicator size="small" />}
                            </StyledView>

                            {/* Search Results */}
                            {searchResults.map((user) => (
                                <StyledView key={user.id} className={`flex-row items-center justify-between p-3 mb-2 rounded-xl border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                                    <StyledView className="flex-row items-center gap-3">
                                        <StyledImage 
                                            source={{ uri: user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random` }} 
                                            className="w-10 h-10 rounded-full bg-gray-200"
                                        />
                                        <StyledView>
                                            <StyledText className={`font-bold ${isDark ? 'text-white' : 'text-main'}`}>{user.name}</StyledText>
                                            <StyledText className={`text-xs ${isDark ? 'text-dark-muted' : 'text-muted'}`}>@{user.username}</StyledText>
                                        </StyledView>
                                    </StyledView>
                                    <TouchableOpacity 
                                        onPress={() => addMember(user.id)}
                                        disabled={!!adding}
                                        className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#238636]' : 'bg-primary'}`}
                                    >
                                        <StyledText className="text-white text-xs font-bold">{adding === user.id ? '...' : 'Add'}</StyledText>
                                    </TouchableOpacity>
                                </StyledView>
                            ))}

                            <TouchableOpacity 
                                onPress={shareInvite}
                                className={`flex-row items-center justify-center p-4 rounded-xl border border-dashed mt-2 ${isDark ? 'border-primary/50 bg-primary/10' : 'border-primary/50 bg-primary/5'}`}
                            >
                                <Feather name="share" size={18} color="#3ecf8e" style={{ marginRight: 8 }} />
                                <StyledText className="text-primary font-bold">Share Invite Link</StyledText>
                            </TouchableOpacity>
                        </StyledView>

                        {/* Members List */}
                        <StyledView>
                            <StyledText className={`text-xs font-bold uppercase mb-3 ml-1 ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Members ({members.length})</StyledText>
                            {members.map((member) => (
                                <StyledView key={member.user_id} className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                                     <StyledView className="flex-row items-center gap-3">
                                        <StyledView className={`w-12 h-12 rounded-full border items-center justify-center overflow-hidden ${isDark ? 'bg-[#21262d] border-dark-border' : 'bg-gray-100 border-border'}`}>
                                            {member.avatar_url ? (
                                                <StyledImage source={{ uri: member.avatar_url }} className="w-full h-full" />
                                            ) : (
                                                <StyledText className={`font-bold text-lg ${isDark ? 'text-dark-muted' : 'text-muted'}`}>{member.name.charAt(0)}</StyledText>
                                            )}
                                        </StyledView>
                                        <StyledView>
                                            <StyledText className={`font-bold text-base ${isDark ? 'text-white' : 'text-main'}`}>{member.name}</StyledText>
                                            <StyledText className={`text-xs ${isDark ? 'text-dark-muted' : 'text-muted'}`}>{member.role}</StyledText>
                                        </StyledView>
                                     </StyledView>
                                </StyledView>
                            ))}
                        </StyledView>

                    </ScrollView>
                </StyledView>
            </StyledView>
        </Modal>
    );
}
