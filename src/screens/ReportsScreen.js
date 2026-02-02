import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Header, Card, StatCard, LoadingSpinner, AreaCalculationWidget } from '../components';
import { getReports } from '../services/dataService';
import { formatDate } from '../utils/helpers';

const ReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('week');

  const fetchReports = async (filterType) => {
    setLoading(true);
    try {
      const today = new Date();
      let params = {};

      if (filterType === 'day') {
        params = { filterType: 'day', date: today.toISOString().split('T')[0] };
      } else if (filterType === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params = {
          filterType: 'date-range',
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      } else if (filterType === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        params = {
          filterType: 'date-range',
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      }

      const data = await getReports(params);
      setReports(data);
    } catch (error) {
      console.error('Fetch reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedFilter);
  }, [selectedFilter]);

  const filterOptions = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Reports"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              selectedFilter === option.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === option.key && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSpinner fullScreen text="Loading reports..." />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AreaCalculationWidget
            totalArea={reports?.totalArea || 0}
            coveredArea={reports?.totalArea || 0}
            operationType="Total Covered Area"
            style={styles.areaWidget}
          />

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Hours"
                value={`${reports?.totalHours?.toFixed(1) || 0}h`}
                icon="time-outline"
                color={COLORS.primary}
              />
              <StatCard
                title="Area Covered"
                value={`${reports?.totalArea?.toFixed(1) || 0}ha`}
                icon="map-outline"
                color={COLORS.success}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Fuel Used"
                value={`${reports?.fuelUsed?.toFixed(1) || 0}L`}
                icon="water-outline"
                color={COLORS.warning}
              />
              <StatCard
                title="Breakdowns"
                value={reports?.breakdowns || 0}
                icon="warning-outline"
                color={COLORS.error}
              />
            </View>
          </View>

          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Summary Statistics</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{reports?.operations?.length || 0}</Text>
                <Text style={styles.summaryLabel}>Operations</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{reports?.fuelLogs?.length || 0}</Text>
                <Text style={styles.summaryLabel}>Fuel Logs</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{reports?.alerts || 0}</Text>
                <Text style={styles.summaryLabel}>Alerts</Text>
              </View>
            </View>
          </Card>

          {reports?.operations?.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Recent Operations</Text>
              {reports.operations.slice(0, 5).map((op, index) => (
                <View key={op.id || index} style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{op.operationType}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {formatDate(op.startTime)} - {op.status}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {reports?.fuelLogs?.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Fuel Consumption</Text>
              {reports.fuelLogs.slice(0, 5).map((log, index) => (
                <View key={log.id || index} style={styles.listItem}>
                  <View style={[styles.listItemIcon, { backgroundColor: COLORS.warning + '20' }]}>
                    <Ionicons name="water-outline" size={20} color={COLORS.warning} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{log.quantity?.toFixed(1)}L</Text>
                    <Text style={styles.listItemSubtitle}>{formatDate(log.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    paddingBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSmall,
    marginHorizontal: 4,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 40,
  },
  areaWidget: {
    marginBottom: 16,
  },
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: -4,
  },
  summaryCard: {
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: SIZES.xxlarge,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  listItemSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});

export default ReportsScreen;
