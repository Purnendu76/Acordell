import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, Platform, RefreshControl, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
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

// Skeleton view for the products page matching productCard dimensions
function ProductsSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.productCard}>
          {/* Left image skeleton */}
          <Skeleton style={{ width: 90, height: 90, borderRadius: 8 }} />
          
          {/* Right info skeleton */}
          <View style={[styles.productInfo, { gap: 8 }]}>
            <View style={styles.productHeader}>
              <View style={styles.brandNameContainer}>
                <Skeleton style={{ width: 65, height: 11, borderRadius: 4 }} />
                <Skeleton style={{ width: 140, height: 15, borderRadius: 4, marginTop: 6 }} />
              </View>
            </View>
            
            <View style={[styles.ratingRow, { gap: 8, marginTop: 4 }]}>
              <Skeleton style={{ width: 35, height: 13, borderRadius: 4 }} />
              <Skeleton style={{ width: 55, height: 13, borderRadius: 4 }} />
            </View>
            
            <View style={styles.productFooter}>
              <Skeleton style={{ width: 65, height: 18, borderRadius: 4 }} />
              <View style={styles.statusContainer}>
                <Skeleton style={{ width: 50, height: 13, borderRadius: 4 }} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  src: string;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  stock_quantity: number | null;
  average_rating: string;
  categories: (Category | string)[];
  brands?: (any | string)[];
  images: ProductImage[] | string[];
  description: string;
  short_description: string;
  // Pre-processed properties for optimization
  brandName?: string;
  cleanName?: string;
  parsedCategories?: string[];
  parsedImage?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&auto=format&fit=crop&q=80';

// Helper to parse Category Name safely from string representation or object
const parseCategoryName = (c: Category | string): string => {
  if (typeof c === 'string') {
    if (c.includes('name=')) {
      const match = c.match(/name=([^;\}]+)/);
      return match ? match[1].trim() : '';
    }
    return c;
  }
  return c && c.name ? c.name : '';
};

// Helper to parse Image Source safely
const parseImageSrc = (images: ProductImage[] | string[] | any): string => {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  const firstImg = images[0];
  if (typeof firstImg === 'string') {
    if (firstImg.includes('src=')) {
      const match = firstImg.match(/src=([^;\}]+)/);
      return match ? match[1].trim() : FALLBACK_IMAGE;
    }
    return firstImg;
  }
  return firstImg && firstImg.src ? firstImg.src : FALLBACK_IMAGE;
};

