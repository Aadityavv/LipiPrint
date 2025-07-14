import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import StoreClosedBanner from '../../components/StoreClosedBanner';
import moment from 'moment';
import Heading from '../../components/Heading';

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
      icon: <Icon name="assignment" size={22} color="#fff" />, 
      color: '#1976D2',
      iconBg: '#1976D2',
      onPress: () => navigation.navigate('AdminOrders')
    },
    {
      title: 'User Management',
      icon: <Icon name="people" size={22} color="#fff" />, 
      color: '#388E3C',
      iconBg: '#388E3C',
      onPress: () => navigation.navigate('AdminUsers')
    },
    {
      title: 'Analytics',
      icon: <Icon name="analytics" size={22} color="#fff" />, 
      color: '#FBC02D',
      iconBg: '#FBC02D',
      onPress: () => navigation.navigate('AdminAnalytics')
    },
    {
      title: 'Update Services',
      icon: <Icon name="build" size={22} color="#fff" />, 
      color: '#F57C00',
      iconBg: '#F57C00',
      onPress: () => navigation.navigate('UpdateServices')
    },
    {
      title: 'Settings',
      icon: <Icon name="settings" size={22} color="#fff" />, 
      color: '#7B1FA2',
      iconBg: '#7B1FA2',
      onPress: () => navigation.navigate('AdminSettings')
    },
    {
      title: 'Failed Payments',
      icon: <Icon name="error-outline" size={22} color="#fff" />, 
      color: '#D32F2F',
      iconBg: '#D32F2F',
      onPress: () => navigation.navigate('AdminReconciliationScreen', { tab: 'failedPayments' })
    },
    {
      title: 'Payments w/o Order',
      icon: <Icon name="payment" size={22} color="#fff" />, 
      color: '#0288D1',
      iconBg: '#0288D1',
      onPress: () => navigation.navigate('AdminReconciliationScreen', { tab: 'paymentsNoOrder' })
    },
    {
      title: 'File Manager',
      icon: <Icon name="folder" size={22} color="#fff" />, 
      color: '#0097A7',
      iconBg: '#0097A7',
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

  // Updated: getActivityIcon now uses action (lowercased)
  const getActivityIcon = (action) => {
    switch ((action || '').toLowerCase()) {
      case 'delivered':
        return <Icon name="local-shipping" size={20} color="#66BB6A" />;
      case 'completed':
        return <Icon name="check-circle" size={20} color="#4F8EF7" />;
      case 'pending':
        return <Icon name="hourglass-empty" size={20} color="#FFA726" />;
      case 'cancelled':
        return <Icon name="cancel" size={20} color="#F44336" />;
      default:
        return <Icon name="info" size={20} color="#9E9E9E" />;
    }
  };

  // Updated: getActivityColor now uses action (lowercased)
  const getActivityColor = (action) => {
    switch ((action || '').toLowerCase()) {
      case 'delivered':
        return '#66BB6A';
      case 'completed':
        return '#4F8EF7';
      case 'pending':
        return '#FFA726';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
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

  const adminName = 'Admin'; // Replace with dynamic name if available
  const today = moment().format('dddd, MMM D');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!acceptingOrders && <StoreClosedBanner />}
      <LinearGradient
        colors={["#e0eafc", "#cfdef3"]}
        style={[styles.heroGradient, {paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20}]}
      >
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 24, color: '#222', fontWeight: 'bold', textAlign: 'left', marginBottom: 2}}>
              {`Welcome back, ${adminName}`}
            </Text>
            <Text style={{fontSize: 15, color: '#888', textAlign: 'left'}}>
              {today}
            </Text>
          </View>
          <Image source={require('../../assets/logo/LipiPrintLogo.png')} style={styles.heroAvatar} />
        </View>
      </LinearGradient>
      <ScrollView style={styles.containerModern} contentContainerStyle={styles.scrollContentModern} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsGridModernDashboard}>
          {stats.map((stat, index) => (
            <View key={stat.title} style={styles.statCardModernDashboard}>
              <View style={[styles.statIconCircleModernDashboard, { backgroundColor: stat.color + '22' }]}> 
                <Icon name={index === 0 ? 'assignment' : index === 1 ? 'pending-actions' : index === 2 ? 'people' : 'currency-rupee'} size={22} color={stat.color} />
              </View>
              <View style={styles.statInfoRowModernDashboard}>
                <Text style={styles.statValueModernDashboard}>{stat.value}</Text>
                <View style={styles.statTrendModernDashboard}>
                  <Icon name={stat.change.startsWith('+') ? 'arrow-upward' : 'arrow-downward'} size={14} color={stat.change.startsWith('+') ? '#43B581' : '#D7263D'} />
                  <Text style={[styles.statChangeModernDashboard, { color: stat.change.startsWith('+') ? '#43B581' : '#D7263D' }]}>{stat.change}</Text>
                </View>
              </View>
              <Text style={styles.statTitleModernDashboard}>{stat.title}</Text>
            </View>
          ))}
        </View>
        {/* Quick Actions */}
        <View style={styles.quickActionsMatrixWrap}>
          <View style={styles.quickActionsMatrixGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={action.title}
                style={[styles.actionPillMatrix, { backgroundColor: action.color }]}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
                <View style={styles.actionPillIconWrap}>{action.icon}</View>
                <Text style={styles.actionPillText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>
        {/* Activity Feed */}
        <View style={styles.sectionModern}>
          <View style={styles.sectionHeaderModern}>
            <Text style={styles.sectionTitleModern}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminAnalytics')}>
              <Text style={styles.viewAllTextModern}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timelineWrap}>
          {(recentActivities || []).length === 0 ? (
              <View style={styles.emptyStateModern}>
                <Icon name="event-busy" size={48} color="#bdbdbd" />
                <Text style={styles.emptyTextModern}>No recent activities. Start managing orders to see updates here!</Text>
              </View>
          ) : (
            recentActivities.map((activity, index) => (
                <View key={activity.id || index} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: getActivityColor(activity.action) }]} />
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      {getActivityIcon(activity.action)}
                      <Text style={styles.timelineAction}>{activity.action}</Text>
                    </View>
                    <Text style={styles.timelineUser}>{activity.user}</Text>
                    <Text style={styles.timelineTime}>{
                      activity.time && moment(activity.time).isValid()
                        ? moment(activity.time).format('D MMMM, YYYY')
                        : activity.time
                    }</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
      </ScrollView>
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
  sectionWrap: {
    marginBottom: 32,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#ececec',
    marginVertical: 8,
    borderRadius: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 100,
    justifyContent: 'center',
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
    marginBottom: 0,
  },
  actionCard: {
    width: (width - 56) / 2,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 10,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'center',
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
  activitiesContainer: {
    backgroundColor: '#f7fafd',
    borderRadius: 18,
    padding: 12,
    marginTop: 8,
  },
  // Add new styles for the modern dashboard
  headerGradientModern: {
    paddingTop: 36,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  headerModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleModern: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitleModern: {
    fontSize: 15,
    color: '#e0e0e0',
    marginBottom: 2,
  },
  headerRightModern: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtnModern: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  avatarModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  containerModern: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContentModern: {
    paddingBottom: 32,
  },
  sectionModern: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitleModern: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  statsGridModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardModern: {
    width: (width - 64) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  statIconModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValueModern: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  statTitleModern: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  statChangeModern: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quickActionsGridModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  actionCardModern: {
    width: (width - 64 - 3 * 12) / 4, // 4 columns, 3 gaps
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'center',
  },
  actionIconCircleModern: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  actionTitleModern: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginTop: 2,
  },
  actionDescModern: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewAllTextModern: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activitiesContainerModern: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  activityIconBarModern: {
    width: 6,
    height: '100%',
    borderRadius: 4,
    marginRight: 12,
  },
  activityInfoModern: {
    flex: 1,
  },
  activityActionModern: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  activityUserModern: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  activityTimeModern: {
    fontSize: 12,
    color: '#999',
  },
  emptyStateModern: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTextModern: {
    color: '#bdbdbd',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  heroGradient: {
    paddingTop: 36,
    paddingBottom: 18,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroWelcome: {
    fontSize: 16,
    color: '#888',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  heroDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  statGlassCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    padding: 16,
    minWidth: 80,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: '#e3e3e3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconModern: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValueModern: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  statTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statChangeModern: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statTitleModern: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  highlightsSection: {
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#43B581',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 13,
    color: '#43B581',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  quickActionsScrollWrap: {
    marginTop: 8,
    marginBottom: 18,
    paddingLeft: 8,
  },
  quickActionsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionPillModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  actionPillIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  actionPillText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  timelineWrap: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 8,
    marginRight: 12,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  timelineAction: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    // marginLeft: 4,
  },
  timelineUser: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
  },
  // Add new styles for the modern dashboard stat cards and grid
  statsGridModernDashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
  },
  statCardModernDashboard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 90,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  statIconCircleModernDashboard: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statInfoRowModernDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  statValueModernDashboard: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 6,
  },
  statTrendModernDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statChangeModernDashboard: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statTitleModernDashboard: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    fontWeight: '600',
  },
  // Add new styles for the quick actions matrix
  quickActionsMatrixWrap: {
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 15,
  },
  quickActionsMatrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 5,
  },
  actionPillMatrix: {
    width: (width - 30 - 2 * 12) / 2, // 2 columns, 1 gap
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 17,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
}); 