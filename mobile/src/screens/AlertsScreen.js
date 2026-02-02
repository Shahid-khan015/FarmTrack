import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Header, ListItem, EmptyState, LoadingSpinner, AreaCalculationWidget } from '../components';
import { getAlerts, resolveAlert } from '../services/dataService';
import { formatDateTime } from '../utils/helpers';

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Fetch alerts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts();
  }, []);

  const handleResolve = (id) => {
    Alert.alert('Resolve Alert', 'Mark this alert as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          try {
            await resolveAlert(id);
            fetchAlerts();
            Alert.alert('Success', 'Alert resolved');
          } catch (error) {
            Alert.alert('Error', 'Failed to resolve alert');
          }
        },
      },
    ]);
  };

  const getAlertIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'warning':
        return 'warning-outline';
      case 'error':
      case 'critical':
        return 'alert-circle-outline';
      case 'maintenance':
        return 'construct-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getAlertColor = (type, isResolved) => {
    if (isResolved) return COLORS.gray;
    switch (type?.toLowerCase()) {
      case 'warning':
        return COLORS.warning;
      case 'error':
      case 'critical':
        return COLORS.error;
      case 'maintenance':
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        item.isResolved && styles.alertCardResolved,
      ]}
      onPress={() => !item.isResolved && handleResolve(item.id)}
      activeOpacity={item.isResolved ? 1 : 0.7}
    >
      <View
        style={[
          styles.alertIconContainer,
          { backgroundColor: getAlertColor(item.alertType, item.isResolved) + '20' },
        ]}
      >
        <Ionicons
          name={getAlertIcon(item.alertType)}
          size={24}
          color={getAlertColor(item.alertType, item.isResolved)}
        />
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertType}>{item.alertType}</Text>
          {item.isResolved ? (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.alertMessage}>{item.message}</Text>
        <Text style={styles.alertMeta}>
          {item.tractor
            ? `${item.tractor.manufacturerName} ${item.tractor.model}`
            : 'Unknown Tractor'}{' '}
          - {formatDateTime(item.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading alerts..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Alerts"
        subtitle={`${unresolvedCount} unresolved`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <AreaCalculationWidget
          totalArea={0}
          coveredArea={0}
          operationType="System Alerts"
          showMap={false}
          style={styles.areaWidget}
        />

        {unresolvedCount > 0 && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color={COLORS.warning} />
            <Text style={styles.warningText}>
              You have {unresolvedCount} unresolved alert{unresolvedCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title="No Alerts"
              message="All systems are running smoothly"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  areaWidget: {
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: SIZES.radiusSmall,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.warning,
    fontWeight: '500',
    marginLeft: 10,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  alertCardResolved: {
    opacity: 0.7,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertType: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resolvedText: {
    fontSize: SIZES.small,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: SIZES.font,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  alertMeta: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
});

export default AlertsScreen;
