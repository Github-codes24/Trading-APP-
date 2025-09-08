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
import { withdraw } from '../store/balanceSlice';
import Svg, { Line } from 'react-native-svg';
import { USER_MODE } from '../services/tradingApi';

const WS_URL_HISTORY = 'ws://13.201.33.113:8000';
const WS_URL_LIVE = 'ws://13.201.33.113:8000/ws/live'; // Adjust this URL as needed
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
  tick: {
    bid: number;
    ask: number;
    last: number;
    yesterday_close: number;
    pnl_pct: number;
  };
}

const formatInstrumentName = (name: string) => {
  if (name && name === 'BTCUSD') {
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

const getBuySell = (candles: Candle[], symbol: string) => {
  if (!candles || candles.length === 0) return null;

  const config = instrumentConfig[symbol] || instrumentConfig.DEFAULT;

  const lastCandle = candles[candles.length - 1];
  const midPrice = lastCandle.close;

  // Calculate spread dynamically
  const spread = Math.max(midPrice * config.spreadFactor, config.minSpread);

  const buyPrice = parseFloat(
    (midPrice + spread / 2).toFixed(config.pricePrecision),
  );
  const sellPrice = parseFloat(
    (midPrice - spread / 2).toFixed(config.pricePrecision),
  );

  return { buyPrice, sellPrice };
};

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
const timeFrames = [{ label: '5 m', value: 7 }];

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
      socket.onclose = () => {};
    } catch (error) {
      reject(error);
    }
  });
};

// LIVE WEBSOCKET CONNECTION
const useLiveWebSocket = (
  symbol: string,
  onLiveData: (data: LiveTick) => void,
) => {
  useEffect(() => {
    const socket = new WebSocket(`${WS_URL_LIVE}?symbol=${symbol}`);

    socket.onopen = () => {
      console.log('Live WebSocket connected');
    };

    socket.onmessage = event => {
      try {
        const data: LiveTick = JSON.parse(event.data);
        if (data.type === 'live' && data.symbol === symbol) {
          onLiveData(data);
        }
      } catch (error) {
        console.error('Error parsing live data:', error);
      }
    };

    socket.onerror = error => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('Live WebSocket disconnected');
    };

    return () => {
      socket.close();
    };
  }, [symbol, onLiveData]);
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

interface InstrumentConfig {
  pricePrecision: number; // decimals
  minSpread: number; // smallest spread
  spreadFactor: number; // dynamic spread scaling
}

const instrumentConfig: Record<string, InstrumentConfig> = {
  EURUSD: { pricePrecision: 5, minSpread: 0.00008, spreadFactor: 0.0003 },
  GBPUSD: { pricePrecision: 5, minSpread: 0.0001, spreadFactor: 0.0003 },
  USDJPY: { pricePrecision: 3, minSpread: 0.01, spreadFactor: 0.0003 },
  GBPJPY: { pricePrecision: 3, minSpread: 0.02, spreadFactor: 0.0003 },
  USDCAD: { pricePrecision: 5, minSpread: 0.0001, spreadFactor: 0.0003 },
  USOIL: { pricePrecision: 2, minSpread: 0.02, spreadFactor: 0.0005 }, // crude oil
  USTEC: { pricePrecision: 2, minSpread: 1.0, spreadFactor: 0.0005 }, // NASDAQ 100
  XAUUSD: { pricePrecision: 2, minSpread: 0.2, spreadFactor: 0.0003 }, // Gold
  BTCUSD: { pricePrecision: 2, minSpread: 5, spreadFactor: 0.001 }, // Bitcoin
  ETHUSD: { pricePrecision: 2, minSpread: 0.5, spreadFactor: 0.001 }, // Ethereum
  DEFAULT: { pricePrecision: 2, minSpread: 0.1, spreadFactor: 0.0003 }, // fallback
};

