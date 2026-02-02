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
import { Header, Card, Button, Input, AreaCalculationWidget } from '../components';
import { updateTractor, deleteTractor } from '../services/dataService';

const TractorDetailsScreen = ({ navigation, route }) => {
  const { tractor, onUpdate } = route.params;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    manufacturerName: tractor.manufacturerName,
    model: tractor.model,
    registrationNumber: tractor.registrationNumber,
    isActive: tractor.isActive,
  });

  const handleSave = async () => {
    if (!formData.manufacturerName || !formData.model || !formData.registrationNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await updateTractor(tractor.id, formData);
      Alert.alert('Success', 'Tractor updated successfully');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update tractor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Tractor', 'Are you sure you want to delete this tractor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTractor(tractor.id);
            Alert.alert('Success', 'Tractor deleted successfully');
            if (onUpdate) onUpdate();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete tractor');
          }
        },
      },
    ]);
  };

  const toggleStatus = async () => {
    setSaving(true);
    try {
      await updateTractor(tractor.id, { isActive: !formData.isActive });
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
        title="Tractor Details"
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
          operationType="Tractor Usage"
          showMap={false}
          style={styles.areaWidget}
        />

        <Card style={styles.card}>
          {editing ? (
            <>
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
              <Text style={styles.cardTitle}>Tractor Information</Text>
              <InfoRow icon="business-outline" label="Manufacturer" value={formData.manufacturerName} />
              <InfoRow icon="pricetag-outline" label="Model" value={formData.model} />
              <InfoRow
                icon="document-text-outline"
                label="Registration"
                value={formData.registrationNumber}
              />
            </>
          )}
        </Card>

        {!editing && (
          <>
            <Button
              title={formData.isActive ? 'Deactivate Tractor' : 'Activate Tractor'}
              onPress={toggleStatus}
              variant={formData.isActive ? 'outline' : 'primary'}
              loading={saving}
              style={styles.actionButton}
              icon={formData.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
            />

            <Button
              title="Delete Tractor"
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

export default TractorDetailsScreen;
