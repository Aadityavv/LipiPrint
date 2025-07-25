import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function AdminReconciliationScreen({ navigation, route }) {
  const initialTab = route?.params?.tab || 'failedPayments';
  const [activeTab, setActiveTab] = useState(initialTab); // 'failedPayments', 'paymentsNoOrder'
  const [failedPaymentsOrders, setFailedPaymentsOrders] = useState([]);
  const [paymentsNoOrder, setPaymentsNoOrder] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  const fetchFailedPaymentsOrders = async () => {
    setTabLoading(true);
    try {
      const data = await api.getOrdersWithFailedPayments();
      setFailedPaymentsOrders(data);
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to load failed payment orders', type: 'error' });
    } finally {
      setTabLoading(false);
    }
  };

  const fetchPaymentsNoOrder = async () => {
    setTabLoading(true);
    try {
      const data = await api.getPaymentsWithoutOrder();
      setPaymentsNoOrder(data);
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to load payments without order', type: 'error' });
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'failedPayments') fetchFailedPaymentsOrders();
    if (activeTab === 'paymentsNoOrder') fetchPaymentsNoOrder();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={{paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 6}}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{flex: 1, textAlign: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: -30}}>
            Reconciliation
          </Text>
        </View>
      </LinearGradient>
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('failedPayments')} style={[styles.tabBtn, activeTab === 'failedPayments' && styles.tabBtnActiveRed]}>
          <Text style={[styles.tabText, activeTab === 'failedPayments' && styles.tabTextActiveRed]}>Failed Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('paymentsNoOrder')} style={[styles.tabBtn, activeTab === 'paymentsNoOrder' && styles.tabBtnActiveYellow]}>
          <Text style={[styles.tabText, activeTab === 'paymentsNoOrder' && styles.tabTextActiveYellow]}>Payments w/o Order</Text>
        </TouchableOpacity>
      </View>
      {/* Tab Content */}
      {activeTab === 'failedPayments' && (
        tabLoading ? <ActivityIndicator size="large" color="#e53935" style={{ marginTop: 40 }} /> :
        failedPaymentsOrders && failedPaymentsOrders.length > 0 ? (
          <FlatList
            data={failedPaymentsOrders}
            renderItem={({ item }) => (
              <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#e53935' }]}> 
                <Text style={styles.cardTitle}>Order #{item.id}</Text>
                <Text style={{ color: '#e53935', fontWeight: 'bold' }}>Payment Failed</Text>
                <Text>User: {item.user?.name} ({item.user?.email || item.user?.phone})</Text>
                <Text>Amount: ₹{item.totalAmount}</Text>
                <Text>Date: {item.createdAt?.slice(0, 10)}</Text>
              </View>
            )}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No failed payment orders found.</Text>
        )
      )}
      {activeTab === 'paymentsNoOrder' && (
        tabLoading ? <ActivityIndicator size="large" color="#ffb300" style={{ marginTop: 40 }} /> :
        paymentsNoOrder && paymentsNoOrder.length > 0 ? (
          <FlatList
            data={paymentsNoOrder}
            renderItem={({ item }) => (
              <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#ffb300' }]}> 
                <Text style={styles.cardTitle}>Payment ID: {item.id}</Text>
                <Text style={{ color: '#ffb300', fontWeight: 'bold' }}>No Order Linked</Text>
                <Text>User: {item.user?.name} ({item.user?.email || item.user?.phone})</Text>
                <Text>Amount: ₹{item.amount}</Text>
                <Text>Status: {item.status}</Text>
                <Text>Razorpay Order ID: {item.razorpayOrderId}</Text>
                <Text>Date: {item.createdAt?.slice(0, 10)}</Text>
              </View>
            )}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No payments without order found.</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f0f0f0', paddingVertical: 10 },
  tabBtn: { paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 0 },
  tabBtnActiveRed: { borderBottomWidth: 2, borderBottomColor: '#e53935' },
  tabBtnActiveYellow: { borderBottomWidth: 2, borderBottomColor: '#ffb300' },
  tabText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  tabTextActiveRed: { color: '#e53935' },
  tabTextActiveYellow: { color: '#ffb300' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 4 },
}); 