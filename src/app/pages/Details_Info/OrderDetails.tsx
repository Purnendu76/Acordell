import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: {
    src?: string;
  };
}

interface Order {
  id: number;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
  };
  line_items: OrderItem[];
  meta_data: {
    key: string;
    value: string;
  }[];
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&auto=format&fit=crop&q=80';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Order[]>('https://n8n.srv917960.hstgr.cloud/webhook/acordell-get-orders');
      if (Array.isArray(response.data)) {
        const found = response.data.find(o => String(o.id) === String(id));
        if (found) {
          setOrder(found);
        } else {
          setError(`Order #${id} not found.`);
        }
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOrderDetails();
    }
  }, [id, fetchOrderDetails]);

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getTrackingStepIndex = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 0;
      case 'on-hold':
        return 1;
      case 'processing':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818cf8" />
        <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
        <ThemedText style={styles.errorText}>{error || 'Failed to retrieve order.'}</ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const trackingIndex = getTrackingStepIndex(order.status);
  const steps = ['Ordered', 'Processing', 'In Transit', 'Delivered'];
  const deliveryDateMeta = order.meta_data.find(m => m.key === 'Delivery Date');
  const deliveryTimeMeta = order.meta_data.find(m => m.key === 'Delivery Time Slot');

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerIconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Status & Date */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <ThemedText style={styles.orderIdText}>Order #{order.id}</ThemedText>
              <ThemedText style={styles.dateText}>{formatOrderDate(order.date_created)}</ThemedText>
            </View>
            <View style={[
              styles.statusBadge,
              order.status.toLowerCase() === 'completed' && styles.statusDelivered,
              (order.status.toLowerCase() === 'cancelled' || order.status.toLowerCase() === 'failed') && styles.statusCancelled,
              (order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'on-hold' || order.status.toLowerCase() === 'processing') && styles.statusActive
            ]}>
              <ThemedText style={[
                styles.statusBadgeText,
                order.status.toLowerCase() === 'completed' && styles.statusTextDelivered,
                (order.status.toLowerCase() === 'cancelled' || order.status.toLowerCase() === 'failed') && styles.statusTextCancelled,
                (order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'on-hold' || order.status.toLowerCase() === 'processing') && styles.statusTextActive
              ]}>
                {order.status.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Tracking Timeline */}
        {order.status.toLowerCase() !== 'cancelled' && order.status.toLowerCase() !== 'failed' && (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Delivery Status</ThemedText>
            <View style={styles.timelineContainer}>
              {steps.map((step, idx) => {
                const isCompleted = idx <= trackingIndex;
                const isCurrent = idx === trackingIndex;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={styles.timelineLeftColumn}>
                      <View style={[
                        styles.timelineNode,
                        isCompleted && styles.timelineNodeCompleted,
                        isCurrent && styles.timelineNodeCurrent
                      ]}>
                        {isCompleted && (
                          <MaterialCommunityIcons name="check" size={12} color="#ffffff" />
                        )}
                      </View>
                      {idx < steps.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          idx < trackingIndex && styles.timelineLineCompleted
                        ]} />
                      )}
                    </View>
                    <View style={styles.timelineRightColumn}>
                      <ThemedText style={[
                        styles.timelineLabel,
                        isCompleted && styles.timelineLabelCompleted,
                        isCurrent && styles.timelineLabelCurrent
                      ]}>
                        {step}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Delivery Slot */}
        {deliveryDateMeta && (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Delivery Slot</ThemedText>
            <View style={styles.deliveryRow}>
              <MaterialCommunityIcons name="truck-delivery" size={22} color="#fbbf24" />
              <View style={styles.deliveryInfo}>
                <ThemedText style={styles.deliveryText}>Date: {deliveryDateMeta.value}</ThemedText>
                {deliveryTimeMeta && (
                  <ThemedText style={styles.deliverySubtext}>Time Slot: {deliveryTimeMeta.value}</ThemedText>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          <View style={styles.itemsList}>
            {order.line_items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Image
                  source={{ uri: item.image?.src || FALLBACK_IMAGE }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemName} numberOfLines={2}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemPrice}>
                    ₹{parseFloat(item.price.toString()).toLocaleString('en-IN')} x {item.quantity}
                  </ThemedText>
                </View>
                <ThemedText style={styles.itemSubtotal}>
                  ₹{(parseFloat(item.price.toString()) * item.quantity).toLocaleString('en-IN')}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Billing / Address */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#818cf8" />
            <View style={styles.addressContent}>
              <ThemedText style={styles.addressName}>
                {order.billing.first_name} {order.billing.last_name}
              </ThemedText>
              <ThemedText style={styles.addressTextLine}>
                {order.billing.address_1}
              </ThemedText>
              <ThemedText style={styles.addressTextLine}>
                {order.billing.city}, {order.billing.state} - {order.billing.postcode}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Price Breakdowns */}
        <View style={[styles.card, { marginBottom: 30 }]}>
          <ThemedText style={styles.sectionTitle}>Payment Details</ThemedText>
          <View style={styles.paymentMethodRow}>
            <ThemedText style={styles.paymentLabel}>Method:</ThemedText>
            <ThemedText style={styles.paymentValue}>{order.payment_method_title || 'Direct Payment'}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.priceValue}>₹{parseFloat(order.total).toLocaleString('en-IN')}</ThemedText>
          </View>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Shipping</ThemedText>
            <ThemedText style={[styles.priceValue, { color: '#10b981' }]}>FREE</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₹{parseFloat(order.total).toLocaleString('en-IN')}</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#818cf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161824',
    backgroundColor: '#0a0b10',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#161824',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#12131e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2133',
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusDelivered: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextDelivered: {
    color: '#10b981',
  },
  statusTextCancelled: {
    color: '#ef4444',
  },
  statusTextActive: {
    color: '#818cf8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1e2133',
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineNodeCompleted: {
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
  },
  timelineNodeCurrent: {
    backgroundColor: '#12131e',
    borderColor: '#818cf8',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1e2133',
    position: 'absolute',
    top: 20,
    bottom: -20,
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: '#818cf8',
  },
  timelineRightColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 2,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  timelineLabelCompleted: {
    color: '#ffffff',
  },
  timelineLabelCurrent: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  deliverySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemsList: {
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#161824',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemPrice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  addressTextLine: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  paymentValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e2133',
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  priceValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#818cf8',
  },
});
