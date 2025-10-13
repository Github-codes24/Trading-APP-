/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  LayoutChangeEvent,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { calculateProfit, USER_MODE } from '../services/tradingApi';
import { CustomLineChart } from '../services/CustomLineChart';

const WS_URL_HISTORY = 'ws://13.201.33.113:8000';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}
export interface HistoryResponse {
  symbol: string;
  days: number;
  data: Candle[];
}
export interface LiveTick {
  type: 'live';
  symbol: string;
  tick: Candle[];
}

const formatInstrumentName = (name: string) => {
  if (name && name === 'BTCUSD') {
    return `${name.slice(0, 3)}`;
  }
  if (name && name === 'ETHUSD') {
    return `${name.slice(0, 3)}`;
  }
  if (
    name &&
    name.length === 6 &&
    /^[A-Z]{6}$/.test(name) &&
    name !== 'BTCUSD'
  ) {
    return `${name.slice(0, 3)}/${name.slice(3)}`;
  }

  return name;
};

// TIMEFRAMES
const timeFrames = [{ label: '5 m', value: 7 }];

// FETCH HISTORY VIA WS (one-shot)
export const FetchTradeDetails = (
  symbol: string,
  days: number,
  onCurrentPriceChange?: (price: number) => void, // Add callback for price updates
) => {
  const [history, setHistory] = useState<Candle[]>([]);

  useEffect(() => {
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(WS_URL_HISTORY);

      socket.onopen = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ symbol, days }));
        }
      };

      socket.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);

          console.log('history', msg);
          if (msg.type === 'history_5m' && Array.isArray(msg.data)) {
            // Load initial history
            setHistory(msg.data);

            // Set current price from last candle
            if (msg.data.length > 0 && onCurrentPriceChange) {
              onCurrentPriceChange(msg.data[msg.data.length - 1].close);
            }
          } else if (msg.type === 'live' && msg.candle) {
            // Append live candle and update current price
            setHistory(prev => {
              const newHistory = [...prev, msg.candle];

              // Update current price whenever a new candle is added
              if (onCurrentPriceChange) {
                onCurrentPriceChange(msg.candle.close);
              }

              return newHistory;
            });
          }
        } catch (err) {
          console.error('Parse error:', err);
          socket?.close();
        }
      };

      socket.onerror = event => {
        console.error('Socket error:', event);
      };

      return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          // socket.close();
        }
      };
    } catch (error) {
      console.error('WebSocket init error:', error);
      return () => {};
    }
  }, [symbol, days, onCurrentPriceChange]);

  return history;
};

// TIME FRAME MODAL
interface TimeFrameModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (v: number) => void;
  selectedTimeFrame: number;
}

