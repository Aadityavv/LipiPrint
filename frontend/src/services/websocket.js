import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userId) {
        return new Promise((resolve, reject) => {
            try {
                const socket = new SockJS('http://10.142.175.104:8082/ws');
                this.stompClient = Stomp.over(socket);

                this.stompClient.connect(
                    {},
                    (frame) => {
                        console.log('Connected to WebSocket:', frame);
                        this.connected = true;
                        this.reconnectAttempts = 0;
                        
                        // Subscribe to user-specific notifications
                        this.subscribeToNotifications(userId);
                        this.subscribeToOrderUpdates(userId);
                        this.subscribeToPrintJobUpdates(userId);
                        
                        resolve();
                    },
                    (error) => {
                        console.error('WebSocket connection error:', error);
                        this.connected = false;
                        this.handleReconnect(userId, resolve, reject);
                    }
                );
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                reject(error);
            }
        });
    }

    handleReconnect(userId, resolve, reject) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect(userId).then(resolve).catch(reject);
            }, 5000 * this.reconnectAttempts); // Exponential backoff
        } else {
            reject(new Error('Max reconnection attempts reached'));
        }
    }

    subscribeToNotifications(userId) {
        const endpoint = `/queue/notifications/${userId}`;
        console.log('[WEBSOCKET SUBSCRIBE]', endpoint);
        const subscription = this.stompClient.subscribe(
            endpoint,
            (message) => {
                try {
                    console.log('[WEBSOCKET MESSAGE]', { endpoint, message: message.body });
                    const notification = JSON.parse(message.body);
                    this.handleNotification(notification);
                } catch (error) {
                    console.error('Error parsing notification:', error);
                }
            }
        );
        this.subscriptions.set('notifications', subscription);
    }

    subscribeToOrderUpdates(userId) {
        const endpoint = `/queue/orders/${userId}`;
        console.log('[WEBSOCKET SUBSCRIBE]', endpoint);
        const subscription = this.stompClient.subscribe(
            endpoint,
            (message) => {
                try {
                    console.log('[WEBSOCKET MESSAGE]', { endpoint, message: message.body });
                    const orderUpdate = JSON.parse(message.body);
                    this.handleOrderUpdate(orderUpdate);
                } catch (error) {
                    console.error('Error parsing order update:', error);
                }
            }
        );
        this.subscriptions.set('orders', subscription);
    }

    subscribeToPrintJobUpdates(userId) {
        const endpoint = `/queue/printjobs/${userId}`;
        console.log('[WEBSOCKET SUBSCRIBE]', endpoint);
        const subscription = this.stompClient.subscribe(
            endpoint,
            (message) => {
                try {
                    console.log('[WEBSOCKET MESSAGE]', { endpoint, message: message.body });
                    const printJobUpdate = JSON.parse(message.body);
                    this.handlePrintJobUpdate(printJobUpdate);
                } catch (error) {
                    console.error('Error parsing print job update:', error);
                }
            }
        );
        this.subscriptions.set('printjobs', subscription);
    }

    handleNotification(notification) {
        // Emit event for React Native to handle
        if (this.onNotificationReceived) {
            this.onNotificationReceived(notification);
        }
        
        // You can also show a local notification here
        this.showLocalNotification(notification.title, notification.message);
    }

    handleOrderUpdate(orderUpdate) {
        if (this.onOrderUpdateReceived) {
            this.onOrderUpdateReceived(orderUpdate);
        }
    }

    handlePrintJobUpdate(printJobUpdate) {
        if (this.onPrintJobUpdateReceived) {
            this.onPrintJobUpdateReceived(printJobUpdate);
        }
    }

    showLocalNotification(title, message) {
        // This would integrate with React Native's notification system
        // For now, we'll just log it
        console.log('Local Notification:', { title, message });
        
        // You can integrate with react-native-push-notification here
        // PushNotification.localNotification({
        //     title: title,
        //     message: message,
        //     playSound: true,
        //     soundName: 'default',
        // });
    }

    disconnect() {
        if (this.stompClient) {
            // Unsubscribe from all subscriptions
            this.subscriptions.forEach((subscription) => {
                subscription.unsubscribe();
            });
            this.subscriptions.clear();
            
            // Disconnect from WebSocket
            this.stompClient.disconnect();
            this.stompClient = null;
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected && this.stompClient;
    }

    // Event handlers that can be set by components
    setOnNotificationReceived(handler) {
        this.onNotificationReceived = handler;
    }

    setOnOrderUpdateReceived(handler) {
        this.onOrderUpdateReceived = handler;
    }

    setOnPrintJobUpdateReceived(handler) {
        this.onPrintJobUpdateReceived = handler;
    }
}

export default new WebSocketService(); 