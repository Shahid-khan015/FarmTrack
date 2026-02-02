import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components';

import {
  LoginScreen,
  RegisterScreen,
  DashboardScreen,
  TractorsScreen,
  TractorDetailsScreen,
  ImplementsScreen,
  ImplementDetailsScreen,
  OperationsScreen,
  OperationDetailsScreen,
  FuelLogsScreen,
  AlertsScreen,
  ReportsScreen,
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="Tractors" component={TractorsScreen} />
    <Stack.Screen name="TractorDetails" component={TractorDetailsScreen} />
    <Stack.Screen name="Implements" component={ImplementsScreen} />
    <Stack.Screen name="ImplementDetails" component={ImplementDetailsScreen} />
    <Stack.Screen name="Operations" component={OperationsScreen} />
    <Stack.Screen name="OperationDetails" component={OperationDetailsScreen} />
    <Stack.Screen name="FuelLogs" component={FuelLogsScreen} />
    <Stack.Screen name="Alerts" component={AlertsScreen} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
  </Stack.Navigator>
);

const TractorsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TractorsList" component={TractorsScreen} />
    <Stack.Screen name="TractorDetails" component={TractorDetailsScreen} />
  </Stack.Navigator>
);

const OperationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OperationsList" component={OperationsScreen} />
    <Stack.Screen name="OperationDetails" component={OperationDetailsScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Fleet':
            iconName = focused ? 'car-sport' : 'car-sport-outline';
            break;
          case 'Operations':
            iconName = focused ? 'analytics' : 'analytics-outline';
            break;
          case 'Reports':
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            break;
          default:
            iconName = 'ellipse-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        height: 65,
        paddingBottom: 10,
        paddingTop: 8,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Fleet" component={TractorsStack} />
    <Tab.Screen name="Operations" component={OperationsStack} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
