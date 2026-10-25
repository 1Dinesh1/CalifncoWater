import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CATEGORY_META, formatPrice, getProductPrice } from '../data/products';
import { useTheme } from '../theme/ThemeContext';

export default function ProductCard({
  product,
  quantity = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
  onImagePress,
  isApprovedDealer = false,
}) {
  const { theme, isDark } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Performant animations: card entrance fade/slide, button press scale feedback
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressAddToCart = () => {
    // Subtle, restrained bounce feedback
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    onAddToCart(product.id);
  };

  const categoryMeta = CATEGORY_META[product.category] || CATEGORY_META.All;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const unitPrice = getProductPrice(product, isApprovedDealer);
  const itemSubtotal = unitPrice * quantity;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Product Image / Visual Area (Tappable for full-screen Lightbox) */}
      <TouchableOpacity
        style={[styles.imageContainer, { backgroundColor: isDark ? '#0b1120' : '#f8fafc' }]}
        onPress={() => onImagePress && onImagePress(product)}
        activeOpacity={0.88}
        accessibilityLabel={`View full-size image of ${product.name}`}
      >
        {/* Category visual placeholder (always rendered as background/fallback) */}
        {(!imgLoaded || imgError) && (
          <View
            style={[
              styles.placeholderContainer,
              { backgroundColor: `${categoryMeta.color}15` },
            ]}
          >
            <Text style={styles.placeholderIcon}>{product.placeholderIcon || '💧'}</Text>
            <Text style={[styles.placeholderCategoryText, { color: categoryMeta.color }]}>
              {product.category}
            </Text>
          </View>
        )}

        {/* Remote HTTPS image (with error fallback) */}
        {!imgError && product.image ? (
          <Image
            source={{ uri: product.image }}
            style={[styles.productImage, !imgLoaded && styles.hiddenImage]}
            resizeMode="cover"
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
          />
        ) : null}

        {/* Promo / Highlight Badge */}
        {product.badge ? (
          <View style={[styles.badge, { backgroundColor: categoryMeta.color }]}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        ) : null}

        {/* Discount Tag */}
        {discountPercent ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        ) : null}

        {/* Inspect / Zoom Hint Pill */}
        <View style={styles.zoomInspectPill}>
          <Text style={styles.zoomInspectText}>🔍 View</Text>
        </View>
      </TouchableOpacity>

      {/* Product Information Body */}
      <View style={styles.content}>
        {/* Category & Rating Row */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryPill,
              {
                borderColor: `${categoryMeta.color}40`,
                backgroundColor: isDark ? '#1a243b' : '#f8fafc',
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: categoryMeta.color }]}>
              {product.category}
            </Text>
          </View>

          {product.rating ? (
            <View
              style={[
                styles.ratingBadge,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7' },
              ]}
            >
              <Text style={styles.starText}>★</Text>
              <Text
                style={[
                  styles.ratingText,
                  { color: isDark ? '#fbbf24' : '#92400e' },
                ]}
              >
                {product.rating}
              </Text>
              <Text
                style={[
                  styles.reviewsText,
                  { color: isDark ? '#f59e0b' : '#b45309' },
                ]}
              >
                ({product.reviewsCount})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>

        {/* Short Description */}
        <Text
          style={[styles.description, { color: theme.textMuted }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.description}
        </Text>

        {/* Specifications highlight */}
        {product.specifications ? (
          <View
            style={[
              styles.specsContainer,
              { backgroundColor: theme.surfaceSubtle },
            ]}
          >
            <Text style={[styles.specsText, { color: theme.textMuted }]} numberOfLines={1}>
              {product.specifications}
            </Text>
          </View>
        ) : null}

        {/* Price & Action Footer */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            {isApprovedDealer ? (
              <>
                <View style={styles.wholesalePillRow}>
                  <Text style={styles.wholesalePillTag}>WHOLESALE</Text>
                </View>
                <Text style={[styles.wholesalePriceText, { color: theme.primary }]}>
                  {formatPrice(unitPrice)}
                </Text>
                <Text style={[styles.originalPrice, { color: theme.textSubtle }]}>
                  Retail: {formatPrice(product.price)}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.price, { color: theme.primary }]}>
                  {formatPrice(product.price)}
                </Text>
                {product.originalPrice ? (
                  <Text style={[styles.originalPrice, { color: theme.textSubtle }]}>
                    {formatPrice(product.originalPrice)}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Cart Quantity Controls with Restrained Scale Animation */}
          {quantity === 0 ? (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primaryDark }]}
                onPress={handlePressAddToCart}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonPlus}>+</Text>
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View
              style={[
                styles.quantityStepper,
                {
                  backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                  borderColor: isDark ? '#059669' : '#16a34a',
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.stepperButton, { backgroundColor: isDark ? '#059669' : '#16a34a' }]}
                onPress={() => onDecrement(product.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.stepperCountBox}>
                <Text
                  style={[
                    styles.stepperCountText,
                    { color: isDark ? '#34d399' : '#166534' },
                  ]}
                >
                  {quantity}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperButton, { backgroundColor: isDark ? '#059669' : '#16a34a' }]}
                onPress={() => onIncrement(product.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Item Subtotal Banner when quantity > 0 */}
        {quantity > 0 && (
          <View
            style={[
              styles.subtotalBanner,
              { borderTopColor: theme.borderSubtle },
              isApprovedDealer && [
                styles.subtotalBannerDealer,
                {
                  backgroundColor: isDark ? '#082f49' : '#f8fafc',
                  borderTopColor: isDark ? '#0284c7' : '#e0f2fe',
                },
              ],
            ]}
          >
            <Text
              style={[
                styles.subtotalLabel,
                { color: isDark ? '#34d399' : '#166534' },
                isApprovedDealer && [
                  styles.subtotalLabelDealer,
                  { color: isDark ? '#38bdf8' : '#0369a1' },
                ],
              ]}
            >
              In Cart: {quantity} {quantity === 1 ? 'unit' : 'units'}
            </Text>
            <Text
              style={[
                styles.subtotalValue,
                { color: theme.text },
                isApprovedDealer && [
                  styles.subtotalValueDealer,
                  { color: isDark ? '#38bdf8' : '#0284c7' },
                ],
              ]}
            >
              {isApprovedDealer ? 'Wholesale Subtotal: ' : 'Item Subtotal: '}
              {formatPrice(itemSubtotal)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f8fafc',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 54,
    marginBottom: 4,
  },
  placeholderCategoryText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  hiddenImage: {
    opacity: 0,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  zoomInspectPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomInspectText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starText: {
    color: '#d97706',
    fontSize: 11,
    marginRight: 2,
  },
  ratingText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  reviewsText: {
    color: '#b45309',
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  specsContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  specsText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  originalPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    elevation: 1,
  },
  addButtonPlus: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepperCountBox: {
    paddingHorizontal: 12,
    minWidth: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  subtotalBanner: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  wholesalePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  wholesalePillTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  wholesalePriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  subtotalBannerDealer: {
    borderTopColor: '#e0f2fe',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subtotalLabelDealer: {
    color: '#0369a1',
  },
  subtotalValueDealer: {
    color: '#0284c7',
  },
});
