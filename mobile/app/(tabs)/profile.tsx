import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenWrapper, Button, Card } from '../../src/components/UI';
import { styled } from 'nativewind';

const StyledText = styled(Text);
const StyledView = styled(View);

interface Profile {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if(user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <ScreenWrapper>
        <StyledView className="mb-8 items-center">
             <StyledView className="w-24 h-24 rounded-full bg-gray-800 border-2 border-green-500 mb-4 items-center justify-center overflow-hidden">
                {profile?.avatar_url && !profile.avatar_url.includes('ui-avatars') ? (
                    <StyledText>IMG</StyledText> // Placeholder for Image component if we want 
                ) : (
                    <StyledText className="text-3xl text-gray-400 font-bold">
                        {profile?.name?.charAt(0) || user?.email?.charAt(0)}
                    </StyledText>
                )}
             </StyledView>
             <StyledText className="text-2xl font-bold text-white">{profile?.name || "User"}</StyledText>
             <StyledText className="text-gray-400">@{profile?.username || "username"}</StyledText>
        </StyledView>

        <Card className="mb-8">
            <StyledView className="flex-row justify-between py-2 border-b border-gray-800">
                <StyledText className="text-gray-400">Email</StyledText>
                <StyledText className="text-white">{user?.email}</StyledText>
            </StyledView>
            <StyledView className="flex-row justify-between py-2 pt-4">
                <StyledText className="text-gray-400">User ID</StyledText>
                <StyledText className="text-white text-xs text-right max-w-[150px]">{user?.id}</StyledText>
            </StyledView>
        </Card>

        <Button title="Sign Out" onPress={signOut} variant="danger" />
    </ScreenWrapper>
  );
}
