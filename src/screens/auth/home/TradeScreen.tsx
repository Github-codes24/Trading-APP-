/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';

import { tradingApiService, TradingInstrument } from '../../../services';
import SparklineChart from '../../../components/SparklineChart';
import { RootState } from '../../../store';
import { Image } from 'react-native';

const TradeScreen: React.FC = () => {
  const [tradingData, setTradingData] = useState<TradingInstrument[]>([]);
  const [activeTab, setActiveTab] = useState('Favorites');
  const [connectionError, setConnectionError] = useState(false);
  const [tradeAmount, setTradeAmount] = useState<number>(0);

  const navigation = useNavigation();
  const balance = useSelector((state: RootState) => state.balance.amount);

  useEffect(() => {
    tradingApiService.initializeConnection();

    const handleLiveData = (data: TradingInstrument[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setTradingData(data);
        setConnectionError(false);
      }
    };

    tradingApiService.subscribeToTradingData(handleLiveData);

    return () => {
      tradingApiService.removeAllListeners();
      tradingApiService.disconnect();
    };
  }, []);

  // Tab Filters
  const getFilteredData = () => {
    switch (activeTab) {
      case 'Favorites':
        return tradingData.filter(item => item.isFavorite);

      case 'Most traded':
        return [...tradingData].sort(() => Math.random() - 0.5).slice(0, 10);

      case 'Top Movers':
        return [...tradingData]
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 10);

      case 'Majors':
        const majors = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'XAUUSD'];
        return tradingData.filter(item => majors.includes(item.symbol));

      default:
        return tradingData;
    }
  };

  const formatInstrumentName = (name: string) => {
    if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
      return `${name.slice(0, 3)}/${name.slice(3)}`;
    }
    return name;
  };

  const getInstrumentIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSD':
      case 'USTEC':
        return require('../../../assets/images/us.png');
      case 'USOIL':
        return require('../../../assets/images/water-and-oil.png');
      default:
        return null; // handled in forex pair case
    }
  };

  // helper to map country codes to flags
  const getFlagIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
        return require('../../../assets/images/us.png');
      case 'ETH':
        return require('../../../assets/images/ethereum.png');
      case 'JPY':
        return require('../../../assets/images/japan.png');
      case 'EUR':
        return require('../../../assets/images/european-union.png');
      case 'GBP':
        return require('../../../assets/images/flag.png');
      case 'CAD':
        return require('../../../assets/images/canada.png');
      case 'XAU':
        return require('../../../assets/images/tether-gold.png');
      case 'XAU':
        return require('../../../assets/images/bitcoin.png');
      default:
        return require('../../../assets/images/bitcoin.png');
    }
  };

  // Safe price renderer
  const renderPrice = (price: any) => {
    const num = Number(price);
    if (isNaN(num)) return '0.0000';
    // Block numbers >= 1e8 (10^8)
    if (num >= 1e8) return '0.0000';
    return num.toFixed(4);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Account Button */}
      <View style={styles.accountButtonContainer}>
        <TouchableOpacity style={styles.accountButton}>
          <View style={styles.realButton}>
            <Text style={styles.accountButtonText}>Real</Text>
          </View>
          <Text style={styles.accountBalance}>{balance.toFixed(2)} USD</Text>
          <Icon name="more-vertical" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="clock" size={18} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <View style={styles.scrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {['Favorites', 'Most traded', 'Top Movers', 'Majors'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabContainer}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab && styles.tabActive,
                  ]}
                >
                  {tab}
                </Text>
                {activeTab === tab && (
                  <View style={styles.activeTabUnderline} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Sort & Edit */}
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortChip}>
          <Text style={styles.sortChipText}>Sorted manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editChip}>
          <Text style={styles.editChipText}>Edit</Text>
          <Icon name="edit" size={13} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Data or Error */}
      {connectionError ? (
        <View style={styles.errorContainer}>
          <Icon name="wifi-off" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            Unable to connect to trading server. Please check your internet
            connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setConnectionError(false);
              tradingApiService.disconnect();
              tradingApiService.initializeConnection();
            }}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : tradingData.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {getFilteredData().map(item => (
            <TouchableOpacity
              key={item.symbol}
              style={styles.instrumentCard}
              onPress={() =>
                navigation.navigate('TradeDetail', { trade: item })
              }
            >
              <View style={styles.instrumentLeft}>
                <View style={styles.instrumentIconCircle}>
                  {formatInstrumentName(item.name).includes('/') ? (
                    // Forex pair → show 2 flags
                    <View style={{ flexDirection: 'row' }}>
                      <Image
                        source={getFlagIcon(formatInstrumentName(item.name).slice(0, 3))}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          marginRight:-8,
                          marginTop: -4,
                        }}
                        resizeMode="contain"
                      />
                      <Image
                        source={getFlagIcon(formatInstrumentName(item.name).slice(4, 7))}
                        style={{ width: 16, height: 16, borderRadius: 8 }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    // Single instrument → show 1 icon
                    <Image
                      source={getInstrumentIcon(item.name)}
                      style={{ width: 22, height: 22, borderRadius: 11 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <View style={styles.instrumentInfo}>
                  <View style={styles.titleChartRow}>
                    <Text style={styles.instrumentTitle}>
                      {formatInstrumentName(item.name)}
                    </Text>
                    <View style={styles.instrumentMiddle}>
                      <SparklineChart
                        data={item.sparkline}
                        color={item.changeColor}
                        width={80}
                        height={30}
                      />
                    </View>
                  </View>
                  <Text style={styles.instrumentSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.instrumentRight}>
                <Text style={styles.instrumentPrice}>
                  {renderPrice(item.price)}
                </Text>
                <Text
                  style={[styles.instrumentChange, { color: item.changeColor }]}
                >
                  {item.change}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trading data...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  accountButtonContainer: { alignItems: 'center', paddingBottom: 8 },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  realButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#F3F5F7',
    borderRadius: 20,
    marginRight: 6,
  },
  accountButtonText: { fontSize: 12, fontWeight: '600', color: '#111111' },
  accountBalance: { fontSize: 14, fontWeight: '600', color: '#111111' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#000000' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollWrapper: { flex: 1 },
  tabsContainer: { flexDirection: 'row', alignItems: 'center' },
  tabContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    paddingBottom: 8,
  },
  tabActive: { color: '#000000', fontWeight: '600' },
  activeTabUnderline: {
    height: 3,
    backgroundColor: '#000000',
    width: '100%',
    marginTop: 5,
  },
  searchButton: { paddingHorizontal: 6 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 18,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEFF1',
    borderRadius: 16,
    paddingVertical: 6,
    marginRight: 8,
    paddingHorizontal: 12,
  },
  sortChipText: { color: '#9da2a5', fontSize: 14, fontWeight: '500' },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEFF1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editChipText: {
    color: '#555C61',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  instrumentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  instrumentLeft: { flexDirection: 'row', alignItems: 'center', flex: 2.5 },
  instrumentIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: -16,
    backgroundColor: '#FFFFFF',
  },
  instrumentInfo: { flex: 1, flexDirection: 'column' },
  titleChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  instrumentTitle: { fontSize: 16, fontWeight: '500', color: '#000000' },
  instrumentSubtitle: { fontSize: 13, color: '#6B7280', marginLeft: -30 },
  instrumentMiddle: { alignItems: 'center' },
  instrumentRight: { flex: 1, alignItems: 'flex-end' },
  instrumentPrice: { fontSize: 16, fontWeight: '500', color: '#000000' },
  instrumentChange: { fontSize: 14, fontWeight: '500' },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
});

export default TradeScreen;
