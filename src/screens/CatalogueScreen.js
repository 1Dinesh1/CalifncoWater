import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { CATEGORIES, CATEGORY_META, PRODUCTS, formatPrice } from '../data/products';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import AuthModal from '../components/AuthModal';
import OrdersModal from '../components/OrdersModal';
import ServiceBookingModal from '../components/ServiceBookingModal';

// Standalone Top-Level Header Component to prevent remounting and maintain TextInput focus
function CatalogueHeader({
  totalCartCount,
  onOpenCart,
  onOpenOrders,
  onOpenBooking,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  filteredCount,
  onResetFilters,
  currentUser,
  onOpenAuth,
  onProfilePress,
}) {
  return (
    <View style={styles.headerContainer}>
      {/* Brand Header */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIconBox}>
            <Text style={styles.brandIcon}>💧</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Califnco Water</Text>
            <Text style={styles.brandTagline}>Pure & Safe Hydration Solutions</Text>
          </View>
        </View>

        {/* Header Actions Row (Orders + Auth + Cart) */}
        <View style={styles.headerActionsRow}>
          {/* Header Orders Button */}
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={onOpenOrders}
            activeOpacity={0.7}
            accessibilityLabel="My Orders"
          >
            <Text style={styles.ordersIcon}>📦</Text>
            <Text style={styles.ordersButtonText}>Orders</Text>
          </TouchableOpacity>

          {currentUser ? (
            <TouchableOpacity
              style={styles.authProfileButton}
              onPress={onProfilePress}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(currentUser.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userEmailColumn}>
                <Text style={styles.userEmailText} numberOfLines={1}>
                  {currentUser.email?.split('@')[0]}
                </Text>
                <Text style={styles.signOutText}>Account</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={onOpenAuth}
              activeOpacity={0.7}
            >
              <Text style={styles.signInIcon}>👤</Text>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}

          {/* Header Cart Icon Button */}
          <TouchableOpacity
            style={styles.cartIconButton}
            onPress={onOpenCart}
            activeOpacity={0.7}
          >
            <Text style={styles.cartIconText}>🛒</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Welcome Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroBadge}>
            {currentUser
              ? `CUSTOMER: ${currentUser.email?.split('@')[0].toUpperCase()}`
              : 'CERTIFIED WATER PURIFICATION'}
          </Text>
          <Text style={styles.heroHeading}>
            {currentUser ? 'Pure Water For Your Home' : 'Drink Pure. Live Healthy.'}
          </Text>
          <Text style={styles.heroSubtext}>
            {currentUser
              ? 'Browse genuine water purifiers, dispensers, replacement cartridges & accessories.'
              : 'Explore our genuine purifiers, dispensers, replacement cartridges & accessories.'}
          </Text>
          {currentUser && (
            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.heroOrdersPill}
                onPress={onOpenOrders}
                activeOpacity={0.8}
              >
                <Text style={styles.heroOrdersPillText}>📦 View Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroServicePill}
                onPress={onOpenBooking}
                activeOpacity={0.8}
              >
                <Text style={styles.heroServicePillText}>🛠️ Book Service</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.heroIllustration}>🚰</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search purifiers, filters, dispensers..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.searchClearBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Service Booking Quick Promo Banner */}
      <View style={styles.servicePromoSection}>
        <TouchableOpacity
          style={styles.servicePromoCard}
          onPress={onOpenBooking}
          activeOpacity={0.85}
        >
          <View style={styles.servicePromoLeft}>
            <View style={styles.servicePromoIconBox}>
              <Text style={styles.servicePromoIcon}>🛠️</Text>
            </View>
            <View style={styles.servicePromoTextCol}>
              <View style={styles.servicePromoBadgeRow}>
                <Text style={styles.servicePromoBadge}>DOORSTEP SERVICE</Text>
              </View>
              <Text style={styles.servicePromoTitle}>Water Purifier Service & Repair</Text>
              <Text style={styles.servicePromoSubtitle}>
                Installation • Filter Replacement • Maintenance
              </Text>
            </View>
          </View>
          <View style={styles.servicePromoButton}>
            <Text style={styles.servicePromoButtonText}>Book Now →</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionLabel}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsList}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORY_META[cat] || CATEGORY_META.All;
            const count = categoryCounts[cat] || 0;

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryPillIcon}>{meta.icon}</Text>
                <Text
                  style={[
                    styles.categoryPillLabel,
                    isSelected && styles.categoryPillLabelActive,
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.categoryCountBadge,
                    isSelected && styles.categoryCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryCountText,
                      isSelected && styles.categoryCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCountText}>
          {filteredCount === 1
            ? '1 Product Available'
            : `${filteredCount} Products Available`}
        </Text>
        {(selectedCategory !== 'All' || searchQuery.trim().length > 0) && (
          <TouchableOpacity onPress={onResetFilters} activeOpacity={0.7}>
            <Text style={styles.resetFiltersText}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Standalone Empty State Component
function EmptyResults({ searchQuery, onResetFilters }) {
  return (
    <View style={styles.emptyResultsContainer}>
      <Text style={styles.emptyResultsIcon}>🔎</Text>
      <Text style={styles.emptyResultsTitle}>No products found</Text>
      <Text style={styles.emptyResultsSubtitle}>
        {searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try checking the spelling or searching another category.`
          : 'No products in this category at the moment.'}
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={onResetFilters}
        activeOpacity={0.8}
      >
        <Text style={styles.resetButtonText}>View All Products</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CatalogueScreen() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [cartModalVisible, setCartModalVisible] = useState(false);

  // Track Firebase customer authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleProfilePress = () => {
    Alert.alert(
      'Customer Account',
      `Signed in as: ${currentUser?.email || 'Customer'}`,
      [
        {
          text: 'Book a Service',
          onPress: () => setBookingModalVisible(true),
        },
        {
          text: 'My Orders',
          onPress: () => setOrdersModalVisible(true),
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (err) {
              Alert.alert('Sign Out Error', err?.message || 'Failed to sign out.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Cart operations
  const handleAddToCart = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleIncrement = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      if (currentQty <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: currentQty - 1,
      };
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Cart metrics
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return sum + (product?.price || 0) * qty;
    }, 0);
  }, [cart]);

  // Product counts per category for filter pills
  const categoryCounts = useMemo(() => {
    const counts = { All: PRODUCTS.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = PRODUCTS.filter((p) => p.category === cat).length;
    });
    return counts;
  }, []);

  // Filtered products based on search query & selected category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.specifications &&
          product.specifications.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantity={cart[item.id] || 0}
            onAddToCart={handleAddToCart}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        )}
        ListHeaderComponent={
          <CatalogueHeader
            totalCartCount={totalCartCount}
            onOpenCart={() => setCartModalVisible(true)}
            onOpenOrders={() => setOrdersModalVisible(true)}
            onOpenBooking={() => setBookingModalVisible(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            filteredCount={filteredProducts.length}
            onResetFilters={handleResetFilters}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalVisible(true)}
            onProfilePress={handleProfilePress}
          />
        }
        ListEmptyComponent={
          <EmptyResults
            searchQuery={searchQuery}
            onResetFilters={handleResetFilters}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          totalCartCount > 0 && styles.listContentWithCartBar,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={styles.bottomCartBar}>
          <View style={styles.bottomCartInfo}>
            <View style={styles.bottomCartCountBadge}>
              <Text style={styles.bottomCartCountText}>🛒 {totalCartCount}</Text>
            </View>
            <View style={styles.bottomCartPriceGroup}>
              <Text style={styles.bottomCartTotalLabel}>Total Amount</Text>
              <Text style={styles.bottomCartTotalPrice}>
                {formatPrice(totalCartAmount)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewCartButtonText}>View Cart</Text>
            <Text style={styles.viewCartArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Shopping Cart Modal */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        cart={cart}
        products={PRODUCTS}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalVisible(true)}
      />

      {/* Customer Authentication Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* Customer Orders Modal */}
      <OrdersModal
        visible={ordersModalVisible}
        onClose={() => setOrdersModalVisible(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalVisible(true)}
      />

      {/* Customer Service Booking Modal */}
      <ServiceBookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentWithCartBar: {
    paddingBottom: 90,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '600',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ordersIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  ordersButtonText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  signInIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  signInButtonText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
  },
  authProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: 110,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  userEmailColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  userEmailText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: 65,
  },
  signOutText: {
    fontSize: 8,
    color: '#0284c7',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cartIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIconText: {
    fontSize: 18,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  heroContent: {
    flex: 1,
    marginRight: 12,
  },
  heroBadge: {
    color: '#bae6fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  heroSubtext: {
    color: '#e0f2fe',
    fontSize: 12,
    lineHeight: 16,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  heroOrdersPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroOrdersPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroServicePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  heroServicePillText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroIllustration: {
    fontSize: 42,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  servicePromoSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  servicePromoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  servicePromoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  servicePromoIcon: {
    fontSize: 18,
  },
  servicePromoTextCol: {
    flex: 1,
  },
  servicePromoBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  servicePromoBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  servicePromoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 16,
  },
  servicePromoSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  servicePromoButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  servicePromoButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 6,
  },
  searchClearText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  categoriesSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  categoryPillsList: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  categoryPillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryPillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginRight: 6,
  },
  categoryPillLabelActive: {
    color: '#ffffff',
  },
  categoryCountBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountBadgeActive: {
    backgroundColor: '#0369a1',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  categoryCountTextActive: {
    color: '#ffffff',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  resetFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyResultsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyResultsSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  resetButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bottomCartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomCartCountBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bottomCartCountText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomCartPriceGroup: {
    flexDirection: 'column',
  },
  bottomCartTotalLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bottomCartTotalPrice: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  viewCartButton: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewCartButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  viewCartArrow: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
