import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { CATEGORY_META, formatPrice, getProductPrice } from '../data/products';

export default function ProductCard({
  product,
  quantity = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
  isApprovedDealer = false,
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const categoryMeta = CATEGORY_META[product.category] || CATEGORY_META.All;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const unitPrice = getProductPrice(product, isApprovedDealer);
  const itemSubtotal = unitPrice * quantity;

  return (
    <View style={styles.card}>
      {/* Product Image / Visual Area */}
      <View style={styles.imageContainer}>
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
      </View>

      {/* Product Information Body */}
      <View style={styles.content}>
        {/* Category & Rating Row */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryPill, { borderColor: `${categoryMeta.color}40` }]}>
            <Text style={[styles.categoryText, { color: categoryMeta.color }]}>
              {product.category}
            </Text>
          </View>

          {product.rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.starText}>★</Text>
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.reviewsText}>({product.reviewsCount})</Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Short Description */}
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {product.description}
        </Text>

        {/* Specifications highlight */}
        {product.specifications ? (
          <View style={styles.specsContainer}>
            <Text style={styles.specsText} numberOfLines={1}>
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
                <Text style={styles.wholesalePriceText}>
                  {formatPrice(unitPrice)}
                </Text>
                <Text style={styles.originalPrice}>
                  Retail: {formatPrice(product.price)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.price}>{formatPrice(product.price)}</Text>
                {product.originalPrice ? (
                  <Text style={styles.originalPrice}>
                    {formatPrice(product.originalPrice)}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Cart Quantity Controls */}
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddToCart(product.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonPlus}>+</Text>
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.quantityStepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => onDecrement(product.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.stepperCountBox}>
                <Text style={styles.stepperCountText}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={styles.stepperButton}
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
          <View style={[styles.subtotalBanner, isApprovedDealer && styles.subtotalBannerDealer]}>
            <Text style={[styles.subtotalLabel, isApprovedDealer && styles.subtotalLabelDealer]}>
              In Cart: {quantity} {quantity === 1 ? 'unit' : 'units'}
            </Text>
            <Text style={[styles.subtotalValue, isApprovedDealer && styles.subtotalValueDealer]}>
              {isApprovedDealer ? 'Wholesale Subtotal: ' : 'Item Subtotal: '}
              {formatPrice(itemSubtotal)}
            </Text>
          </View>
        )}
      </View>
    </View>
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
