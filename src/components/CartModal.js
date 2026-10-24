import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../data/products';

export default function CartModal({
  visible,
  onClose,
  cart,
  products,
  onIncrement,
  onDecrement,
  onClearCart,
  currentUser = null,
  onOpenAuth,
}) {
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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

  const handleModalClose = () => {
    setIsCheckout(false);
    setCheckoutError('');
    onClose();
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

  const handleProceedToCheckout = () => {
    if (cartEntries.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding to checkout.');
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create a customer account to place your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => {
              handleModalClose();
              if (onOpenAuth) onOpenAuth();
            },
          },
        ]
      );
      return;
    }

    // Prefill name from email if empty
    if (!customerName && currentUser.email) {
      const emailName = currentUser.email.split('@')[0];
      setCustomerName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }

    setCheckoutError('');
    setIsCheckout(true);
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedName) {
      setCheckoutError('Please enter your full name.');
      return;
    }

    if (!trimmedPhone) {
      setCheckoutError('Please enter your contact phone number.');
      return;
    }

    // Basic 10-digit phone validation
    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setCheckoutError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!trimmedAddress) {
      setCheckoutError('Please enter your complete delivery address.');
      return;
    }

    if (trimmedAddress.length < 8) {
      setCheckoutError('Please provide a more detailed address (e.g. House No., Street, City, PIN).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order payload strictly conforming to Firestore security rules
      const orderPayload = {
        userId: currentUser.uid,
        customerEmail: currentUser.email || '',
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        deliveryAddress: trimmedAddress,
        items: cartEntries.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          category: item.product.category,
          unitPrice: item.product.price,
          quantity: item.quantity,
          itemSubtotal: item.subtotal,
        })),
        totalItems: totalQuantity,
        totalAmount: totalAmount,
        orderStatus: 'placed',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      // Successfully saved to Cloud Firestore
      setIsSubmitting(false);
      onClearCart(); // Clear cart only after confirmed save
      setIsCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      onClose();

      Alert.alert(
        'Order Placed Successfully! 🎉',
        `Thank you for choosing Califnco Water!\n\nOrder ID: ${docRef.id}\nPayment: Cash on Delivery\nTotal Amount: ${formatPrice(totalAmount)}\n\nOur team will contact you at ${trimmedPhone} before dispatch.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      setIsSubmitting(false);
      const friendlyError = err?.message || 'Failed to place order. Please check your connection and try again.';
      setCheckoutError(friendlyError);
      Alert.alert('Order Failed', friendlyError);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {isCheckout && (
              <TouchableOpacity
                onPress={() => setIsCheckout(false)}
                style={styles.backButton}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.backButtonArrow}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
              {isCheckout ? 'Checkout' : 'Shopping Cart'}
            </Text>
            {!isCheckout && totalQuantity > 0 && (
              <View style={styles.headerCountBadge}>
                <Text style={styles.headerCountText}>{totalQuantity}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {!isCheckout && totalQuantity > 0 && (
              <TouchableOpacity
                onPress={handleClearConfirm}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleModalClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content: Cart Items or Checkout Form */}
        {cartEntries.length === 0 && !isCheckout ? (
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
              onPress={handleModalClose}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse Catalogue</Text>
            </TouchableOpacity>
          </View>
        ) : isCheckout ? (
          /* Checkout Form View */
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Customer Account Context Banner */}
            <View style={styles.customerContextCard}>
              <View style={styles.customerContextRow}>
                <Text style={styles.customerAvatarIcon}>👤</Text>
                <View style={styles.customerContextTextGroup}>
                  <Text style={styles.customerContextLabel}>Ordering Account</Text>
                  <Text style={styles.customerContextEmail}>
                    {currentUser?.email || 'Authenticated Customer'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method Badge */}
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodHeader}>
                <Text style={styles.paymentMethodIcon}>💵</Text>
                <View>
                  <Text style={styles.paymentMethodTitle}>Cash on Delivery (COD)</Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Pay cash upon delivery at your doorstep
                  </Text>
                </View>
              </View>
              <View style={styles.codTag}>
                <Text style={styles.codTagText}>FREE DELIVERY INCLUDED</Text>
              </View>
            </View>

            {/* Error Banner */}
            {checkoutError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{checkoutError}</Text>
              </View>
            ) : null}

            {/* Delivery Details Form */}
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Delivery Details</Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor="#94a3b8"
                  value={customerName}
                  onChangeText={(text) => {
                    setCustomerName(text);
                    if (checkoutError) setCheckoutError('');
                  }}
                  editable={!isSubmitting}
                />
              </View>

              {/* Contact Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94a3b8"
                  value={customerPhone}
                  onChangeText={(text) => {
                    setCustomerPhone(text);
                    if (checkoutError) setCheckoutError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!isSubmitting}
                />
              </View>

              {/* Delivery Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Address (Full Address & Pincode) *</Text>
                <TextInput
                  style={[styles.textInput, styles.addressInput]}
                  placeholder="House/Flat No., Street, Landmark, City, Pincode"
                  placeholderTextColor="#94a3b8"
                  value={deliveryAddress}
                  onChangeText={(text) => {
                    setDeliveryAddress(text);
                    if (checkoutError) setCheckoutError('');
                  }}
                  multiline={true}
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Order Items Preview */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              {cartEntries.map(({ product, quantity, subtotal }) => (
                <View key={product.id} style={styles.checkoutItemRow}>
                  <Text style={styles.checkoutItemName} numberOfLines={1}>
                    {product.name} × {quantity}
                  </Text>
                  <Text style={styles.checkoutItemPrice}>{formatPrice(subtotal)}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Total Items: {totalQuantity}
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
                  <Text style={styles.taxInclusiveText}>Pay with Cash on Delivery</Text>
                </View>
                <Text style={styles.grandTotalValue}>{formatPrice(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Standard Cart Items View */
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

        {/* Sticky Action Footer */}
        {cartEntries.length > 0 && (
          <View style={styles.footerBar}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerPrice}>{formatPrice(totalAmount)}</Text>
            </View>

            {isCheckout ? (
              <TouchableOpacity
                style={[styles.checkoutButton, isSubmitting && styles.checkoutButtonDisabled]}
                onPress={handlePlaceOrder}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.checkoutButtonText}>Placing Order...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.checkoutButtonText}>Confirm Order (COD)</Text>
                    <Text style={styles.checkoutArrow}>✓</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleProceedToCheckout}
                activeOpacity={0.8}
              >
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                <Text style={styles.checkoutArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
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
  backButton: {
    paddingRight: 10,
    paddingVertical: 2,
  },
  backButtonArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284c7',
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
  customerContextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  customerContextTextGroup: {
    flex: 1,
  },
  customerContextLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  customerContextEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentMethodCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#15803d',
  },
  codTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 14,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  addressInput: {
    height: 75,
    textAlignVertical: 'top',
  },
  checkoutItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkoutItemName: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  checkoutItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
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
    marginBottom: 14,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#93c5fd',
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
