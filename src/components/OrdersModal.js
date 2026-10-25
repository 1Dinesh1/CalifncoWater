import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../data/products';

/**
 * Format Firestore Timestamp, Date, or numeric millisecond timestamp
 * into a customer-friendly Indian date & time string.
 */
function formatOrderDate(timestamp) {
  if (!timestamp) return 'Recent order';
  let dateObj = null;

  try {
    if (typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (timestamp.seconds != null) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    }
  } catch {
    return 'Recent order';
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Recent order';
  }

  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return status badge styling & label based on orderStatus string
 */
function getOrderStatusMeta(status = 'placed') {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'placed':
      return {
        label: 'Order Placed',
        badgeStyle: styles.badgePlaced,
        textStyle: styles.badgePlacedText,
        dotColor: '#0284c7',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        badgeStyle: styles.badgeConfirmed,
        textStyle: styles.badgeConfirmedText,
        dotColor: '#2563eb',
      };
    case 'dispatched':
    case 'shipped':
      return {
        label: 'Dispatched',
        badgeStyle: styles.badgeDispatched,
        textStyle: styles.badgeDispatchedText,
        dotColor: '#d97706',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        badgeStyle: styles.badgeDelivered,
        textStyle: styles.badgeDeliveredText,
        dotColor: '#16a34a',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeStyle: styles.badgeCancelled,
        textStyle: styles.badgeCancelledText,
        dotColor: '#dc2626',
      };
    default:
      return {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Processing',
        badgeStyle: styles.badgeDefault,
        textStyle: styles.badgeDefaultText,
        dotColor: '#64748b',
      };
  }
}

/**
 * Render an individual order card (read-only)
 */