const TimeFrameModal: React.FC<TimeFrameModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedTimeFrame,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Time Frame</Text>
          <FlatList
            data={timeFrames}
            keyExtractor={item => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.timeFrameItem,
                  selectedTimeFrame === item.value && styles.selectedTimeFrame,
                ]}
                onPress={() => onSelect(item.value)}
              >
                <Text
                  style={[
                    styles.timeFrameText,
                    selectedTimeFrame === item.value &&
                      styles.selectedTimeFrameText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// TRADE MODAL
interface TradeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (lotSize: number, tradeType: 'buy' | 'sell') => void;
  tradeType: 'buy' | 'sell';
  currentPrice: number;
  symbol: string;
}

const TradeModal: React.FC<TradeModalProps> = ({
  visible,
  onClose,
  onConfirm,
  tradeType,
  currentPrice,
  symbol,
}) => {
  const [lotSize, setLotSize] = useState<string>('1');
  const [calculatedValues, setCalculatedValues] = useState<{
    profit: number;
    points: number;
    rsc: number;
  } | null>(null);

  const calculateTradeValues = useCallback(
    (size: string) => {
      const lot = parseFloat(size) || 0;
      if (lot <= 0) {
        setCalculatedValues(null);
        return;
      }

      const baseSymbol = symbol.substring(0, 3).toUpperCase();

      let profit = 0;
      let points = 0;
      let rsc = 0;

      if (baseSymbol === 'VAL') {
        points = lot * 100;
        profit = points * 1;
        rsc = profit * 0.05;
      } else if (['FUN', 'GEN', 'USO'].includes(baseSymbol)) {
        const unitSize = 100000;
        points = lot * unitSize;

        if (baseSymbol === 'FUN' || baseSymbol === 'GEN') {
          profit = points * 0.004;
        } else if (baseSymbol === 'USO') {
          profit = points * 0.02;
        }

        rsc = profit * 0.15;
      } else if (symbol === 'BTCUSD') {
        rsc = lot;
        profit = rsc * currentPrice;
        points = profit / 0.01;
      } else {
        points = lot * 100;
        profit = points * 0.01;
        rsc = profit * 0.1;
      }

      setCalculatedValues({
        profit,
        points,
        rsc,
      });
    },
    [symbol, currentPrice],
  );

  useEffect(() => {
    calculateTradeValues(lotSize);
  }, [lotSize, calculateTradeValues]);

  const handleIncrement = () => {
    const current = parseFloat(lotSize) || 0;
    setLotSize((current + 0.1).toFixed(1));
  };

  const handleDecrement = () => {
    const current = parseFloat(lotSize) || 0;
    if (current > 0.1) {
      setLotSize((current - 0.1).toFixed(1));
    }
  };

  const handleConfirm = () => {
    const size = parseFloat(lotSize);
    if (size <= 0 || isNaN(size)) {
      Alert.alert('Error', 'Please enter a valid lot size');
      return;
    }

    onConfirm(size, tradeType);
    setLotSize('1');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.tradeModalContent}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              top: -10,
              height: 6,
            }}
          >
            <View
              style={{
                backgroundColor: '#e5e5e5',
                height: 4,
                width: 30,
                borderRadius: 2,
              }}
            ></View>
          </View>
          <Text style={styles.tradeModalTitle}>Regular</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Volume</Text>
            <View style={styles.input}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={handleDecrement}
              >
                <Text style={styles.volumeButtonText}>-</Text>
              </TouchableOpacity>

              <TextInput
                value={lotSize}
                onChangeText={setLotSize}
                keyboardType="numeric"
                placeholder="Enter lot size"
                textAlign="center"
                style={{
                  flex: 1,
                  height: 40,
                  paddingHorizontal: 10,
                  fontSize: 16,
                  color: '#000',
                }}
              />

              <TouchableOpacity
                style={styles.volumeButton}
                onPress={handleIncrement}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tradeModalButtons}>
            <TouchableOpacity
              style={[styles.trademodalbuttoncancle]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tradeModalButton,
                tradeType === 'buy' ? styles.buyButton : styles.sellButton,
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonTextBuySell}>
                Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'} {lotSize} lots
              </Text>
              <Text style={styles.buttonTextBuySell}>
                {currentPrice.toFixed(symbol === 'EURUSD' ? 4 : 2)}
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ bottom: -12, color: '#797979', fontSize: 12 }}>
              Fees: 0.16 USD | Margin: 1.77 USD(1:2000)
            </Text>
            <Icon
              name="info"
              size={22}
              style={{
                marginRight: 4,
                height: 22,
                width: 22,
                top: 10,
                color: '#aeafb1',
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getTradeCounts = async (
  symbol: string,
  user: 'real' | 'demo',
  currentPrice: number,
) => {
  try {
    const existingTradesJSON = await AsyncStorage.getItem('tradeHistory');
    const existingTrades = existingTradesJSON
      ? JSON.parse(existingTradesJSON)
      : [];

    // ✅ Only get trades for this user mode
    const userTrades = existingTrades.filter((t: any) => t.user === user);

    const openTrades = userTrades.filter(
      (t: any) => t.symbol === symbol && t.status === 'open',
    );

    const pendingTrades = userTrades.filter(
      (t: any) => t.symbol === symbol && t.status === 'pending',
    );

    // ✅ Calculate total profit/loss for all open trades
    const totalProfitLoss = openTrades.reduce((total: number, trade: any) => {
      const tradePnl = calculateProfit({
        symbol: trade.symbol,
        openPrice: trade.price, // entry price
        closePrice: currentPrice, // live market price
        lotSize: trade.lotSize, // user lot size
        tradeType: trade.type, // buy or sell
      });
      return total + tradePnl;
    }, 0);

    return {
      openCount: openTrades.length,
      pendingCount: pendingTrades.length,
      totalProfitLoss,
    };
  } catch (error) {
    console.error('Error reading trades:', error);
    return { openCount: 0, pendingCount: 0, totalProfitLoss: 0 };
  }
};

// SCREEN
interface TradeDetailScreenProps {
  route?: {
    params?: {
      trade?: { name: string };
    };
  };
}

// ✅ Capitalized Component
const OpenOrderModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}> = ({ visible, onClose, title, message }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.openOrderOverlay}>
        <View style={styles.openOrderCard}>
          <View style={styles.openOrderHeader}>
            <Text style={styles.openOrderTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.openOrderClose}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.openOrderMessage}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const TradeDetailScreen: React.FC<TradeDetailScreenProps> = ({ route }) => {
  const { trade = { name: 'BTCUSD' } } = route?.params || {};
  const walletBalance = useSelector(
    (state: any) => state?.balance?.amount ?? 0,
  );
  const dispatch = useDispatch();

  const [timeFrame, setTimeFrame] = useState(7);
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeCounts, setTradeCounts] = useState({
    openCount: 0,
    pendingCount: 0,
    totalProfitLoss: 0,
  });
  const [activeSection, setActiveSection] = useState<
    'Chart' | 'Analytics' | 'Specification'
  >('Chart');

  const leftPercent = 31;
  const rightPercent = 69;

  const [openOrdereModalVisible, setOpenOrderModalVisible] = useState(false);
  const [openOrderModalTitle, setOpenOrderModalTitle] = useState('');
  const [openorderModalMessage, setOpenOrderModalMessage] = useState('');

  const historyData = FetchTradeDetails(trade.name, 7, price => {
    setCurrentPrice(price);
  });

  const handleTimeFrameSelect = (v: number) => {
    setTimeFrame(v);
    setShowTimeFrameModal(false);
  };

  const getTimeFrameLabel = () =>
    timeFrames.find(tf => tf.value === timeFrame)?.label || '7d';

  // const handleCurrentPriceChange = useCallback((price: number) => {
  //   setCurrentPrice(price);
  // }, []);

  const handleTradeAction = (type: 'buy' | 'sell') => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  const getInstrumentIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSD':
        return require('../assets/images/bitcoin.png');
      case 'ETHUSD':
        return require('../assets/images/eth.png');
      case 'USTEC':
        return require('../assets/images/us.png');
      case 'USOIL':
        return require('../assets/images/crudeoilbig.png');
      default:
        return null;
    }
  };

  // Helper to map country codes to flags
  const getFlagIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
        return require('../assets/images/us.png');
      case 'ETH':
        return require('../assets/images/eth.png');
      case 'JPY':
        return require('../assets/images/japan.png');
      case 'EUR':
        return require('../assets/images/european-union.png');
      case 'GBP':
        return require('../assets/images/flag.png');
      case 'CAD':
        return require('../assets/images/canada.png');
      case 'XAU':
        return require('../assets/images/xau.png');
      case 'BTC':
        return require('../assets/images/bitcoin.png');
      default:
        return require('../assets/images/bitcoin.png');
    }
  };

  const handleTradeConfirm = async (
    lotSize: number,
    type: 'buy' | 'sell',
    user: 'real' | 'demo', // ✅ Add user mode as a parameter
  ) => {
    try {
      const tradeData = {
        id: Date.now().toString(),
        symbol: trade.name,
        formattedSymbol: formatInstrumentName(trade.name),
        type,
        lotSize,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        status: 'open',
        user,
      };

      const existingTradesJSON = await AsyncStorage.getItem('tradeHistory');
      const existingTrades = existingTradesJSON
        ? JSON.parse(existingTradesJSON)
        : [];

      const updatedTrades = [tradeData, ...existingTrades];
      await AsyncStorage.setItem('tradeHistory', JSON.stringify(updatedTrades));

      setShowTradeModal(false);

      setOpenOrderModalTitle('Order Open');
      setOpenOrderModalMessage(
        `${
          tradeType === 'buy' ? 'Buy' : '123456'
        } ${lotSize} lots of ${formatInstrumentName(
          trade.name,
        )} at ${currentPrice.toFixed(2)}`,
      );
      setOpenOrderModalVisible(true);
      const timer = setTimeout(() => {
        setOpenOrderModalVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error saving trade:', error);
      Alert.alert('Error', 'Failed to save trade to history');
    }
  };

  const priceDigits = trade.name === 'EURUSD' ? 4 : 3;

  useEffect(() => {
    const refreshProfitLoss = async () => {
      const counts = await getTradeCounts(trade.name, USER_MODE, currentPrice);
      setTradeCounts(prev => ({
        ...prev,
        openCount: counts.openCount,
        totalProfitLoss: counts.totalProfitLoss,
      }));
    };
    refreshProfitLoss();
  }, [currentPrice, trade.name]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* TOP (BALANCE BAR) */}
        {/* <View style={styles.accountButtonContainer}>
          <TouchableOpacity style={styles.accountButton}>
            <View style={styles.realButton}>
              <Text style={styles.accountButtonText}>Real</Text>
            </View>
            <Text style={styles.accountBalance}>
              {walletBalance.toFixed(2)} USD
            </Text>
            <Icon name="more-vertical" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View> */}

        {/* HEADER */}
        <View style={styles.containtView}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.instrumentIconCircle}>
                {formatInstrumentName(trade.name).includes('/') ? (
                  <View style={{ flexDirection: 'row' }}>
                    <Image
                      source={getFlagIcon(
                        formatInstrumentName(trade.name).slice(0, 3),
                      )}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        marginRight: -12,
                        marginTop: -6,
                      }}
                      resizeMode="contain"
                    />
                    <Image
                      source={getFlagIcon(
                        formatInstrumentName(trade.name).slice(4, 7),
                      )}
                      style={{ width: 20, height: 20, borderRadius: 10 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={getInstrumentIcon(trade.name)}
                    style={{ width: 23, height: 23, borderRadius: 13 }}
                    resizeMode="contain"
                  />
                )}
              </View>

              <Text style={styles.pairText}>
                {formatInstrumentName(trade.name)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                top: -30,
                height: 6,
              }}
            >
              <View
                style={{
                  backgroundColor: '#e5e5e5',
                  height: 4,
                  width: 30,
                  borderRadius: 2,
                }}
              ></View>
            </View>
            <View style={styles.headerIcons}>
              <Image
                source={require('../assets/images/alarm.png')}
                style={{ width: 22, height: 22, marginLeft: 12 }}
              />

              <Image
                source={require('../assets/images/calculator.png')}
                style={{ width: 20, height: 20, marginLeft: 12 }}
              />
              <Image
                source={require('../assets/images/arrowfour.png')}
                style={{ width: 20, height: 20, marginLeft: 12 }}
              />
              <Icon
                name="settings"
                size={20}
                color="#111"
                style={styles.icon}
              />
            </View>
          </View>

          {/* COUNTS */}
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Open</Text>
            <Text
              style={{
                backgroundColor: '#edeff1',
                fontSize: 14,
                fontWeight: '500',
                color: '#1f2023ff',
                paddingVertical: 2,
                paddingHorizontal: 5,
                borderRadius: 15,
                marginLeft: -10,
                marginRight: 15,
              }}
            >
              {tradeCounts.openCount}
            </Text>
            <Text style={styles.statusText}>Pending</Text>
            <Text
              style={{
                backgroundColor: '#edeff1',
                fontSize: 14,
                fontWeight: '500',
                color: '#1f2023ff',
                paddingVertical: 2,
                paddingHorizontal: 5,
                borderRadius: 15,
                marginLeft: -10,
                marginRight: 18,
              }}
            >
              {tradeCounts.pendingCount}
            </Text>

            {/* Conditionally render the View only when openCount is not 0 */}
            {tradeCounts.openCount !== 0 && (
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row-reverse',
                  height: '100%',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity onPress={() => setActiveSection('Chart')}>
                  <Image
                    source={require('../assets/images/cancel.png')}
                    style={{
                      width: 13,
                      height: 13,
                      marginLeft: 12,
                      tintColor: '#ec4945',
                    }}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color:
                      tradeCounts.totalProfitLoss >= 0 ? '#64D68C' : '#f44336',
                    marginLeft: 8,
                  }}
                >
                  {Number(tradeCounts.totalProfitLoss) >= 0 ? '+' : ''}
                  {Number(tradeCounts.totalProfitLoss.toFixed(2))} USD
                </Text>
              </View>
            )}
          </View>

          {/* SECTION TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'Chart' && styles.activeTab,
              ]}
              onPress={() => setActiveSection('Chart')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSection === 'Chart' && styles.activeTabText,
                ]}
              >
                Chart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'Analytics' && styles.activeTab,
              ]}
              onPress={() => setActiveSection('Analytics')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSection === 'Analytics' && styles.activeTabText,
                ]}
              >
                Analytics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'Specification' && styles.activeTab,
              ]}
              onPress={() => setActiveSection('Specification')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSection === 'Specification' && styles.activeTabText,
                ]}
              >
                Specifications
              </Text>
            </TouchableOpacity>
          </View>

          {/* SECTION CONTENT */}
          <View style={styles.sectionBox}>
            {activeSection === 'Chart' && (
              <CustomLineChart
                data={FetchTradeDetails(trade.name, 7)}
                currentPrice={currentPrice}
              />
            )}
            {activeSection === 'Analytics' && (
              <CustomLineChart
                data={FetchTradeDetails(trade.name, 7)}
                currentPrice={currentPrice}
              />
            )}
            {activeSection === 'Specification' && (
              <CustomLineChart
                data={FetchTradeDetails(trade.name, 7)}
                currentPrice={currentPrice}
              />
            )}
          </View>

          {/* TOOLS ROW - FIXED */}
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <Icon name="sliders" size={16} color="#777" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.7}
              onPress={() => setShowTimeFrameModal(true)}
            >
              <Text style={{ fontWeight: '600', color: '#444' }}>
                {getTimeFrameLabel()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <Icon name="bar-chart-2" size={16} color="#777" />
            </TouchableOpacity>
          </View>

          {/* TIME FRAME MODAL - FIXED */}
          <TimeFrameModal
            visible={showTimeFrameModal}
            onClose={() => setShowTimeFrameModal(false)}
            onSelect={handleTimeFrameSelect}
            selectedTimeFrame={timeFrame}
          />

          {/* TRADE MODAL */}
          <TradeModal
            visible={showTradeModal}
            onClose={() => setShowTradeModal(false)}
            onConfirm={(lotSize, type) =>
              handleTradeConfirm(lotSize, type, USER_MODE)
            }
            tradeType={tradeType}
            currentPrice={currentPrice}
            symbol={trade.name}
          />
          {/* BUY / SELL ACTIONS */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: '#EB483F', borderRadius: 3 },
              ]}
              activeOpacity={0.85}
              onPress={() => handleTradeAction('sell')}
            >
              <Text style={styles.actionTitle}>Sell</Text>
              <Text style={styles.actionPrice}>
                {currentPrice.toFixed(priceDigits)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: '#1E89F1', borderRadius: 3 },
              ]}
              activeOpacity={0.85}
              onPress={() => handleTradeAction('buy')}
            >
              <Text style={styles.actionTitle}>Buy</Text>
              <Text style={styles.actionPrice}>
                {currentPrice.toFixed(priceDigits)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PERCENT BAR */}
          <View style={styles.progressWrapper}>
            {/* Left (Sell side) */}
            <View style={styles.halfWrapper}>
              {/* Filled red */}
              <View
                style={{
                  height: 4,
                  width: `${leftPercent}%`,
                  backgroundColor: '#ff5b5b',
                }}
              />
              {/* Empty gray */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e4e4e4ff',
                  borderTopRightRadius: 2,
                  borderBottomRightRadius: 2,
                }}
              />
            </View>

            {/* Right (Buy side) */}
            <View style={styles.halfWrapper}>
              {/* Filled blue */}
              <View
                style={{
                  height: 4,
                  width: `${rightPercent}%`,
                  borderTopLeftRadius: 2,
                  borderBottomLeftRadius: 2,
                  marginLeft: 5,
                  backgroundColor: '#1992FC',
                }}
              />
              {/* Empty gray */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e4e4e4ff',
                }}
              />
            </View>
          </View>

          <View style={styles.percentTextWrapper}>
            <View style={styles.persentageWrapper}>
              <Text style={[styles.actionSub, { color: '#ff5b5b' }]}>
                {leftPercent}%
              </Text>
            </View>
            <View style={styles.persentageWrapper}>
              <Text style={[styles.actionSub, { color: '#1992FC' }]}>
                {rightPercent}%
              </Text>
            </View>
          </View>
        </View>
      </View>
      {openOrdereModalVisible && (
        <OpenOrderModal
          visible={openOrdereModalVisible}
          onClose={() => setOpenOrderModalVisible(false)}
          title={openOrderModalTitle}
          message={openorderModalMessage}
        />
      )}
    </SafeAreaView>
  );
};

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  openOrderOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 100,
  },
  openOrderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  openOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  openOrderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  openOrderClose: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
  },
  openOrderMessage: {
    fontSize: 14,
    color: '#333',
  },
  volumeButton: {
    alignItems: 'center',
  },
  volumeButtonText: {
    fontSize: 25,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    height: 43,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instrumentIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  containtView: {
    backgroundColor: '#fff',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    height: '100%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
    justifyContent: 'space-between',
  },
  pairText: { fontSize: 22, fontWeight: '700', color: '#222' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginLeft: 14 },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    alignItems: 'center',
    borderBottomWidth: 0,
    marginTop: -18,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 0,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2023ff',
    marginRight: 18,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#ffffffff',
    marginHorizontal: 20,
    marginBottom: 10,
    width: '100%',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderRadius: 1,
    paddingHorizontal: 8,
    marginHorizontal: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999',
  },
  activeTabText: {
    color: '#000000',
  },
  sectionBox: {
    height: '46%',
    marginHorizontal: 0,
    backgroundColor: '#fff',
  },
  toolsRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    backgroundColor: '#fff',
    marginBottom: 4,
    marginLeft: 10,
  },
  toolBtn: {
    marginHorizontal: 4,
    backgroundColor: '#ececec',
    borderRadius: 8,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    position: 'absolute',
    marginHorizontal: 15,
    bottom: 35,
    width: '92%',
    height: 55,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    marginHorizontal: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  actionPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    height: 17,
    width: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  timeFrameItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  timeFrameText: {
    fontSize: 16,
    color: '#111',
  },
  selectedTimeFrameText: {
    color: '#111',
    fontWeight: '500',
  },

  tradeModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    height: '28%',
  },
  tradeModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    color: '#393d3e',
  },
  calculatedValues: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  tradeModalButtons: {
    flexDirection: 'row',
  },
  tradeModalButton: {
    padding: 5,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
    width: '75%',
  },
  trademodalbuttoncancle: {
    flex: 1,
    padding: 5,
    borderRadius: 4,
    alignItems: 'center',
    width: 25,
    backgroundColor: '#f4f5f7',
  },
  buyButton: {
    backgroundColor: '#1992FC',
  },
  sellButton: {
    backgroundColor: '#ff5b5b',
  },
  buttonText: {
    color: '#36373b',
    fontSize: 12,
    top: 7,
  },
  buttonTextBuySell: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  percentTextWrapper: {
    flexDirection: 'row',
    height: 10,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 10,
    width: '92%',
    marginLeft: 20,
  },
  progressWrapper: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    width: '90%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  halfWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  persentageWrapper: {
    flex: 1,
    backgroundColor: '#ffff',
    justifyContent: 'center',
    height: 10,
  },
  percentFill: {
    height: '100%',
  },
});

export default TradeDetailScreen;
function setOpenTradeModalVisible(arg0: boolean) {
  throw new Error('Function not implemented.');
}

function setOpenTradeModalMessage(arg0: string) {
  throw new Error('Function not implemented.');
}
