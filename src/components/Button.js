import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const styles = [buttonStyles.base];
    
    switch (variant) {
      case 'primary':
        styles.push(buttonStyles.primary);
        break;
      case 'secondary':
        styles.push(buttonStyles.secondary);
        break;
      case 'outline':
        styles.push(buttonStyles.outline);
        break;
      case 'ghost':
        styles.push(buttonStyles.ghost);
        break;
      case 'danger':
        styles.push(buttonStyles.danger);
        break;
    }
    
    switch (size) {
      case 'small':
        styles.push(buttonStyles.small);
        break;
      case 'large':
        styles.push(buttonStyles.large);
        break;
    }
    
    if (disabled || loading) {
      styles.push(buttonStyles.disabled);
    }
    
    return styles;
  };

  const getTextStyle = () => {
    const styles = [textStyles.base];
    
    switch (variant) {
      case 'primary':
      case 'danger':
        styles.push(textStyles.light);
        break;
      case 'secondary':
        styles.push(textStyles.dark);
        break;
      case 'outline':
      case 'ghost':
        styles.push(textStyles.primary);
        break;
    }
    
    switch (size) {
      case 'small':
        styles.push(textStyles.small);
        break;
      case 'large':
        styles.push(textStyles.large);
        break;
    }
    
    return styles;
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return COLORS.white;
      case 'secondary':
        return COLORS.text;
      case 'outline':
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getIconColor()} size="small" />
      ) : (
        <View style={buttonStyles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={SIZES.iconSmall}
              color={getIconColor()}
              style={buttonStyles.iconLeft}
            />
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={SIZES.iconSmall}
              color={getIconColor()}
              style={buttonStyles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: SIZES.radius,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.light,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.light,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    ...SHADOWS.light,
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusSmall,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: SIZES.radiusLarge,
  },
  disabled: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

const textStyles = StyleSheet.create({
  base: {
    fontSize: SIZES.font,
    fontWeight: '600',
    textAlign: 'center',
  },
  light: {
    color: COLORS.white,
  },
  dark: {
    color: COLORS.white,
  },
  primary: {
    color: COLORS.primary,
  },
  small: {
    fontSize: SIZES.small,
  },
  large: {
    fontSize: SIZES.large,
  },
});

export default Button;
