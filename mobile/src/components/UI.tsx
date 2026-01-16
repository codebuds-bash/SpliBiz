import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ViewProps, TextInputProps, TouchableOpacityProps } from 'react-native';
import { styled } from 'nativewind';
import { useTheme } from '../contexts/ThemeContext';

// Styled Components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouchable = styled(TouchableOpacity);

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenWrapper = ({ children, className = "", ...props }: ScreenWrapperProps) => {
  const { isDark } = useTheme();
  return (
    <StyledView className={`flex-1 pt-12 px-4 ${isDark ? 'bg-dark-background' : 'bg-background'} ${className}`} {...props}>
      {children}
    </StyledView>
  );
};

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export const Button = ({ onPress, title, variant = "primary", loading = false, ...props }: ButtonProps) => {
  const { isDark } = useTheme();
  const baseStyle = "py-4 rounded-xl items-center justify-center";
  
  const variants = {
    primary: "bg-primary",
    secondary: isDark ? "bg-dark-surface border border-dark-border" : "bg-surface border border-border",
    danger: "bg-red-500/10 border border-red-500/20",
  };
  const textVariants = {
    primary: "text-white font-bold text-base",
    secondary: isDark ? "text-white font-medium text-base" : "text-main font-medium text-base",
    danger: "text-red-500 font-medium text-base",
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

export const Input = ({ value, onChangeText, placeholder, secureTextEntry, ...props }: InputProps) => {
  const { isDark } = useTheme();
  
  return (
    <StyledView className="mb-4">
      <StyledInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
        secureTextEntry={secureTextEntry}
        className={`px-4 py-4 rounded-xl text-base ${isDark ? 'bg-dark-surface border-dark-border text-white' : 'bg-surface border-border text-main'}`}
        style={{ borderWidth: 1 }}
        {...props}
      />
    </StyledView>
  );
};

interface CardProps extends ViewProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  const { isDark } = useTheme();
  return (
    <StyledView className={`rounded-xl p-4 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-surface border-border'} ${className}`} style={{ borderWidth: 1 }} {...props}>
      {children}
    </StyledView>
  );
};
