import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ViewProps, TextInputProps, TouchableOpacityProps } from 'react-native';
import { styled } from 'nativewind';

// Styled Components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouchable = styled(TouchableOpacity);

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenWrapper = ({ children, className = "", ...props }: ScreenWrapperProps) => (
  <StyledView className={`flex-1 bg-background pt-12 px-4 ${className}`} {...props}>
    {children}
  </StyledView>
);

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export const Button = ({ onPress, title, variant = "primary", loading = false, ...props }: ButtonProps) => {
  const baseStyle = "py-4 rounded-xl items-center justify-center";
  const variants = {
    primary: "bg-blue-600",
    secondary: "bg-gray-800 border border-gray-700",
    danger: "bg-red-500/10 border border-red-500/20",
  };
  const textVariants = {
    primary: "text-white font-bold text-base",
    secondary: "text-white font-medium text-base",
    danger: "text-red-400 font-medium text-base",
  };

  return (
    <StyledTouchable 
      onPress={onPress} 
      className={`${baseStyle} ${variants[variant]}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <StyledText className={textVariants[variant]}>{title}</StyledText>
      )}
    </StyledTouchable>
  );
};

interface InputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export const Input = ({ value, onChangeText, placeholder, secureTextEntry, ...props }: InputProps) => (
  <StyledView className="mb-4">
    <StyledInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      secureTextEntry={secureTextEntry}
      className="bg-gray-900/50 border border-gray-800 text-white px-4 py-4 rounded-xl text-base"
      {...props}
    />
  </StyledView>
);

interface CardProps extends ViewProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = "", ...props }: CardProps) => (
  <StyledView className={`bg-[#1c1c1c] border border-white/5 rounded-xl p-4 ${className}`} {...props}>
    {children}
  </StyledView>
);
