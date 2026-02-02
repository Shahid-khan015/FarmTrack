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
import { getImplements, createImplement, deleteImplement } from '../services/dataService';
import { OPERATION_TYPES } from '../constants/api';
import { getOperationTypeLabel } from '../utils/helpers';

const ImplementsScreen = ({ navigation }) => {
  const [implements_, setImplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    operationType: '',
    workingWidth: '',
  });

  const fetchImplements = async () => {
    try {
      const data = await getImplements();
      setImplements(data);
    } catch (error) {
      console.error('Fetch implements error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImplements();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchImplements();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.brandName || !formData.operationType || !formData.workingWidth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createImplement({
        ...formData,
        workingWidth: parseFloat(formData.workingWidth),
      });
      setModalVisible(false);
      setFormData({ name: '', brandName: '', operationType: '', workingWidth: '' });
      fetchImplements();
      Alert.alert('Success', 'Implement added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add implement');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <ListItem
      title={item.name}
      subtitle={`${item.brandName} - ${item.workingWidth}m width`}
      description={getOperationTypeLabel(item.operationType)}
      icon="construct-outline"
      iconColor={item.isActive ? COLORS.info : COLORS.gray}
      status={item.isActive ? 'Active' : 'Inactive'}
      statusColor={item.isActive ? COLORS.success : COLORS.gray}
      onPress={() =>
        navigation.navigate('ImplementDetails', { implement: item, onUpdate: fetchImplements })
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading implements..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Implements"
        subtitle={`${implements_.length} total`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon="add-circle-outline"
        onRightPress={() => setModalVisible(true)}
      />

      <View style={styles.content}>
        <AreaCalculationWidget
          totalArea={0}
          coveredArea={0}
          operationType="Equipment Usage"
          showMap={false}
          style={styles.areaWidget}
        />

        <FlatList
          data={implements_}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title="No Implements"
              message="Add your first implement to get started"
              buttonTitle="Add Implement"
              onButtonPress={() => setModalVisible(true)}
            />
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Implement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Name"
              value={formData.name}
              onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
              placeholder="e.g., Heavy Duty Plough"
              icon="create-outline"
              required
            />

            <Input
              label="Brand Name"
              value={formData.brandName}
              onChangeText={(v) => setFormData((p) => ({ ...p, brandName: v }))}
              placeholder="e.g., Mahindra"
              icon="business-outline"
              required
            />

            <PickerSelect
              label="Operation Type"
              value={formData.operationType}
              options={OPERATION_TYPES}
              onValueChange={(v) => setFormData((p) => ({ ...p, operationType: v }))}
              placeholder="Select operation type"
              required
            />

            <Input
              label="Working Width (meters)"
              value={formData.workingWidth}
              onChangeText={(v) => setFormData((p) => ({ ...p, workingWidth: v }))}
              placeholder="e.g., 2.5"
              icon="resize-outline"
              keyboardType="decimal-pad"
              required
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Add Implement"
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

export default ImplementsScreen;
