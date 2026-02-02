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
  FarmerDashboardScreen,
  OperatorDashboardScreen,
  OwnerDashboardScreen,
  TractorsScreen,
  TractorDetailsScreen,
  ImplementsScreen,
  ImplementDetailsScreen,
  OperationsScreen,
  OperationDetailsScreen,
  FuelLogsScreen,
  AlertsScreen,
  ReportsScreen,
  FieldsScreen,
  FieldDetailsScreen,
  DisputesScreen,
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const FarmerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} />
    <Stack.Screen name="Fields" component={FieldsScreen} />
    <Stack.Screen name="FieldDetails" component={FieldDetailsScreen} />
    <Stack.Screen name="Operations" component={OperationsScreen} />
    <Stack.Screen name="OperationDetails" component={OperationDetailsScreen} />
    <Stack.Screen name="Disputes" component={DisputesScreen} />
  </Stack.Navigator>
);

const OperatorStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OperatorDashboard" component={OperatorDashboardScreen} />
    <Stack.Screen name="Operations" component={OperationsScreen} />
    <Stack.Screen name="OperationDetails" component={OperationDetailsScreen} />
    <Stack.Screen name="FuelLogs" component={FuelLogsScreen} />
    <Stack.Screen name="Alerts" component={AlertsScreen} />
  </Stack.Navigator>
);

const OwnerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
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

const MainTabs = () => {
  const { user } = useAuth();

  const getTabConfig = () => {
    switch (user?.role) {
      case 'farmer':
        return {
          Home: { component: FarmerStack, icon: 'leaf' },
          Fields: { component: FieldsScreen, icon: 'map' },
          Operations: { component: OperationsScreen, icon: 'analytics' },
          Disputes: { component: DisputesScreen, icon: 'alert-circle' },
        };
      case 'operator':
        return {
          Home: { component: OperatorStack, icon: 'construct' },
          Operations: { component: OperationsScreen, icon: 'analytics' },
          Fuel: { component: FuelLogsScreen, icon: 'water' },
          Alerts: { component: AlertsScreen, icon: 'notifications' },
        };
      case 'owner':
      default:
        return {
          Home: { component: OwnerStack, icon: 'business' },
          Fleet: { component: TractorsStack, icon: 'car-sport' },
          Operations: { component: OperationsStack, icon: 'analytics' },
          Reports: { component: ReportsScreen, icon: 'bar-chart' },
        };
    }
  };

  const tabConfig = getTabConfig();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const config = tabConfig[route.name];
          const iconName = focused ? config.icon : `${config.icon}-outline`;
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
      {Object.entries(tabConfig).map(([name, config]) => (
        <Tab.Screen key={name} name={name} component={config.component} />
      ))}
    </Tab.Navigator>
  );
};

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
