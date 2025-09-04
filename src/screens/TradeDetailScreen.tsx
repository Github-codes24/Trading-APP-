/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  PanResponder,
  Modal,
  FlatList,
  LayoutChangeEvent,
  Platform,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withdraw } from '../store/balanceSlice';



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

const formatInstrumentName = (name: string) => {
  if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
    return `${name.slice(0, 3)}/${name.slice(3)}`;
  }
  console.log('======', name);
  return name;
};
const formatInstrumentNames = (name: string) => {
  console.log('namemmememem', name.length);
  if (name && name.length === 6) {
    console.log('080980809', [name.slice(0, 3), name.slice(3)]);
    return [name.slice(0, 3), name.slice(3)];
  }
  console.log('-------', name);
  return [name]; // wrap whole name in array
};

// Examples
// console.log(formatInstrumentName("ABCDEF")); // ["ABC", "DEF"]
// console.log(formatInstrumentName("BTC"));    // ["BTC"]

const formatDate = (dateStr: string): string => {
  // expects YYYY-MM-DD
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
};

const formatTimeForTooltip = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year.slice(2)}`;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// TIMEFRAMES
const timeFrames = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
];

// FETCH HISTORY VIA WS (one-shot)
export const FetchTradeDetails = async (
  symbol: string,
  days: number,
): Promise<HistoryResponse | null> => {
  return new Promise((resolve, reject) => {
    try {
      const socket = new WebSocket(WS_URL_HISTORY);
      socket.onopen = () => {
        socket.send(JSON.stringify({ symbol, days }));
      };
      socket.onmessage = event => {
        try {
          const data: HistoryResponse = JSON.parse(event.data);
          resolve(data);
          socket.close();
        } catch (err) {
          reject(err);
          socket.close();
        }
      };
      socket.onerror = err => {
        reject(err);
      };
      socket.onclose = () => { };
    } catch (error) {
      reject(error);
    }
  });
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
    },
    [symbol, currentPrice],
  );

  useEffect(() => {
    calculateTradeValues(lotSize);
  }, [lotSize, calculateTradeValues]);

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
          <Text style={styles.tradeModalTitle}>
            {tradeType === 'buy' ? 'Buy' : 'Sell'}{' '}
            {formatInstrumentName(symbol)}
          </Text>

          <Text style={styles.currentPriceText}>
            Current Price: {currentPrice.toFixed(symbol === 'EURUSD' ? 4 : 2)}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Lot Size:</Text>
            <TextInput
              style={styles.input}
              value={lotSize}
              onChangeText={setLotSize}
              keyboardType="numeric"
              placeholder="Enter lot size"
            />
          </View>

          {calculatedValues && (
            <View style={styles.calculatedValues}>
              <Text style={styles.calculatedText}>
                Estimated Profit: ${calculatedValues.profit}
              </Text>
              <Text style={styles.calculatedText}>
                Points: {calculatedValues.points}
              </Text>
              <Text style={styles.calculatedText}>
                RSC: {calculatedValues.rsc}
              </Text>
            </View>
          )}

          <View style={styles.tradeModalButtons}>
            <TouchableOpacity
              style={[styles.tradeModalButton, styles.cancelButton]}
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
              <Text style={styles.buttonText}>
                Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// LIVE CANDLE ENGINE (synthetic per-second updates)
const useLiveCandles = (initial: Candle[] | null, symbol: string) => {
  const [candles, setCandles] = useState<Candle[]>(initial || []);

  useEffect(() => {
    if (initial && initial.length) setCandles(initial);
    else setCandles([]);
  }, [initial?.length, symbol]);

  useEffect(() => {
    if (!candles || candles.length === 0) return;

    const pricePrecision = symbol === 'EURUSD' ? 4 : 2;
    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        const spread = Math.max(
          last.close * 0.0003,
          symbol === 'EURUSD' ? 0.0002 : 0.2,
        );
        const delta = (Math.random() - 0.5) * spread;
        const newClose = parseFloat(
          (last.close + delta).toFixed(pricePrecision),
        );
        last.close = newClose;
        if (newClose > last.high) last.high = newClose;
        if (newClose < last.low) last.low = newClose;
        next[next.length - 1] = last;

        // optionally, every ~25s start a fresh candle to simulate stream
        const now = Date.now();
        const shouldAddNew = now % 25000 < 1000; // rough 1s window every 25s
        if (shouldAddNew) {
          const base = last.close;
          const newCandle: Candle = {
            time: last.time, // keep same date label for simplicity
            open: base,
            high: base,
            low: base,
            close: base,
            tick_volume: last.tick_volume + 1,
          };
          next.push(newCandle);
          // keep memory reasonable
          if (next.length > 400) next.shift();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [symbol, candles.length]);

  return candles;
};

// DYNAMIC GRAPH
interface GraphProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  verticalZoom: number;
  setVerticalZoom: React.Dispatch<React.SetStateAction<number>>;
  timeFrame: number;
  symbol: string;
  onCurrentPriceChange: (price: number) => void;
}

const DynamicGraph: React.FC<GraphProps> = ({
  zoom,
  setZoom,
  verticalZoom,
  setVerticalZoom,
  timeFrame,
  symbol,
  onCurrentPriceChange,
}) => {
  const [history, setHistory] = useState<Candle[] | null>(null);
  const [chartHeight, setChartHeight] = useState(
    Math.floor(SCREEN_HEIGHT * 0.52),
  );
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [selectedCandle, setSelectedCandle] = useState<Candle | null>(null);
  const [showCandleDetails, setShowCandleDetails] = useState(false);
  const candleSlotWidth = 30 * zoom;
  const barWidth = candleSlotWidth * 0.55;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await FetchTradeDetails(symbol, timeFrame).catch(() => null);
      if (!isMounted) return;
      if (res?.data && res.data.length) setHistory(res.data);
      else setHistory(null);
    })();
    return () => {
      isMounted = false;
    };
  }, [timeFrame, symbol]);

  const liveCandles = useLiveCandles(history, symbol);

  // Update current price when candles change
  useEffect(() => {
    if (liveCandles && liveCandles.length > 0) {
      const currentPrice = liveCandles[liveCandles.length - 1].close;
      onCurrentPriceChange(currentPrice);
    }
  }, [liveCandles, onCurrentPriceChange]);

  // pinch zoom (horizontal vs vertical) with PanResponder
  const lastDistance = useRef(0);
  const isVerticalZoomRef = useRef(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: evt =>
          evt.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponder: evt =>
          evt.nativeEvent.touches.length === 2,
        onPanResponderMove: evt => {
          if (evt.nativeEvent.touches.length === 2) {
            const [t1, t2] = evt.nativeEvent.touches as any;
            const dx = t1.pageX - t2.pageX;
            const dy = t1.pageY - t2.pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isVertical = Math.abs(dy) > Math.abs(dx) * 1.4;

            if (lastDistance.current === 0) {
              lastDistance.current = distance;
              isVerticalZoomRef.current = isVertical;
              return;
            }

            const diff = distance - lastDistance.current;
            if (Math.abs(diff) < 4) return;

            if (isVerticalZoomRef.current) {
              setVerticalZoom(v => clamp(v + diff / 300, 0.5, 3));
            } else {
              setZoom(z => clamp(z + diff / 300, 0.5, 3));
            }
            lastDistance.current = distance;
          }
        },
        onPanResponderRelease: () => {
          lastDistance.current = 0;
          isVerticalZoomRef.current = false;
        },
        onPanResponderTerminate: () => {
          lastDistance.current = 0;
          isVerticalZoomRef.current = false;
        },
      }),
    [setZoom, setVerticalZoom],
  );

  // double-tap to reset zoom
  const lastTapRef = useRef<number>(0);
  const handleChartTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 250) {
      setZoom(1);
      setVerticalZoom(1);
    }
    lastTapRef.current = now;
  }, [setZoom, setVerticalZoom]);

  // Handle candle tap for showing details
  const handleCandleTap = useCallback(
    (candle: Candle) => {
      if (selectedCandle === candle && showCandleDetails) {
        // If the same candle is tapped again, hide the details
        setShowCandleDetails(false);
        setSelectedCandle(null);
      } else {
        // Show details for the tapped candle
        setSelectedCandle(candle);
        setShowCandleDetails(true);
      }
    },
    [selectedCandle, showCandleDetails],
  );

  const onChartLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setChartHeight(h);
  };

  if (!liveCandles || liveCandles.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>Loading chart…</Text>
      </View>
    );
  }

  const data = liveCandles;
  // compute zoomed price range
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const midPrice = (maxPrice + minPrice) / 2;
  const baseRange = Math.max(1e-9, maxPrice - minPrice);
  const zoomedRange = baseRange / verticalZoom;
  const zoomedMax = midPrice + zoomedRange / 2;
  const zoomedMin = midPrice - zoomedRange / 2;
  const priceRange = Math.max(1e-9, zoomedMax - zoomedMin);

  // Get current price for buy/sell lines
  const currentPrice = data[data.length - 1].close;
  const buyLineY = ((zoomedMax - currentPrice) / priceRange) * chartHeight;
  const sellLineY = ((zoomedMax - currentPrice) / priceRange) * chartHeight;

  const levels = [zoomedMax, midPrice, zoomedMin];
  const totalWidth = data.length * candleSlotWidth + 60;
  const priceDigits = symbol === 'EURUSD' ? 4 : 2;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* Candle Details Box */}
      {showCandleDetails && selectedCandle && (
        <View style={styles.candleDetailsBox}>
          <Text style={styles.candleDetailsText}>
            Time: {formatTimeForTooltip(selectedCandle.time)}
          </Text>
          <Text style={styles.candleDetailsText}>
            Open: {selectedCandle.open.toFixed(priceDigits)}
          </Text>
          <Text style={styles.candleDetailsText}>
            High: {selectedCandle.high.toFixed(priceDigits)}
          </Text>
          <Text style={styles.candleDetailsText}>
            Low: {selectedCandle.low.toFixed(priceDigits)}
          </Text>
          <Text style={styles.candleDetailsText}>
            Close: {selectedCandle.close.toFixed(priceDigits)}
          </Text>
        </View>
      )}

      {/* PRICE LABELS RIGHT */}
      {levels.map((val, i) => {
        const top = ((zoomedMax - val) / priceRange) * chartHeight;
        return (
          <Text
            key={`rlabel-${i}`}
            style={{
              position: 'absolute',
              right: 2,
              top: clamp(top - 8, 2, chartHeight - 20),
              fontSize: 12,
              fontWeight: '600',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 3,
              paddingHorizontal: 4,
              borderRadius: 3,
            }}
          >
            {val.toFixed(priceDigits)}
          </Text>
        );
      })}

      {/* BUY/SELL BADGES (RIGHT) */}
      <View
        style={{
          position: 'absolute',
          right: 2,
          top: 0,
          bottom: 0,
          zIndex: 4,
        }}
        pointerEvents="none"
      >
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: clamp(buyLineY - 8, 2, chartHeight - 18),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 6,
              height: 1,
              backgroundColor: '#1992FC',
              marginRight: 2,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#111',
              backgroundColor: '#1992FC',
              paddingHorizontal: 6,
              borderRadius: 3,
            }}
          >
            {currentPrice.toFixed(priceDigits)}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: clamp(sellLineY - 8, 2, chartHeight - 18),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 6,
              height: 1,
              backgroundColor: '#ff5b5b',
              marginRight: 2,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#111',
              backgroundColor: '#ff5b5b',
              paddingHorizontal: 6,
              borderRadius: 3,
            }}
          >
            {currentPrice.toFixed(priceDigits)}
          </Text>
        </View>
      </View>

      {/* SCROLLABLE PLOT AREA */}
      <View style={{ flex: 1 }} onLayout={onChartLayout}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ height: '100%', width: totalWidth }}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={handleChartTap}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
            >
              {/* HORIZONTAL GRID */}
              {levels.map((val, i) => {
                const top = ((zoomedMax - val) / priceRange) * chartHeight;
                return (
                  <View
                    key={`grid-${i}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top,
                      height: 1,
                      backgroundColor: '#ececec',
                    }}
                  />
                );
              })}

              {/* BUY/SELL LINES */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: buyLineY,
                  height: 1,
                  backgroundColor: '#1992FC',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: sellLineY,
                  height: 1,
                  backgroundColor: 'rgba(255, 91, 91, 0.7)',
                }}
              />

              {/* CANDLES */}
              {data.map((c, idx) => {
                const isBull = c.close >= c.open;
                const bodyHeight = Math.max(
                  4,
                  Math.abs(((c.close - c.open) / priceRange) * chartHeight),
                );
                const wickHeight =
                  ((c.high - c.low) / priceRange) * chartHeight;
                const bottomWick =
                  ((c.low - zoomedMin) / priceRange) * chartHeight;
                const bottomBody =
                  ((Math.min(c.open, c.close) - zoomedMin) / priceRange) *
                  chartHeight;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: candleSlotWidth,
                      alignItems: 'center',
                      position: 'relative',
                      height: '100%',
                    }}
                    onPress={() => handleCandleTap(c)}
                    activeOpacity={0.7}
                  >
                    {/* Wick */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: bottomWick,
                        width: 2,
                        height: wickHeight,
                        backgroundColor: isBull ? '#1992FC' : '#ff5b5b',
                        borderRadius: 2,
                      }}
                    />
                    {/* Body */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: bottomBody,
                        width: barWidth,
                        height: bodyHeight,
                        backgroundColor: isBull ? '#1992FC' : '#ff5b5b',
                        borderRadius: 2,
                      }}
                    />
                    {(() => {
                      const step = Math.max(1, Math.ceil(8 / zoom));
                      if (idx % step === 0) {
                        return (
                          <Text
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              fontSize: 11,
                              color: '#9b9b9b',
                              fontWeight: '600',
                              width:70,
                            }}
                          >
                            {formatDate(c.time)}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

// SCREEN
interface TradeDetailScreenProps {
  route?: {
    params?: {
      trade?: { name: string };
    };
  };
}

const TradeDetailScreen: React.FC<TradeDetailScreenProps> = ({ route }) => {
  const { trade = { name: 'BTCUSD' } } = route?.params || {};
  const walletBalance = useSelector(
    (state: any) => state?.balance?.amount ?? 0,
  );
  const dispatch = useDispatch();
  const [zoom, setZoom] = useState(1);
  const [verticalZoom, setVerticalZoom] = useState(1);
  const [timeFrame, setTimeFrame] = useState(60);
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [activeSection, setActiveSection] = useState<'Chart' | 'Analytics' | 'Specification'>('Chart');

  const leftPercent = 31;
  const rightPercent = 69;

  const handleTimeFrameSelect = (v: number) => {
    setTimeFrame(v);
    setShowTimeFrameModal(false);
  };

  const getTimeFrameLabel = () =>
    timeFrames.find(tf => tf.value === timeFrame)?.label || '7d';

  const handleCurrentPriceChange = useCallback((price: number) => {
    setCurrentPrice(price);
  }, []);

  const handleTradeAction = (type: 'buy' | 'sell') => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  const getInstrumentIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSD':
        return require('../assets/images/bitcoin.png');
      case 'USTEC':
        return require('../assets/images/us.png');
      case 'USOIL':
        return require('../assets/images/water-and-oil.png');
      default:
        return require('../assets/images/bitcoin.png'); // fallback
    }
  };

  // Currency flag icons
  const getFlagIcon = (currencies: string | string[]) => {
    const mapCurrencyToIcon = (currency: string) => {
      switch (currency) {
        case 'USD':
          return { name: 'USD', source: require('../assets/images/us.png') };
        case 'ETH':
          return { name: 'ETH', source: require('../assets/images/ethereum.png') };
        case 'JPY':
          return { name: 'JPY', source: require('../assets/images/japan.png') };
        case 'EUR':
          return { name: 'EUR', source: require('../assets/images/european-union.png') };
        case 'GBP':
          return { name: 'GBP', source: require('../assets/images/flag.png') };
        case 'CAD':
          return { name: 'CAD', source: require('../assets/images/canada.png') };
        case 'XAU':
          return { name: 'XAU', source: require('../assets/images/tether-gold.png') };
        default:
          return { name: currency, source: require('../assets/images/bitcoin.png') };
      }
    };

    if (Array.isArray(currencies)) {
      return currencies.map((c) => mapCurrencyToIcon(c));
    }
    return [mapCurrencyToIcon(currencies)];
  };

  const handleTradeConfirm = async (lotSize: number, type: 'buy' | 'sell') => {
    try {
      const tradeData = {
        id: Date.now().toString(),
        symbol: trade.name,
        formattedSymbol: formatInstrumentName(trade.name),
        type,
        lotSize,
        price: currentPrice,
        timestamp: new Date().toISOString(),
        status: 'executed',
      };

      const existingTradesJSON = await AsyncStorage.getItem('tradeHistory');
      const existingTrades = existingTradesJSON
        ? JSON.parse(existingTradesJSON)
        : [];

      const updatedTrades = [tradeData, ...existingTrades];

      await AsyncStorage.setItem('tradeHistory', JSON.stringify(updatedTrades));

      const tradeCost = lotSize * currentPrice;

      dispatch(withdraw(tradeCost));

      Alert.alert(
        'Trade Executed',
        `Successfully ${type === 'buy' ? 'bought' : 'sold'
        } ${lotSize} lots of ${formatInstrumentName(
          trade.name,
        )} at ${currentPrice.toFixed(trade.name === 'EURUSD' ? 4 : 2)}`,
      );

      setShowTradeModal(false);
    } catch (error) {
      console.error('Error saving trade:', error);
      Alert.alert('Error', 'Failed to save trade to history');
    }
  };

  const priceDigits = trade.name === 'EURUSD' ? 4 : 2;
  const isForex = formatInstrumentName(trade.name).includes('/');
  const iconsA = formatInstrumentNames(trade.name);
  const icons = getFlagIcon(iconsA);
  console.log('iconsicons', icons);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* TOP (BALANCE BAR) */}
        <View style={styles.balanceBar}>
          <View style={styles.balanceBox}>
            <Text style={styles.demoBadge}>Real</Text>
            <Text style={styles.balanceAmount}>
              {walletBalance
                ? `$${Number(walletBalance).toFixed(2)} USD`
                : '0.00 USD'}
            </Text>
            <Icon
              name="more-vertical"
              size={14}
              color="#111"
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.instrumentIconCircle}>
              {icons.length > 0 && (
                <View style={{ flexDirection: 'row' }}>
                  {icons.map((icon, idx) =>
                    icon ? (
                      <Image
                        key={idx}
                        source={icon.source}
                        style={{
                          width: isForex ? 20 : 22,
                          height: isForex ? 20 : 22,
                          borderRadius: isForex ? 8 : 11,
                          marginRight: isForex && idx === 0 ? -10 : 0,
                          marginTop: isForex && idx === 0 ? 15 : 20,
                        }}
                        resizeMode="contain"
                      />
                    ) : null,
                  )}
                </View>
              )}
            </View>

            <Text style={styles.pairText}>
              {formatInstrumentName(trade.name)}
            </Text>
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
            <Icon name="settings" size={20} color="#111" style={styles.icon} />
          </View>
        </View>

        {/* COUNTS */}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Open 0</Text>
          <Text style={styles.statusText}>Pending 0</Text>
        </View>

        {/* SECTION TABS */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'Chart' && styles.activeTab]}
            onPress={() => setActiveSection('Chart')}
          >
            <Text style={[
              styles.tabText,
              activeSection === 'Chart' && styles.activeTabText
            ]}>
              Chart
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSection === 'Analytics' && styles.activeTab]}
            onPress={() => setActiveSection('Analytics')}
          >
            <Text style={[
              styles.tabText,
              activeSection === 'Analytics' && styles.activeTabText
            ]}>
              Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSection === 'Specification' && styles.activeTab]}
            onPress={() => setActiveSection('Specification')}
          >
            <Text style={[
              styles.tabText,
              activeSection === 'Specification' && styles.activeTabText
            ]}>
              Specification
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION CONTENT */}
        <View style={styles.sectionBox}>
          {activeSection === 'Chart' && (
            <DynamicGraph
              zoom={zoom}
              setZoom={setZoom}
              verticalZoom={verticalZoom}
              setVerticalZoom={setVerticalZoom}
              timeFrame={timeFrame}
              symbol={trade.name}
              onCurrentPriceChange={handleCurrentPriceChange}
            />
          )}
          {activeSection === 'Analytics' && (
            <DynamicGraph
              zoom={zoom}
              setZoom={setZoom}
              verticalZoom={verticalZoom}
              setVerticalZoom={setVerticalZoom}
              timeFrame={timeFrame}
              symbol={trade.name}
              onCurrentPriceChange={handleCurrentPriceChange}
            />
          )}
          {activeSection === 'Specification' && (
            <DynamicGraph
              zoom={zoom}
              setZoom={setZoom}
              verticalZoom={verticalZoom}
              setVerticalZoom={setVerticalZoom}
              timeFrame={timeFrame}
              symbol={trade.name}
              onCurrentPriceChange={handleCurrentPriceChange}
            />
          )}
        </View>

        {/* TOOLS ROW - FIXED */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={styles.toolBtn}
            activeOpacity={0.7}
            onPress={() => { }}
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
            onPress={() => { }}
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
          onConfirm={handleTradeConfirm}
          tradeType={tradeType}
          currentPrice={currentPrice}
          symbol={trade.name}
        />

        {/* BUY / SELL ACTIONS */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EB483F' }]}
            activeOpacity={0.85}
            onPress={() => handleTradeAction('sell')}
          >
            <Text style={styles.actionTitle}>Sell</Text>
            <Text style={styles.actionPrice}>
              {currentPrice.toFixed(priceDigits)}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1E89F1' }]}
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
        <View style={styles.percentBarWrapper}>
          {/* Left (Sell side) */}
          <View style={styles.halfWrapper}>
            <View
              style={[
                styles.percentFill,
                {
                  width: `${leftPercent}%`,
                  backgroundColor: '#ff5b5b',
                },
              ]}
            />
          </View>

          {/* Right (Buy side) */}
          <View style={styles.halfWrapper}>
            <View
              style={[
                styles.percentFill,
                {
                  width: `${rightPercent}%`,
                  backgroundColor: '#1992FC',
                },
              ]}
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
    </SafeAreaView>
  );
};

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  balanceBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0,
    borderColor: '#e5e7eb',
    marginTop:10
  },
  percentBlock: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  percentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  percentSub: {
    fontSize: 12,
    color: '#fff',
  },
  spreadBox: {
    backgroundColor: '#111',
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  spreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
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
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    maxWidth: 195,
    borderWidth: 1, // Border
    borderColor: '#d3d3d3',
  },
  demoBadge: {
    backgroundColor: '#edeff5',
    color: '#999',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  balanceAmount: { fontWeight: '600', fontSize: 16, color: '#222' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  pairText: { fontSize: 22, fontWeight: '700', color: '#222' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginLeft: 14 },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8', // Greyish background for the rectangular box
    borderRadius: 12, // Rounded corners for a rectangular look
    alignItems: 'center', // Center text vertically
    borderBottomWidth: 0,
    margin: 8,
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
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#ffffffff',
    marginHorizontal: 8,
    borderRadius: 12,
    marginBottom: 0,
    gap: 24, 
    
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingHorizontal: 20, 
  marginHorizontal: 8
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
    height: '45%',
    marginBottom: 30,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  toolBtn: {
    marginHorizontal: 10,
    backgroundColor: '#ececec',
    paddingVertical: 7,
    paddingHorizontal: 23,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  bottomBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 45,
    width: '100%',
    height: 54,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    width: '95%'
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  actionPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111',
    height: 15,
    width: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#fff',
    height: '80%',
  },
  percentBarLeft: {
    backgroundColor: '#ff5b5b',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  percentBarRight: {
    backgroundColor: '#1992FC',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedTimeFrame: {
    backgroundColor: '#1992FC',
    borderRadius: 6,
  },
  timeFrameText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeFrameText: {
    color: 'white',
    fontWeight: '600',
  },
  // Candle Details Box Styles
  candleDetailsBox: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 6,
    zIndex: 100,
  },
  candleDetailsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  // Trade Modal Styles
  tradeModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  tradeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  currentPriceText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  calculatedValues: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  calculatedText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  tradeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buyButton: {
    backgroundColor: '#1992FC',
  },
  sellButton: {
    backgroundColor: '#ff5b5b',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  percentBarWrapper: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    width: '100%',
  },
  percentTextWrapper: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 15,
    width: '100%',
  },
  halfWrapper: {
    flex: 1,
    backgroundColor: '#ddd', // grey background for each half
    justifyContent: 'center',
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