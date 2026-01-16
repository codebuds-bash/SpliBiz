import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Alert, Linking, Modal, TextInput } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { styled } from 'nativewind';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- Styled Components ---
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);
const StyledInput = styled(TextInput);

interface Profile {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, setTheme, theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  
  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit Profile State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ groups: 0, settled: 0, friends: 0 });

  useEffect(() => {
    if(user) {
        fetchProfile();
        fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if(!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
        setProfile(data);
        setEditName(data.name || '');
    }
  };

  const fetchStats = async () => {
      if(!user) return;
      // 1. Groups Count
      const { count: groupCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
    
      setStats(prev => ({ ...prev, groups: groupCount || 0 }));
  };

  const handleSaveProfile = async () => {
      if (!user) return;
      if (!editName.trim()) {
          Alert.alert("Error", "Name cannot be empty");
          return;
      }
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName.trim() })
        .eq('id', user.id);
    
      if (error) {
          Alert.alert("Error", error.message);
      } else {
          setProfile(prev => prev ? { ...prev, name: editName.trim() } : null);
          setIsEditModalVisible(false);
          Alert.alert("Success", "Profile updated!");
      }
      setSaving(false);
  };

  const handleSignOut = () => {
    setIsSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
      setIsSignOutModalVisible(false);
      setTimeout(() => {
          signOut();
      }, 200);
  };

  const toggleTheme = () => {
      console.log('Toggling theme from:', theme);
      setTheme(isDark ? 'light' : 'dark');
  };

  const MenuItem = ({ icon, label, value, onPress, isDanger = false, type = 'link' }: any) => (
    <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between p-4 border-b ${isDark ? 'border-dark-border' : 'border-border'} ${isDanger ? 'opacity-90' : ''}`}
        style={{ borderBottomWidth: 1 }}
    >
        <StyledView className="flex-row items-center gap-4">
            <StyledView className={`w-8 h-8 rounded-lg items-center justify-center ${isDanger ? 'bg-red-500/10' : (isDark ? 'bg-[#535353]' : 'bg-gray-100')}`}>
                <Ionicons name={icon} size={18} color={isDanger ? '#ef4444' : (isDark ? '#b3b3b3' : '#64748b')} />
            </StyledView>
            <StyledText className={`font-medium text-base ${isDanger ? 'text-red-500' : (isDark ? 'text-white' : 'text-main')}`}>
                {label}
            </StyledText>
        </StyledView>

        {type === 'toggle' ? (
            <Switch 
                value={value} 
                onValueChange={onPress}
                trackColor={{ false: '#e2e8f0', true: '#1db954' }} // Light gray vs Spotify Green
                thumbColor={'#fff'}
            />
        ) : (
            <Feather name="chevron-right" size={18} color={isDark ? "#b3b3b3" : "#94a3b8"} />
        )}
    </TouchableOpacity>
  );

  return (
    <StyledScrollView className={`flex-1 ${isDark ? "bg-dark-background" : "bg-background"}`}>
        {/* --- Header Section --- */}
        <StyledView className={`items-center pt-12 pb-8 border-b rounded-b-[32px] ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`} style={{ borderBottomWidth: 1 }}>
             
             {/* Avatar */}
             <StyledView className="relative mb-4">
                <StyledView className={`w-28 h-28 rounded-full border-4 items-center justify-center overflow-hidden shadow-xl shadow-black/20 ${isDark ? "bg-dark-background border-dark-border" : "bg-background border-border"}`} style={{ borderWidth: 4 }}>
                    {profile?.avatar_url && !profile.avatar_url.includes('ui-avatars') ? (
                        <StyledImage source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <StyledText className={`text-4xl font-bold ${isDark ? "text-dark-muted" : "text-muted"}`}>
                            {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </StyledText>
                    )}
                </StyledView>
                <TouchableOpacity 
                    onPress={() => setIsEditModalVisible(true)}
                    className={`absolute bottom-0 right-1 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 ${isDark ? "border-dark-background" : "border-background"}`}
                    style={{ borderWidth: 2 }}
                >
                    <Feather name="edit-2" size={12} color="white" />
                </TouchableOpacity>
             </StyledView>

             {/* Info */}
             <StyledText className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-main"}`}>{profile?.name || "SpliBiz User"}</StyledText>
             <StyledText className={`font-medium mb-4 ${isDark ? "text-dark-muted" : "text-muted"}`}>@{profile?.username || "username"}</StyledText>
             
             {/* Email Badge */}
             <StyledView className={`px-3 py-1 rounded-full border ${isDark ? "bg-[#212121] border-dark-border" : "bg-gray-100 border-border"}`} style={{ borderWidth: 1 }}>
                <StyledText className={`text-xs pb-[2px] ${isDark ? "text-dark-muted" : "text-muted"}`}>{user?.email}</StyledText>
             </StyledView>
        </StyledView>

        {/* --- Stats Row --- */}
        <StyledView className="flex-row justify-evenly py-6 mx-4 mb-4">
            <StyledView className="items-center w-1/3">
                <StyledText className={`font-bold text-lg ${isDark ? "text-white" : "text-main"}`}>{stats.groups}</StyledText>
                <StyledText className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-dark-muted" : "text-muted"}`}>Groups</StyledText>
            </StyledView>
            <StyledView className={`w-[1px] h-8 self-center ${isDark ? "bg-dark-border" : "bg-border"}`} />
            <StyledView className="items-center w-1/3">
                <StyledText className={`font-bold text-lg ${isDark ? "text-white" : "text-main"}`}>₹0</StyledText>
                <StyledText className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-dark-muted" : "text-muted"}`}>Settled</StyledText>
            </StyledView>
             <StyledView className={`w-[1px] h-8 self-center ${isDark ? "bg-dark-border" : "bg-border"}`} />
            <StyledView className="items-center w-1/3">
                <StyledText className={`font-bold text-lg ${isDark ? "text-white" : "text-main"}`}>0</StyledText>
                <StyledText className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-dark-muted" : "text-muted"}`}>Friends</StyledText>
            </StyledView>
        </StyledView>

        {/* --- Settings Groups --- */}
        <StyledView className="px-4 pb-20">
            {/* Account Settings */}
            <StyledText className={`text-xs font-bold uppercase ml-2 mb-2 mt-4 ${isDark ? "text-dark-muted" : "text-muted"}`}>Account</StyledText>
            <StyledView className={`border rounded-xl overflow-hidden mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`} style={{ borderWidth: 1 }}>
                <MenuItem icon="person-outline" label="Edit Profile" onPress={() => setIsEditModalVisible(true)} />
                <MenuItem icon="notifications-outline" label="Notifications" type="toggle" value={notificationsEnabled} onPress={() => setNotificationsEnabled(!notificationsEnabled)} />
                <MenuItem icon="lock-closed-outline" label="Privacy & Security" onPress={() => {}} />
            </StyledView>

            {/* App Settings */}
            <StyledText className={`text-xs font-bold uppercase ml-2 mb-2 ${isDark ? "text-dark-muted" : "text-muted"}`}>Preferences</StyledText>
            <StyledView className={`border rounded-xl overflow-hidden mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`} style={{ borderWidth: 1 }}>
                <MenuItem icon="moon-outline" label="Dark Mode" type="toggle" value={isDark} onPress={toggleTheme} />
                <MenuItem icon="globe-outline" label="Language" onPress={() => {}} />
            </StyledView>

             {/* Support */}
             <StyledText className={`text-xs font-bold uppercase ml-2 mb-2 ${isDark ? "text-dark-muted" : "text-muted"}`}>Support</StyledText>
            <StyledView className={`border rounded-xl overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`} style={{ borderWidth: 1 }}>
                <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Linking.openURL('https://github.com/codebuds-bash/SpliBiz/issues')} />
                <MenuItem icon="information-circle-outline" label="About SpliBiz" onPress={() => Alert.alert("SpliBiz Beta", "Version 1.0.0\nBuilt with ❤️ by CodeBuds.")} />
            </StyledView>

            {/* Sign Out */}
            <TouchableOpacity 
                onPress={handleSignOut} 
                className={`flex-row items-center justify-center p-4 border rounded-xl active:bg-red-500/10 active:border-red-500/30 ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`}
                style={{ borderWidth: 1 }}
            >
                <Feather name="log-out" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                <StyledText className="text-red-500 font-bold text-base">Sign Out</StyledText>
            </TouchableOpacity>
            
            <StyledText className={`text-center text-xs mt-6 mb-10 font-bold ${isDark ? "text-dark-border" : "text-muted"}`}>SpliBiz v1.0.0 (Greenify Build)</StyledText>
        </StyledView>

        {/* --- Edit Profile Modal --- */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isEditModalVisible}
            onRequestClose={() => setIsEditModalVisible(false)}
        >
            <StyledView className="flex-1 justify-end bg-black/80">
                <StyledView className={`rounded-t-3xl border-t p-6 pb-12 ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`} style={{ borderWidth: 1 }}>
                     <StyledView className="flex-row justify-between items-center mb-6">
                         <StyledText className={`font-bold text-xl ${isDark ? "text-white" : "text-main"}`}>Edit Profile</StyledText>
                         <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className={`p-2 rounded-full ${isDark ? "bg-dark-border" : "bg-gray-100"}`}>
                             <Feather name="x" size={20} color={isDark ? "#b3b3b3" : "#000"} />
                         </TouchableOpacity>
                     </StyledView>

                     <StyledView className="mb-6">
                         <StyledText className={`text-xs font-bold uppercase mb-2 ml-1 ${isDark ? "text-dark-muted" : "text-muted"}`}>Full Name</StyledText>
                         <StyledInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Your Name"
                            placeholderTextColor="#64748b"
                            className={`p-4 rounded-xl text-base border ${isDark ? "bg-dark-background border-dark-border text-white" : "bg-background border-border text-main"}`}
                            style={{ borderWidth: 1 }}
                            autoFocus
                         />
                     </StyledView>

                     <TouchableOpacity 
                        onPress={handleSaveProfile}
                        disabled={saving}
                        className="bg-primary w-full py-4 rounded-xl items-center"
                     >
                         <StyledText className="text-white font-bold text-base">
                             {saving ? "Saving..." : "Save Changes"}
                         </StyledText>
                     </TouchableOpacity>
                </StyledView>
            </StyledView>
        </Modal>


    {/* --- Sign Out Confirmation Modal --- */}
    <Modal
        animationType="fade"
        transparent={true}
        visible={isSignOutModalVisible}
        onRequestClose={() => setIsSignOutModalVisible(false)}
    >
        <StyledView className="flex-1 bg-black/80 items-center justify-center p-4">
            <StyledView className={`w-full max-w-[320px] rounded-3xl p-6 items-center shadow-2xl ${isDark ? 'bg-[#212121]' : 'bg-white'}`}>
                <StyledView className={`w-16 h-16 rounded-full items-center justify-center mb-5 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <Feather name="log-out" size={28} color="#ef4444" style={{ marginLeft: 3 }} />
                </StyledView>
                
                <StyledText className={`text-xl font-bold mb-2 text-center font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>Sign Out</StyledText>
                <StyledText className={`text-center mb-8 font-sans ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Are you sure you want to sign out of your account?</StyledText>
                
                <StyledView className="flex-row gap-3 w-full">
                    <TouchableOpacity 
                        onPress={() => setIsSignOutModalVisible(false)}
                        className={`flex-1 py-3.5 rounded-xl border items-center justify-center ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
                    >
                        <StyledText className={`font-semibold font-sans ${isDark ? 'text-white' : 'text-gray-700'}`}>Cancel</StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={confirmSignOut}
                        className="flex-1 py-3.5 rounded-xl bg-red-500 items-center justify-center shadow-lg shadow-red-500/30"
                    >
                        <StyledText className="text-white font-bold font-sans">Sign Out</StyledText>
                    </TouchableOpacity>
                </StyledView>
            </StyledView>
        </StyledView>
    </Modal>
    </StyledScrollView>
  );
}
