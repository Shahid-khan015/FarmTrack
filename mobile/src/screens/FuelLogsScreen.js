import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import {
  Header,
  ListItem,
  EmptyState,
  LoadingSpinner,
  Button,
  Input,
  PickerSelect,
  AreaCalculationWidget,
} from '../components';
import { getFuelLogs, createFuelLog, getTractors } from '../services/dataService';
import { formatDateTime } from '../utils/helpers';

const FuelLogsScreen = ({ navigation, route }) => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tractorId: '',
    quantity: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [logsData, tractorsData] = await Promise.all([
        getFuelLogs(),
        getTractors(),
      ]);
      setFuelLogs(logsData);
      setTractors(tractorsData);
    } catch (error) {
      console.error('Fetch fuel logs error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (route.params?.showAdd) {
      setModalVisible(true);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.tractorId || !formData.quantity) {
      Alert.alert('Error', 'Please select tractor and enter quantity');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await createFuelLog({
        ...formData,
        quantity,
      });
      setModalVisible(false);
      setFormData({ tractorId: '', quantity: '', notes: '' });
      fetchData();
      Alert.alert('Success', 'Fuel log added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  const tractorOptions = tractors.map((t) => ({
    value: t.id,
    label: `${t.manufacturerName} ${t.model} (${t.registrationNumber})`,
  }));

  const totalFuel = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);

  const renderItem = ({ item }) => (
    <ListItem
      title={`${item.tractor?.manufacturerName || ''} ${item.tractor?.model || 'Unknown'}`}
      subtitle={`Added: ${item.quantity.toFixed(1)} liters`}
      description={`By: ${item.operator?.fullName || 'N/A'} - ${formatDateTime(item.timestamp)}`}
      icon="water-outline"
      iconColor={COLORS.warning}
      rightText={`${item.quantity.toFixed(1)}L`}
      showArrow={false}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading fuel logs..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Fuel Logs"
        subtitle={`Total: ${totalFuel.toFixed(1)}L`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon="add-circle-outline"
        onRightPress={() => setModalVisible(true)}
      />

      <View style={styles.content}>
        <AreaCalculationWidget
          totalArea={0}
          coveredArea={0}
          operationType="Fuel Consumption"
          showMap={false}
          style={styles.areaWidget}
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="water" size={24} color={COLORS.warning} />
            <Text style={styles.summaryValue}>{totalFuel.toFixed(1)}L</Text>
            <Text style={styles.summaryLabel}>Total Fuel</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="receipt-outline" size={24} color={COLORS.info} />
            <Text style={styles.summaryValue}>{fuelLogs.length}</Text>
            <Text style={styles.summaryLabel}>Log Entries</Text>
          </View>
        </View>

        <FlatList
          data={fuelLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="water-outline"
              title="No Fuel Logs"
              message="Start logging fuel consumption"
              buttonTitle="Add Fuel Log"
              onButtonPress={() => setModalVisible(true)}
            />
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Fuel Log</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <PickerSelect
              label="Select Tractor"
              value={formData.tractorId}
              options={tractorOptions}
              onValueChange={(v) => setFormData((p) => ({ ...p, tractorId: v }))}
              placeholder="Choose a tractor"
              required
            />

            <Input
              label="Quantity (Liters)"
              value={formData.quantity}
              onChangeText={(v) => setFormData((p) => ({ ...p, quantity: v }))}
              placeholder="e.g., 50"
              icon="water-outline"
              keyboardType="decimal-pad"
              required
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChangeText={(v) => setFormData((p) => ({ ...p, notes: v }))}
              placeholder="Add any notes..."
              icon="document-text-outline"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Add Log"
                onPress={handleCreate}
                loading={submitting}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  summaryValue: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding * 1.5,
    ...SHADOWS.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default FuelLogsScreen;
