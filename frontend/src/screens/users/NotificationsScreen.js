import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

// Dummy notification data
const dummyNotifications = [
  {
    id: 1,
    title: 'Order #12345 Completed',
    message: 'Your print order has been completed and is ready for pickup.',
    time: '2 hours ago',
    type: 'success',
    read: false,
  },
  {
    id: 2,
    title: 'Payment Confirmed',
    message: 'Your payment of ₹150 has been successfully processed.',
    time: '1 day ago',
    type: 'info',
    read: false,
  },
  {
    id: 3,
    title: 'Order #12344 Shipped',
    message: 'Your order has been shipped and will arrive within 2-3 business days.',
    time: '2 days ago',
    type: 'info',
    read: true,
  },
  {
    id: 4,
    title: 'Special Offer',
    message: 'Get 20% off on your next order! Use code SAVE20 at checkout.',
    time: '3 days ago',
    type: 'promo',
    read: true,
  },
  {
    id: 5,
    title: 'Order #12343 Delivered',
    message: 'Your order has been successfully delivered. Thank you for choosing LipiPrint!',
    time: '1 week ago',
    type: 'success',
    read: true,
  },
];

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState(dummyNotifications);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'info':
        return 'info';
      case 'promo':
        return 'local-offer';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'info':
        return '#2196F3';
      case 'promo':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="notifications-none" size={64} color="#ccc" />
            <Text style={[styles.emptyText, { color: theme.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              You'll see updates about your orders and offers here
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <Animatable.View
              key={notification.id}
              animation="fadeInUp"
              delay={index * 100}
              duration={500}
              style={[
                styles.notificationCard,
                { backgroundColor: theme.card },
                !notification.read && styles.unreadCard
              ]}
            >
              <TouchableOpacity
                style={styles.notificationContent}
                onPress={() => markAsRead(notification.id)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.notificationText}>
                    <Text style={[styles.notificationTitle, { color: theme.text }]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
                      {notification.message}
                    </Text>
                  </View>
                  <View style={styles.notificationMeta}>
                    <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                      {notification.time}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: -30,
  },
  headerRight: {
    width: 30,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationMeta: {
    alignItems: 'flex-end',
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
}); 