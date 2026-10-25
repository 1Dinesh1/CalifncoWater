import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  BackHandler,
  Animated,
  StatusBar as RNStatusBar,
} from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { CATEGORIES, CATEGORY_META, PRODUCTS, formatPrice, getProductPrice } from '../data/products';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import AuthModal from '../components/AuthModal';
import OrdersModal from '../components/OrdersModal';
import ServiceBookingModal from '../components/ServiceBookingModal';
import DealerApplyModal from '../components/DealerApplyModal';
import BottomNavBar from '../components/BottomNavBar';
import ImageLightboxModal from '../components/ImageLightboxModal';
import AccountScreen from './AccountScreen';
import { useTheme } from '../theme/ThemeContext';

// Standalone Top-Level Header Component to prevent remounting and maintain TextInput focus
function CatalogueHeader({
  totalCartCount,
  onOpenCart,
  onOpenBooking,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  filteredCount,
  onResetFilters,
  currentUser,
  isApprovedDealer = false,
  dealerBusinessName = '',
  theme,
  isDark,
}) {
  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Brand Header & Cart Button */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={[styles.brandIconBox, { backgroundColor: theme.primaryLight, borderColor: isDark ? theme.border : '#bae6fd' }]}>
            <Text style={styles.brandIcon}>💧</Text>
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>Califnco Water</Text>
            <Text style={[styles.brandTagline, { color: theme.textMuted }]}>Pure & Safe Hydration Solutions</Text>
          </View>
        </View>

        {/* Header Cart Icon Button */}
        <TouchableOpacity
          style={[styles.cartIconButton, { backgroundColor: theme.surfaceSubtle }]}
          onPress={onOpenCart}
          activeOpacity={0.7}
          accessibilityLabel="Shopping Cart"
        >
          <Text style={styles.cartIconText}>🛒</Text>
          {totalCartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.primaryDark, borderColor: theme.surface }]}>
              <Text style={styles.cartBadgeText}>
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dealer Wholesale Pricing Active Indicator Banner */}
      {isApprovedDealer && (
        <View
          style={[
            styles.dealerPricingIndicator,
            {
              backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
              borderColor: isDark ? '#059669' : '#86efac',
            },
          ]}
        >
          <View
            style={[
              styles.dealerIndicatorIconBox,
              { backgroundColor: isDark ? '#047857' : '#dcfce7' },
            ]}
          >
            <Text style={styles.dealerIndicatorIcon}>🏢</Text>
          </View>
          <View style={styles.dealerIndicatorTextCol}>
            <Text
              style={[
                styles.dealerIndicatorTitle,
                { color: isDark ? '#34d399' : '#166534' },
              ]}
            >
              Wholesale Pricing Active
            </Text>
            <Text
              style={[
                styles.dealerIndicatorSubtitle,
                { color: isDark ? '#a7f3d0' : '#15803d' },
              ]}
              numberOfLines={1}
            >
              {dealerBusinessName ? `${dealerBusinessName} • ` : ''}Authorized Trade Rates & Bulk Ordering
            </Text>
          </View>
        </View>
      )}

      {/* Hero Welcome Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? '#082f49' : '#0284c7',
            borderColor: isDark ? '#0284c7' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.heroContent}>
          <Text style={[styles.heroBadge, isApprovedDealer && styles.heroBadgeDealer]}>
            {isApprovedDealer
              ? `🏢 DEALER: ${(dealerBusinessName || currentUser?.email?.split('@')[0] || '').toUpperCase()}`
              : currentUser
              ? `CUSTOMER: ${currentUser.email?.split('@')[0].toUpperCase()}`
              : 'CERTIFIED WATER PURIFICATION'}
          </Text>
          <Text style={styles.heroHeading}>
            {isApprovedDealer
              ? 'Wholesale Catalogue & Bulk Ordering'
              : currentUser
              ? 'Pure Water For Your Home'
              : 'Drink Pure. Live Healthy.'}
          </Text>
          <Text style={styles.heroSubtext}>
            {isApprovedDealer
              ? 'Exclusive wholesale trade margins and multi-unit ordering enabled for your verified dealership.'
              : currentUser
              ? 'Browse genuine water purifiers, dispensers, replacement cartridges & accessories.'
              : 'Explore our genuine purifiers, dispensers, replacement cartridges & accessories.'}
          </Text>
        </View>
        <Text style={styles.heroIllustration}>🚰</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search purifiers, filters, dispensers..."
            placeholderTextColor={theme.textSubtle}
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
          style={[
            styles.servicePromoCard,
            {
              backgroundColor: isDark ? '#0a1d12' : '#f0fdf4',
              borderColor: isDark ? '#059669' : '#bbf7d0',
            },
          ]}
          onPress={onOpenBooking}
          activeOpacity={0.85}
        >
          <View style={styles.servicePromoLeft}>
            <View
              style={[
                styles.servicePromoIconBox,
                { backgroundColor: isDark ? '#064e3b' : '#dcfce7' },
              ]}
            >
              <Text style={styles.servicePromoIcon}>🛠️</Text>
            </View>
            <View style={styles.servicePromoTextCol}>
              <View style={styles.servicePromoBadgeRow}>
                <Text
                  style={[
                    styles.servicePromoBadge,
                    { color: isDark ? '#34d399' : '#16a34a' },
                  ]}
                >
                  DOORSTEP SERVICE
                </Text>
              </View>
              <Text style={[styles.servicePromoTitle, { color: theme.text }]}>
                Water Purifier Service & Repair
              </Text>
              <Text style={[styles.servicePromoSubtitle, { color: theme.textMuted }]}>
                Installation • Filter Replacement • Maintenance
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.servicePromoButton,
              { backgroundColor: isDark ? '#059669' : '#16a34a' },
            ]}
          >
            <Text style={styles.servicePromoButtonText}>Book Now →</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      <View style={styles.categoriesSection}>
        <Text style={[styles.sectionLabel, { color: theme.textSubtle }]}>Categories</Text>
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
                  {
                    backgroundColor: isSelected
                      ? theme.primaryDark
                      : isDark
                      ? theme.surfaceSubtle
                      : '#f8fafc',
                    borderColor: isSelected ? theme.primaryDark : theme.border,
                  },
                ]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryPillIcon}>{meta.icon}</Text>
                <Text
                  style={[
                    styles.categoryPillLabel,
                    {
                      color: isSelected ? '#ffffff' : theme.textMuted,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.categoryCountBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                        ? theme.border
                        : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryCountText,
                      { color: isSelected ? '#ffffff' : theme.textMuted },
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
        <Text style={[styles.resultsCountText, { color: theme.textMuted }]}>
          {filteredCount === 1
            ? '1 Product Available'
            : `${filteredCount} Products Available`}
        </Text>
        {(selectedCategory !== 'All' || searchQuery.trim().length > 0) && (
          <TouchableOpacity onPress={onResetFilters} activeOpacity={0.7}>
            <Text style={[styles.resetFiltersText, { color: theme.primary }]}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Standalone Empty State Component
function EmptyResults({ searchQuery, onResetFilters, theme }) {
  return (
    <View style={styles.emptyResultsContainer}>
      <Text style={styles.emptyResultsIcon}>🔎</Text>
      <Text style={[styles.emptyResultsTitle, { color: theme.text }]}>No products found</Text>
      <Text style={[styles.emptyResultsSubtitle, { color: theme.textMuted }]}>
        {searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try checking the spelling or searching another category.`
          : 'No products in this category at the moment.'}
      </Text>
      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: theme.primaryDark }]}
        onPress={onResetFilters}
        activeOpacity={0.8}
      >
        <Text style={styles.resetButtonText}>View All Products</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CatalogueScreen() {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'account'
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [dealerModalVisible, setDealerModalVisible] = useState(false);
  const [dealerStatus, setDealerStatus] = useState(null);
  const [dealerProfile, setDealerProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [cartModalVisible, setCartModalVisible] = useState(false);

  // Feature B: Lightbox Product State
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // Feature C: Restrained Bottom Cart Bar Animation
  const cartBarAnim = useRef(new Animated.Value(90)).current;

  // Track Firebase customer authentication state & dealer application status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user?.uid) {
        try {
          const snap = await getDoc(doc(db, 'dealers', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setDealerStatus(data?.status || 'pending');
            setDealerProfile(data || null);
          } else {
            setDealerStatus(null);
            setDealerProfile(null);
          }
        } catch {
          setDealerStatus(null);
          setDealerProfile(null);
        }
      } else {
        setDealerStatus(null);
        setDealerProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  // Strict check: only verified 'approved' dealers receive wholesale pricing
  const isApprovedDealer = Boolean(currentUser && dealerStatus === 'approved');
  const dealerBusinessName = dealerProfile?.businessName || '';

  // Android Hardware Back button handling
  useEffect(() => {
    const onHardwareBack = () => {
      // 1. Dismiss Lightbox viewer if active
      if (lightboxVisible) {
        setLightboxVisible(false);
        return true;
      }
      // 2. Dismiss active modals in order of precedence
      if (cartModalVisible) {
        setCartModalVisible(false);
        return true;
      }
      if (ordersModalVisible) {
        setOrdersModalVisible(false);
        return true;
      }
      if (bookingModalVisible) {
        setBookingModalVisible(false);
        return true;
      }
      if (dealerModalVisible) {
        setDealerModalVisible(false);
        return true;
      }
      if (authModalVisible) {
        setAuthModalVisible(false);
        return true;
      }
      // 3. If on Account tab, navigate smoothly back to Home
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      // 4. If on Home with no modals open, let standard Android back action occur
      return false;
    };

    const backSub = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );

    return () => backSub.remove();
  }, [
    lightboxVisible,
    cartModalVisible,
    ordersModalVisible,
    bookingModalVisible,
    dealerModalVisible,
    authModalVisible,
    activeTab,
  ]);

  // Bottom navigation tab press handler
  const handleTabPress = (tabKey) => {
    if (tabKey === 'orders') {
      setOrdersModalVisible(true);
    } else if (tabKey === 'services') {
      setBookingModalVisible(true);
    } else if (tabKey === 'account') {
      setActiveTab('account');
    } else {
      setActiveTab('home');
    }
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

  // Feature B: Handle opening product lightbox without affecting cart
  const handleOpenLightbox = (product) => {
    setLightboxProduct(product);
    setLightboxVisible(true);
  };

  // Cart metrics
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      const unitPrice = getProductPrice(product, isApprovedDealer);
      return sum + unitPrice * qty;
    }, 0);
  }, [cart, isApprovedDealer]);

  // Animate bottom cart bar on cart state changes
  useEffect(() => {
    if (totalCartCount > 0 && activeTab === 'home') {
      Animated.spring(cartBarAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cartBarAnim, {
        toValue: 90,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [totalCartCount, activeTab]);

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
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Active View: Account Screen or Catalogue Home */}
      {activeTab === 'account' ? (
        <AccountScreen
          currentUser={currentUser}
          dealerStatus={dealerStatus}
          onOpenDealer={() => setDealerModalVisible(true)}
          onOpenOrders={() => setOrdersModalVisible(true)}
          onOpenService={() => setBookingModalVisible(true)}
          onOpenAuth={() => setAuthModalVisible(true)}
          onBackToHome={() => setActiveTab('home')}
        />
      ) : (
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
              onImagePress={handleOpenLightbox}
              isApprovedDealer={isApprovedDealer}
            />
          )}
          ListHeaderComponent={
            <CatalogueHeader
              totalCartCount={totalCartCount}
              onOpenCart={() => setCartModalVisible(true)}
              onOpenBooking={() => setBookingModalVisible(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
              filteredCount={filteredProducts.length}
              onResetFilters={handleResetFilters}
              currentUser={currentUser}
              isApprovedDealer={isApprovedDealer}
              dealerBusinessName={dealerBusinessName}
              theme={theme}
              isDark={isDark}
            />
          }
          ListEmptyComponent={
            <EmptyResults
              searchQuery={searchQuery}
              onResetFilters={handleResetFilters}
              theme={theme}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            totalCartCount > 0
              ? styles.listContentWithCartBarAndNav
              : styles.listContentWithNav,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Bottom Cart Bar (active on Home when cart has items) */}
      {activeTab === 'home' && totalCartCount > 0 && (
        <Animated.View
          style={[
            styles.bottomCartBar,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              transform: [{ translateY: cartBarAnim }],
            },
          ]}
        >
          <View style={styles.bottomCartInfo}>
            <View
              style={[
                styles.bottomCartCountBadge,
                {
                  backgroundColor: theme.primaryLight,
                  borderColor: isDark ? theme.primary : '#bae6fd',
                },
              ]}
            >
              <Text style={[styles.bottomCartCountText, { color: theme.primary }]}>
                🛒 {totalCartCount}
              </Text>
            </View>
            <View style={styles.bottomCartPriceGroup}>
              <Text style={[styles.bottomCartTotalLabel, { color: theme.textMuted }]}>
                Total Amount
              </Text>
              <Text style={[styles.bottomCartTotalPrice, { color: theme.text }]}>
                {formatPrice(totalCartAmount)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewCartButton, { backgroundColor: theme.primaryDark }]}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewCartButtonText}>View Cart</Text>
            <Text style={styles.viewCartArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Persistent Bottom Tab Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        currentUser={currentUser}
      />

      {/* Product Image Lightbox Modal */}
      <ImageLightboxModal
        visible={lightboxVisible}
        product={lightboxProduct}
        onClose={() => setLightboxVisible(false)}
      />

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
        isApprovedDealer={isApprovedDealer}
        dealerBusinessName={dealerBusinessName}
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

      {/* Dealer Application Modal */}
      <DealerApplyModal
        visible={dealerModalVisible}
        onClose={() => setDealerModalVisible(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalVisible(true)}
        onStatusUpdated={(status) => {
          setDealerStatus(status);
          if (currentUser?.uid) {
            getDoc(doc(db, 'dealers', currentUser.uid))
              .then((snap) => {
                if (snap.exists()) setDealerProfile(snap.data());
              })
              .catch(() => {});
          }
        }}
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
  listContentWithNav: {
    paddingBottom: Platform.OS === 'ios' ? 84 : 68,
  },
  listContentWithCartBarAndNav: {
    paddingBottom: Platform.OS === 'ios' ? 148 : 130,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : RNStatusBar.currentHeight || 12,
    paddingBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  brandIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cartIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 12,
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
  dealerPricingIndicator: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dealerIndicatorIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerIndicatorIcon: {
    fontSize: 14,
  },
  dealerIndicatorTextCol: {
    flex: 1,
  },
  dealerIndicatorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  dealerIndicatorSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#15803d',
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
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
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
  heroBadgeDealer: {
    color: '#86efac',
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
  heroIllustration: {
    fontSize: 42,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  servicePromoSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  servicePromoCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  servicePromoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicePromoIcon: {
    fontSize: 18,
  },
  servicePromoTextCol: {
    flex: 1,
  },
  servicePromoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  servicePromoBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.6,
  },
  servicePromoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 1,
  },
  servicePromoSubtitle: {
    fontSize: 11,
    color: '#475569',
  },
  servicePromoButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  servicePromoButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryPillsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  categoryPillIcon: {
    fontSize: 13,
  },
  categoryPillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryCountBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyResultsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyResultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyResultsSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
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
    bottom: Platform.OS === 'ios' ? 76 : 58,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 30,
  },
  bottomCartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomCartCountBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  bottomCartCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
  },
  bottomCartPriceGroup: {
    flexDirection: 'column',
  },
  bottomCartTotalLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bottomCartTotalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewCartButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  viewCartArrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
