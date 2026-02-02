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
import { getFields, getOperations, getDisputes } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const FarmerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    fieldsCount: 0,
    pendingApprovals: 0,
    activeOperations: 0,
    disputesCount: 0,
  });
  const [recentOperations, setRecentOperations] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch fields
      const fieldsData = await getFields();
      const fields = Array.isArray(fieldsData) ? fieldsData : [];

      // Fetch operations for approval
      const operationsData = await getOperations();
      const operations = Array.isArray(operationsData) ? operationsData : [];
      const pendingApprovals = operations.filter(op => !op.approvedByFarmer).length;
      const activeOps = operations.filter(op => op.status === 'active').length;

      // Fetch disputes
      const disputesData = await getDisputes();
      const disputes = Array.isArray(disputesData) ? disputesData : [];

      setStats({
        fieldsCount: fields.length,
        pendingApprovals,
        activeOperations: activeOps,
        disputesCount: disputes.length,
      });

      setRecentOperations(operations.slice(0, 3));
      setRecentDisputes(disputes.slice(0, 3));

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
          <Text style={styles.userName}>{user?.fullName || 'Farmer'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Disputes')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            {stats.disputesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {stats.disputesCount > 9 ? '9+' : stats.disputesCount}
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
                title="My Fields"
                value={stats.fieldsCount}
                icon="map-outline"
                color={COLORS.primary}
                onPress={() => navigation.navigate('Fields')}
              />
              <StatCard
                title="Pending Approvals"
                value={stats.pendingApprovals}
                icon="checkmark-circle-outline"
                color={COLORS.warning}
                onPress={() => navigation.navigate('Operations')}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Active Operations"
                value={stats.activeOperations}
                icon="pulse-outline"
                color={COLORS.success}
                onPress={() => navigation.navigate('Operations')}
              />
              <StatCard
                title="Disputes"
                value={stats.disputesCount}
                icon="alert-circle-outline"
                color={COLORS.error}
                onPress={() => navigation.navigate('Disputes')}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Operations Awaiting Approval</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Operations')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentOperations.filter(op => !op.approvedByFarmer).length > 0 ? (
              recentOperations
                .filter(op => !op.approvedByFarmer)
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
                <Ionicons name="checkmark-circle" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>All operations approved!</Text>
              </View>
            )}

            {recentDisputes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Disputes</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Disputes')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {recentDisputes.map((dispute) => (
                  <ListItem
                    key={dispute.id}
                    title={`Dispute #${dispute.id.slice(-8)}`}
                    subtitle={dispute.reason}
                    rightText={formatDateTime(dispute.createdAt)}
                    onPress={() => navigation.navigate('Disputes')}
                    status={COLORS.error}
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

export default FarmerDashboardScreen;