import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Styled Components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);

export default function CreateGroupScreen() {
  const router = useRouter(); 
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const createGroup = async () => {
      if (!name.trim()) return;
      if (!user) return;
      
      setLoading(true);
      try {
          // 1. Create Group
          const { data: group, error } = await supabase
            .from('groups')
            .insert({
                name: name.trim(),
                created_by: user.id,
                type: 'expense' 
            })
            .select()
            .single();

          if (error) throw error;
          
          // 2. Add Creator as Admin
          if (group) {
              await supabase.from('group_members').insert({
                  group_id: group.id,
                  user_id: user.id,
                  role: 'admin'
              });
              
              // Success
              router.replace('/(tabs)'); 
          }

      } catch (error: any) {
          Alert.alert("Error", error.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <StyledView className={`flex-1 pt-12 ${isDark ? 'bg-dark-background' : 'bg-background'}`}> 
        
        {/* Header */}
        <StyledView className="flex-row items-center px-4 mb-8">
            <TouchableOpacity 
                onPress={() => router.back()} 
                className={`w-10 h-10 items-center justify-center rounded-md border ${isDark ? 'bg-[#21262d] border-dark-border' : 'bg-surface border-border'}`}
            >
                <Ionicons name="arrow-back" size={24} color={isDark ? "#c9d1d9" : "#0f172a"} />
            </TouchableOpacity>
            <StyledText className={`font-bold text-xl ml-4 ${isDark ? 'text-dark-main' : 'text-main'}`}>New Group</StyledText>
        </StyledView>

        <StyledView className="flex-1 px-4">
            <StyledText className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-main'}`}>Create a group</StyledText>
            <StyledText className={`text-base mb-8 ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Groups help you split expenses with friends, roommates, and family.</StyledText>

            {/* Input Card */}
            <StyledView className={`border rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'}`}>
                <StyledText className={`text-xs font-bold uppercase mb-2 ml-1 ${isDark ? 'text-dark-muted' : 'text-muted'}`}>Group Details</StyledText>
                
                <StyledView className={`flex-row items-center rounded-md px-4 py-3 border focus:border-green-500/50 ${isDark ? 'bg-dark-background border-dark-border' : 'bg-background border-border'}`}>
                    <Ionicons name="text-outline" size={20} color={isDark ? "#8b949e" : "#64748b"} style={{ marginRight: 12 }} />
                    <StyledInput 
                        placeholder="Group Name (e.g. Project Alpha)" 
                        placeholderTextColor={isDark ? "#484f58" : "#94a3b8"}
                        value={name} 
                        onChangeText={setName} 
                        className={`flex-1 text-base font-medium ${isDark ? 'text-dark-main' : 'text-main'}`}
                        autoFocus
                        selectionColor="#3ecf8e"
                    />
                </StyledView>
            </StyledView>

        </StyledView>

        {/* Bottom Action Button */}
        <StyledView className={`p-6 border-t ${isDark ? 'bg-dark-background border-dark-border' : 'bg-background border-border'}`}>
            <TouchableOpacity 
                onPress={createGroup}
                disabled={loading}
                className={`w-full h-12 rounded-md items-center justify-center border ${name.trim() ? 'bg-primary border-primary hover:bg-primary-hover shadow-sm' : (isDark ? 'bg-[#21262d] border-dark-border' : 'bg-surface border-border')}`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <StyledText className={`font-bold text-base ${name.trim() ? 'text-white' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                         Create Group
                    </StyledText>
                )}
            </TouchableOpacity>
        </StyledView>

    </StyledView>
  );
}