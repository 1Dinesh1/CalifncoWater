import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { formatPrice } from '../data/products';

export default function CartModal({
  visible,
  onClose,
  cart,
  products,
  onIncrement,
  onDecrement,
  onClearCart,
}) {
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  // Derive cart items list
  const cartEntries = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      return {
        product,
        quantity: qty,
        subtotal: (product?.price || 0) * qty,
      };
    })
    .filter((item) => item.product != null);

  const totalQuantity = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartEntries.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckoutPress = () => {
    setCheckoutNotice(true);
  };

  const handleClearConfirm = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearCart },
      ]
    );
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
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            {totalQuantity > 0 && (
              <View style={styles.headerCountBadge}>
                <Text style={styles.headerCountText}>{totalQuantity}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {totalQuantity > 0 && (
              <TouchableOpacity
                onPress={handleClearConfirm}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
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

        {/* Informational Checkout Notice banner when pressed */}
        {checkoutNotice && (
          <View style={styles.noticeBanner}>
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>📋 Milestone Note (M1)</Text>
              <Text style={styles.noticeText}>
                Order checkout and persistence will be activated in Milestone M3 (Orders & Dealer). Your in-session cart total is {formatPrice(totalAmount)}.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCheckoutNotice(false)}
              style={styles.noticeDismiss}
            >
              <Text style={styles.noticeDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content: Cart Items or Empty State */}
        {cartEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🛒</Text>
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore our range of water purifiers, dispensers, and replacement filters to add items.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse Catalogue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* List of Cart Items */}
            <View style={styles.itemsList}>
              {cartEntries.map(({ product, quantity, subtotal }) => (
                <View key={product.id} style={styles.cartItemRow}>
                  <View style={styles.itemIconBox}>
                    <Text style={styles.itemIcon}>{product.placeholderIcon || '💧'}</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.itemCategory}>{product.category}</Text>
                    <Text style={styles.itemUnitPrice}>
                      Unit: {formatPrice(product.price)}
                    </Text>

                    <View style={styles.itemSubtotalRow}>
                      <Text style={styles.itemSubtotalLabel}>Subtotal:</Text>
                      <Text style={styles.itemSubtotalValue}>
                        {formatPrice(subtotal)}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.itemStepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onDecrement(product.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.stepperValBox}>
                      <Text style={styles.stepperValText}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onIncrement(product.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Bill Summary Section */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Bill Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Items Subtotal ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </Text>
                <Text style={styles.summaryValue}>{formatPrice(totalAmount)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <View style={styles.freeDeliveryBadge}>
                  <Text style={styles.freeDeliveryText}>FREE</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryTotalRow}>
                <View>
                  <Text style={styles.grandTotalLabel}>Total Payable</Text>
                  <Text style={styles.taxInclusiveText}>Inclusive of all taxes</Text>
                </View>
                <Text style={styles.grandTotalValue}>{formatPrice(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Sticky Checkout Bottom Bar (only shown when cart has items) */}
        {cartEntries.length > 0 && (
          <View style={styles.footerBar}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerPrice}>{formatPrice(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckoutPress}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Order</Text>
              <Text style={styles.checkoutArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
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
  },
  headerCountBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  headerCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  noticeBanner: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeContent: {
    flex: 1,
    marginRight: 8,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  noticeDismiss: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  noticeDismissText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  itemsList: {
    marginBottom: 16,
  },
  cartItemRow: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemSubtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSubtotalLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    marginRight: 4,
  },
  itemSubtotalValue: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '800',
  },
  itemStepper: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepperValBox: {
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  freeDeliveryBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeDeliveryText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  taxInclusiveText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  footerBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'column',
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerPrice: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  checkoutButton: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  checkoutArrow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
