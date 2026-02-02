import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Input, Button, LoadingSpinner } from '../components';
import { getField, createField, updateField } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

const FieldDetailsScreen = ({ navigation, route }) => {
  const { fieldId } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!fieldId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    areaHectares: '',
    soilType: '',
    boundaryCoordinates: [],
  });

  useEffect(() => {
    if (fieldId) {
      fetchField();
    }
  }, [fieldId]);

  const fetchField = async () => {
    try {
      const data = await getField(fieldId);
      setFormData({
        name: data.name || '',
        areaHectares: data.areaHectares?.toString() || '',
        soilType: data.soilType || '',
        boundaryCoordinates: data.boundaryCoordinates || [],
      });
    } catch (error) {
      console.error('Error fetching field:', error);
      Alert.alert('Error', 'Failed to load field details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Field name is required');
      return;
    }

    if (!formData.areaHectares || isNaN(parseFloat(formData.areaHectares))) {
      Alert.alert('Error', 'Valid area in hectares is required');
      return;
    }

    setSaving(true);
    try {
      const fieldData = {
        name: formData.name.trim(),
        areaHectares: parseFloat(formData.areaHectares),
        soilType: formData.soilType.trim() || null,
        boundaryCoordinates: formData.boundaryCoordinates.length > 0 ? formData.boundaryCoordinates : null,
      };

      if (fieldId) {
        await updateField(fieldId, fieldData);
        Alert.alert('Success', 'Field updated successfully');
      } else {
        await createField(fieldData);
        Alert.alert('Success', 'Field created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving field:', error);
      Alert.alert('Error', 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading field..." />;
  }

  if (user?.role !== 'farmer') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color={COLORS.gray} />
          <Text style={styles.errorText}>Access denied</Text>
          <Text style={styles.errorSubtext}>Only farmers can manage fields</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {fieldId ? 'Edit Field' : 'Add Field'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Input
              label="Field Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Enter field name"
              required
            />

            <Input
              label="Area (Hectares)"
              value={formData.areaHectares}
              onChangeText={(value) => updateFormData('areaHectares', value)}
              placeholder="Enter area in hectares"
              keyboardType="numeric"
              required
            />

            <Input
              label="Soil Type"
              value={formData.soilType}
              onChangeText={(value) => updateFormData('soilType', value)}
              placeholder="e.g., Clay, Loam, Sandy"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                Boundary coordinates can be added later for precise area calculation and GPS tracking.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={saving ? 'Saving...' : (fieldId ? 'Update Field' : 'Create Field')}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.light,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: SIZES.padding / 2,
    flex: 1,
  },
  footer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    marginTop: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  errorSubtext: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SIZES.padding / 2,
  },
});

export default FieldDetailsScreen;