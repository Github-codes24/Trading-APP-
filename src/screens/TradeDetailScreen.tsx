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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';

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
  return name;
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

//  TIMEFRAMES
const timeFrames = [
  { label: '1 day', value: 1 },
  { label: '1 week', value: 7 },
  { label: '1 month', value: 30 },
];

// LIVE BUY/SELL PRICE HOOK (1s updates)

const useLivePrice = (symbol: string) => {
  const [sellPrice, setSellPrice] = useState(109889.55);
  const [buyPrice, setBuyPrice] = useState(109972.48);

  useEffect(() => {
    let volatility = 20;
    let baseSell = 109889.55;
    let baseBuy = 109972.48;

    if (symbol === 'ETHUSD') {
      baseSell = 2898.55;
      baseBuy = 2902.48;
      volatility = 5;
    } else if (symbol === 'XAUUSD') {
      baseSell = 2189.55;
      baseBuy = 2192.48;
      volatility = 8;
    } else if (symbol === 'EURUSD') {
      baseSell = 1.0889;
      baseBuy = 1.0897;
      volatility = 0.002;
    }

    setSellPrice(baseSell);
    setBuyPrice(baseBuy);

    const interval = setInterval(() => {
      setSellPrice(prev =>
        parseFloat(
          (prev + (Math.random() - 0.5) * volatility).toFixed(
            symbol === 'EURUSD' ? 4 : 2,
          ),
        ),
      );
      setBuyPrice(prev =>
        parseFloat(
          (prev + (Math.random() - 0.5) * volatility).toFixed(
            symbol === 'EURUSD' ? 4 : 2,
          ),
        ),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { sellPrice, buyPrice };
};

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
  sellPrice: number;
  buyPrice: number;
  timeFrame: number;
  symbol: string;
}

const DynamicGraph: React.FC<GraphProps> = ({
  zoom,
  setZoom,
  verticalZoom,
  setVerticalZoom,
  sellPrice,
  buyPrice,
  timeFrame,
  symbol,
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
  const handleCandleTap = useCallback((candle: Candle) => {
    if (selectedCandle === candle && showCandleDetails) {
      // If the same candle is tapped again, hide the details
      setShowCandleDetails(false);
      setSelectedCandle(null);
    } else {
      // Show details for the tapped candle
      setSelectedCandle(candle);
      setShowCandleDetails(true);
    }
  }, [selectedCandle, showCandleDetails]);

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

  // buy/sell overlay Y positions
  const buyLineY = ((zoomedMax - buyPrice) / priceRange) * chartHeight;
  const sellLineY = ((zoomedMax - sellPrice) / priceRange) * chartHeight;

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
        style={{ position: 'absolute', right: 2, top: 0, bottom: 0, zIndex: 4 }}
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
            {buyPrice.toFixed(priceDigits)}
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
            {sellPrice.toFixed(priceDigits)}
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
  route?: { params?: { trade?: { name: string } } };
}

const TradeDetailScreen: React.FC<TradeDetailScreenProps> = ({ route }) => {
  const { trade = { name: 'BTCUSD' } } = route?.params || {};
  const walletBalance = useSelector(
    (state: any) => state?.balance?.amount ?? 0,
  );
  const { sellPrice, buyPrice } = useLivePrice(trade.name);

  const [zoom, setZoom] = useState(1);
  const [verticalZoom, setVerticalZoom] = useState(1);
  const [timeFrame, setTimeFrame] = useState(60);
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);

  const leftPercent = 31;
  const rightPercent = 69;

  const handleTimeFrameSelect = (v: number) => {
    setTimeFrame(v);
    setShowTimeFrameModal(false);
  };

  const getTimeFrameLabel = () =>
    timeFrames.find(tf => tf.value === timeFrame)?.label || '7d';

  return (
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
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name="dollar-sign"
            size={22}
            color="#1992FC"
            style={{ marginRight: 7 }}
          />
          <Text style={styles.pairText}>
            {formatInstrumentName(trade.name)}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <Icon name="clock" size={20} color="#111" style={styles.icon} />
          <Icon name="maximize" size={20} color="#111" style={styles.icon} />
          <Icon name="settings" size={20} color="#111" style={styles.icon} />
          <Icon name="more-vertical" size={20} color="#111" />
        </View>
      </View>

      {/* COUNTS */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Open 0</Text>
        <Text style={styles.statusText}>Pending 0</Text>
      </View>

      {/* CHART AREA (FULL HEIGHT MINUS BOTTOM ACTIONS) */}
      <View style={styles.chartBox}>
        <DynamicGraph
          zoom={zoom}
          setZoom={setZoom}
          verticalZoom={verticalZoom}
          setVerticalZoom={setVerticalZoom}
          sellPrice={sellPrice}
          buyPrice={buyPrice}
          timeFrame={timeFrame}
          symbol={trade.name}
        />
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

      {/* BUY / SELL ACTIONS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ff5b5b' }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTitle}>Sell</Text>
          <Text style={styles.actionPrice}>
            {sellPrice.toFixed(trade.name === 'EURUSD' ? 4 : 2)}
          </Text>
          <Text style={styles.actionSub}>{leftPercent}%</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#1992FC' }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTitle}>Buy</Text>
          <Text style={styles.actionPrice}>
            {buyPrice.toFixed(trade.name === 'EURUSD' ? 4 : 2)}
          </Text>
          <Text style={styles.actionSub}>{rightPercent}%</Text>
        </TouchableOpacity>
      </View>

      {/* PERCENT BAR */}
      <View style={styles.percentBarWrapper}>
        <View style={[styles.percentBarLeft, { flex: leftPercent }]} />
        <View style={[styles.percentBarRight, { flex: rightPercent }]} />
      </View>
    </View>
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
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    maxWidth: 160,
  },
  demoBadge: {
    backgroundColor: '#edeff5',
    color: '#999',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
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
  pairText: { fontSize: 18, fontWeight: '700', color: '#222' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginLeft: 14 },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a2a8b4',
    marginRight: 18,
  },
  chartBox: {
    height: '50%',
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
    bottom: 32,
    width: '100%',
    height: 54,
    alignItems: 'center',
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  actionPrice: { fontSize: 17, fontWeight: '700', color: '#fff' },
  actionSub: { fontSize: 12, fontWeight: '500', color: '#fff', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#fff', height: '80%' },
  percentBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    height: 5,
    flexDirection: 'row',
    width: '100%',
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
  selectedTimeFrame: { backgroundColor: '#1992FC', borderRadius: 6 },
  timeFrameText: { fontSize: 16, color: '#333' },
  selectedTimeFrameText: { color: 'white', fontWeight: '600' },
  
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
});

export default TradeDetailScreen;