function OrderCard({ order }) {
  const statusMeta = getOrderStatusMeta(order.orderStatus);
  const formattedDate = formatOrderDate(order.createdAt);
  const shortenedId = order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : '#ORDER';
  const paymentMethodLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || 'COD');
  const isPaymentPending = (order.paymentStatus || 'pending').toLowerCase() === 'pending';
  const isWholesale = order.orderType === 'wholesale';

  return (
    <View style={styles.orderCard}>
      {/* Top Header: Order ID & Date */}
      <View style={styles.orderCardHeader}>
        <View style={styles.orderIdGroup}>
          <Text style={styles.orderIdPrefix}>Order ID:</Text>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>{shortenedId}</Text>
          </View>
          {isWholesale && (
            <View style={styles.wholesaleBadge}>
              <Text style={styles.wholesaleBadgeText}>🏢 WHOLESALE</Text>
            </View>
          )}
        </View>
        <Text style={styles.orderDateText}>{formattedDate}</Text>
      </View>

      {/* Wholesale Business Name Banner */}
      {isWholesale && order.businessName ? (
        <View style={styles.businessNameBanner}>
          <Text style={styles.businessNameIcon}>🏢</Text>
          <Text style={styles.businessNameText} numberOfLines={1}>
            Dealership: {order.businessName}
          </Text>
        </View>
      ) : null}

      {/* Badges Row: Order Status & Payment Status */}
      <View style={styles.badgesRow}>
        <View style={[styles.statusBadge, statusMeta.badgeStyle]}>
          <View style={[styles.statusDot, { backgroundColor: statusMeta.dotColor }]} />
          <Text style={[styles.statusBadgeText, statusMeta.textStyle]}>
            {statusMeta.label}
          </Text>
        </View>

        <View
          style={[
            styles.paymentBadge,
            isPaymentPending ? styles.paymentPendingBadge : styles.paymentPaidBadge,
          ]}
        >
          <Text
            style={[
              styles.paymentBadgeText,
              isPaymentPending ? styles.paymentPendingText : styles.paymentPaidText,
            ]}
          >
            {paymentMethodLabel} • {isPaymentPending ? 'Payment Pending' : 'Paid'}
          </Text>
        </View>
      </View>

      {/* Items Section */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsSectionTitle}>
          ITEMS ({order.totalItems || order.items?.length || 0})
        </Text>
        {Array.isArray(order.items) &&
          order.items.map((item, index) => (
            <View key={item.productId || `${order.id}-item-${index}`} style={styles.itemRow}>
              <View style={styles.itemBulletBox}>
                <Text style={styles.itemBullet}>💧</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name || 'Product'}
                </Text>
                <Text style={styles.itemQuantityPrice}>
                  Qty: {item.quantity} × {formatPrice(item.unitPrice || 0)}{isWholesale ? ' (Wholesale)' : ''}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {formatPrice(item.itemSubtotal != null ? item.itemSubtotal : (item.unitPrice || 0) * (item.quantity || 1))}
              </Text>
            </View>
          ))}
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Total Amount Row */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Total Order Amount</Text>
          <Text style={styles.totalMethodSubtext}>Pay on Delivery (COD)</Text>
        </View>
        <Text style={styles.totalAmountValue}>{formatPrice(order.totalAmount || 0)}</Text>
      </View>

      {/* Delivery Summary */}
      {(order.deliveryAddress || order.customerPhone) && (
        <View style={styles.deliveryBox}>
          <Text style={styles.deliveryBoxTitle}>DELIVERY ADDRESS</Text>
          {isWholesale && order.businessName ? (
            <Text style={styles.deliveryRecipient} numberOfLines={1}>
              🏢 {order.businessName}
            </Text>
          ) : null}
          {order.customerName ? (
            <Text style={styles.deliveryRecipient} numberOfLines={1}>
              {isWholesale ? 'Contact Person: ' : ''}{order.customerName}
            </Text>
          ) : null}
          {order.deliveryAddress ? (
            <Text style={styles.deliveryAddressText} numberOfLines={3}>
              {order.deliveryAddress}
            </Text>
          ) : null}
          {order.customerPhone ? (
            <Text style={styles.deliveryPhoneText}>
              Contact: {order.customerPhone}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function OrdersModal({
  visible,
  onClose,
  currentUser = null,
  onOpenAuth,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch orders from Cloud Firestore for the signed-in customer
  const fetchOrders = useCallback(async () => {
    if (!currentUser?.uid) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);

    try {
      // Query collection 'orders' filtered strictly by userId == auth.currentUser.uid
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort client-side descending by createdAt so newest orders appear first
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : 0;
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : 0;
        return timeB - timeA;
      });

      setOrders(fetchedOrders);
    } catch (err) {
      setError(err?.message || 'Failed to load your orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  // Fetch on modal open or user change
  useEffect(() => {
    if (visible && currentUser) {
      setLoading(true);
      fetchOrders();
    } else if (visible && !currentUser) {
      setOrders([]);
      setLoading(false);
    }
  }, [visible, currentUser, fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Modal Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>My Orders</Text>
            {currentUser && orders.length > 0 && (
              <View style={styles.headerCountBadge}>
                <Text style={styles.headerCountText}>{orders.length}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {currentUser && !loading && (
              <TouchableOpacity
                onPress={handleRefresh}
                style={styles.refreshButton}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Body State Views */}
        {!currentUser ? (
          // Guest State: Sign-in Required
          <View style={styles.stateCenterContainer}>
            <View style={styles.stateIconCircle}>
              <Text style={styles.stateIcon}>👤</Text>
            </View>
            <Text style={styles.stateTitle}>Sign In to View Your Orders</Text>
            <Text style={styles.stateSubtitle}>
              Please sign in with your Califnco Water customer account to view your past orders, delivery status, and order details.
            </Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionButtonText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        ) : loading && !refreshing ? (
          // Loading State
          <View style={styles.stateCenterContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Fetching your orders...</Text>
          </View>
        ) : error && orders.length === 0 ? (
          // Error State
          <View style={styles.stateCenterContainer}>
            <View style={[styles.stateIconCircle, styles.stateIconCircleError]}>
              <Text style={styles.stateIcon}>⚠️</Text>
            </View>
            <Text style={styles.stateTitle}>Unable to Load Orders</Text>
            <Text style={styles.stateSubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                setLoading(true);
                fetchOrders();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          // Empty State
          <View style={styles.stateCenterContainer}>
            <View style={styles.stateIconCircle}>
              <Text style={styles.stateIcon}>📦</Text>
            </View>
            <Text style={styles.stateTitle}>No Orders Placed Yet</Text>
            <Text style={styles.stateSubtitle}>
              You haven't placed any orders with this account yet. Browse our certified water purifiers and accessories to place your first order!
            </Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionButtonText}>Explore Catalogue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Orders List
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#0284c7']}
                tintColor="#0284c7"
              />
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerCountBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  headerCountText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdPrefix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 6,
  },
  orderIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  wholesaleBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  wholesaleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  businessNameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  businessNameIcon: {
    fontSize: 13,
  },
  businessNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgePlaced: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  badgePlacedText: {
    color: '#0284c7',
  },
  badgeConfirmed: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
  },
  badgeConfirmedText: {
    color: '#2563eb',
  },
  badgeDispatched: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  badgeDispatchedText: {
    color: '#b45309',
  },
  badgeDelivered: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  badgeDeliveredText: {
    color: '#15803d',
  },
  badgeCancelled: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  badgeCancelledText: {
    color: '#dc2626',
  },
  badgeDefault: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeDefaultText: {
    color: '#475569',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paymentPendingBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  paymentPendingText: {
    color: '#b45309',
  },
  paymentPaidBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  paymentPaidText: {
    color: '#16a34a',
  },
  itemsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  itemsSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemBulletBox: {
    marginRight: 8,
  },
  itemBullet: {
    fontSize: 13,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 18,
  },
  itemQuantityPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalMethodSubtext: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  deliveryBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deliveryBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deliveryRecipient: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  deliveryAddressText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 4,
  },
  deliveryPhoneText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  stateCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  stateIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateIconCircleError: {
    backgroundColor: '#fee2e2',
  },
  stateIcon: {
    fontSize: 34,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