// LIVE CANDLE ENGINE (updated with WebSocket integration)
const useLiveCandles = (initial: Candle[] | null, symbol: string) => {
  const [candles, setCandles] = useState<Candle[]>(initial || []);
  const [lastLivePrice, setLastLivePrice] = useState<number | null>(null);
  const [lastLiveTime, setLastLiveTime] = useState<number>(0);

  useEffect(() => {
    if (initial && initial.length) setCandles(initial);
    else setCandles([]);
  }, [initial?.length, symbol]);

  // Handle live WebSocket data
  const handleLiveData = useCallback((data: LiveTick) => {
    setLastLivePrice(data.tick.last);
    setLastLiveTime(Date.now());
  }, []);

  useLiveWebSocket(symbol, handleLiveData);

  useEffect(() => {
    if (!candles || candles.length === 0) return;

    const config = instrumentConfig[symbol] || instrumentConfig.DEFAULT;

    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = { ...next[next.length - 1] };

        // Use live price if available, otherwise use synthetic updates
        if (lastLivePrice !== null && Date.now() - lastLiveTime < 2000) {
          // Update with live price
          last.close = parseFloat(lastLivePrice.toFixed(config.pricePrecision));
          if (last.close > last.high) last.high = last.close;
          if (last.close < last.low) last.low = last.close;
        } else {
          // Fallback to synthetic updates
          const spread = Math.max(
            last.close * config.spreadFactor,
            config.minSpread,
          );
          const delta = (Math.random() - 0.5) * spread;

          // Update candle close with precision
          const newClose = parseFloat(
            (last.close + delta).toFixed(config.pricePrecision),
          );
          last.close = newClose;
          if (newClose > last.high) last.high = newClose;
          if (newClose < last.low) last.low = newClose;
        }

        last.tick_volume += 1;
        next[next.length - 1] = last;

        // Optionally simulate new candle
        const now = Date.now();
        const shouldAddNew = now % 30000 < 1000;
        if (shouldAddNew) {
          const base = last.close;
          const newCandle: Candle = {
            time: new Date().toISOString(),
            open: base,
            high: base,
            low: base,
            close: base,
            tick_volume: 1,
          };
          next.push(newCandle);
          if (next.length > 400) next.shift();
        }

        return next;
      });
    }, 1000); // Update more frequently for live data

    return () => clearInterval(interval);
  }, [symbol, candles.length, lastLivePrice, lastLiveTime]);

  return candles;
};

// DYNAMIC GRAPH
interface GraphProps {
  timeFrame: number;
  symbol: string;
  onCurrentPriceChange: (price: number) => void;
  tpValue?: number;
  slValue?: number;
}

