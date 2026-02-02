import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Header = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  variant = 'default',
}) => {
  const isTransparent = variant === 'transparent';

  return (
    <>
      <StatusBar
        barStyle={isTransparent ? 'light-content' : 'dark-content'}
        backgroundColor={isTransparent ? 'transparent' : COLORS.white}
      />
      <View
        style={[
          styles.container,
          isTransparent ? styles.transparent : styles.default,
        ]}
      >
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={SIZES.icon}
                color={isTransparent ? COLORS.white : COLORS.text}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.centerContainer}>
          <Text
            style={[
              styles.title,
              isTransparent && styles.titleLight,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                isTransparent && styles.subtitleLight,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.rightContainer}>
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon}
                size={SIZES.icon}
                color={isTransparent ? COLORS.white : COLORS.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: 48,
    paddingBottom: 16,
  },
  default: {
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  rightButton: {
    padding: 8,
    marginRight: -8,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  titleLight: {
    color: COLORS.white,
  },
  subtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subtitleLight: {
    color: COLORS.white,
    opacity: 0.9,
  },
});

export default Header;
