import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import StoreClosedBanner from '../../components/StoreClosedBanner';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const quickActions = [
    {
      title: 'Manage Orders',
      icon: <Icon name="assignment" size={28} color="#fff" />, 
      color: '#1976D2',
      iconBg: 'rgba(25, 118, 210, 0.12)',
      onPress: () => navigation.navigate('AdminOrders')
    },
    {
      title: 'User Management',
      icon: <Icon name="people" size={28} color="#fff" />, 
      color: '#388E3C',
      iconBg: 'rgba(56, 142, 60, 0.12)',
      onPress: () => navigation.navigate('AdminUsers')
    },
    {
      title: 'Analytics',
      icon: <Icon name="analytics" size={28} color="#fff" />, 
      color: '#FBC02D',
      iconBg: 'rgba(251, 192, 45, 0.15)',
      onPress: () => navigation.navigate('AdminAnalytics')
    },
    {
      title: 'Update Services',
      icon: <Icon name="build" size={28} color="#fff" />, 
      color: '#F57C00',
      iconBg: 'rgba(245, 124, 0, 0.13)',
      onPress: () => navigation.navigate('UpdateServices')
    },
    {
      title: 'Settings',
      icon: <Icon name="settings" size={28} color="#fff" />, 
      color: '#7B1FA2',
      iconBg: 'rgba(123, 31, 162, 0.13)',
      onPress: () => navigation.navigate('AdminSettings')
    },
    {
      title: 'Failed Payments',
      icon: <Icon name="error-outline" size={28} color="#fff" />, 
      color: '#D32F2F',
      iconBg: 'rgba(211, 47, 47, 0.13)',
      onPress: () => navigation.navigate('AdminReconciliationScreen', { tab: 'failedPayments' })
    },
    {
      title: 'Payments w/o Order',
      icon: <Icon name="payment" size={28} color="#fff" />, 
      color: '#0288D1',
      iconBg: 'rgba(2, 136, 209, 0.13)',
      onPress: () => navigation.navigate('AdminReconciliationScreen', { tab: 'paymentsNoOrder' })
    },
    {
      title: 'File Manager',
      icon: <Icon name="folder" size={28} color="#fff" />, 
      color: '#0097A7',
      iconBg: 'rgba(0, 151, 167, 0.13)',
      onPress: () => navigation.navigate('FileManagerScreen')
    },
  ];

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.request('/analytics/orders'),
      api.request('/analytics/pendingOrders'),
      api.request('/analytics/users'),
      api.request('/analytics/revenue'),
      api.request('/analytics/recent-activities'),
    ])
      .then(([orders, pendingOrders, users, revenue, activities]) => {
        setStats([
          { title: 'Total Orders', value: orders?.value ?? 0, change: '+12%', color: '#4F8EF7' },
          { title: 'Pending Orders', value: pendingOrders?.value ?? 0, change: '-5%', color: '#FF7043' },
          { title: 'Active Users', value: users?.value ?? 0, change: '+8%', color: '#43B581' },
          { title: 'Revenue', value: revenue?.value ?? 0, change: '+15%', color: '#FFB300' },
        ]);
        setRecentActivities(Array.isArray(activities) ? activities : []);
      })
      .catch(e => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
    api.request('/settings/accepting-orders')
      .then(res => setAcceptingOrders(res.acceptingOrders))
      .catch(() => setAcceptingOrders(true));
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'order': return <Icon name="assignment" size={20} color="#fff" />;
      case 'user': return <Icon name="person-add" size={20} color="#fff" />;
      case 'completed': return <Icon name="check-circle" size={20} color="#fff" />;
      case 'payment': return <Icon name="payment" size={20} color="#fff" />;
      default: return <Icon name="info" size={20} color="#fff" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'order': return '#4F8EF7';
      case 'user': return '#43B581';
      case 'completed': return '#66BB6A';
      case 'payment': return '#FFB300';
      default: return '#9E9E9E';
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#4F8EF7" />
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  );
  if (error) return (
    <View style={styles.centered}>
      <Icon name="error-outline" size={40} color="#D7263D" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardData}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!acceptingOrders && <StoreClosedBanner />}
      <LinearGradient
        colors={["#4F8EF7", "#7E57C2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Overview & Analytics</Text>
          </View>
          <TouchableOpacity onPress={fetchDashboardData} style={styles.refreshBtn}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={stat.title} style={[styles.statCard, { borderLeftColor: stat.color }]}> 
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? '#43B581' : '#D7263D' }]}>{stat.change}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={action.title}
              style={[styles.actionCard, { backgroundColor: action.color }]}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: action.iconBg }]}> 
                {action.icon}
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activities */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminAnalytics')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {(recentActivities || []).length === 0 ? (
            <Text style={styles.emptyText}>No recent activities.</Text>
          ) : (
            recentActivities.map((activity, index) => (
              <View key={activity.id || index} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) }]}> 
                  {getActivityIcon(activity.type)}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityUser}>{activity.user}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    marginTop: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  statChange: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  actionCard: {
    width: (width - 56) / 2,
    backgroundColor: '#4F8EF7',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 10,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    // Remove shadow for a soft look
    // shadowColor: '#000',
    // shadowOpacity: 0.10,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  recentSection: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewAllText: {
    color: '#4F8EF7',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
  },
  activityAction: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  activityUser: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    color: '#4F8EF7',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#D7263D',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 