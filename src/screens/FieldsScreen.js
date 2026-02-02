import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ListItem, LoadingSpinner, EmptyState } from '../components';
import { getFields, deleteField } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';

const FieldsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFields = async () => {
    try {
      const data = await getFields();
      setFields(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      Alert.alert('Error', 'Failed to load fields');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFields();
  }, []);

  const handleDeleteField = (fieldId, fieldName) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${fieldName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteField(fieldId);
              setFields(fields.filter(field => field.id !== fieldId));
              Alert.alert('Success', 'Field deleted successfully');
            } catch (error) {
              console.error('Error deleting field:', error);
              Alert.alert('Error', 'Failed to delete field');
            }
          },
        },
      ]
    );
  };

  const renderField = ({ item }) => (
    <ListItem
      title={item.name}
      subtitle={`${item.areaHectares} hectares - ${item.soilType || 'Unknown soil'}`}
      rightText={formatDateTime(item.createdAt)}
      onPress={() => navigation.navigate('FieldDetails', { fieldId: item.id })}
      onDelete={() => handleDeleteField(item.id, item.name)}
      showDelete={user?.role === 'farmer'}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading fields..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Fields</Text>
        </View>
        {user?.role === 'farmer' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('FieldDetails', { fieldId: null })}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={fields}
        renderItem={renderField}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="No Fields Yet"
            message={user?.role === 'farmer' ? "Add your first field to get started" : "No fields available"}
            actionText={user?.role === 'farmer' ? "Add Field" : null}
            onAction={() => navigation.navigate('FieldDetails', { fieldId: null })}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SIZES.padding,
    padding: 5,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    padding: 5,
  },
  listContainer: {
    padding: SIZES.padding,
    flexGrow: 1,
  },
});

export default FieldsScreen;