import React, { useState } from 'react';
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
import { Header, Card, Button, Input, PickerSelect, AreaCalculationWidget } from '../components';
import { updateImplement, deleteImplement } from '../services/dataService';
import { OPERATION_TYPES } from '../constants/api';
import { getOperationTypeLabel } from '../utils/helpers';

const ImplementDetailsScreen = ({ navigation, route }) => {
  const { implement, onUpdate } = route.params;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: implement.name,
    brandName: implement.brandName,
    operationType: implement.operationType,
    workingWidth: implement.workingWidth?.toString(),
    isActive: implement.isActive,
  });

  const handleSave = async () => {
    if (!formData.name || !formData.brandName || !formData.operationType || !formData.workingWidth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await updateImplement(implement.id, {
        ...formData,
        workingWidth: parseFloat(formData.workingWidth),
      });
      Alert.alert('Success', 'Implement updated successfully');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update implement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Implement', 'Are you sure you want to delete this implement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteImplement(implement.id);
            Alert.alert('Success', 'Implement deleted successfully');
            if (onUpdate) onUpdate();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete implement');
          }
        },
      },
    ]);
  };

  const toggleStatus = async () => {
    setSaving(true);
    try {
      await updateImplement(implement.id, { isActive: !formData.isActive });
      setFormData((p) => ({ ...p, isActive: !p.isActive }));
      if (onUpdate) onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Implement Details"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={editing ? 'close-outline' : 'create-outline'}
        onRightPress={() => setEditing(!editing)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: formData.isActive ? COLORS.success + '20' : COLORS.gray + '20' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: formData.isActive ? COLORS.success : COLORS.gray },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: formData.isActive ? COLORS.success : COLORS.gray },
              ]}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <AreaCalculationWidget
          totalArea={0}
          coveredArea={0}
          operationType="Equipment Usage"
          showMap={false}
          style={styles.areaWidget}
        />

        <Card style={styles.card}>
          {editing ? (
            <>
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
              <View style={styles.editButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setEditing(false)}
                  style={styles.editButton}
                />
                <Button
                  title="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.editButton}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Implement Information</Text>
              <InfoRow icon="create-outline" label="Name" value={formData.name} />
              <InfoRow icon="business-outline" label="Brand" value={formData.brandName} />
              <InfoRow
                icon="layers-outline"
                label="Type"
                value={getOperationTypeLabel(formData.operationType)}
              />
              <InfoRow icon="resize-outline" label="Width" value={`${formData.workingWidth}m`} />
            </>
          )}
        </Card>

        {!editing && (
          <>
            <Button
              title={formData.isActive ? 'Deactivate Implement' : 'Activate Implement'}
              onPress={toggleStatus}
              variant={formData.isActive ? 'outline' : 'primary'}
              loading={saving}
              style={styles.actionButton}
              icon={formData.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
            />

            <Button
              title="Delete Implement"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
              icon="trash-outline"
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  statusContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
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
    marginBottom: 16,
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
    paddingVertical: 12,
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
  editButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
});

export default ImplementDetailsScreen;
