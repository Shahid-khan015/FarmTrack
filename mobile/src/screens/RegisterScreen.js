import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Button, Input, PickerSelect } from '../components';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../constants/api';

const RegisterScreen = ({ navigation }) => {
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'operator',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Please enter a username');
      return false;
    }
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const result = await register({
      username: formData.username.trim(),
      password: formData.password,
      fullName: formData.fullName.trim(),
      role: formData.role,
      phone: formData.phone.trim() || null,
    });

    if (result.success) {
      authLogin(result.user, result.token);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Ionicons name="person-add" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Fleet Management today</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              value={formData.fullName}
              onChangeText={(v) => updateField('fullName', v)}
              placeholder="Enter your full name"
              icon="person-outline"
              required
            />

            <Input
              label="Username"
              value={formData.username}
              onChangeText={(v) => updateField('username', v)}
              placeholder="Choose a username"
              icon="at-outline"
              autoCapitalize="none"
              required
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              placeholder="Enter phone number (optional)"
              icon="call-outline"
              keyboardType="phone-pad"
            />

            <PickerSelect
              label="Role"
              value={formData.role}
              options={USER_ROLES}
              onValueChange={(v) => updateField('role', v)}
              required
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              placeholder="Create a password"
              icon="lock-closed-outline"
              secureTextEntry
              required
            />

            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              placeholder="Confirm your password"
              icon="lock-closed-outline"
              secureTextEntry
              required
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
              icon="checkmark-circle-outline"
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 50,
    paddingHorizontal: SIZES.padding,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: SIZES.padding,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: SIZES.font,
    color: COLORS.white,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: SIZES.padding * 1.5,
    marginTop: -20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: SIZES.radiusSmall,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.error,
    marginLeft: 10,
  },
  registerButton: {
    marginTop: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  loginText: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
