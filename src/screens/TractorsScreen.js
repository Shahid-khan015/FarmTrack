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
  AreaCalculationWidget,
} from '../components';
import { getTractors, createTractor, deleteTractor } from '../services/dataService';

const TractorsScreen = ({ navigation }) => {
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    manufacturerName: '',
    model: '',
    registrationNumber: '',
  });

  const fetchTractors = async () => {
    try {
      const data = await getTractors();
      setTractors(data);
    } catch (error) {
      console.error('Fetch tractors error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTractors();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTractors();
  }, []);

  const handleCreate = async () => {
    if (!formData.manufacturerName || !formData.model || !formData.registrationNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createTractor(formData);
      setModalVisible(false);
      setFormData({ manufacturerName: '', model: '', registrationNumber: '' });
      fetchTractors();
      Alert.alert('Success', 'Tractor added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add tractor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Tractor', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTractor(id);
            fetchTractors();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete tractor');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <ListItem
      title={`${item.manufacturerName} ${item.model}`}
      subtitle={`Reg: ${item.registrationNumber}`}
      description={item.isActive ? 'Active' : 'Inactive'}
      icon="car-sport-outline"
      iconColor={item.isActive ? COLORS.success : COLORS.gray}
      status={item.isActive ? 'Active' : 'Inactive'}
      statusColor={item.isActive ? COLORS.success : COLORS.gray}
      onPress={() =>
        navigation.navigate('TractorDetails', { tractor: item, onUpdate: fetchTractors })
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading tractors..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Tractors"
        subtitle={`${tractors.length} total`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon="add-circle-outline"
        onRightPress={() => setModalVisible(true)}
      />

      <View style={styles.content}>
        <AreaCalculationWidget
          totalArea={0}
          coveredArea={0}
          operationType="Fleet Coverage"
          showMap={false}
          style={styles.areaWidget}
        />

        <FlatList
          data={tractors}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="car-sport-outline"
              title="No Tractors"
              message="Add your first tractor to get started"
              buttonTitle="Add Tractor"
              onButtonPress={() => setModalVisible(true)}
            />
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Tractor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Manufacturer"
              value={formData.manufacturerName}
              onChangeText={(v) => setFormData((p) => ({ ...p, manufacturerName: v }))}
              placeholder="e.g., John Deere"
              icon="business-outline"
              required
            />

            <Input
              label="Model"
              value={formData.model}
              onChangeText={(v) => setFormData((p) => ({ ...p, model: v }))}
              placeholder="e.g., 5055E"
              icon="pricetag-outline"
              required
            />

            <Input
              label="Registration Number"
              value={formData.registrationNumber}
              onChangeText={(v) => setFormData((p) => ({ ...p, registrationNumber: v }))}
              placeholder="e.g., TRC-001"
              icon="document-text-outline"
              autoCapitalize="characters"
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
                title="Add Tractor"
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

export default TractorsScreen;
