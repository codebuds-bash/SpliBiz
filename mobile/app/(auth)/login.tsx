import React, { useState } from 'react';
import { View, Text, Alert, Platform, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper } from '../../src/components/UI';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../../src/contexts/ThemeContext';

const StyledText = styled(Text);
const StyledView = styled(View);
const StyledImage = styled(Image);

// Handle redirects
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
        const deepLink = Linking.createURL('/');
        const redirectUrl = `https://splibiz.vercel.app/auth/callback?redirect_to=${encodeURIComponent(deepLink)}`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true
            },
        });

        if (data?.url) {
            const result = await WebBrowser.openAuthSessionAsync(data.url, deepLink);
            
            if (result.type === 'success' && result.url) {
                const url = new URL(result.url);
                const params = new URLSearchParams(url.hash.substring(1));
                
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) throw sessionError;
                }
            }
        }
    } catch (e: any) {
        Alert.alert('Login Error', e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="justify-center items-center">
      {/* Brand Logo / Name */}
      

      <StyledView className={`w-full max-w-[400px] border rounded-2xl p-8 shadow-xl ${isDark ? 'bg-dark-surface border-dark-border shadow-black/50' : 'bg-surface border-border shadow-gray-200'}`}>
        <StyledView className="items-center mb-8">
          <StyledView className="items-center">
         <StyledImage 
            source={require('../../assets/app_icons/icon.png')}
            className="w-20 h-20 rounded-xl mb-4"
            resizeMode="contain"
         />
      </StyledView>
          <StyledText className={`text-3xl font-bold mb-2 font-gl ${isDark ? 'text-white' : 'text-main'}`}>
            Welcome
          </StyledText>
          <StyledText className={`text-sm text-center font-sans ${isDark ? 'text-dark-muted' : 'text-muted'}`}>
            Sign in to start splitting with friends.
          </StyledText>
        </StyledView>

        <TouchableOpacity 
            onPress={loginWithGoogle}
            disabled={loading}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center w-full border rounded-xl py-4 ${isDark ? 'bg-white border-white' : 'bg-black border-black'}`}
        >
            <StyledImage 
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
                className="w-5 h-5 mr-3"
                resizeMode="contain"
            />
            <StyledText className={`font-bold text-base font-sans ${isDark ? 'text-black' : 'text-white'}`}>
                Continue with Google
            </StyledText>
        </TouchableOpacity>
      </StyledView>
    </ScreenWrapper>
  );
}
