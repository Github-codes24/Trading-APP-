import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const instruments = [
  { key: 'BTC', name: 'BTC', subtitle: 'Bitcoin vs US Dollar', price: '113765.81', change: '+ 0.81%', changeColor: '#1E90FF', leftIcon: 'bitcoin' as const },
  { key: 'XAUUSD', name: 'XAU/USD', subtitle: 'Gold vs US Dollar', price: '3335.228', change: '+ 0.63%', changeColor: '#1E90FF', leftIcon: 'flag' as const },
  { key: 'AAPL', name: 'AAPL', subtitle: 'Apple Inc.', price: '229.30', change: '− 0.45%', changeColor: '#EF4444', leftIcon: 'apple' as const },
  { key: 'EURUSD', name: 'EUR/USD', subtitle: 'Euro vs US Dollar', price: '1.16494', change: '+ 0.07%', changeColor: '#1E90FF', leftIcon: 'flag' as const },
  { key: 'GBPUSD', name: 'GBP/USD', subtitle: 'Great Britain Pound vs US Dollar', price: '1.34764', change: '− 0.06%', changeColor: '#EF4444', leftIcon: 'flag' as const },
  { key: 'USDJPY', name: 'USD/JPY', subtitle: 'US Dollar vs Japanese Yen', price: '147.436', change: '− 0.20%', changeColor: '#EF4444', leftIcon: 'flag' as const },
  { key: 'USTEC', name: 'USTEC', subtitle: 'US Tech 100 Index', price: '23352.18', change: '− 0.02%', changeColor: '#EF4444', leftIcon: 'trending-up' as const },
];

const TradeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings" size={18} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <View style={styles.tabsLeft}>
          <Text style={[styles.tabLabel, styles.tabActive]}>Favorites</Text>
          <Text style={styles.tabLabel}>Most traded</Text>
          <Text style={styles.tabLabel}>Top Movers</Text>
          <Text style={styles.tabLabel}>Majors</Text>
        </View>
        <Icon name="search" size={18} color="#111" />
      </View>
      <View style={styles.activeTabUnderline} />

      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortChip}>
          <Text style={styles.sortChipText}>Sorted manually</Text>
          <Icon name="chevron-down" size={16} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editChip}>
          <Text style={styles.editChipText}>Edit</Text>
          <Icon name="edit-2" size={16} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {instruments.map((item, index) => (
          <View key={item.key} style={styles.instrumentCard}>
            <View style={styles.instrumentLeft}>
              <View style={styles.instrumentIconCircle}>
                <Icon name={item.leftIcon} size={16} color="#111" />
              </View>
              <View>
                <Text style={styles.instrumentTitle}>{item.name}</Text>
                <Text style={styles.instrumentSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <View style={styles.instrumentRight}>
              <View style={styles.sparkline} />
              <Text style={styles.instrumentPrice}>{item.price}</Text>
              <Text style={[styles.instrumentChange, { color: item.changeColor }]}>{item.change}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tabsLeft: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginRight: 'auto',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabActive: {
    color: '#111111',
    fontWeight: '700',
  },
  activeTabUnderline: {
    marginLeft: 24,
    marginTop: 8,
    width: 56,
    height: 2,
    backgroundColor: '#111111',
    borderRadius: 2,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sortChipText: {
    color: '#111111',
    fontSize: 14,
    marginRight: 6,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editChipText: {
    color: '#111111',
    fontSize: 14,
    marginRight: 6,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  instrumentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  instrumentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instrumentIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrumentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  instrumentSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  instrumentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sparkline: {
    width: 80,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  instrumentPrice: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '600',
  },
  instrumentChange: {
    fontSize: 12,
  },
});

export default TradeScreen;
