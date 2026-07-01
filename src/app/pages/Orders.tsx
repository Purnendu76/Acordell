import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, FlatList, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { router } from 'expo-router';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';

// Pulsing Skeleton loader block component
function Skeleton({ style }: { style: any }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[{ backgroundColor: '#26293b', borderRadius: 4 }, style, animatedStyle]} />;
}

// Skeleton view for the orders page matching orderCard dimensions
function OrdersSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.orderCard}>
          {/* Order Header Skeleton */}
          <View style={styles.orderHeader}>
            <View style={{ gap: 4 }}>
              <Skeleton style={{ width: 85, height: 13, borderRadius: 4 }} />
              <Skeleton style={{ width: 110, height: 10, borderRadius: 4, marginTop: 4 }} />
            </View>
            <Skeleton style={{ width: 70, height: 18, borderRadius: 4 }} />
          </View>

          {/* Order Items List Skeleton */}
          <View style={styles.itemsList}>
            <View style={styles.itemRow}>
              <Skeleton style={{ width: 50, height: 50, borderRadius: 6 }} />
              <View style={[styles.itemInfo, { gap: 6 }]}>
                <Skeleton style={{ width: 150, height: 13, borderRadius: 4 }} />
                <Skeleton style={{ width: 95, height: 11, borderRadius: 4, marginTop: 4 }} />
              </View>
            </View>
          </View>

          {/* Address Skeleton */}
          <View style={[styles.addressContainer, { gap: 6 }]}>
            <Skeleton style={{ width: 14, height: 14, borderRadius: 7 }} />
            <Skeleton style={{ width: '75%', height: 12, borderRadius: 4 }} />
          </View>

          {/* Order Footer Skeleton */}
          <View style={styles.orderFooter}>
            <Skeleton style={{ width: 100, height: 12, borderRadius: 4 }} />
            <Skeleton style={{ width: 80, height: 15, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

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

const TABS = ['Active', 'Completed', 'Cancelled'];

// Fallback image for items that don't have an image source
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&auto=format&fit=crop&q=80';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('Active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Order[]>('https://n8n.srv917960.hstgr.cloud/webhook/acordell-get-orders');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err?.message || 'Failed to fetch orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const getOrderStatusTab = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'on-hold':
      case 'processing':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
      case 'failed':
      case 'refunded':
      default:
        return 'Cancelled';
    }
  };

  const getTrackingStepIndex = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 0; // Ordered
      case 'on-hold':
        return 1; // Processing
      case 'processing':
        return 2; // In Transit
      case 'completed':
        return 3; // Delivered
      default:
        return 0;
    }
  };

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Memoize counts to avoid O(N) filters inside the tabs mapping loops on every render
  const tabCounts = useMemo(() => {
    const counts = { Active: 0, Completed: 0, Cancelled: 0 };
    orders.forEach(o => {
      const tab = getOrderStatusTab(o.status);
      if (tab === 'Active') counts.Active++;
      else if (tab === 'Completed') counts.Completed++;
      else if (tab === 'Cancelled') counts.Cancelled++;
    });
    return counts;
  }, [orders]);

  // Memoize filtered orders based on tab and search query
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesTab = getOrderStatusTab(order.status) === selectedTab;
      if (!matchesTab) return false;

      const matchesSearch =
        !query ||
        order.id.toString().includes(query) ||
        (order.billing?.first_name || '').toLowerCase().includes(query) ||
        (order.billing?.last_name || '').toLowerCase().includes(query) ||
        (order.line_items || []).some(
          (item) => (item.name || '').toLowerCase().includes(query)
        );

      return matchesSearch;
    });
  }, [orders, selectedTab, searchQuery]);

  const getDeliveryInfo = (order: Order) => {
    const deliveryDateMeta = order.meta_data.find(m => m.key === 'Delivery Date');
    const deliveryTimeMeta = order.meta_data.find(m => m.key === 'Delivery Time Slot');
    if (deliveryDateMeta) {
      return {
        date: deliveryDateMeta.value,
        time: deliveryTimeMeta ? deliveryTimeMeta.value : null
      };
    }
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search order ID, products, names..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab;
          const count = tabCounts[tab as keyof typeof tabCounts] || 0;
          return (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
            >
              <ThemedText style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab} ({count})
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Main Content */}
      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={() => fetchOrders()}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: order }) => {
            const trackingIndex = getTrackingStepIndex(order.status);
            const steps = ['Ordered', 'Processing', 'In Transit', 'Delivered'];
            const deliveryInfo = getDeliveryInfo(order);

            return (
              <Pressable
                onPress={() => router.push({ pathname: '/pages/Details_Info/OrderDetails', params: { id: order.id } })}
                style={styles.orderCard}
              >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <ThemedText style={styles.orderId}>Order #{order.id}</ThemedText>
                    <ThemedText style={styles.orderDate}>{formatOrderDate(order.date_created)}</ThemedText>
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

                {/* Order Items */}
                <View style={styles.itemsList}>
                  {order.line_items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Image
                        source={{ uri: item.image?.src || FALLBACK_IMAGE }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemInfo}>
                        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                        <ThemedText style={styles.itemMeta}>
                          Qty: {item.quantity}  •  ₹{parseFloat(item.price.toString()).toLocaleString('en-IN')}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Tracking / Progress Bar (Only for Active Orders) */}
                {selectedTab === 'Active' && (
                  <View style={styles.trackingContainer}>
                    <ThemedText style={styles.trackingTitle}>Status Tracker</ThemedText>
                    <View style={styles.progressBarWrapper}>
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= trackingIndex;
                        const isCurrent = idx === trackingIndex;
                        return (
                          <View key={step} style={styles.progressStepContainer}>
                            <View style={styles.progressNodeLineWrapper}>
                              {idx > 0 && (
                                <View style={[
                                  styles.progressLine,
                                  idx <= trackingIndex ? styles.progressLineCompleted : null
                                ]} />
                              )}
                              <View style={[
                                styles.progressNode,
                                isCompleted ? styles.progressNodeCompleted : null,
                                isCurrent ? styles.progressNodeCurrent : null
                              ]}>
                                {isCompleted && (
                                  <MaterialCommunityIcons name="check" size={10} color="#ffffff" />
                                )}
                              </View>
                            </View>
                            <ThemedText style={[
                              styles.progressLabel,
                              isCompleted ? styles.progressLabelCompleted : null,
                              isCurrent ? styles.progressLabelCurrent : null
                            ]}>
                              {step}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Delivery Slot info if available */}
                {deliveryInfo && (
                  <View style={styles.deliveryInfoRow}>
                    <MaterialCommunityIcons name="truck-delivery-outline" size={16} color="#fbbf24" style={styles.deliveryIcon} />
                    <View>
                      <ThemedText style={styles.deliveryInfoText}>
                        Delivery: {deliveryInfo.date}
                      </ThemedText>
                      {deliveryInfo.time && (
                        <ThemedText style={styles.deliveryTimeText}>
                          Slot: {deliveryInfo.time}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}

                {/* Billing Address snippet */}
                <View style={styles.addressContainer}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748b" />
                  <ThemedText style={styles.addressText} numberOfLines={1}>
                    Deliver to: {order.billing.first_name} {order.billing.last_name}, {order.billing.address_1}, {order.billing.city}
                  </ThemedText>
                </View>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <ThemedText style={styles.paymentMethod}>
                    Via: {order.payment_method_title || 'Payment gateway'}
                  </ThemedText>
                  <View style={styles.totalPriceRow}>
                    <ThemedText style={styles.totalLabel}>Total: </ThemedText>
                    <ThemedText style={styles.totalPrice}>₹{parseFloat(order.total).toLocaleString('en-IN')}</ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={54} color="#334155" />
              <ThemedText style={styles.emptyText}>No {selectedTab.toLowerCase()} orders found.</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10', // Dark premium background
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161824',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161824',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#818cf8', // Indigo highlights
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#12131e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2133',
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2133',
    paddingBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusDelivered: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextActive: {
    color: '#f59e0b',
  },
  statusTextDelivered: {
    color: '#10b981',
  },
  statusTextCancelled: {
    color: '#ef4444',
  },
  itemsList: {
    marginVertical: 12,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#161824',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  trackingContainer: {
    backgroundColor: '#161824',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#1e2133',
  },
  trackingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressStepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressNodeLineWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
    position: 'relative',
  },
  progressLine: {
    position: 'absolute',
    left: '-50%',
    right: '50%',
    height: 2,
    backgroundColor: '#26293b',
    top: 8,
    zIndex: 1,
  },
  progressLineCompleted: {
    backgroundColor: '#818cf8',
  },
  progressNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1c1e2e',
    borderWidth: 2,
    borderColor: '#26293b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  progressNodeCompleted: {
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
  },
  progressNodeCurrent: {
    borderColor: '#818cf8',
    backgroundColor: '#1c1e2e',
  },
  progressLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  progressLabelCompleted: {
    color: '#cbd5e1',
  },
  progressLabelCurrent: {
    color: '#818cf8',
    fontWeight: '600',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  deliveryIcon: {
    marginTop: 1,
  },
  deliveryInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  deliveryTimeText: {
    fontSize: 10,
    color: '#fef08a',
    marginTop: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2133',
  },
  addressText: {
    fontSize: 11,
    color: '#94a3b8',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e2133',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#64748b',
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#818cf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
});
