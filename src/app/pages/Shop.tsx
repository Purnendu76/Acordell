import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Bakery products list from the screenshot
const PRODUCTS = [
  {
    id: '1',
    name: 'Test product',
    category: 'Miscellaneous Treats',
    price: 5,
    stockText: '100 left',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: '2',
    name: 'Basil Pesto Loaf - Eggless',
    category: 'Artisanal Breads',
    price: 230,
    stockText: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: '3',
    name: 'Double Seeded Multigrain Bread - Eggless',
    category: 'Artisanal Breads',
    price: 230,
    stockText: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: '4',
    name: 'Cheddar Cheese and Caramelised Onion loaf - Eggless',
    category: 'Artisanal Breads',
    price: 200,
    stockText: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: '5',
    name: 'Spicy Tomato loaf - Eggless',
    category: 'Artisanal Breads',
    price: 200,
    stockText: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=60',
  },
];

const CATEGORIES = ['All', 'Miscellaneous Treats', 'Artisanal Breads', 'Savoury'];

export default function ShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ThemedView style={styles.container}>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search products or categories..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Category Horizontal Scroll */}
      <View style={{ height: 48, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
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

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>TOTAL</ThemedText>
          <ThemedText style={styles.metricValue}>91</ThemedText>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <ThemedText style={[styles.metricLabel, { color: '#10b981' }]}>IN STOCK</ThemedText>
          <ThemedText style={styles.metricValue}>91</ThemedText>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <ThemedText style={styles.metricLabel}>PAGE</ThemedText>
          <ThemedText style={styles.metricValue}>1/13</ThemedText>
        </View>
      </View>

      {/* Scrollable Products List */}
      <ScrollView contentContainerStyle={styles.productList} showsVerticalScrollIndicator={false}>
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <Pressable>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#94a3b8" />
                </Pressable>
              </View>
              <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
              
              <View style={styles.productFooter}>
                <ThemedText style={styles.productPrice}>₹{product.price}</ThemedText>
                <View style={styles.statusBadge}>
                  <ThemedText style={styles.statusText}>In Stock</ThemedText>
                  <ThemedText style={styles.stockDetails}>{product.stockText}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10', // Dark black background
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1.5,
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
    backgroundColor: '#6366f1',
  },
  categoryText: {
    fontSize: 13,
    color: '#94a3b8',
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
  },
  productImage: {
    width: 80,
    height: 80,
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
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  productCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockDetails: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});
