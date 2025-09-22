import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    fetchUsers();
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
    <Animatable.View animation="fadeInUp" delay={index * 60} duration={400}>
      <View style={[styles.userCard, item.blocked && { borderColor: '#FF3B30', backgroundColor: '#fff6f6' }]}> 
        <View style={styles.userInfo}>
          <Icon name="person" size={32} color={item.blocked ? '#FF3B30' : '#667eea'} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.userName}>{item.name}</Text>
              {item.blocked && (
                <Text style={styles.blockedTag}>(Blocked)</Text>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRole}>{item.role}</Text>
          </View>
        </View>
        <View style={styles.userActions}>
          {item.blocked ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnblockUser(item)}>
              <Icon name="lock-open" size={22} color="#2ecc71" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlockUser(item)}>
              <Icon name="block" size={22} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animatable.View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#667eea" /><Text style={{marginTop: 12}}>Loading users...</Text></View>;
  }
  if (error) {
    return <View style={styles.centered}><Text>{error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={{paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20}}
      >
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 6}}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{flex: 1, textAlign: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: -30}}>
            Manage Users
          </Text>
          <TouchableOpacity style={{padding: 6}} onPress={() => navigation.navigate('AddEmployee')}>
            <Icon name="person-add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'blocked' && styles.filterBtnActive]}
          onPress={() => setFilter('blocked')}
        >
          <Text style={[styles.filterText, filter === 'blocked' && styles.filterTextActive]}>Blocked</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshUsers}>
          <Icon name={refreshing ? 'autorenew' : 'refresh'} size={22} color="#667eea" style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
      </View>
      {/* Search bar */}
      <View style={styles.searchBarWrap}>
        <Icon name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name, email, or phone"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
      </View>
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people-outline" size={60} color="#eee" />
          <Text style={{ color: '#aaa', fontSize: 18, marginTop: 10 }}>No users found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Admin Users Section */}
          {adminUsers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Administrators ({adminUsers.length})</Text>
              {adminUsers.map((item, index) => (
                <Animatable.View key={item.id?.toString()} animation="fadeInUp" delay={index * 60} duration={400}>
                  <View style={[styles.userCard, item.blocked && { borderColor: '#FF3B30', backgroundColor: '#fff6f6' }, styles.adminCard]}> 
                    <View style={styles.userInfo}>
                      <Icon name="admin-panel-settings" size={32} color={item.blocked ? '#FF3B30' : '#667eea'} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={styles.userName}>{item.name}</Text>
                          {item.blocked && (
                            <Text style={styles.blockedTag}>(Blocked)</Text>
                          )}
                        </View>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        <Text style={styles.userRole}>{item.role}</Text>
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      {item.blocked ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnblockUser(item)}>
                          <Icon name="lock-open" size={22} color="#2ecc71" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlockUser(item)}>
                          <Icon name="block" size={22} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Animatable.View>
              ))}
            </View>
          )}

          {/* Regular Users Section */}
          {regularUsers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Users ({regularUsers.length})</Text>
              {regularUsers.map((item, index) => (
                <Animatable.View key={item.id?.toString()} animation="fadeInUp" delay={index * 60} duration={400}>
                  <View style={[styles.userCard, item.blocked && { borderColor: '#FF3B30', backgroundColor: '#fff6f6' }]}> 
                    <View style={styles.userInfo}>
                      <Icon name="person" size={32} color={item.blocked ? '#FF3B30' : '#667eea'} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={styles.userName}>{item.name}</Text>
                          {item.blocked && (
                            <Text style={styles.blockedTag}>(Blocked)</Text>
                          )}
                        </View>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        <Text style={styles.userRole}>{item.role}</Text>
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      {item.blocked ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnblockUser(item)}>
                          <Icon name="lock-open" size={22} color="#2ecc71" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlockUser(item)}>
                          <Icon name="block" size={22} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Animatable.View>
              ))}
            </View>
          )}
        </ScrollView>
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
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  headerGradient: {paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 38, paddingBottom: 20, },
  backButton: { padding: 6, marginRight: 8 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  addButton: { padding: 6, marginLeft: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#eee', marginHorizontal: 5, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  filterText: { fontSize: 14, fontWeight: 'bold', color: '#667eea' },
  filterTextActive: { color: 'white' },
  refreshBtn: { marginLeft: 10, backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 2 },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, elevation: 1 },
  searchBar: { flex: 1, fontSize: 16, color: '#222', paddingVertical: 6 },
  userCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginHorizontal: 16, marginVertical: 7, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  blockedTag: { color: '#FF3B30', marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
  userEmail: { fontSize: 14, color: '#555', marginTop: 2 },
  userRole: { fontSize: 13, color: '#888', marginTop: 1 },
  userActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  actionBtn: { marginLeft: 8, backgroundColor: '#fff', borderRadius: 8, padding: 8, elevation: 1 },
  userStatus: { fontSize: 12, fontWeight: 'bold', marginRight: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 30 },
  sectionContainer: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, paddingHorizontal: 16 },
  adminCard: { borderLeftWidth: 4, borderLeftColor: '#667eea' },
});