import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  Animated,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { CATEGORY_META, formatPrice } from '../data/products';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageLightboxModal({ visible, product, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Reset state when opening a new product
  useEffect(() => {
    if (visible && product) {
      setLoading(true);
      setError(false);
      setIsZoomed(false);
      scaleAnim.setValue(1);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      opacityAnim.setValue(0);
    }
  }, [visible, product]);

  // Android hardware back button handling
  useEffect(() => {
    if (!visible) return;

    const onHardwareBack = () => {
      onClose();
      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );

    return () => backSubscription.remove();
  }, [visible, onClose]);

  const toggleZoom = () => {
    const nextZoom = !isZoomed;
    setIsZoomed(nextZoom);
    Animated.spring(scaleAnim, {
      toValue: nextZoom ? 1.75 : 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  if (!product) return null;

  const categoryMeta = CATEGORY_META[product.category] || CATEGORY_META.All;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar with Product Info and Close Action */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close image viewer"
            >
              <Text style={styles.closeIcon}>✕</Text>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {product.name}
              </Text>
              <View style={[styles.categoryBadge, { borderColor: `${categoryMeta.color}80` }]}>
                <Text style={[styles.categoryText, { color: categoryMeta.color }]}>
                  {product.category}
                </Text>
              </View>
            </View>

            {/* 1x / 2x Zoom Toggle Button */}
            <TouchableOpacity
              style={[styles.zoomButton, isZoomed && styles.zoomButtonActive]}
              onPress={toggleZoom}
              activeOpacity={0.8}
              accessibilityLabel={isZoomed ? 'Reset zoom' : 'Zoom in'}
            >
              <Text style={[styles.zoomText, isZoomed && styles.zoomTextActive]}>
                {isZoomed ? '1x' : '2x 🔍'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Central Image Canvas */}
          <View style={styles.canvasContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={toggleZoom}
                style={styles.imageWrapper}
              >
                {/* Fallback View when remote image has error */}
                {error || !product.image ? (
                  <View style={styles.fallbackBox}>
                    <Text style={styles.fallbackIcon}>{product.placeholderIcon || '💧'}</Text>
                    <Text style={styles.fallbackTitle}>{product.name}</Text>
                    <Text style={styles.fallbackSubtitle}>
                      {product.category} • Certified Califnco Water System
                    </Text>
                  </View>
                ) : (
                  <Animated.View
                    style={[
                      styles.animatedImageContainer,
                      {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: product.image }}
                      style={styles.mainImage}
                      resizeMode="contain"
                      onLoad={() => setLoading(false)}
                      onError={() => {
                        setLoading(false);
                        setError(true);
                      }}
                    />
                  </Animated.View>
                )}

                {/* Loading Spinner */}
                {loading && !error && (
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color="#38bdf8" />
                    <Text style={styles.loadingText}>Loading high-res preview...</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Bottom Information Footer */}
          <View style={styles.bottomSheet}>
            <View style={styles.footerRow}>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Product Price</Text>
                <Text style={styles.priceValue}>{formatPrice(product.price)}</Text>
              </View>

              {product.rating ? (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>★</Text>
                  <Text style={styles.ratingVal}>{product.rating}/5</Text>
                  <Text style={styles.ratingCount}>({product.reviewsCount} reviews)</Text>
                </View>
              ) : null}
            </View>

            {product.specifications ? (
              <Text style={styles.specificationsText} numberOfLines={2}>
                ⚙️ {product.specifications}
              </Text>
            ) : null}

            <Text style={styles.hintText}>
              {Platform.OS === 'ios'
                ? 'Tip: Pinch to zoom or tap 2x to inspect details.'
                : 'Tip: Double-tap or tap 2x in top right to inspect details.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.96)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
  },
  closeIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  productTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryBadge: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  zoomButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  zoomButtonActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  zoomText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  zoomTextActive: {
    color: '#ffffff',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: SCREEN_WIDTH * 0.92,
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 15, 0.6)',
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 13,
  },
  fallbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  fallbackIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  fallbackSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  bottomSheet: {
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceCol: {
    flexDirection: 'column',
  },
  priceLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingStar: {
    color: '#f59e0b',
    fontSize: 14,
    marginRight: 4,
  },
  ratingVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  ratingCount: {
    color: '#94a3b8',
    fontSize: 12,
  },
  specificationsText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  hintText: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
