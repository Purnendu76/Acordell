import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useToast } from "@/components/toast";
import { useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function Skeleton({ style }: { style: any }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600 }),
        withTiming(0.3, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { backgroundColor: "#26293b", borderRadius: 4 },
        style,
        animatedStyle,
      ]}
    />
  );
}

function ProductsSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.productCard}>
          <Skeleton style={{ width: 90, height: 90, borderRadius: 8 }} />
          <View style={[styles.productInfo, { gap: 8 }]}>
            <View style={styles.productHeader}>
              <View style={styles.brandNameContainer}>
                <Skeleton style={{ width: 65, height: 11, borderRadius: 4 }} />
                <Skeleton
                  style={{
                    width: 140,
                    height: 15,
                    borderRadius: 4,
                    marginTop: 6,
                  }}
                />
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
  brandName?: string;
  cleanName?: string;
  parsedCategories?: string[];
  parsedImage?: string;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&auto=format&fit=crop&q=80";

const parseCategoryName = (c: Category | string): string => {
  if (typeof c === "string") {
    if (c.includes("name=")) {
      const match = c.match(/name=([^;\}]+)/);
      return match ? match[1].trim() : "";
    }
    return c;
  }
  return c && c.name ? c.name : "";
};

const parseImageSrc = (images: ProductImage[] | string[] | any): string => {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  const firstImg = images[0];
  if (typeof firstImg === "string") {
    if (firstImg.includes("src=")) {
      const match = firstImg.match(/src=([^;\}]+)/);
      return match ? match[1].trim() : FALLBACK_IMAGE;
    }
    return firstImg;
  }
  return firstImg && firstImg.src ? firstImg.src : FALLBACK_IMAGE;
};