// Helper to parse Brand Name safely
const getBrandName = (product: Product): string => {
  if (product.brands && product.brands.length > 0) {
    const brandObj = product.brands[0];
    if (typeof brandObj === 'string') {
      if (brandObj.includes('name=')) {
        const match = brandObj.match(/name=([^;\}]+)/);
        if (match) return match[1].trim();
      }
    } else if (typeof brandObj === 'object' && brandObj.name) {
      return brandObj.name;
    }
  }

  // Fallback 1: Extract brand from "by BrandName" in the product name
  const byMatch = product.name.match(/\s+by\s+([A-Za-z0-9\s'’]+)$/i);
  if (byMatch) {
    return byMatch[1].trim();
  }

  // Fallback 2: Check if name starts with a known brand
  const knownBrands = [
    'Creed', 'Chanel', 'Dior', 'Tom Ford', 'Versace', 'Armani',
    'Mancera', 'Rayhaan', 'Rasasi', 'Sospiro', 'Unique\'e Luxury',
    'Unique’e Luxury', 'Rabanne', 'Prada', 'Valentino', 'Lattafa',
    'Montblanc', 'Guerlain', 'Hermès', 'Diptyque', 'Riiffs',
    'Arabiyat Prestige', 'Issey Miyake'
  ];
  for (const brand of knownBrands) {
    if (product.name.toLowerCase().startsWith(brand.toLowerCase())) {
      return brand;
    }
  }

  return 'Acordell';
};

// Helper to clean up perfume title (removes brand name suffix like "by Issey Miyake" if present)
const cleanProductName = (name: string): string => {
  return name.replace(/\s+by\s+[A-Za-z0-9\s'’]+$/i, '').trim();
};

// Helper to strip HTML tags safely
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeMenuProduct, setActiveMenuProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const fetchProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Product[]>('https://n8n.srv917960.hstgr.cloud/webhook/acordell-get-products');
      if (Array.isArray(response.data)) {
        // Pre-process items once to optimize list rendering cycles and avoid CPU spikes
        const processed = response.data.map((p) => ({
          ...p,
          brandName: getBrandName(p),
          cleanName: cleanProductName(p.name),
          parsedCategories: p.categories.map((c) => parseCategoryName(c)),
          parsedImage: parseImageSrc(p.images),
        }));
        setProducts(processed);
      } else {
        throw new Error('Invalid data format received from products API');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err?.message || 'Failed to load products. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(false);
  };

  // Triggers category transition with brief loading animation
  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  // Triggers details screen modal with transition spinner
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalLoading(true);
    setTimeout(() => {
      setModalLoading(false);
    }, 400);
  };

  // Render Fragrance Notes Cards
  const renderNotes = (htmlDescription: string) => {
    if (!htmlDescription) return null;
    
    const text = stripHtml(htmlDescription);
    const topNotesMatch = text.match(/Top\s+Notes:\s*([^\n]+)/i);
    const heartNotesMatch = text.match(/Heart\s+Notes:\s*([^\n]+)/i);
    const baseNotesMatch = text.match(/Base\s+Notes:\s*([^\n]+)/i);
    
    const topNoteMatch = text.match(/Top\s+Note:\s*([^\n]+)/i);
    const heartNoteMatch = text.match(/Heart\s+Note:\s*([^\n]+)/i);
    const baseNoteMatch = text.match(/Base\s+Note:\s*([^\n]+)/i);

    const topNotes = topNotesMatch ? topNotesMatch[1] : (topNoteMatch ? topNoteMatch[1] : null);
    const heartNotes = heartNotesMatch ? heartNotesMatch[1] : (heartNoteMatch ? heartNoteMatch[1] : null);
    const baseNotes = baseNotesMatch ? baseNotesMatch[1] : (baseNoteMatch ? baseNoteMatch[1] : null);

    if (!topNotes && !heartNotes && !baseNotes) return null;

    return (
      <View style={styles.notesSection}>
        <ThemedText style={styles.sectionHeader}>Fragrance Notes</ThemedText>
        <View style={styles.notesGrid}>
          {topNotes && (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Top Notes</ThemedText>
              <ThemedText style={styles.noteValue}>{topNotes.trim()}</ThemedText>
            </View>
          )}
          {heartNotes && (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Heart Notes</ThemedText>
              <ThemedText style={styles.noteValue}>{heartNotes.trim()}</ThemedText>
            </View>
          )}
          {baseNotes && (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Base Notes</ThemedText>
              <ThemedText style={styles.noteValue}>{baseNotes.trim()}</ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Extract all categories dynamically - Memoized to prevent recalculations on every keystroke
  const categoriesList = useMemo(() => {
    return ['All', ...new Set(products.flatMap(p => 
      p.parsedCategories || []
    ).filter(Boolean))];
  }, [products]);

  // Memoize filtered products list
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const brand = product.brandName || '';
      const matchesCategory = selectedCategory === 'All' || 
                              (product.parsedCategories || []).some(cat => cat.toLowerCase() === selectedCategory.toLowerCase());
                              
      const matchesSearch = !query || 
                            product.name.toLowerCase().includes(query) || 
                            brand.toLowerCase().includes(query);
                            
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <ThemedView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search perfumes, brands..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Dynamic Category Horizontal Scroll */}
      {!loading && !error && categoriesList.length > 1 && (
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categoriesList.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryPress(category)}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillSelected,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Metrics Row */}
      {!loading && !error && (
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>FRAGRANCES</ThemedText>
            <ThemedText style={styles.metricValue}>{filteredProducts.length}</ThemedText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <ThemedText style={[styles.metricLabel, { color: '#fbbf24' }]}>PREMIUM</ThemedText>
            <ThemedText style={styles.metricValue}>100%</ThemedText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>CURRENCY</ThemedText>
            <ThemedText style={styles.metricValue}>INR (₹)</ThemedText>
          </View>
        </View>
      )}

      {/* Main Content */}
      {loading ? (
        <ProductsSkeleton />
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={() => fetchProducts()}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: product }) => {
            const brand = product.brandName || 'Acordell';
            const nameClean = product.cleanName || product.name;
            const priceVal = parseFloat(product.price || '0');
            const regPriceVal = parseFloat(product.regular_price || '0');
            const rating = parseFloat(product.average_rating || '0.00');
            const displayRating = rating > 0 ? rating.toFixed(1) : (4.5 + (product.id % 6) * 0.1).toFixed(1);
            const isInstock = product.stock_status === 'instock';

            return (
              <Pressable onPress={() => handleProductPress(product)} style={styles.productCard}>
                <Image source={{ uri: product.parsedImage }} style={styles.productImage} />
                
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <View style={styles.brandNameContainer}>
                      <ThemedText style={styles.brandName}>{brand}</ThemedText>
                      <ThemedText style={styles.productName} numberOfLines={2}>{nameClean}</ThemedText>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation(); // Stop details screen from opening
                        setActiveMenuProduct(product);
                      }}
                      style={styles.dotsButton}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={22} color="#94a3b8" />
                    </Pressable>
                  </View>
                  
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                    <ThemedText style={styles.ratingText}>{displayRating}</ThemedText>
                    {product.parsedCategories && product.parsedCategories.length > 0 && (
                      <ThemedText style={styles.categoryBadge}>
                        {product.parsedCategories[0]}
                      </ThemedText>
                    )}
                  </View>
                  
                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      {product.on_sale && regPriceVal > priceVal && (
                        <ThemedText style={styles.regularPrice}>
                          ₹{regPriceVal.toLocaleString('en-IN')}
                        </ThemedText>
                      )}
                      <ThemedText style={styles.productPrice}>
                        ₹{priceVal.toLocaleString('en-IN')}
                      </ThemedText>
                    </View>

                    <View style={styles.statusContainer}>
                      <ThemedText style={[
                        styles.statusText,
                        !isInstock && styles.statusTextOutOfStock
                      ]}>
                        {isInstock ? (product.stock_quantity ? `${product.stock_quantity} left` : 'In Stock') : 'Out of Stock'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="tag-outline" size={54} color="#64748b" />
              <ThemedText style={styles.emptyText}>No fragrances match your criteria.</ThemedText>
            </View>
          }
        />
      )}

      {/* Details Bottom Sheet Modal */}
      {selectedProduct && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Backdrop */}
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedProduct(null)} />
          
          {/* Modal Content container */}
          <ThemedView style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Pressable style={styles.closeButton} onPress={() => setSelectedProduct(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </Pressable>
              <ThemedText style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedProduct.brandName || 'Acordell'}
              </ThemedText>
              <Pressable style={styles.modalFavoriteButton}>
                <MaterialCommunityIcons name="heart-outline" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Scrollable details / Loader */}
            {modalLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#818cf8" />
                <ThemedText style={styles.modalLoadingText}>Loading fragrance details...</ThemedText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedProduct.parsedImage }}
                    style={styles.modalImage}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.modalInfoSection}>
                  <ThemedText style={styles.modalBrand}>{selectedProduct.brandName || 'Acordell'}</ThemedText>
                  <ThemedText style={styles.modalTitle}>{selectedProduct.cleanName || selectedProduct.name}</ThemedText>

                  <View style={styles.modalRatingRow}>
                    <View style={styles.modalStars}>
                      <MaterialCommunityIcons name="star" size={15} color="#fbbf24" />
                      <ThemedText style={styles.modalRatingText}>
                        {(parseFloat(selectedProduct.average_rating) > 0 
                          ? parseFloat(selectedProduct.average_rating) 
                          : (4.5 + (selectedProduct.id % 6) * 0.1)
                        ).toFixed(1)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.modalCategoryBadge}>
                      {selectedProduct.parsedCategories && selectedProduct.parsedCategories.length > 0 ? selectedProduct.parsedCategories[0] : 'Fragrance'}
                    </ThemedText>
                    <ThemedText style={[
                      styles.modalStockBadge,
                      selectedProduct.stock_status !== 'instock' && styles.modalStockBadgeOutOfStock
                    ]}>
                      {selectedProduct.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                    </ThemedText>
                  </View>

                  {/* Description */}
                  <View style={{ marginTop: 16 }}>
                    <ThemedText style={styles.sectionHeader}>Description</ThemedText>
                    <ThemedText style={styles.descriptionText}>
                      {stripHtml(selectedProduct.description || selectedProduct.short_description || 'No description available.')}
                    </ThemedText>
                  </View>

                  {/* Fragrance Notes Cards */}
                  {renderNotes(selectedProduct.description)}
                </View>
              </ScrollView>
            )}

            {/* Sticky Action Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.modalPriceContainer}>
                <ThemedText style={styles.modalPriceLabel}>Price</ThemedText>
                <ThemedText style={styles.modalPrice}>
                  ₹{parseFloat(selectedProduct.price || '0').toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <Pressable
                style={[
                  styles.modalAddCartButton,
                  selectedProduct.stock_status !== 'instock' && styles.modalAddCartButtonDisabled
                ]}
                disabled={selectedProduct.stock_status !== 'instock'}
              >
                <MaterialCommunityIcons name="shopping-outline" size={18} color="#ffffff" />
                <ThemedText style={styles.modalAddCartButtonText}>
                  {selectedProduct.stock_status === 'instock' ? 'Add to Cart' : 'Out of Stock'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      )}

      {/* 3-Dot Options Context Bottom Sheet Menu */}
      {activeMenuProduct && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Backdrop */}
          <Pressable style={styles.menuBackdrop} onPress={() => setActiveMenuProduct(null)} />
          
          {/* Menu Sheet Panel */}
          <ThemedView style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <ThemedText style={styles.menuTitle} numberOfLines={1}>
                {activeMenuProduct.cleanName || activeMenuProduct.name}
              </ThemedText>
              <ThemedText style={styles.menuSubtitle}>{activeMenuProduct.brandName}</ThemedText>
            </View>

            <View style={styles.menuOptionsList}>
              {/* Add Option */}
              <Pressable
                onPress={() => {
                  Alert.alert('Action Triggered', `Added "${activeMenuProduct.cleanName}" to cart!`);
                  setActiveMenuProduct(null);
                }}
                style={[
                  styles.menuOptionItem,
                  activeMenuProduct.stock_status !== 'instock' && styles.menuOptionItemDisabled
                ]}
                disabled={activeMenuProduct.stock_status !== 'instock'}
              >
                <MaterialCommunityIcons name="plus-box-outline" size={22} color={activeMenuProduct.stock_status === 'instock' ? '#818cf8' : '#475569'} />
                <ThemedText style={[
                  styles.menuOptionText,
                  activeMenuProduct.stock_status !== 'instock' && styles.menuOptionTextDisabled
                ]}>
                  {activeMenuProduct.stock_status === 'instock' ? 'Add to Cart' : 'Out of Stock'}
                </ThemedText>
              </Pressable>

              {/* Edit Option */}
              <Pressable
                onPress={() => {
                  Alert.alert('Action Triggered', `Edit details for "${activeMenuProduct.cleanName}" (ID: ${activeMenuProduct.id})`);
                  setActiveMenuProduct(null);
                }}
                style={styles.menuOptionItem}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color="#f59e0b" />
                <ThemedText style={styles.menuOptionText}>Edit Product</ThemedText>
              </Pressable>

              {/* Delete Option */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Delete Product',
                    `Are you sure you want to delete "${activeMenuProduct.cleanName}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => Alert.alert('Action Triggered', `Product "${activeMenuProduct.cleanName}" deleted.`),
                      },
                    ]
                  );
                  setActiveMenuProduct(null);
                }}
                style={[styles.menuOptionItem, styles.menuOptionItemDanger]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
                <ThemedText style={[styles.menuOptionText, styles.menuOptionTextDanger]}>Delete Product</ThemedText>
              </Pressable>
            </View>

            <Pressable style={styles.menuCancelButton} onPress={() => setActiveMenuProduct(null)}>
              <ThemedText style={styles.menuCancelText}>Cancel</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10', // Dark luxury background
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
  categoriesWrapper: {
    height: 48,
    marginBottom: 16,
  },
  categoriesScroll: {
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#161824',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryPillSelected: {
    backgroundColor: '#818cf8',
  },
  categoryText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#161824',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#26293b',
  },
  productList: {
    paddingBottom: 24,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#12131e',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1e2133',
    marginBottom: 12,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#161824',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  brandName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  dotsButton: {
    padding: 6,
    marginRight: -4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  categoryBadge: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: '#161824',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  regularPrice: {
    fontSize: 11,
    color: '#64748b',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  statusTextOutOfStock: {
    color: '#ef4444',
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: '#0a0b10',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1e2133',
    zIndex: 1001,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2133',
  },
  closeButton: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalFavoriteButton: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#12131e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalInfoSection: {
    padding: 16,
  },
  modalBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    lineHeight: 26,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  modalStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fbbf24',
  },
  modalCategoryBadge: {
    fontSize: 11,
    color: '#94a3b8',
    backgroundColor: '#161824',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalStockBadge: {
    fontSize: 11,
    color: '#10b981',
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalStockBadgeOutOfStock: {
    color: '#ef4444',
    backgroundColor: '#451a1a',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  notesSection: {
    marginTop: 10,
  },
  notesGrid: {
    gap: 8,
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#161824',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e2133',
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteValue: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e2133',
    backgroundColor: '#12131e',
  },
  modalPriceContainer: {
    flexDirection: 'column',
  },
  modalPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  modalAddCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#818cf8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  modalAddCartButtonDisabled: {
    backgroundColor: '#334155',
  },
  modalAddCartButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0b10',
    gap: 12,
  },
  modalLoadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 2000,
  },
  menuSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#12131e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1e2133',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    zIndex: 2001,
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2133',
    paddingBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  menuOptionsList: {
    gap: 8,
    marginBottom: 12,
  },
  menuOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161824',
    padding: 14,
    borderRadius: 8,
    gap: 12,
  },
  menuOptionItemDisabled: {
    backgroundColor: '#0f1017',
    opacity: 0.5,
  },
  menuOptionItemDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuOptionTextDisabled: {
    color: '#475569',
  },
  menuOptionTextDanger: {
    color: '#ef4444',
  },
  menuCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  menuCancelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
});
