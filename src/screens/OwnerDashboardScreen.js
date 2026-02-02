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
import { getDashboardStats, getOperations, getRecommendations } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const OwnerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOperations, setRecentOperations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch dashboard stats
      const statsData = await getDashboardStats();
      setStats(statsData);

      // Fetch recent operations
      const operationsData = await getOperations();
      const operations = Array.isArray(operationsData) ? operationsData : [];
      setRecentOperations(operations.slice(0, 3));

      // Fetch recommendations
      const recommendationsData = await getRecommendations();
      const recs = Array.isArray(recommendationsData) ? recommendationsData : [];
      setRecommendations(recs.slice(0, 3));

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
          <Text style={styles.userName}>{user?.fullName || 'Owner'}</Text>
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
            <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
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
                onPress={() => navigation.navigate('Fleet')}
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
                title="Today's Fuel"
                value={`${stats?.todayFuelUsage?.toFixed(1) || 0}L`}
                icon="water-outline"
                color={COLORS.warning}
                onPress={() => navigation.navigate('FuelLogs')}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Operations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Operations')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentOperations.length > 0 ? (
              recentOperations.map((op) => (
                <ListItem
                  key={op.id}
                  title={`${op.tractor?.manufacturerName || 'Unknown'} ${op.tractor?.model || 'Tractor'}`}
                  subtitle={`${capitalizeFirst(op.operationType)} - ${op.operator?.fullName || 'Unknown Operator'}`}
                  rightText={formatDateTime(op.startTime)}
                  onPress={() => navigation.navigate('OperationDetails', { operationId: op.id })}
                  status={getStatusColor(op.status)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="analytics" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>No recent operations</Text>
              </View>
            )}

            {recommendations.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>AI Recommendations</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
                    <Text style={styles.seeAll}>View All</Text>
                  </TouchableOpacity>
                </View>

                {recommendations.map((rec) => (
                  <ListItem
                    key={rec.id}
                    title={rec.title}
                    subtitle={rec.description}
                    rightText={rec.type}
                    onPress={() => navigation.navigate('Reports')}
                    status={COLORS.primary}
                  />
                ))}
              </>
            )}

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Tractors')}
                >
                  <Ionicons name="car-sport-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.actionText}>Add Tractor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Implements')}
                >
                  <Ionicons name="construct-outline" size={24} color={COLORS.info} />
                  <Text style={styles.actionText}>Add Implement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Operations')}
                >
                  <Ionicons name="play-outline" size={24} color={COLORS.success} />
                  <Text style={styles.actionText}>Start Operation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <Ionicons name="bar-chart-outline" size={24} color={COLORS.warning} />
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
  quickActions: {
    marginTop: SIZES.padding * 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    ...SHADOWS.light,
  },
  actionText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginTop: SIZES.padding / 2,
    fontWeight: '500',
  },
});

export default OwnerDashboardScreen;