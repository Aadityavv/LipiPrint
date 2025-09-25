import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Button, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function AdminSettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [acceptingOrdersLoading, setAcceptingOrdersLoading] = useState(true);

  useEffect(() => {
    api.request('/services')
      .then(setOptions)
      .catch(e => setError('Failed to load service options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.request('/settings/accepting-orders')
      .then(res => setAcceptingOrders(res.acceptingOrders))
      .catch(() => setAcceptingOrders(true))
      .finally(() => setAcceptingOrdersLoading(false));
  }, []);

  const handleToggleAcceptingOrders = async () => {
    setAcceptingOrdersLoading(true);
    try {
      const res = await api.request(`/settings/accepting-orders?accepting=${!acceptingOrders}`, { method: 'PUT' });
      setAcceptingOrders(res.acceptingOrders);
    } catch (e) {
      // Optionally show error
    } finally {
      setAcceptingOrdersLoading(false);
    }
  };

  const updateOption = async (id, data) => {
    try {
      const updated = await api.request(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setOptions(opts => opts.map(o => o.id === id ? updated : o));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Failed', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading options...</Text></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.header} style={styles.headerGradient}>
        <Heading
          title="Admin Settings"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={theme.headerText} />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
          <Icon name={acceptingOrders ? 'check-circle' : 'block'} size={24} color={acceptingOrders ? '#4CAF50' : '#F44336'} style={{ marginRight: 12 }} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Accepting Orders</Text>
          <Switch value={acceptingOrders} onValueChange={handleToggleAcceptingOrders} disabled={acceptingOrdersLoading} />
        </View>
        <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
          <Icon name="notifications" size={24} color={theme.icon} style={{ marginRight: 12 }} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card }]}>
          <Icon name="lock" size={24} color={theme.icon} style={{ marginRight: 12 }} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card }]} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF6B6B" style={{ marginRight: 12 }} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Logout</Text>
        </TouchableOpacity>
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
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  settingLabel: { fontSize: 16, color: '#1a1a1a', flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
}); 