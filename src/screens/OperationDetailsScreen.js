import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Header, Card, Button, AreaCalculationWidget, LoadingSpinner } from '../components';
import { stopOperation, getTelemetry } from '../services/dataService';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const OperationDetailsScreen = ({ navigation, route }) => {
  const { operation } = route.params;
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const data = await getTelemetry(operation.id);
        setTelemetry(data);
      } catch (error) {
        console.error('Fetch telemetry error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetry();
  }, [operation.id]);

  const handleStop = () => {
    Alert.alert('Stop Operation', 'Are you sure you want to stop this operation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          setStopping(true);
          try {
            await stopOperation(operation.id);
            Alert.alert('Success', 'Operation stopped successfully');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to stop operation');
          } finally {
            setStopping(false);
          }
        },
      },
    ]);
  };

  const InfoRow = ({ icon, label, value, valueColor }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Operation Details"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(operation.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(operation.status) }]}>
            {capitalizeFirst(operation.status)}
          </Text>
        </View>

        <AreaCalculationWidget
          totalArea={15.5}
          coveredArea={operation.status === 'completed' ? 15.5 : 8.2}
          operationType={capitalizeFirst(operation.operationType)}
          style={styles.areaWidget}
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Tractor Information</Text>
          <InfoRow
            icon="car-sport-outline"
            label="Tractor"
            value={`${operation.tractor?.manufacturerName || ''} ${operation.tractor?.model || 'N/A'}`}
          />
          <InfoRow
            icon="document-text-outline"
            label="Registration"
            value={operation.tractor?.registrationNumber || 'N/A'}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Implement Information</Text>
          <InfoRow
            icon="construct-outline"
            label="Implement"
            value={operation.implement?.name || 'N/A'}
          />
          <InfoRow
            icon="business-outline"
            label="Brand"
            value={operation.implement?.brandName || 'N/A'}
          />
          <InfoRow
            icon="resize-outline"
            label="Width"
            value={operation.implement?.workingWidth ? `${operation.implement.workingWidth}m` : 'N/A'}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Operation Details</Text>
          <InfoRow
            icon="person-outline"
            label="Operator"
            value={operation.operator?.fullName || 'N/A'}
          />
          <InfoRow
            icon="layers-outline"
            label="Type"
            value={capitalizeFirst(operation.operationType)}
          />
          <InfoRow
            icon="time-outline"
            label="Start Time"
            value={formatDateTime(operation.startTime)}
          />
          {operation.endTime && (
            <InfoRow
              icon="checkmark-circle-outline"
              label="End Time"
              value={formatDateTime(operation.endTime)}
            />
          )}
          {operation.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{operation.notes}</Text>
            </View>
          )}
        </Card>

        {telemetry.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Latest Telemetry</Text>
            <InfoRow
              icon="speedometer-outline"
              label="Speed"
              value={`${telemetry[0]?.speed?.toFixed(1) || 0} km/h`}
            />
            <InfoRow
              icon="location-outline"
              label="Coordinates"
              value={
                telemetry[0]?.latitude && telemetry[0]?.longitude
                  ? `${telemetry[0].latitude.toFixed(4)}, ${telemetry[0].longitude.toFixed(4)}`
                  : 'N/A'
              }
            />
            <InfoRow
              icon="cog-outline"
              label="Engine"
              value={telemetry[0]?.engineOn ? 'Running' : 'Off'}
              valueColor={telemetry[0]?.engineOn ? COLORS.success : COLORS.gray}
            />
          </Card>
        )}

        {operation.status === 'active' && (
          <Button
            title="Stop Operation"
            onPress={handleStop}
            variant="danger"
            loading={stopping}
            icon="stop-circle-outline"
            style={styles.stopButton}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  areaWidget: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.text,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  notesLabel: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
    marginLeft: 10,
    marginRight: 8,
  },
  notesText: {
    fontSize: SIZES.font,
    color: COLORS.text,
    flex: 1,
  },
  stopButton: {
    marginTop: 16,
  },
});

export default OperationDetailsScreen;
