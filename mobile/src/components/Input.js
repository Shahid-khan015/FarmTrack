import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  icon,
  error,
  disabled = false,
  style,
  inputStyle,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.border;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          disabled && styles.disabled,
          multiline && styles.multiline,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={SIZES.iconSmall}
            color={isFocused ? COLORS.primary : COLORS.gray}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={SIZES.iconSmall}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  multiline: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.text,
    paddingVertical: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  icon: {
    marginRight: 12,
  },
  eyeButton: {
    padding: 4,
  },
  disabled: {
    backgroundColor: COLORS.grayLight,
    opacity: 0.7,
  },
  error: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginTop: 6,
  },
});

export default Input;
