import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { LineChart } from 'react-native-gifted-charts';

export default function AdminAnalyticsScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.request('/analytics/orders'),
      api.request('/analytics/revenue'),
      api.request('/analytics/users'),
      api.request('/analytics/pendingOrders'),
      api.request('/analytics/trends/orders'),
      api.request('/analytics/trends/revenue'),
    ])
      .then(([orders, revenue, users, pendingOrders, orderTrends, revenueTrends]) => {
        setStats([
          { title: 'Total Orders', value: orders.value, color: '#FF6B6B' },
          { title: 'Revenue', value: revenue.value, color: '#66BB6A' },
          { title: 'Active Users', value: users.value, color: '#4ECDC4' },
          { title: 'Pending Orders', value: pendingOrders.value, color: '#FFA726' },
        ]);
        setTrends([
          { label: 'Orders (Last 7 days)', value: orderTrends.map(t => t.count), dates: orderTrends.map(t => t.date) },
          { label: 'Revenue (Last 7 days)', value: revenueTrends.map(t => t.revenue), dates: revenueTrends.map(t => t.date) },
        ]);
      })
      .catch(e => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading analytics...</Text></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics & Reports</Text>
          <View style={{ width: 44 }} />
        </Animatable.View>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Key Stats</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={stat.title} style={[styles.statCard, { borderLeftColor: stat.color }]}> 
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Trends</Text>
        {trends.map((trend, idx) => (
          <View key={trend.label} style={styles.trendCard}>
            <Text style={styles.trendLabel}>{trend.label}</Text>
            <LineChart
              data={trend.value.map((v, i) => ({ value: Number(v), label: trend.dates[i]?.slice(5) }))}
              thickness={2}
              color={idx === 0 ? '#667eea' : '#66BB6A'}
              hideDataPoints={false}
              areaChart={true}
              yAxisTextStyle={{ color: '#888' }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              noOfSections={4}
              maxValue={Math.max(...trend.value.map(Number), 1)}
              spacing={30}
              width={320}
              height={180}
              isAnimated
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  statTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  trendCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  trendLabel: { fontSize: 16, fontWeight: '600', color: '#667eea', marginBottom: 8 },
  trendData: { fontSize: 14, color: '#1a1a1a' },
}); 