import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { formatArea } from '../utils/helpers';

const AreaCalculationWidget = ({
  totalArea = 0,
  coveredArea = 0,
  operationType = 'Field',
  showMap = true,
  style,
}) => {
  const progress = totalArea > 0 ? (coveredArea / totalArea) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="map-outline" size={20} color={COLORS.primary} />
          <Text style={styles.title}>Field Area Calculation</Text>
        </View>
        <Text style={styles.operationType}>{operationType}</Text>
      </View>

      {showMap && (
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapGrid}>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.coveredCell]} />
              <View style={[styles.gridCell, styles.coveredCell]} />
              <View style={styles.gridCell} />
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.coveredCell]} />
              <View style={[styles.gridCell, styles.partialCell]} />
              <View style={styles.gridCell} />
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
            </View>
          </View>
          <View style={styles.tractorIcon}>
            <Ionicons name="car-sport" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.mapLabel}>Interactive Field Map</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Area</Text>
          <Text style={styles.statValue}>{formatArea(totalArea)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Covered</Text>
          <Text style={[styles.statValue, styles.coveredValue]}>
            {formatArea(coveredArea)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, styles.remainingValue]}>
            {formatArea(totalArea - coveredArea)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progress.toFixed(1)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  operationType: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '500',
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusSmall,
    height: 140,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 30,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    margin: 2,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 4,
  },
  coveredCell: {
    backgroundColor: COLORS.primaryLight + '60',
  },
  partialCell: {
    backgroundColor: COLORS.secondaryLight + '60',
  },
  tractorIcon: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 20,
    ...SHADOWS.light,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusSmall,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: COLORS.text,
  },
  coveredValue: {
    color: COLORS.success,
  },
  remainingValue: {
    color: COLORS.warning,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});

export default AreaCalculationWidget;
