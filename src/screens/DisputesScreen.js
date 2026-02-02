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
import { getDisputes, createDispute } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';

const DisputesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = async () => {
    try {
      const data = await getDisputes();
      setDisputes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      Alert.alert('Error', 'Failed to load disputes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDisputes();
  }, []);

  const handleCreateDispute = () => {
    // Navigate to operation selection or show dispute creation modal
    Alert.alert(
      'Create Dispute',
      'Select an operation to raise a dispute about:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Operations',
          onPress: () => navigation.navigate('Operations'),
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return COLORS.success;
      case 'open':
        return COLORS.warning;
      case 'closed':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const renderDispute = ({ item }) => (
    <ListItem
      title={`Dispute #${item.id.slice(-8)}`}
      subtitle={item.reason}
      rightText={formatDateTime(item.createdAt)}
      status={getStatusColor(item.status)}
      onPress={() => {
        // Navigate to dispute details or show modal
        Alert.alert(
          'Dispute Details',
          `Reason: ${item.reason}\nStatus: ${item.status || 'Open'}`,
          [{ text: 'OK' }]
        );
      }}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading disputes..." />;
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
          <Text style={styles.headerTitle}>Disputes</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateDispute}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={disputes}
        renderItem={renderDispute}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="alert-circle-outline"
            title="No Disputes"
            message="No disputes have been raised yet"
            actionText="Raise Dispute"
            onAction={handleCreateDispute}
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

export default DisputesScreen;