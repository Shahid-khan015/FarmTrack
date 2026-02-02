import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { StatCard, ListItem, LoadingSpinner } from '../components';
import { getOperations, getFuelLogs, getAlerts } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const OperatorDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    activeOperations: 0,
    todayFuelUsage: 0,
    totalWage: 0,
    unresolvedAlerts: 0,
  });
  const [recentOperations, setRecentOperations] = useState([]);
  const [recentFuelLogs, setRecentFuelLogs] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch operations
      const operationsData = await getOperations();
      const operations = Array.isArray(operationsData) ? operationsData : [];
      const activeOps = operations.filter(op => op.status === 'active').length;
      const completedOps = operations.filter(op => op.status === 'completed');
      const totalWage = completedOps.reduce((sum, op) => sum + (op.wage || 0), 0);

      // Fetch fuel logs
      const fuelLogsData = await getFuelLogs();
      const fuelLogs = Array.isArray(fuelLogsData) ? fuelLogsData : [];
      const todayFuel = fuelLogs
        .filter(log => new Date(log.timestamp).toDateString() === new Date().toDateString())
        .reduce((sum, log) => sum + log.quantity, 0);

      // Fetch alerts
      const alertsData = await getAlerts();
      const alerts = Array.isArray(alertsData) ? alertsData : [];
      const unresolvedAlerts = alerts.filter(alert => !alert.isResolved).length;

      setStats({
        activeOperations: activeOps,
        todayFuelUsage: todayFuel,
        totalWage,
        unresolvedAlerts,
      });

      setRecentOperations(operations.slice(0, 3));
      setRecentFuelLogs(fuelLogs.slice(0, 3));
      setRecentAlerts(alerts.filter(alert => !alert.isResolved).slice(0, 3));

    } catch (err) {
      setError('Unable to load dashboard data. Please check your connection.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Operator'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            {stats.unresolvedAlerts > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {stats.unresolvedAlerts > 9 ? '9+' : stats.unresolvedAlerts}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard
                title="Active Operations"
                value={stats.activeOperations}
                icon="pulse-outline"
                color={COLORS.success}
                onPress={() => navigation.navigate('Operations')}
              />
              <StatCard
                title="Today's Fuel"
                value={`${stats.todayFuelUsage.toFixed(1)}L`}
                icon="water-outline"
                color={COLORS.info}
                onPress={() => navigation.navigate('Fuel')}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Total Earnings"
                value={`$${stats.totalWage.toFixed(2)}`}
                icon="cash-outline"
                color={COLORS.primary}
                onPress={() => navigation.navigate('Operations')}
              />
              <StatCard
                title="Alerts"
                value={stats.unresolvedAlerts}
                icon="alert-circle-outline"
                color={COLORS.warning}
                onPress={() => navigation.navigate('Alerts')}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Operations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Operations')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentOperations.filter(op => op.status === 'active').length > 0 ? (
              recentOperations
                .filter(op => op.status === 'active')
                .slice(0, 3)
                .map((op) => (
                  <ListItem
                    key={op.id}
                    title={`${op.tractor?.manufacturerName || 'Unknown'} ${op.tractor?.model || 'Tractor'}`}
                    subtitle={`${capitalizeFirst(op.operationType)} - ${op.field?.name || 'Unknown Field'}`}
                    rightText={formatDateTime(op.startTime)}
                    onPress={() => navigation.navigate('OperationDetails', { operationId: op.id })}
                    status={getStatusColor(op.status)}
                  />
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="construct" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>No active operations</Text>
              </View>
            )}

            {recentFuelLogs.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Fuel Logs</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Fuel')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {recentFuelLogs.map((log) => (
                  <ListItem
                    key={log.id}
                    title={`${log.tractor?.registrationNumber || 'Unknown Tractor'}`}
                    subtitle={`${log.quantity}L - ${log.notes || 'No notes'}`}
                    rightText={formatDateTime(log.timestamp)}
                    onPress={() => navigation.navigate('Fuel')}
                    status={COLORS.info}
                  />
                ))}
              </>
            )}

            {recentAlerts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Alerts</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {recentAlerts.map((alert) => (
                  <ListItem
                    key={alert.id}
                    title={alert.alertType}
                    subtitle={alert.message}
                    rightText={formatDateTime(alert.timestamp)}
                    onPress={() => navigation.navigate('Alerts')}
                    status={COLORS.warning}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
  },
  userName: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: SIZES.padding,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  errorContainer: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    fontSize: SIZES.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  retryButton: {
    marginTop: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
});

export default OperatorDashboardScreen;