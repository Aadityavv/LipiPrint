import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function ShipmentManagementScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedAwbs, setSelectedAwbs] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [ndrData, setNdrData] = useState(null);
  const [showNdrModal, setShowNdrModal] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      // This would fetch shipments with AWB numbers from orders
      const response = await api.request('/api/orders?status=SHIPPED,OUT_FOR_DELIVERY,DELIVERED');
      setShipments(response.filter(order => order.awbNumber));
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      Alert.alert('Error', 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const generateManifest = async () => {
    if (selectedAwbs.length === 0) {
      Alert.alert('No Selection', 'Please select at least one shipment to generate manifest.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.request('/api/shipping/manifest', {
        method: 'POST',
        body: JSON.stringify({ awb_numbers: selectedAwbs })
      });
      
      Alert.alert(
        'Manifest Generated', 
        'Manifest has been generated successfully. Check your email for the download link.',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Failed to generate manifest:', error);
      Alert.alert('Error', 'Failed to generate manifest');
    } finally {
      setLoading(false);
    }
  };

  const createBulkShipments = async () => {
    // This would be used for bulk shipment creation
    Alert.alert(
      'Bulk Shipments',
      'This feature allows you to create multiple shipments at once. Select orders and create shipments in bulk.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Bulk', onPress: () => {
          // Navigate to bulk creation screen
          navigation.navigate('BulkShipmentScreen');
        }}
      ]
    );
  };

  const getNDRReport = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const response = await api.request('/api/shipping/ndr', {
        method: 'POST',
        body: JSON.stringify({
          start_date: weekAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0]
        })
      });
      
      setNdrData(response);
      setShowNdrModal(true);
    } catch (error) {
      console.error('Failed to get NDR report:', error);
      Alert.alert('Error', 'Failed to get NDR report');
    } finally {
      setLoading(false);
    }
  };

  const initiateReturn = async (awbNumber) => {
    Alert.prompt(
      'Initiate Return',
      'Enter reason for return:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Initiate', onPress: async (reason) => {
          if (!reason || reason.trim().length === 0) {
            Alert.alert('Error', 'Please enter a reason for return');
            return;
          }
          
          setLoading(true);
          try {
            await api.request('/api/shipping/return', {
              method: 'POST',
              body: JSON.stringify({
                awb_number: awbNumber,
                return_reason: reason,
                return_address: 'Near Civil Court Sadar, Thana Road, Saharanpur, Uttar Pradesh 247001'
              })
            });
            
            Alert.alert('Success', 'Return initiated successfully');
          } catch (error) {
            console.error('Failed to initiate return:', error);
            Alert.alert('Error', 'Failed to initiate return');
          } finally {
            setLoading(false);
          }
        }}
      ],
      'plain-text'
    );
  };

  const toggleAwbSelection = (awbNumber) => {
    setSelectedAwbs(prev => 
      prev.includes(awbNumber) 
        ? prev.filter(awb => awb !== awbNumber)
        : [...prev, awbNumber]
    );
  };

  const selectAllAwbs = () => {
    const allAwbs = shipments.map(s => s.awbNumber);
    setSelectedAwbs(allAwbs);
  };

  const clearSelection = () => {
    setSelectedAwbs([]);
  };

  const renderFeatureCard = (title, description, icon, color, onPress, disabled = false) => (
    <Animatable.View animation="fadeInUp" duration={500}>
      <TouchableOpacity
        style={[styles.featureCard, disabled && styles.disabledCard]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? ['#f5f5f5', '#f0f0f0'] : [color, color + '80']}
          style={styles.featureGradient}
        >
          <View style={styles.featureIcon}>
            <Icon name={icon} size={32} color={disabled ? '#999' : 'white'} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, disabled && styles.disabledText]}>{title}</Text>
            <Text style={[styles.featureDescription, disabled && styles.disabledText]}>{description}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <Heading
          title="Shipment Management"
          subtitle="Manage shipments with NimbusPost"
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Shipment Features</Text>
          
          {renderFeatureCard(
            'Generate Manifest',
            'Create manifest for selected shipments',
            'description',
            '#4CAF50',
            generateManifest,
            selectedAwbs.length === 0
          )}
          
          {renderFeatureCard(
            'Bulk Shipments',
            'Create multiple shipments at once',
            'add-shopping-cart',
            '#2196F3',
            createBulkShipments
          )}
          
          {renderFeatureCard(
            'NDR Report',
            'View Non-Delivery Reports',
            'report-problem',
            '#FF9800',
            getNDRReport
          )}
          
          {renderFeatureCard(
            'Detailed Rates',
            'Get detailed shipping rates',
            'attach-money',
            '#9C27B0',
            () => {
              Alert.prompt(
                'Get Detailed Rates',
                'Enter delivery pincode:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Get Rates', onPress: async (pincode) => {
                    if (!pincode || pincode.length !== 6) {
                      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
                      return;
                    }
                    
                    setLoading(true);
                    try {
                      const response = await api.request('/api/shipping/detailed-rates', {
                        method: 'POST',
                        body: JSON.stringify({
                          pickup_pincode: '247001',
                          delivery_pincode: pincode,
                          weight: 0.2,
                          payment_type: 'prepaid'
                        })
                      });
                      
                      Alert.alert(
                        'Detailed Rates',
                        `Rates for ${pincode}:\n${JSON.stringify(response, null, 2)}`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      console.error('Failed to get detailed rates:', error);
                      Alert.alert('Error', 'Failed to get detailed rates');
                    } finally {
                      setLoading(false);
                    }
                  }}
                ],
                'plain-text'
              );
            }
          )}
        </View>

        {/* Shipment Selection */}
        {shipments.length > 0 && (
          <View style={styles.selectionSection}>
            <View style={styles.selectionHeader}>
              <Text style={styles.sectionTitle}>Select Shipments</Text>
              <View style={styles.selectionActions}>
                <TouchableOpacity onPress={selectAllAwbs} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearSelection} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {shipments.map((shipment, index) => (
              <Animatable.View
                key={shipment.id}
                animation="slideInRight"
                delay={index * 100}
                duration={400}
                style={styles.shipmentCard}
              >
                <TouchableOpacity
                  style={[
                    styles.shipmentItem,
                    selectedAwbs.includes(shipment.awbNumber) && styles.selectedShipment
                  ]}
                  onPress={() => toggleAwbSelection(shipment.awbNumber)}
                >
                  <View style={styles.shipmentInfo}>
                    <Text style={styles.awbNumber}>AWB: {shipment.awbNumber}</Text>
                    <Text style={styles.orderInfo}>Order #{shipment.id}</Text>
                    <Text style={styles.courierInfo}>
                      {shipment.courierName || 'NimbusPost'} • {shipment.status}
                    </Text>
                  </View>
                  
                  <View style={styles.shipmentActions}>
                    <Icon
                      name={selectedAwbs.includes(shipment.awbNumber) ? "check-box" : "check-box-outline-blank"}
                      size={24}
                      color={selectedAwbs.includes(shipment.awbNumber) ? "#4CAF50" : "#999"}
                    />
                    <TouchableOpacity
                      onPress={() => initiateReturn(shipment.awbNumber)}
                      style={styles.returnButton}
                    >
                      <Icon name="undo" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>

      {/* NDR Modal */}
      {showNdrModal && ndrData && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NDR Report</Text>
            <ScrollView style={styles.ndrContent}>
              <Text style={styles.ndrText}>{JSON.stringify(ndrData, null, 2)}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNdrModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  featureGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  disabledText: {
    color: '#999',
  },
  selectionSection: {
    marginBottom: 30,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  shipmentCard: {
    marginBottom: 12,
  },
  shipmentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedShipment: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  shipmentInfo: {
    flex: 1,
  },
  awbNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courierInfo: {
    fontSize: 12,
    color: '#999',
  },
  shipmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: width - 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  ndrContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  ndrText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
