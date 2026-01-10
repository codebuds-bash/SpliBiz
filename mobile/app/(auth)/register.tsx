import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper, Input, Button } from '../../src/components/UI';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';

const StyledText = styled(Text);

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    
    // 1. Sign Up
    const { data: { user }, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
            full_name: fullName,
            username: username
        }
      }
    });

    if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
    }

    // 2. Create Profile (Similar to web EnsureProfile)
    if (user) {
         try {
            await supabase.from("profiles").upsert({
                id: user.id,
                email: email,
                username: username,
                name: fullName,
                avatar_url: `https://ui-avatars.com/api/?name=${fullName}&background=random`
            });
            Alert.alert('Success', 'Check your email for confirmation!');
            router.back();
         } catch (e) {
             Alert.alert('Error', 'Account created but profile setup failed.');
         }
    }
    
    setLoading(false);
  }

  return (
    <ScreenWrapper className="justify-center">
      <View className="mb-12">
        <StyledText className="text-3xl font-bold text-white mb-2">Create Account</StyledText>
        <StyledText className="text-gray-400 text-base">Join SpliBiz to manage expenses</StyledText>
      </View>

      <Input
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View className="mt-4 gap-4">
        <Button 
            title="Sign Up" 
            onPress={signUpWithEmail} 
            loading={loading} 
        />
        <Button 
            title="Back to Login" 
            variant="secondary"
            onPress={() => router.back()} 
        />
      </View>
    </ScreenWrapper>
  );
}
