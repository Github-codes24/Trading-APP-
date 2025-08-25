import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { tradingApiService, TradingInstrument } from '../../../services';
import SparklineChart from '../../../components/SparklineChart';
import Fontisto from 'react-native-vector-icons/Fontisto';

const TradeScreen: React.FC = () => {
  const [tradingData, setTradingData] = useState<TradingInstrument[]>([]);
  const [activeTab, setActiveTab] = useState('Favorites');
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Initialize trading API connection
    tradingApiService.initializeConnection();

    // Subscribe to real data from WS
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

  const formatInstrumentName = (name: string) => {
    if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
      return `${name.slice(0, 3)}/${name.slice(3)}`;
    }
    return name;
  };

  const getIconName = (icon: string) => {
    switch (icon) {
      case 'bitcoin':
        return 'circle';
      case 'apple':
        return 'apple';
      case 'trending-up':
        return 'trending-up';
      default:
        return 'flag';
    }
  };

  const getIconColor = (icon: string) => {
    switch (icon) {
      case 'bitcoin':
        return '#F7931A';
      case 'apple':
        return '#000000';
      case 'trending-up':
        return '#1F2937';
      default:
        return '#6B7280';
    }
  };

  const getIconBackground = (icon: string) => {
    switch (icon) {
      case 'bitcoin':
        return '#F7931A';
      case 'apple':
        return '#F3F4F6';
      case 'trending-up':
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Account Button - Centered above header */}
      <View style={styles.accountButtonContainer}>
        <TouchableOpacity style={styles.accountButton}>
          <View style={styles.realButton}>
            <Text style={styles.accountButtonText}>Real</Text>
          </View>
          <Text style={styles.accountBalance}>0.00 USD</Text>
          <Icon name="more-vertical" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Header with title and clock icon */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="clock" size={18} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsRow}>
        <View style={styles.scrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {['Favorites', 'Most traded', 'Top Movers', 'Majors'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabContainer}
              >
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab && styles.tabActive
                ]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.activeTabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={22} color="#111" />
        </TouchableOpacity>
      </View>



      {/* Sort and Edit Controls */}
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortChip}>
          <Text style={styles.sortChipText}>Sorted manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editChip}>
          <Text style={styles.editChipText}>Edit</Text>
          <Icon name="edit" size={13} color="#111" />
        </TouchableOpacity>
      </View>



      {/* Trading Instruments List or Error Message */}
      {connectionError ? (
        <View style={styles.errorContainer}>
          <Icon name="wifi-off" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>Unable to connect to trading server. Please check your internet connection and try again.</Text>
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
          style={styles.scrollView}
        >
          {tradingData.map((item) => (
            <TouchableOpacity key={item.symbol} style={styles.instrumentCard}>
              <View style={styles.instrumentLeft}>
                <View style={[
                  styles.instrumentIconCircle,
                  { backgroundColor: getIconBackground(item.icon) }
                ]}>
                  {item.icon === 'bitcoin' ? (
                    <Fontisto name="bitcoin" size={18} color="#FFFFFF" />
                  ) : (
                    <Icon
                      name={getIconName(item.icon) as any}
                      size={14}
                      color={getIconColor(item.icon)}
                    />
                  )}
                </View>
                <View style={styles.instrumentInfo}>
                  {/* NEW: A row for the title and the sparkline chart */}
                  <View style={styles.titleChartRow}>
                    <Text style={styles.instrumentTitle}>{formatInstrumentName(item.name)}</Text>
                    <View style={styles.instrumentMiddle}>
                      <SparklineChart
                        data={item.sparkline}
                        color={item.changeColor}
                        width={80}
                        height={30}
                      />
                    </View>
                  </View>
                  {/* Subtitle is now directly below the title/chart row */}
                  <Text style={styles.instrumentSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.instrumentRight}>
                <Text style={styles.instrumentPrice}>{item.price}</Text>
                <Text style={[styles.instrumentChange, { color: item.changeColor }]}>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  accountButtonContainer: {
    alignItems: 'center',

    paddingBottom: 8,

  },
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
  accountButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111',

  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    borderBottomWidth: 1, // Optional: adds a faint line below the entire tab bar
    borderBottomColor: '#E5E7EB',
  },
  scrollWrapper: {
    flex: 1, // Allows the scrollable area to take up all available horizontal space
  },
  tabsContainer: {
    // This style applies to the content within the ScrollView
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainer: {

    paddingHorizontal: 12, // Increased horizontal padding for better spacing
    alignItems: 'center', // Center the content (text and underline)
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    paddingBottom: 8
  },
  tabActive: {
    color: '#000000',
    fontWeight: 400,
  },
  activeTabUnderline: {
    height: 3,
    backgroundColor: '#000000',
    width: '100%', // Underline spans the full width of the tab container
    marginTop: 5, // Space between text and underline
  },
  searchButton: {
    paddingHorizontal: 6,
  },
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
  sortChipText: {
    color: '#9da2a5',
    fontSize: 14,
    fontWeight: '500',
  },
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
    marginRight: 6
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  instrumentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,

    marginBottom: 8,
  },
instrumentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.5, 
  },
  instrumentIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: -16
  },
  instrumentInfo: {
    flex: 1,
    flexDirection: 'column'
  },
  
  titleChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2, 
  },
  instrumentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  instrumentSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft:-30
  },
  instrumentMiddle: {
    alignItems: 'center',
  },
  instrumentRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  instrumentPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  instrumentChange: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default TradeScreen;