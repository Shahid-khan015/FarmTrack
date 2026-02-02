import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/api';

export const login = async (username, password) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { success: true, user, token };
  } catch (error) {
    const message = error.response?.data?.detail || 'Login failed. Please try again.';
    return { success: false, error: message };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
    const { token, user } = response.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { success: true, user, token };
  } catch (error) {
    const message = error.response?.data?.detail || 'Registration failed. Please try again.';
    return { success: false, error: message };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('user');
};

export const getStoredUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    const token = await AsyncStorage.getItem('authToken');
    if (user && token) {
      return { user: JSON.parse(user), token };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return !!token;
};

export default { login, register, logout, getStoredUser, isAuthenticated };
