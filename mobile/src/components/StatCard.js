import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const StatCard = ({
  title,
  value,
  icon,
  color = COLORS.primary,
  subtitle,
  onPress,
  trend,
  trendValue,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={trend === 'up' ? COLORS.success : COLORS.error}
            />
            <Text
              style={[
                styles.trendValue,
                { color: trend === 'up' ? COLORS.success : COLORS.error },
              ]}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 14,
    marginHorizontal: 4,
    ...SHADOWS.light,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendValue: {
    fontSize: SIZES.small,
    fontWeight: '500',
    marginLeft: 2,
  },
});

export default StatCard;
