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
  PickerSelect,
  Input,
  AreaCalculationWidget,
} from '../components';
import { getOperations, createOperation, stopOperation, getTractors, getImplements } from '../services/dataService';
import { OPERATION_TYPES } from '../constants/api';
import { formatDateTime, getStatusColor, capitalizeFirst } from '../utils/helpers';

const OperationsScreen = ({ navigation, route }) => {
  const [operations, setOperations] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [implements_, setImplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tractorId: '',
    implementId: '',
    operationType: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [opsData, tractorsData, implementsData] = await Promise.all([
        getOperations(),
        getTractors(),
        getImplements(),
      ]);
      setOperations(opsData);
      setTractors(tractorsData);
      setImplements(implementsData);
    } catch (error) {
      console.error('Fetch operations error:', error);
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
    if (!formData.tractorId || !formData.implementId || !formData.operationType) {
      Alert.alert('Error', 'Please select tractor, implement, and operation type');
      return;
    }

    setSubmitting(true);
    try {
      await createOperation(formData);
      setModalVisible(false);
      setFormData({ tractorId: '', implementId: '', operationType: '', notes: '' });
      fetchData();
      Alert.alert('Success', 'Operation started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start operation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStop = (id) => {
    Alert.alert('Stop Operation', 'Are you sure you want to stop this operation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopOperation(id);
            fetchData();
            Alert.alert('Success', 'Operation stopped');
          } catch (error) {
            Alert.alert('Error', 'Failed to stop operation');
          }
        },
      },
    ]);
  };

  const tractorOptions = tractors
    .filter((t) => t.isActive)
    .map((t) => ({
      value: t.id,
      label: `${t.manufacturerName} ${t.model} (${t.registrationNumber})`,
    }));

  const implementOptions = implements_
    .filter((i) => i.isActive)
    .map((i) => ({
      value: i.id,
      label: `${i.name} (${i.brandName})`,
    }));

  const renderItem = ({ item }) => (
    <ListItem
      title={`${item.tractor?.manufacturerName || ''} ${item.tractor?.model || 'Unknown'}`}
      subtitle={capitalizeFirst(item.operationType)}
      description={`Started: ${formatDateTime(item.startTime)}`}
      icon="analytics-outline"
      iconColor={getStatusColor(item.status)}
      status={capitalizeFirst(item.status)}
      statusColor={getStatusColor(item.status)}
      onPress={() => navigation.navigate('OperationDetails', { operation: item })}
    />
  );

  const activeOperations = operations.filter((op) => op.status === 'active');

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading operations..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Operations"
        subtitle={`${activeOperations.length} active`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon="add-circle-outline"
        onRightPress={() => setModalVisible(true)}
      />

      <View style={styles.content}>
        <AreaCalculationWidget
          totalArea={50}
          coveredArea={23.5}
          operationType="Today's Progress"
          style={styles.areaWidget}
        />

        <FlatList
          data={operations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="analytics-outline"
              title="No Operations"
              message="Start your first field operation"
              buttonTitle="Start Operation"
              onButtonPress={() => setModalVisible(true)}
            />
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start New Operation</Text>
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

            <PickerSelect
              label="Select Implement"
              value={formData.implementId}
              options={implementOptions}
              onValueChange={(v) => setFormData((p) => ({ ...p, implementId: v }))}
              placeholder="Choose an implement"
              required
            />

            <PickerSelect
              label="Operation Type"
              value={formData.operationType}
              options={OPERATION_TYPES}
              onValueChange={(v) => setFormData((p) => ({ ...p, operationType: v }))}
              placeholder="Select type"
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
                title="Start Operation"
                onPress={handleCreate}
                loading={submitting}
                style={styles.modalButton}
                icon="play-circle-outline"
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

export default OperationsScreen;