const getBrandName = (product: Product): string => {
  if (product.brands && product.brands.length > 0) {
    const brandObj = product.brands[0];
    if (typeof brandObj === "string") {
      if (brandObj.includes("name=")) {
        const match = brandObj.match(/name=([^;\}]+)/);
        if (match) return match[1].trim();
      }
    } else if (typeof brandObj === "object" && brandObj.name) {
      return brandObj.name;
    }
  }

  const byMatch = product.name.match(/\s+by\s+([A-Za-z0-9\s'’]+)$/i);
  if (byMatch) {
    return byMatch[1].trim();
  }

  const knownBrands = [
    "Creed",
    "Chanel",
    "Dior",
    "Tom Ford",
    "Versace",
    "Armani",
    "Mancera",
    "Rayhaan",
    "Rasasi",
    "Sospiro",
    "Unique'e Luxury",
    "Unique’e Luxury",
    "Rabanne",
    "Prada",
    "Valentino",
    "Lattafa",
    "Montblanc",
    "Guerlain",
    "Hermès",
    "Diptyque",
    "Riiffs",
    "Arabiyat Prestige",
    "Issey Miyake",
  ];
  for (const brand of knownBrands) {
    if (product.name.toLowerCase().startsWith(brand.toLowerCase())) {
      return brand;
    }
  }

  return "Acordell";
};

const cleanProductName = (name: string): string => {
  return name.replace(/\s+by\s+[A-Za-z0-9\s'’]+$/i, "").trim();
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<(?:"[^"]*"|'[^']*'|[^'">])*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

export default function ProductsScreen() {
  const { showToast } = useToast();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeMenuProduct, setActiveMenuProduct] = useState<Product | null>(
    null,
  );
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [manageStock, setManageStock] = useState<boolean>(false);
  const [stockCount, setStockCount] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Product[]>(
        "https://n8n.srv917960.hstgr.cloud/webhook/acordell-get-products",
      );
      if (Array.isArray(response.data)) {
        const processed = response.data.map((p) => ({
          ...p,
          brandName: getBrandName(p),
          cleanName: cleanProductName(p.name),
          parsedCategories: p.categories.map((c) => parseCategoryName(c)),
          parsedImage: parseImageSrc(p.images),
        }));
        setProducts(processed);
      } else {
        throw new Error("Invalid data format received from products API");
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(
        err?.message ||
          "Failed to load products. Please check your internet connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productId && products.length > 0) {
      const prodIdNum = parseInt(productId, 10);
      const prod = products.find((p) => p.id === prodIdNum);
      if (prod) {
        setSelectedProduct(prod);
      }
    }
  }, [productId, products]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(false);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalLoading(true);
    setTimeout(() => {
      setModalLoading(false);
    }, 400);
  };

  const handleEditPress = (product: Product) => {
    setEditingProduct(product);
    setActiveMenuProduct(null);

    const hasCount =
      product.stock_quantity !== null && product.stock_quantity !== undefined;
    setManageStock(hasCount);
    setStockCount(hasCount ? String(product.stock_quantity) : "");
  };

  const handleSaveStock = async () => {
    if (!editingProduct) return;

    let qty: number | null = null;
    const hasExistingCount =
      editingProduct.stock_quantity !== null &&
      editingProduct.stock_quantity !== undefined;

    if (hasExistingCount || manageStock) {
      const parsed = parseInt(stockCount, 10);
      if (isNaN(parsed) || parsed <= 1) {
        showToast("Stock count must be a number greater than 1.", {
          type: "warning",
        });
        return;
      }
      qty = parsed;
    }

    setSaveLoading(true);
    try {
      const payload = {
        id: editingProduct.id,
        manage_stock: hasExistingCount || manageStock,
        stock_quantity: qty,
        stock_status: "instock",
      };

      await axios.post(
        "https://n8n.srv917960.hstgr.cloud/webhook/acordell-edit-product",
        payload,
      );

      showToast("Stock status updated successfully!", { type: "success" });

      setEditingProduct(null);
      setSelectedProduct(null);
      fetchProducts(false);
    } catch (err: any) {
      console.error("Error saving stock status:", err);
      showToast(err?.message || "Failed to update stock. Please try again.", {
        type: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProduct = async (
    productId: number,
    productName: string,
  ) => {
    setDeleteLoading(true);
    try {
      await axios.delete(
        `https://n8n.srv917960.hstgr.cloud/webhook/acordell-delete-product?id=${productId}&product_id=${productId}`,
        {
          data: {
            id: productId,
            product_id: productId,
          },
        },
      );
      showToast(`Product "${productName}" deleted successfully.`, {
        type: "success",
      });
      setSelectedProduct(null);
      setDeletingProduct(null);
      setActiveMenuProduct(null);
      fetchProducts(false);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      showToast(err?.message || `Failed to delete product "${productName}".`, {
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderNotes = (htmlDescription: string) => {
    if (!htmlDescription) return null;

    const text = stripHtml(htmlDescription);
    const topNotesMatch = text.match(/Top\s+Notes:\s*([^\n]+)/i);
    const heartNotesMatch = text.match(/Heart\s+Notes:\s*([^\n]+)/i);
    const baseNotesMatch = text.match(/Base\s+Notes:\s*([^\n]+)/i);

    const topNoteMatch = text.match(/Top\s+Note:\s*([^\n]+)/i);
    const heartNoteMatch = text.match(/Heart\s+Note:\s*([^\n]+)/i);
    const baseNoteMatch = text.match(/Base\s+Note:\s*([^\n]+)/i);

    const topNotes = topNotesMatch
      ? topNotesMatch[1]
      : topNoteMatch
        ? topNoteMatch[1]
        : null;
    const heartNotes = heartNotesMatch
      ? heartNotesMatch[1]
      : heartNoteMatch
        ? heartNoteMatch[1]
        : null;
    const baseNotes = baseNotesMatch
      ? baseNotesMatch[1]
      : baseNoteMatch
        ? baseNoteMatch[1]
        : null;

    if (!topNotes && !heartNotes && !baseNotes) return null;

    return (
      <View style={styles.notesSection}>
        <ThemedText style={styles.sectionHeader}>Fragrance Notes</ThemedText>
        <View style={styles.notesGrid}>
          {!!topNotes ? (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Top Notes</ThemedText>
              <ThemedText style={styles.noteValue}>
                {topNotes.trim()}
              </ThemedText>
            </View>
          ) : null}
          {!!heartNotes ? (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Heart Notes</ThemedText>
              <ThemedText style={styles.noteValue}>
                {heartNotes.trim()}
              </ThemedText>
            </View>
          ) : null}
          {!!baseNotes ? (
            <View style={styles.noteCard}>
              <ThemedText style={styles.noteLabel}>Base Notes</ThemedText>
              <ThemedText style={styles.noteValue}>
                {baseNotes.trim()}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const categoriesList = useMemo(() => {
    return [
      "All",
      ...new Set(
        products.flatMap((p) => p.parsedCategories || []).filter(Boolean),
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const brand = product.brandName || "";
      const matchesCategory =
        selectedCategory === "All" ||
        (product.parsedCategories || []).some(
          (cat) => cat.toLowerCase() === selectedCategory.toLowerCase(),
        );

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        brand.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const hasExistingCount =
    editingProduct?.stock_quantity !== null &&
    editingProduct?.stock_quantity !== undefined;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search perfumes, brands..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {!loading && !error && categoriesList.length > 1 ? (
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
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
      ) : null}

      {!loading && !error ? (
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>FRAGRANCES</ThemedText>
            <ThemedText style={styles.metricValue}>
              {filteredProducts.length}
            </ThemedText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <ThemedText style={[styles.metricLabel, { color: "#fbbf24" }]}>
              PREMIUM
            </ThemedText>
            <ThemedText style={styles.metricValue}>100%</ThemedText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>CURRENCY</ThemedText>
            <ThemedText style={styles.metricValue}>INR (₹)</ThemedText>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ProductsSkeleton />
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color="#ef4444"
          />
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
            const brand = product.brandName || "Acordell";
            const nameClean = product.cleanName || product.name;
            const priceVal = parseFloat(product.price || "0");
            const regPriceVal = parseFloat(product.regular_price || "0");
            const rating = parseFloat(product.average_rating || "0.00");
            const displayRating =
              rating > 0
                ? rating.toFixed(1)
                : (4.5 + (product.id % 6) * 0.1).toFixed(1);
            const isInstock = product.stock_status === "instock";

            return (
              <Pressable
                onPress={() => handleProductPress(product)}
                style={styles.productCard}
              >
                <Image
                  source={{ uri: product.parsedImage }}
                  style={styles.productImage}
                />

                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <View style={styles.brandNameContainer}>
                      <ThemedText style={styles.brandName}>{brand}</ThemedText>
                      <ThemedText style={styles.productName} numberOfLines={2}>
                        {nameClean}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveMenuProduct(product);
                      }}
                      style={styles.dotsButton}
                    >
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        size={22}
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>

                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#fbbf24"
                    />
                    <ThemedText style={styles.ratingText}>
                      {displayRating}
                    </ThemedText>
                    {product.parsedCategories &&
                    product.parsedCategories.length > 0 ? (
                      <ThemedText style={styles.categoryBadge}>
                        {product.parsedCategories[0]}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      {product.on_sale && regPriceVal > priceVal ? (
                        <ThemedText
                          style={styles.regularPrice}
                        >{`₹${regPriceVal.toLocaleString("en-IN")}`}</ThemedText>
                      ) : null}
                      <ThemedText
                        style={styles.productPrice}
                      >{`₹${priceVal.toLocaleString("en-IN")}`}</ThemedText>
                    </View>

                    <View style={styles.statusContainer}>
                      <ThemedText
                        style={[
                          styles.statusText,
                          !isInstock && styles.statusTextOutOfStock,
                        ]}
                      >
                        {isInstock
                          ? product.stock_quantity
                            ? `${product.stock_quantity} left`
                            : "In Stock"
                          : "Out of Stock"}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#818cf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={54}
                color="#64748b"
              />
              <ThemedText style={styles.emptyText}>
                No fragrances match your criteria.
              </ThemedText>
            </View>
          }
        />
      )}

      {selectedProduct ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedProduct(null)}
          />

          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedProduct(null)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#ffffff"
                />
              </Pressable>
              <ThemedText style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedProduct.brandName || "Acordell"}
              </ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {modalLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#818cf8" />
                <ThemedText style={styles.modalLoadingText}>
                  Loading fragrance details...
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedProduct.parsedImage }}
                    style={styles.modalImage}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.modalInfoSection}>
                  <ThemedText style={styles.modalBrand}>
                    {selectedProduct.brandName || "Acordell"}
                  </ThemedText>
                  <ThemedText style={styles.modalTitle}>
                    {selectedProduct.cleanName || selectedProduct.name}
                  </ThemedText>

                  <View style={styles.modalRatingRow}>
                    <View style={styles.modalStars}>
                      <MaterialCommunityIcons
                        name="star"
                        size={15}
                        color="#fbbf24"
                      />
                      <ThemedText style={styles.modalRatingText}>
                        {(parseFloat(selectedProduct.average_rating) > 0
                          ? parseFloat(selectedProduct.average_rating)
                          : 4.5 + (selectedProduct.id % 6) * 0.1
                        ).toFixed(1)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.modalCategoryBadge}>
                      {selectedProduct.parsedCategories &&
                      selectedProduct.parsedCategories.length > 0
                        ? selectedProduct.parsedCategories[0]
                        : "Fragrance"}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modalStockBadge,
                        selectedProduct.stock_status !== "instock" &&
                          styles.modalStockBadgeOutOfStock,
                      ]}
                    >
                      {selectedProduct.stock_status === "instock"
                        ? "In Stock"
                        : "Out of Stock"}
                    </ThemedText>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <ThemedText style={styles.sectionHeader}>
                      Description
                    </ThemedText>
                    <ThemedText style={styles.descriptionText}>
                      {stripHtml(
                        selectedProduct.description ||
                          selectedProduct.short_description ||
                          "No description available.",
                      )}
                    </ThemedText>
                  </View>

                  {renderNotes(selectedProduct.description)}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <View style={styles.modalButtonsRow}>
                <Pressable
                  onPress={() => handleEditPress(selectedProduct)}
                  style={styles.modalEditButtonFull}
                >
                  <ThemedText style={styles.modalEditButtonText}>
                    Edit
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDeletingProduct(selectedProduct)}
                  style={styles.modalDeleteButtonFull}
                >
                  <ThemedText style={styles.modalDeleteButtonText}>
                    Delete
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.modalPriceFooterContainer}>
                <ThemedText style={styles.modalPriceLabel}>Price</ThemedText>
                <ThemedText
                  style={styles.modalPrice}
                >{`₹${parseFloat(selectedProduct.price || "0").toLocaleString("en-IN")}`}</ThemedText>
              </View>
            </View>
          </ThemedView>
        </View>
      ) : null}

      {activeMenuProduct ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setActiveMenuProduct(null)}
          />

          <ThemedView style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <ThemedText style={styles.menuTitle} numberOfLines={1}>
                {activeMenuProduct.cleanName || activeMenuProduct.name}
              </ThemedText>
              <ThemedText style={styles.menuSubtitle}>
                {activeMenuProduct.brandName}
              </ThemedText>
            </View>

            <View style={styles.menuOptionsList}>
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Action Triggered",
                    `Added "${activeMenuProduct.cleanName}" to cart!`,
                  );
                  setActiveMenuProduct(null);
                }}
                style={[
                  styles.menuOptionItem,
                  activeMenuProduct.stock_status !== "instock" &&
                    styles.menuOptionItemDisabled,
                ]}
                disabled={activeMenuProduct.stock_status !== "instock"}
              >
                <MaterialCommunityIcons
                  name="plus-box-outline"
                  size={22}
                  color={
                    activeMenuProduct.stock_status === "instock"
                      ? "#818cf8"
                      : "#475569"
                  }
                />
                <ThemedText
                  style={[
                    styles.menuOptionText,
                    activeMenuProduct.stock_status !== "instock" &&
                      styles.menuOptionTextDisabled,
                  ]}
                >
                  {activeMenuProduct.stock_status === "instock"
                    ? "Add to Cart"
                    : "Out of Stock"}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleEditPress(activeMenuProduct)}
                style={styles.menuOptionItem}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color="#f59e0b"
                />
                <ThemedText style={styles.menuOptionText}>
                  Edit Product
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDeletingProduct(activeMenuProduct);
                  setActiveMenuProduct(null);
                }}
                style={[styles.menuOptionItem, styles.menuOptionItemDanger]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color="#ef4444"
                />
                <ThemedText
                  style={[styles.menuOptionText, styles.menuOptionTextDanger]}
                >
                  Delete Product
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              style={styles.menuCancelButton}
              onPress={() => setActiveMenuProduct(null)}
            >
              <ThemedText style={styles.menuCancelText}>Cancel</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      ) : null}

      {editingProduct ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            style={styles.dialogBackdrop}
            onPress={() => setEditingProduct(null)}
          />

          <View style={styles.dialogWrapper} pointerEvents="box-none">
            <View style={styles.dialogContainer}>
              <ThemedText style={styles.dialogTitle}>
                Edit Stock Status
              </ThemedText>
              <ThemedText style={styles.dialogSubtitle} numberOfLines={1}>
                {editingProduct.cleanName || editingProduct.name}
              </ThemedText>

              <View style={styles.dialogInfoRow}>
                <ThemedText style={styles.dialogInfoLabel}>
                  Current Status:{" "}
                </ThemedText>
                <ThemedText style={styles.dialogInfoValue}>
                  {editingProduct.stock_quantity !== null
                    ? `${editingProduct.stock_quantity} left`
                    : editingProduct.stock_status === "instock"
                      ? "In Stock"
                      : "Out of Stock"}
                </ThemedText>
              </View>

              {!hasExistingCount ? (
                <Pressable
                  onPress={() => setManageStock(!manageStock)}
                  style={styles.checkboxRow}
                >
                  <MaterialCommunityIcons
                    name={
                      manageStock ? "checkbox-marked" : "checkbox-blank-outline"
                    }
                    size={22}
                    color={manageStock ? "#818cf8" : "#94a3b8"}
                  />
                  <ThemedText style={styles.checkboxLabel}>
                    Track Stock Count
                  </ThemedText>
                </Pressable>
              ) : null}

              {hasExistingCount || manageStock ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Stock Count</ThemedText>
                  <TextInput
                    value={stockCount}
                    onChangeText={setStockCount}
                    placeholder="Enter stock count (more than 1)"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    style={styles.dialogTextInput}
                  />
                </View>
              ) : null}

              <View style={styles.dialogFooter}>
                <Pressable
                  onPress={() => setEditingProduct(null)}
                  style={styles.dialogCancelButton}
                  disabled={saveLoading}
                >
                  <ThemedText style={styles.dialogCancelButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSaveStock}
                  style={styles.dialogSaveButton}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.dialogSaveButtonText}>
                      Save
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {deletingProduct ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            style={styles.dialogBackdrop}
            onPress={() => setDeletingProduct(null)}
          />

          <View style={styles.dialogWrapper} pointerEvents="box-none">
            <View style={styles.dialogContainer}>
              <ThemedText style={styles.dialogTitle}>Delete Product</ThemedText>
              <ThemedText style={styles.dialogSubtitle} numberOfLines={1}>
                {deletingProduct.cleanName || deletingProduct.name}
              </ThemedText>

              <ThemedText
                style={[
                  styles.descriptionText,
                  { marginTop: 8, marginBottom: 8 },
                ]}
              >
                Are you sure you want to delete this product? This action cannot
                be undone.
              </ThemedText>

              <View style={styles.dialogFooter}>
                <Pressable
                  onPress={() => setDeletingProduct(null)}
                  style={styles.dialogCancelButton}
                  disabled={deleteLoading}
                >
                  <ThemedText style={styles.dialogCancelButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() =>
                    handleDeleteProduct(
                      deletingProduct.id,
                      deletingProduct.cleanName || deletingProduct.name,
                    )
                  }
                  style={[
                    styles.dialogSaveButton,
                    { backgroundColor: "#ef4444" },
                  ]}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.dialogSaveButtonText}>
                      Delete
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0b10", // Dark luxury background
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
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
    color: "#ffffff",
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: "none" as any,
      },
    }),
  },
  categoriesWrapper: {
    height: 48,
    marginBottom: 16,
  },
  categoriesScroll: {
    alignItems: "center",
    gap: 8,
  },
  categoryPill: {
    backgroundColor: "#161824",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryPillSelected: {
    backgroundColor: "#818cf8",
  },
  categoryText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    backgroundColor: "#161824",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 4,
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#26293b",
  },
  productList: {
    paddingBottom: 24,
    gap: 12,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#12131e",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1e2133",
    marginBottom: 12,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#161824",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  brandName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 2,
  },
  dotsButton: {
    padding: 6,
    marginRight: -4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fbbf24",
  },
  categoryBadge: {
    fontSize: 10,
    color: "#94a3b8",
    backgroundColor: "#161824",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: "column",
  },
  regularPrice: {
    fontSize: 11,
    color: "#64748b",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10b981",
  },
  statusTextOutOfStock: {
    color: "#ef4444",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: "#818cf8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
    gap: 12,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85%",
    backgroundColor: "#0a0b10",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2133",
    zIndex: 1001,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2133",
  },
  closeButton: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#12131e",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalInfoSection: {
    padding: 16,
  },
  modalBrand: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
    lineHeight: 26,
  },
  modalRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  modalStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalRatingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fbbf24",
  },
  modalCategoryBadge: {
    fontSize: 11,
    color: "#94a3b8",
    backgroundColor: "#161824",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalStockBadge: {
    fontSize: 11,
    color: "#10b981",
    backgroundColor: "#064e3b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalStockBadgeOutOfStock: {
    color: "#ef4444",
    backgroundColor: "#451a1a",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 13,
    color: "#cbd5e1",
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
    backgroundColor: "#161824",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1e2133",
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteValue: {
    fontSize: 13,
    color: "#ffffff",
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1e2133",
    backgroundColor: "#12131e",
    gap: 12,
  },
  modalPriceContainer: {
    flexDirection: "column",
  },
  modalPriceLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 2,
  },
  modalButtonsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalEditButtonFull: {
    flex: 1,
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEditButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalDeleteButtonFull: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalPriceFooterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingTop: 4,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0b10",
    gap: 12,
  },
  modalLoadingText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 2000,
  },
  menuSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#12131e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2133",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    zIndex: 2001,
  },
  menuHeader: {
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2133",
    paddingBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  menuOptionsList: {
    gap: 8,
    marginBottom: 12,
  },
  menuOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
    padding: 14,
    borderRadius: 8,
    gap: 12,
  },
  menuOptionItemDisabled: {
    backgroundColor: "#0f1017",
    opacity: 0.5,
  },
  menuOptionItemDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  menuOptionTextDisabled: {
    color: "#475569",
  },
  menuOptionTextDanger: {
    color: "#ef4444",
  },
  menuCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  menuCancelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#94a3b8",
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 3000,
  },
  dialogWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 3001,
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#12131e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e2133",
    padding: 20,
    gap: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  dialogSubtitle: {
    fontSize: 12,
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  dialogInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dialogInfoLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  dialogInfoValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  dialogTextInput: {
    backgroundColor: "#161824",
    borderWidth: 1,
    borderColor: "#1e2133",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    color: "#ffffff",
    fontSize: 15,
    ...Platform.select({
      web: {
        outlineStyle: "none" as any,
      },
    }),
  },
  dialogFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  dialogCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCancelButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "bold",
  },
  dialogSaveButton: {
    backgroundColor: "#818cf8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  dialogSaveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
