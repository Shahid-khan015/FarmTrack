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
import { StatCard, AreaCalculationWidget, ListItem, LoadingSpinner } from '../components';
import { getDashboardStats } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Unable to load dashboard data. Please check your connection.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            {stats?.unresolvedAlerts > 0 && (
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
            <TouchableOpacity onPress={fetchDashboardStats} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard
                title="Tractors"
                value={stats?.tractorsCount || 0}
                icon="car-sport-outline"
                color={COLORS.primary}
                onPress={() => navigation.navigate('Tractors')}
              />
              <StatCard
                title="Implements"
                value={stats?.implementsCount || 0}
                icon="construct-outline"
                color={COLORS.info}
                onPress={() => navigation.navigate('Implements')}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Active Ops"
                value={stats?.activeOperations || 0}
                icon="pulse-outline"
                color={COLORS.success}
                onPress={() => navigation.navigate('Operations')}
              />
              <StatCard
                title="Fuel Today"
                value={`${stats?.todayFuelUsage?.toFixed(1) || 0}L`}
                icon="water-outline"
                color={COLORS.warning}
                onPress={() => navigation.navigate('FuelLogs')}
              />
            </View>

            <AreaCalculationWidget
              totalArea={25.5}
              coveredArea={12.3}
              operationType="Today's Coverage"
              style={styles.areaWidget}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Operations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Operations')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {stats?.recentOperations?.length > 0 ? (
              stats.recentOperations.slice(0, 3).map((op) => (
                <ListItem
                  key={op.id}
                  title={op.tractor?.manufacturerName + ' ' + op.tractor?.model || 'Unknown Tractor'}
                  subtitle={capitalizeFirst(op.operationType)}
                  description={`Operator: ${op.operator?.fullName || 'N/A'}`}
                  icon="analytics-outline"
                  iconColor={getStatusColor(op.status)}
                  status={capitalizeFirst(op.status)}
                  statusColor={getStatusColor(op.status)}
                  onPress={() => navigation.navigate('OperationDetails', { operation: op })}
                />
              ))
            ) : (
              <View style={styles.emptyList}>
                <Text style={styles.emptyText}>No recent operations</Text>
              </View>
            )}

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Operations', { showAdd: true })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                    <Ionicons name="play-circle-outline" size={28} color={COLORS.success} />
                  </View>
                  <Text style={styles.actionText}>Start Operation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('FuelLogs', { showAdd: true })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                    <Ionicons name="water-outline" size={28} color={COLORS.warning} />
                  </View>
                  <Text style={styles.actionText}>Log Fuel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '20' }]}>
                    <Ionicons name="bar-chart-outline" size={28} color={COLORS.info} />
                  </View>
                  <Text style={styles.actionText}>View Reports</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
  },
  errorText: {
    fontSize: SIZES.font,
    color: COLORS.error,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSmall,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: -4,
  },
  areaWidget: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: SIZES.font,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.font,
  },
  quickActions: {
    marginTop: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 16,
    marginHorizontal: 4,
    ...SHADOWS.light,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default DashboardScreen;
