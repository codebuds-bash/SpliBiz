import React, { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper, Button } from '../../src/components/UI';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const StyledText = styled(Text);

// Handle redirects
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
        // 1. Create the deep link that points back to THIS device (e.g. exp://192.168.1.5:8081/--/auth)
        // This is dynamic and changes on every network/user
        const deepLink = Linking.createURL('/auth');
        console.log('Mobile Deep Link:', deepLink);

        // 2. Create the "Proxy" URL pointing to our hosted web app
        // We pass the deepLink as a parameter so the web page knows where to bounce the user back
        // IMPORTANT: You might need to add 'https://splibiz.vercel.app/auth/callback*' to Supabase Redirect URLs
        const redirectUrl = `https://splibiz.vercel.app/auth/callback?redirect_to=${encodeURIComponent(deepLink)}`;
        console.log('Supabase Redirect URL:', redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true
            },
        });

        if (data?.url) {
            // We expect the browser to open the 'redirectUrl' (web proxy), which will then redirect to our 'deepLink'
            // However, openAuthSessionAsync needs to know what URL to wait for.
            // It should wait for 'exp://...' (the deepLink) to come back.
            const result = await WebBrowser.openAuthSessionAsync(data.url, deepLink);
            
            if (result.type === 'success' && result.url) {
                // Parse access_token and refresh_token from the URL fragment
                const url = new URL(result.url);
                const params = new URLSearchParams(url.hash.substring(1)); // Remove the '#'
                
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) throw sessionError;
                    // AuthState listener in context will pick this up and redirect
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
    <ScreenWrapper className="justify-center">
      <View className="mb-20 items-center">
        <StyledText className="text-4xl font-bold text-white mb-4 text-center">SpliBiz</StyledText>
        <StyledText className="text-gray-400 text-base text-center">Manage expenses with your group</StyledText>
      </View>

      <View className="gap-4">
        <Button 
            title="Continue with Google" 
            onPress={loginWithGoogle} 
            loading={loading}
            variant="secondary"
        />
      </View>
      
      <View className="mt-8">
          <StyledText className="text-gray-600 text-xs text-center">
            By continuing, you agree to our Terms and Privacy Policy.
          </StyledText>
      </View>
    </ScreenWrapper>
  );
}
