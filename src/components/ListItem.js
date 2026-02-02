import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const ListItem = ({
  title,
  subtitle,
  description,
  icon,
  iconColor = COLORS.primary,
  rightText,
  rightSubtext,
  showArrow = true,
  status,
  statusColor,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      
      <View style={styles.rightContainer}>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: (statusColor || COLORS.gray) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor || COLORS.gray }]} />
            <Text style={[styles.statusText, { color: statusColor || COLORS.gray }]}>
              {status}
            </Text>
          </View>
        )}
        {rightText && (
          <Text style={styles.rightText}>{rightText}</Text>
        )}
        {rightSubtext && (
          <Text style={styles.rightSubtext}>{rightSubtext}</Text>
        )}
        {showArrow && !status && !rightText && (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.light,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  description: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  rightText: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
  },
  rightSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ListItem;
