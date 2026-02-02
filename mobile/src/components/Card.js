import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Card = ({
  children,
  onPress,
  style,
  padding = true,
  shadow = true,
  variant = 'default',
}) => {
  const getCardStyle = () => {
    const styles = [cardStyles.base];
    
    if (padding) {
      styles.push(cardStyles.padding);
    }
    
    if (shadow) {
      styles.push(SHADOWS.light);
    }
    
    switch (variant) {
      case 'primary':
        styles.push(cardStyles.primary);
        break;
      case 'success':
        styles.push(cardStyles.success);
        break;
      case 'warning':
        styles.push(cardStyles.warning);
        break;
      case 'error':
        styles.push(cardStyles.error);
        break;
      case 'info':
        styles.push(cardStyles.info);
        break;
    }
    
    return styles;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[...getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[...getCardStyle(), style]}>{children}</View>;
};

const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  padding: {
    padding: SIZES.padding,
  },
  primary: {
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  success: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  warning: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  error: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  info: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
});

export default Card;
