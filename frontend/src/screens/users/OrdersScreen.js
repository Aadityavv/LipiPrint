import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl, Image, TextInput, Dimensions, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';
import LoadingPaperplane from '../../assets/animations/Loading_Paperplane.json';

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // For paper plane animation
  const screenWidth = Dimensions.get('window').width;
  const planeAnim = React.useRef(new Animated.Value(-180)).current;
  useEffect(() => {
    let isMounted = true;
    function startPlaneAnim() {
      planeAnim.setValue(-180);
      Animated.timing(planeAnim, {
        toValue: screenWidth,
        duration: 1800,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && isMounted && loading) {
          startPlaneAnim(); // Loop
        }
      });
    }
    if (loading) {
      startPlaneAnim();
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line
  }, [loading]);

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    ApiService.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    ApiService.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setRefreshing(false));
  };

  const filters = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'PENDING', label: 'Pending', count: orders.filter(o => o.status === 'PENDING').length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
    { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.status === 'DELIVERED').length },
  ];

  // Modern, soft status badge colors
  const statusBadgeColors = {
    PENDING: '#FFC107',      // Opaque amber
    PROCESSING: '#039BE5',  // Opaque blue
    READY: '#43A047',       // Opaque green
    COMPLETED: '#8E24AA',   // Opaque purple
    CANCELLED: '#E53935',   // Opaque red
    DELIVERED: '#00897B',   // Opaque teal
  };

  const getStatusColor = (status) => statusBadgeColors[status] || '#9E9E9E';

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'READY': return 'Ready for Pickup';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'DELIVERED': return 'Delivered';
      default: return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Icon name="check-circle" size={20} color="#fff" />;
      case 'PROCESSING': return <Icon name="print" size={20} color="#fff" />;
      case 'READY': return <Icon name="local-shipping" size={20} color="#fff" />;
      case 'COMPLETED': return <Icon name="done-all" size={20} color="#fff" />;
      case 'CANCELLED': return <Icon name="cancel" size={20} color="#fff" />;
      case 'DELIVERED': return <Icon name="local-shipping" size={20} color="#fff" />;
      default: return <Icon name="info" size={20} color="#fff" />;
    }
  };

  const getDisplayFileName = (file) => {
    if (!file) return 'No file';
    // Prefer originalFilename, fallback to filename
    let name = file.originalFilename || file.filename || 'No file';
    // Replace URL-encoded characters with spaces
    try {
      name = decodeURIComponent(name);
    } catch (e) {
      name = name.replace(/%20/g, ' ');
    }
    return name;
  };

  // Search filter
  const filteredOrders = (selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter)
  ).filter(order => {
    if (!search.trim()) return true;
    const searchLower = search.trim().toLowerCase();
    // Search by order ID or file name
    const idMatch = order.id.toString().includes(searchLower);
    const fileMatch = order.printJobs && order.printJobs.some(pj => {
      const name = (pj.file?.originalFilename || pj.file?.filename || '').toLowerCase();
      return name.includes(searchLower);
    });
    return idMatch || fileMatch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="My Orders"
          subtitle="Track your print orders"
          variant="primary"
        />
      </LinearGradient>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, backgroundColor: theme.background }}>
        <TextInput
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#e0e0e0',
            color: '#222',
            marginBottom: 4,
          }}
          placeholder="Search by order ID or file name..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
          <View style={{ width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
            <LottieView
              source={LoadingPaperplane}
              autoPlay
              loop
              speed={1.5}
              style={{ width: 220, height: 220, alignSelf: 'center', marginTop: 40, marginBottom: 0 }}
            />
          </View>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>
      ) : (
        <>
          {/* Filters */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.filtersContainer, { backgroundColor: theme.card }]}
              contentContainerStyle={styles.filtersContent}
            >
              {filters.map((filter, index) => (
                <Animatable.View
                  key={filter.id}
                  animation="zoomIn"
                  delay={300 + index * 100}
                  duration={400}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === filter.id && {
                        backgroundColor: '#667eea',
                        borderColor: '#764ba2',
                        borderWidth: 2,
                      },
                      !selectedFilter === filter.id && { backgroundColor: '#e0eafc' },
                    ]}
                    onPress={() => setSelectedFilter(filter.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[
                      styles.filterText,
                      selectedFilter === filter.id && { color: '#fff', fontWeight: 'bold' },
                      !selectedFilter === filter.id && { color: '#222' },
                    ]}>
                      {filter.label}
                    </Text>
                    <View style={[
                      styles.filterCount,
                      selectedFilter === filter.id && { backgroundColor: '#fff' },
                    ]}>
                      <Text style={[
                        styles.filterCountText,
                        selectedFilter === filter.id && { color: '#667eea', fontWeight: 'bold' },
                      ]}>
                        {filter.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>
          {/* Orders List */}
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animatable.View
                animation="fadeInUp"
                delay={index * 80}
                duration={400}
                style={{ marginBottom: 18 }}
              >
                <TouchableOpacity
                  style={[
                    styles.orderCard,
                    { backgroundColor: '#fff', borderRadius: 18, shadowColor: '#667eea', shadowOpacity: 0.10, shadowRadius: 8, elevation: 4, padding: 18, flexDirection: 'row', alignItems: 'center' }
                  ]}
                  onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: item.id, navigation })}
                  activeOpacity={0.92}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#22194f', marginBottom: 2 }}>Order #{item.id}</Text>
                    <Text style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Placed on {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</Text>
                    {item.printJobs && item.printJobs.length > 0 ? (
                      item.printJobs.map((pj) => (
                        <Text key={pj.id} style={{ color: '#333', fontSize: 14 }}>• {getDisplayFileName(pj.file)} ({pj.file?.pages || 0} pages)</Text>
                      ))
                    ) : (
                      <Text style={{ color: '#333', fontSize: 14 }}>No files</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      {getStatusIcon(item.status)}
                      <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold', marginLeft: 6 }}>{getStatusText(item.status)}</Text>
                    </View>
                    <Text style={{ color: '#764ba2', fontWeight: 'bold', fontSize: 16 }}>₹{item.totalAmount}</Text>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            )}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No orders found.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  filtersContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  filtersContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#e0eafc',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  filterText: {
    fontSize: 15,
    marginRight: 8,
  },
  filterCount: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
  },
  filterCountText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: 'bold',
  },
  orderCard: {
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#667eea',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

