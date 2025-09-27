import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';

export default function AdminUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false });
  const [filter, setFilter] = useState('all'); // 'all' or 'blocked'
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' or 'users'
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
    api.checkCanEdit()
      .then(res => setCanEdit(res.canEdit))
      .catch(() => setCanEdit(false));
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.request('/user/list')
      .then(setUsers)
      .catch(e => setError('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const refreshUsers = () => {
    setRefreshing(true);
    api.request('/user/list')
      .then(setUsers)
      .catch(e => setError('Failed to load users'))
      .finally(() => setRefreshing(false));
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlert({ visible: true, title, message, type, onConfirm, showCancel });
  };
  const hideAlert = () => setAlert({ ...alert, visible: false });

  const handleBlockUser = (user) => {
    showAlert(
      'Block User',
      `Are you sure you want to block user: ${user.name}?`,
      'warning',
      async () => {
        hideAlert();
        try {
          await api.blockUser(user.id, true);
          refreshUsers();
          showAlert('Success', 'User has been blocked.', 'success');
        } catch (e) {
          showAlert('Error', 'Failed to block user.', 'error');
        }
      },
      true
    );
  };

  const handleUnblockUser = (user) => {
    showAlert(
      'Unblock User',
      `Are you sure you want to unblock user: ${user.name}?`,
      'info',
      async () => {
        hideAlert();
        try {
          await api.blockUser(user.id, false);
          refreshUsers();
          showAlert('Success', 'User has been unblocked.', 'success');
        } catch (e) {
          showAlert('Error', 'Failed to unblock user.', 'error');
        }
      },
      true
    );
  };

  const handleToggleCanEdit = (user) => {
    const action = user.canEdit ? 'revoke' : 'grant';
    showAlert(
      `${action === 'grant' ? 'Grant' : 'Revoke'} Edit Permission`,
      `Are you sure you want to ${action} edit permission for user: ${user.name}?`,
      'warning',
      async () => {
        hideAlert();
        try {
          await api.updateCanEdit(user.id, !user.canEdit);
          refreshUsers();
          showAlert('Success', `Edit permission ${action}ed successfully.`, 'success');
        } catch (e) {
          showAlert('Error', `Failed to ${action} edit permission.`, 'error');
        }
      },
      true
    );
  };

  // Filtering and searching logic
  const filteredUsers = users.filter(user => {
    if (filter === 'blocked' && !user.blocked) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(s)) ||
        (user.email && user.email.toLowerCase().includes(s)) ||
        (user.phone && user.phone.toLowerCase().includes(s))
      );
    }
    return true;
  });
  
  // Separate admins and users
  const adminUsers = filteredUsers.filter(user => user.role === 'ADMIN');
  const regularUsers = filteredUsers.filter(user => user.role !== 'ADMIN');

  const renderUser = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 50} duration={300}>
      <View style={[styles.userCard, item.blocked && styles.blockedCard]}> 
        <View style={styles.userAvatar}>
          <Icon name={item.role === 'ADMIN' ? "admin-panel-settings" : "person"} 
                size={18} 
                color={item.blocked ? '#FF3B30' : '#4F46E5'} />
        </View>
        
        <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            {item.blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedText}>Blocked</Text>
              </View>
            )}
            {item.canEdit && (
              <View style={styles.canEditBadge}>
                <Text style={styles.canEditText}>Super Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        </View>
        
        <View style={styles.userActions}>
          {item.role === 'ADMIN' && canEdit && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: item.canEdit ? '#F59E0B' : '#10B981' }]} 
              onPress={() => handleToggleCanEdit(item)}
            >
              <Icon name={item.canEdit ? "admin-panel-settings" : "person"} size={18} color="white" />
            </TouchableOpacity>
          )}
          {item.blocked ? (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleUnblockUser(item)}
            >
              <Icon name="lock-open" size={18} color="#10B981" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleBlockUser(item)}
            >
              <Icon name="block" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Users</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('AddEmployee')}>
            <Icon name="person-add" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'admins' && styles.activeTab]} 
          onPress={() => setActiveTab('admins')}
        >
          <Text style={[styles.tabText, activeTab === 'admins' && styles.activeTabText]}>
            Admins ({adminUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users ({regularUsers.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="cancel" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'blocked' && styles.activeFilterButton]}
            onPress={() => setFilter('blocked')}
          >
            <Text style={[styles.filterText, filter === 'blocked' && styles.activeFilterText]}>Blocked</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshUsers}>
            <Icon name={refreshing ? 'autorenew' : 'refresh'} size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* User List */}
      {activeTab === 'admins' && adminUsers.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="admin-panel-settings" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No administrators found</Text>
        </View>
      )}
      
      {activeTab === 'users' && regularUsers.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="people-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No users found</Text>
        </View>
      )}
      
      {activeTab === 'admins' && adminUsers.length > 0 && (
        <FlatList
          data={adminUsers}
          keyExtractor={(item) => `admin-${item.id}`}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {activeTab === 'users' && regularUsers.length > 0 && (
        <FlatList
          data={regularUsers}
          keyExtractor={(item) => `user-${item.id}`}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
        onConfirm={alert.onConfirm}
        showCancel={alert.showCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: 'white',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  blockedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  blockedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#EF4444',
  },
  canEditBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  canEditText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F59E0B',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  userActions: {
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
});