const DynamicGraph: React.FC<GraphProps> = ({
  timeFrame,
  symbol,
  onCurrentPriceChange,
}) => {
  const [history, setHistory] = useState<Candle[] | null>(null);
  const [chartHeight, setChartHeight] = useState(
    Math.floor(SCREEN_HEIGHT * 0.5),
  );
  const [selectedCandle, setSelectedCandle] = useState<Candle | null>(null);
  const [showCandleDetails, setShowCandleDetails] = useState(false);
  const [candleCount, setCandleCount] = useState(0); // Track candle count
  const candleSlotWidth = 20;
  const barWidth = candleSlotWidth * 0.4;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await FetchTradeDetails(symbol, timeFrame).catch(() => null);
      if (!isMounted) return;
      if (res?.data && res.data.length) {
        setHistory(res.data);
        setCandleCount(res.data.length); // Initialize candle count
      } else {
        setHistory(null);
        setCandleCount(0);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [timeFrame, symbol]);

  const liveCandles = useLiveCandles(history, symbol);

  // Update candle count when liveCandles changes
  useEffect(() => {
    if (liveCandles) {
      setCandleCount(liveCandles.length);
    }
  }, [liveCandles]);

  // Update current price when candles change
  useEffect(() => {
    if (liveCandles && liveCandles.length > 0) {
      const currentPrice = liveCandles[liveCandles.length - 1].close;
      onCurrentPriceChange(currentPrice);
    }
  }, [liveCandles, onCurrentPriceChange]);

  // Calculate chart width based on candle count
  const chartWidth = candleCount * candleSlotWidth;
  const finalchartWeidth = SCREEN_WIDTH - chartWidth;

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
  // compute price range
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const midPrice = (maxPrice + minPrice) / 2;
  const baseRange = Math.max(1e-9, maxPrice - minPrice);
  const zoomedRange = baseRange;
  const zoomedMax = midPrice + zoomedRange / 1.5;
  const zoomedMin = midPrice - zoomedRange / 1.5;
  const priceRange = Math.max(1e-9, zoomedMax - zoomedMin);

  // Get current price for buy/sell lines
  const currentPrice = data[data.length - 1].close;

  const spreads: Record<string, number> = {
    EURUSD: 0.00008, // 0.8 pip
    GBPUSD: 0.0001, // 1.0 pip
    USDJPY: 0.01, // 1.0 pip
    GBPJPY: 0.02, // 2.0 pips
    USDCAD: 0.0001, // 1.0 pip
    USOIL: 0.02, // 2 cents
    USTEC: 1.0, // 1 point
    XAUUSD: 0.5, // 50 cents
    BTCUSD: 10, // $10
    ETHUSD: 0.5, // $0.5
  };

  const spread = spreads[symbol] ?? 0.0001;

  const buyPrice = currentPrice + spread / 2;
  const sellPrice = currentPrice - spread / 2;

  const buyLineY = ((zoomedMax - buyPrice) / priceRange) * chartHeight;
  const sellLineY = ((zoomedMax - sellPrice) / priceRange) * chartHeight;

  const levels = [zoomedMax, midPrice, zoomedMin];
  const priceDigits = symbol === 'EURUSD' ? 4 : 2;

  return (
    <View style={{ flex: 1 }}>
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
              fontSize: 16,
              fontWeight: '500',
              color: '#7c8484',
              zIndex: 3,
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
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#fff',
              backgroundColor: '#1992FC',
              paddingHorizontal: 11,
              paddingVertical: 1,
              borderTopLeftRadius: 15,
            }}
          >
            {buyPrice.toFixed(priceDigits)}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: clamp(sellLineY + 13, 2, chartHeight - 18),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#fff',
              backgroundColor: '#ff5b5b',
              paddingHorizontal: 11,
              paddingVertical: 1,
              borderBottomLeftRadius: 15,
            }}
          >
            {sellPrice.toFixed(priceDigits)}
          </Text>
        </View>
      </View>

      {/* PLOT AREA */}
      <View style={{ flex: 1 }} onLayout={onChartLayout}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: '94%',
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
          <Svg
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            {/* Buy line (blue dotted) */}
            <Line
              x1="100%"
              y1={buyLineY + 10}
              x2={finalchartWeidth - 118}
              y2={buyLineY + 10}
              stroke="#1992FC"
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Sell line (red dotted) */}
            <Line
              x1="100%"
              y1={sellLineY + 14}
              x2={finalchartWeidth - 118}
              y2={sellLineY + 14}
              stroke="rgba(255, 91, 91, 0.7)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </Svg>
          {/* CANDLES */}
          {data.map((c, idx) => {
            const isBull = c.close >= c.open;
            const bodyHeight = Math.max(
              4,
              Math.abs(((c.close - c.open) / priceRange) * chartHeight),
            );
            const wickHeight = ((c.high - c.low) / priceRange) * chartHeight;
            const bottomWick = ((c.low - zoomedMin) / priceRange) * chartHeight;
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
                  height: '95%',
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
                  const step = Math.max(1, Math.ceil(8));
                  if (idx % step === 0) {
                    return (
                      <Text
                        style={{
                          position: 'absolute',
                          bottom: -10,
                          fontSize: 11,
                          color: '#9b9b9b',
                          width: 70,
                          fontWeight: '500',
                        }}
                      >
                        {/* {formatDate(c.time)} */}
                      </Text>
                    );
                  }
                  return null;
                })()}
              </TouchableOpacity>
            );
          })}
        </View>
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
  const [timeFrame, setTimeFrame] = useState(7);
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [activeSection, setActiveSection] = useState<
    'Chart' | 'Analytics' | 'Specification'
  >('Chart');

  const leftPercent = 31;
  const rightPercent = 69;

  const [openOrdereModalVisible, setOpenOrderModalVisible] = useState(false);
  const [openOrderModalTitle, setOpenOrderModalTitle] = useState('');
  const [openorderModalMessage, setOpenOrderModalMessage] = useState('');

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

  const handleOpenOrderCloseModal = useCallback(() => {
    setOpenOrderModalVisible(false);
  }, []);

  const handleTradeConfirm = async (
    lotSize: number,
    type: 'buy' | 'sell',
    user: 'real' | 'demo', // ✅ Add user mode as a parameter
  ) => {
    try {
      const tradeCost = lotSize * currentPrice;

      // ✅ Check if user has enough balance
      // if (walletBalance < tradeCost) {
      //   Alert.alert(
      //     'Insufficient Balance',
      //     `You need at least ${tradeCost.toFixed(
      //       2,
      //     )} but you only have ${walletBalance.toFixed(2)}`,
      //   );
      //   return;
      // }

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

      // Deduct balance only if trade is valid
      // dispatch(withdraw(tradeCost));

      setShowTradeModal(false);

      // ✅ Set modal message
      setOpenOrderModalTitle('Order Open');
      setOpenOrderModalMessage(
        `${
          tradeType === 'buy' ? 'Buy' : '123456'
        } ${lotSize} lots of ${formatInstrumentName(
          trade.name,
        )} at ${currentPrice.toFixed(2)}`,
      );
      setOpenOrderModalVisible(true);
    } catch (error) {
      console.error('Error saving trade:', error);
      Alert.alert('Error', 'Failed to save trade to history');
    }
  };

  const getTradeCounts = async (symbol: string, user: 'real' | 'demo') => {
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

      // ✅ Calculate total profit/loss for open trades
      const totalProfitLoss = openTrades.reduce((total: number, trade: any) => {
        // Calculate P/L based on current price vs entry price
        const priceDifference =
          trade.type === 'buy'
            ? currentPrice - trade.price
            : trade.price - currentPrice; // adjust for sell trades

        const tradePnl = priceDifference * trade.lotSize;

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

  const priceDigits = trade.name === 'EURUSD' ? 4 : 3;

  const [tradeCounts, setTradeCounts] = useState({
    openCount: 0,
    pendingCount: 0,
    totalProfitLoss: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const counts = await getTradeCounts(trade.name, USER_MODE);
      setTradeCounts(counts);
    };

    loadCounts();
  }, [trade.name, currentPrice]);

  useEffect(() => {
    const refreshProfitLoss = async () => {
      const counts = await getTradeCounts(trade.name, USER_MODE);
      setTradeCounts(prev => ({
        ...prev,
        totalProfitLoss: counts.totalProfitLoss,
      }));
    };

    refreshProfitLoss();
  }, [currentPrice, trade.name]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* TOP (BALANCE BAR) */}
        <View style={styles.balanceBar}>
          <View style={styles.balanceBox}>
            <Text style={styles.demoBadge}>Real</Text>
            <Text style={styles.balanceAmount}>
              {walletBalance
                ? `${Number(walletBalance).toFixed(2)} USD`
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
                      tradeCounts.totalProfitLoss >= 0 ? '#4caf50' : '#f44336',
                    marginLeft: 8,
                  }}
                >
                  {tradeCounts.totalProfitLoss >= 0 ? '+' : ''}
                  {tradeCounts.totalProfitLoss.toFixed(2)} USD
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
              <DynamicGraph
                timeFrame={timeFrame}
                symbol={trade.name}
                onCurrentPriceChange={handleCurrentPriceChange}
              />
            )}
            {activeSection === 'Analytics' && (
              <DynamicGraph
                timeFrame={timeFrame}
                symbol={trade.name}
                onCurrentPriceChange={handleCurrentPriceChange}
              />
            )}
            {activeSection === 'Specification' && (
              <DynamicGraph
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
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  balanceBar: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
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
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  volumeButton: {
    alignItems: 'center',
    // justifyContent: 'center',
  },
  volumeButtonText: {
    fontSize: 25,
    // fontWeight: 'bold',
    color: '#333',
  },
  input: {
    // flex:1,
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
  inputText: {},
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
    width: 26,
    height: 26,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    // marginTop: -16,
    backgroundColor: '#FFFFFF',
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 18,
    maxWidth: 200,
    borderWidth: 1, // Border
    borderColor: '#d3d3d3',
    height: 37,
  },
  demoBadge: {
    backgroundColor: '#edeff5',
    color: '#111',
    fontWeight: '400',
    fontSize: 12,
    marginRight: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  balanceAmount: { fontWeight: '600', fontSize: 16, color: '#222' },
  containtView: {
    backgroundColor: '#fff',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    height: '93%',
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
    // borderRadius: 8,
    marginHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderRadius: 1,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    // width: '100%'
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
    marginBottom: 30,
    marginHorizontal: 0,
    backgroundColor: '#fff',
  },
  toolsRow: {
    flexDirection: 'row',
    // justifyContent: 'center',
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
    // borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
  },
  selectedTimeFrame: {
    // backgroundColor: '#1992FC',
    // borderRadius: 6,
  },
  timeFrameText: {
    fontSize: 16,
    color: '#111',
  },
  selectedTimeFrameText: {
    color: '#111',
    fontWeight: '500',
  },
  candleDetailsBox: {
    position: 'absolute',
    top: 25,
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
  calculatedText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
    // fontWeight: 'bold',
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
