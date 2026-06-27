import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, LayoutAnimation } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Circular brand listings for top scroll
const BRANDS = [
  { id: '1', name: 'Creed', imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Chanel', imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=100&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Dior', imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=100&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Tom Ford', imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Versace', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Armani', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&auto=format&fit=crop&q=80' },
];

const SEASONS = [
  { title: 'SUMMER COLLECTION', imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=300&auto=format&fit=crop&q=80' },
  { title: 'WINTER COLLECTION', imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=80' },
  { title: 'ALL WEATHER COLLECTION', imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80' },
];

const OCCASIONS = [
  { title: 'SIGNATURE WEAR', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&auto=format&fit=crop&q=80' },
  { title: 'OFFICE WEAR', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80' },
  { title: 'DATE WEAR', imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=80' },
];

const POWERS = [
  { title: 'BEAST MODE', imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80' },
  { title: 'PARTY MODE', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80' },
  { title: 'GYM MODE', imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80' },
];

const CONCENTRATIONS = [
  { title: 'Eau de Cologne', abbr: 'EDC', pct: '2-5%', desc: 'Light concentration, last 2 hours. Fresh and zesty.' },
  { title: 'Eau de Toilette', abbr: 'EDT', pct: '5-15%', desc: 'Ideal for daily wear, lasts 3-4 hours.' },
  { title: 'Eau de Parfum', abbr: 'EDP', pct: '15-20%', desc: 'Rich concentration, lasts 5-6 hours. Highly popular.' },
  { title: 'Extrait de Parfum', abbr: 'Parfum', pct: '20-40%', desc: 'Deepest concentration, lasts 8+ hours. Absolute luxury.' },
];

export default function HomeScreen() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner Hero */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <ThemedText style={styles.heroSaleTag}>SALE</ThemedText>
            <ThemedText style={styles.heroTitle}>THE SCENT SALE IS LIVE.</ThemedText>
            <ThemedText style={styles.heroDiscount}>UP TO 50% OFF</ThemedText>
          </View>
        </View>

        {/* Brands Circle Horizontal Scroll */}
        <View style={styles.brandsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandsScroll}>
            {BRANDS.map((brand) => (
              <View key={brand.id} style={styles.brandContainer}>
                <Image source={{ uri: brand.imageUrl }} style={styles.brandCircle} />
                <ThemedText style={styles.brandName}>{brand.name}</ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Wear the Season */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>WEAR THE SEASON</ThemedText>
        </View>
        <View style={styles.collectionGrid}>
          {SEASONS.map((item, idx) => (
            <View key={idx} style={styles.collectionCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <Pressable style={styles.exploreButton}>
                  <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Wear the Occasion */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>WEAR THE OCCASION</ThemedText>
        </View>
        <View style={styles.collectionGrid}>
          {OCCASIONS.map((item, idx) => (
            <View key={idx} style={styles.collectionCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <Pressable style={styles.exploreButton}>
                  <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Wear the Power */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>WEAR THE POWER</ThemedText>
        </View>
        <View style={styles.collectionGrid}>
          {POWERS.map((item, idx) => (
            <View key={idx} style={styles.collectionCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <Pressable style={styles.exploreButton}>
                  <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Know Your Fragrance */}
        <View style={styles.infographicSection}>
          <ThemedText style={styles.infoTitle}>KNOW YOUR FRAGRANCE</ThemedText>
          <ThemedText style={styles.infoSubtitle}>OIL CONCENTRATION CATEGORIES</ThemedText>
          <ThemedText style={styles.infoText}>HOW MUCH PERFUME OIL IS IN YOUR FRAGRANCE?</ThemedText>

          <View style={styles.infoGrid}>
            {CONCENTRATIONS.map((item, idx) => (
              <View key={idx} style={styles.infoCard}>
                <View style={styles.infoBadge}>
                  <ThemedText style={styles.infoBadgePct}>{item.pct}</ThemedText>
                </View>
                <ThemedText style={styles.infoCardTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.infoCardAbbr}>({item.abbr})</ThemedText>
                <ThemedText style={styles.infoCardDesc}>{item.desc}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <ThemedText style={styles.faqTitle}>FREQUENTLY ASKED QUESTIONS</ThemedText>
          {[
            { q: 'How long do Acordell scents last?', a: 'Depending on the oil concentration, our Eau de Parfums last 5-6 hours, and our Extraits de Parfum last upwards of 8 hours.' },
            { q: 'Are Acordell fragrances cruelty-free?', a: 'Yes, all of our products are 100% cruelty-free, vegan-friendly, and sourced responsibly.' },
            { q: 'How should I store my perfume?', a: 'Keep your bottles in a cool, dark place away from direct sunlight and temperature fluctuations to preserve the fragrance notes.' },
          ].map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <View key={idx} style={styles.faqCard}>
                <Pressable onPress={() => toggleFaq(idx)} style={styles.faqHeader}>
                  <ThemedText style={styles.faqQuestion}>{item.q}</ThemedText>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'minus' : 'plus'}
                    size={20}
                    color="#ffffff"
                  />
                </Pressable>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <ThemedText style={styles.faqAnswer}>{item.a}</ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>© 2026 Acordell Perfumery. All rights reserved.</ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10', // Dark theme background
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroBanner: {
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    right: 20,
  },
  heroSaleTag: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444', // Red Sale Tag
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  heroDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  brandsWrapper: {
    paddingVertical: 16,
    backgroundColor: '#0d0f17',
    borderBottomWidth: 1,
    borderBottomColor: '#161824',
  },
  brandsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 6,
  },
  brandCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#3b4261',
  },
  brandName: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  collectionCard: {
    flex: 1,
    minWidth: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 11, 16, 0.4)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginTop: 6,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  infographicSection: {
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24', // Amber/gold
    letterSpacing: 1,
  },
  infoSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  infoGrid: {
    width: '100%',
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoBadge: {
    backgroundColor: '#3b82f6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBadgePct: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoCardAbbr: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  infoCardDesc: {
    flex: 1,
    fontSize: 10,
    color: '#cbd5e1',
    marginLeft: 12,
  },
  faqSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#161824',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#26293b',
    paddingTop: 10,
  },
  faqAnswer: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  footer: {
    marginTop: 40,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#161824',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
  },
});
