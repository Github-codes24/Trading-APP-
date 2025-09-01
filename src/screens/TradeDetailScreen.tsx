/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";
import { FetchTradeDetails, HistoryResponse } from "../services/tradingApi";

const { width } = Dimensions.get("window");

// 🔹 Live Buy/Sell Price Hook
const useLivePrice = () => {
  const [sellPrice, setSellPrice] = useState(109889.55);
  const [buyPrice, setBuyPrice] = useState(109972.48);

  useEffect(() => {
    const interval = setInterval(() => {
      setSellPrice((prev) =>
        parseFloat((prev + (Math.random() - 0.5) * 20).toFixed(2))
      );
      setBuyPrice((prev) =>
        parseFloat((prev + (Math.random() - 0.5) * 20).toFixed(2))
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return { sellPrice, buyPrice };
};

// 🔹 Format Pair Name
const formatInstrumentName = (name) => {
  if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
    return `${name.slice(0, 3)}/${name.slice(3)}`;
  }
  return name;
};

// Time format for display
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

// Time format for tooltip
const formatTimeForTooltip = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year.slice(2)}`;
};

// Time frame options
const timeFrames = [
  // { label: "1 minute", value: 1 },
  // { label: "5 minutes", value: 5 },
  // { label: "15 minutes", value: 15 },
  // { label: "30 minutes", value: 30 },
  // { label: "1 hour", value: 60 },
  // { label: "4 hours", value: 240 },
  { label: "1 day", value: 1 },
  { label: "1 week", value: 7 },
  { label: "1 month", value: 30 },
];

// 🔹 Time Frame Modal Component
const TimeFrameModal = ({ visible, onClose, onSelect, selectedTimeFrame }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
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
            keyExtractor={(item) => item.value.toString()}
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
                    selectedTimeFrame === item.value && styles.selectedTimeFrameText,
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

// 🔹 Dynamic Candlestick Graph with pinch zoom and buy/sell lines
const DynamicGraph = ({ 
  zoom, 
  setZoom, 
  verticalZoom, 
  setVerticalZoom, 
  sellPrice, 
  buyPrice,
  timeFrame 
}) => {
  const [tradeData, setTradeData] = useState<HistoryResponse | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentValue, setCurrentValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const chartHeight = 400;
  const scrollViewRef = useRef(null);

  // base candle width × zoom factor
  const candleSlotWidth = 30 * zoom;
  const barWidth = candleSlotWidth * 0.55;

  // fetch trade data
  useEffect(() => {
    const loadHistory = async () => {
      const res = await FetchTradeDetails("EURUSD", timeFrame);
      if (res) {
        setTradeData(res);
        // Set initial time and value
        if (res.data && res.data.length > 0) {
          setCurrentTime(formatTimeForTooltip(res.data[0].time));
          setCurrentValue(res.data[0].close);
        }
      }
    };
    loadHistory();
  }, [timeFrame]);

  // 🔹 Gesture handler (Pinch for both horizontal and vertical zoom)
  const lastDistance = useRef(0);
  const lastCenterY = useRef(0);
  const isVerticalZoom = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only become the responder for multi-touch events (pinch)
        return evt.nativeEvent.touches.length === 2;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only become the responder for multi-touch events (pinch)
        return evt.nativeEvent.touches.length === 2;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate center point
          const centerY = (touch1.pageY + touch2.pageY) / 2;
          
          // Determine if this is primarily a vertical gesture
          const isVertical = Math.abs(dy) > Math.abs(dx) * 1.5;
          
          if (lastDistance.current === 0) {
            lastDistance.current = distance;
            lastCenterY.current = centerY;
            isVerticalZoom.current = isVertical;
          } else {
            const diff = distance - lastDistance.current;
            
            if (isVerticalZoom.current) {
              // Vertical zoom (pinch with vertical movement)
              if (Math.abs(diff) > 5) {
                setVerticalZoom((vz) =>
                  Math.max(0.5, Math.min(3, vz + diff / 300)) // clamp vertical zoom
                );
                lastDistance.current = distance;
              }
            } else {
              // Horizontal zoom (regular pinch)
              if (Math.abs(diff) > 5) {
                setZoom((z) =>
                  Math.max(0.5, Math.min(3, z + diff / 300)) // clamp zoom
                );
                lastDistance.current = distance;
              }
            }
          }
        }
      },
      onPanResponderRelease: () => {
        lastDistance.current = 0;
        isVerticalZoom.current = false;
      },
      onPanResponderTerminate: () => {
        lastDistance.current = 0;
        isVerticalZoom.current = false;
      },
    })
  ).current;

  // Helper functions for zoom calculations
  const calculateZoomedMax = () => {
    if (!tradeData || !tradeData.data) return 0;
    
    const maxPrice = Math.max(...tradeData.data.map((d) => d.high));
    const minPrice = Math.min(...tradeData.data.map((d) => d.low));
    const midPrice = (maxPrice + minPrice) / 2;
    const baseRange = maxPrice - minPrice;
    
    return midPrice + (baseRange / verticalZoom) / 2;
  };

  const calculateZoomedMin = () => {
    if (!tradeData || !tradeData.data) return 0;
    
    const maxPrice = Math.max(...tradeData.data.map((d) => d.high));
    const minPrice = Math.min(...tradeData.data.map((d) => d.low));
    const midPrice = (maxPrice + minPrice) / 2;
    const baseRange = maxPrice - minPrice;
    
    return midPrice - (baseRange / verticalZoom) / 2;
  };

  // if no data yet
  if (!tradeData || !tradeData.data || tradeData.data.length === 0) {
    return (
      <View
        style={{
          height: chartHeight,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#999" }}>Loading chart...</Text>
      </View>
    );
  }

  const data = tradeData.data;

  // Apply vertical zoom to the price range
  const maxPrice = Math.max(...data.map((d) => d.high));
  const minPrice = Math.min(...data.map((d) => d.low));
  const midPrice = (maxPrice + minPrice) / 2;
  const baseRange = maxPrice - minPrice;
  
  // Calculate zoomed range
  const zoomedRange = baseRange / verticalZoom;
  const zoomedMax = midPrice + zoomedRange / 2;
  const zoomedMin = midPrice - zoomedRange / 2;
  const priceRange = zoomedMax - zoomedMin || 1;

  // Calculate positions for buy and sell lines
  const buyLinePosition = ((zoomedMax - buyPrice) / priceRange) * chartHeight;
  const sellLinePosition = ((zoomedMax - sellPrice) / priceRange) * chartHeight;

  const levels = [zoomedMax, midPrice, zoomedMin];
  const totalWidth = data.length * candleSlotWidth + 60;

  // Get the last candle data
  const lastCandle = data[data.length - 1];
  const isLastCandleBull = lastCandle.close >= lastCandle.open;
  const lastCandleBottomBody = ((Math.min(lastCandle.open, lastCandle.close) - zoomedMin) / priceRange) * chartHeight;
  const lastCandleBodyHeight = Math.abs(((lastCandle.close - lastCandle.open) / priceRange) * chartHeight) || 2;
  const lastCandleCenterX = (data.length - 1) * candleSlotWidth + candleSlotWidth / 2;
  const lastCandleTop = ((zoomedMax - Math.max(lastCandle.open, lastCandle.close)) / priceRange) * chartHeight;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }} {...panResponder.panHandlers}>
      {/* Tooltip */}
      {showTooltip && (
        <View style={[styles.tooltip, { left: tooltipPosition.x, top: tooltipPosition.y }]}>
          <Text style={styles.tooltipText}>{currentTime}</Text>
          <Text style={styles.tooltipText}>{currentValue.toFixed(5)}</Text>
        </View>
      )}

      {/* Price Labels on Right Side */}
      {levels.map((val, i) => {
        const top = ((zoomedMax - val) / priceRange) * chartHeight;
        return (
          <Text
            key={`label-${i}`}
            style={{
              position: "absolute",
              right: 2,
              top: top - 8,
              fontSize: 12,
              fontWeight: "600",
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 2,
              paddingHorizontal: 4,
              borderRadius: 3,
            }}
          >
            {val.toFixed(5)}
          </Text>
        );
      })}

      {/* Buy and Sell Price Labels */}
      <Text
        style={{
          position: "absolute",
          right: 2,
          top: buyLinePosition - 8,
          fontSize: 12,
          fontWeight: "600",
          color: "#1992FC",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 2,
          paddingHorizontal: 4,
          borderRadius: 3,
        }}
      >
        {buyPrice.toFixed(2)}
      </Text>
      <Text
        style={{
          position: "absolute",
          right: 2,
          top: sellLinePosition - 8,
          fontSize: 12,
          fontWeight: "600",
          color: "#ff5b5b",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 2,
          paddingHorizontal: 4,
          borderRadius: 3,
        }}
      >
        {sellPrice.toFixed(2)}
      </Text>

      {/* Last Candle Price Info - Simple version like in the image */}
      <View
        style={{
          position: "absolute",
          left: lastCandleCenterX - 45,
          top: lastCandleTop - 45,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 6,
          borderRadius: 4,
          zIndex: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
          109926.35
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
          109904.75
        </Text>
      </View>

      {/* Scrollable Candles */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          height: chartHeight,
          width: totalWidth,
        }}
        onScroll={(event) => {
          // Update time based on scroll position
          const scrollX = event.nativeEvent.contentOffset.x;
          const visibleStartIndex = Math.floor(scrollX / candleSlotWidth);
          const visibleEndIndex = Math.min(
            data.length - 1,
            Math.floor((scrollX + width) / candleSlotWidth)
          );
          
          if (visibleStartIndex >= 0 && visibleEndIndex < data.length) {
            const midIndex = Math.floor((visibleStartIndex + visibleEndIndex) / 2);
            setCurrentTime(formatTimeForTooltip(data[midIndex].time));
          }
        }}
        scrollEventThrottle={16}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: chartHeight,
            position: "relative",
          }}
        >
          {/* Buy Line (Blue) */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: buyLinePosition,
              height: 1,
              backgroundColor: "#1992FC",
              zIndex: 1,
            }}
          />
          
          {/* Sell Line (Red) */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: sellLinePosition,
              height: 1,
              backgroundColor: "rgba(255, 91, 91, 0.7)",
              zIndex: 1,
            }}
          />

          {/* Grid Lines */}
          {levels.map((val, i) => {
            const top = ((zoomedMax - val) / priceRange) * chartHeight;
            return (
              <View
                key={`grid-${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top,
                  height: 1,
                  backgroundColor: "#ececec",
                }}
              />
            );
          })}

          {/* Candlesticks */}
          {data.map((item, idx) => {
            const isBull = item.close >= item.open;
            const bodyHeight =
              Math.abs(((item.close - item.open) / priceRange) * chartHeight) || 2;
            const wickHeight =
              ((item.high - item.low) / priceRange) * chartHeight;
            const bottomWick =
              ((item.low - zoomedMin) / priceRange) * chartHeight;
            const bottomBody =
              ((Math.min(item.open, item.close) - zoomedMin) / priceRange) *
              chartHeight;

            return (
              <View
                key={idx}
                style={{
                  width: candleSlotWidth,
                  alignItems: "center",
                  position: "relative",
                  height: chartHeight,
                }}
              >
                {/* Wick */}
                <View
                  style={{
                    position: "absolute",
                    bottom: bottomWick,
                    width: 2,
                    height: wickHeight,
                    backgroundColor: isBull ? "#1992FC" : "#ff5b5b",
                    borderRadius: 2,
                  }}
                />
                {/* Body */}
                <View
                  style={{
                    position: "absolute",
                    bottom: bottomBody,
                    width: barWidth,
                    height: Math.max(bodyHeight, 4),
                    backgroundColor: isBull ? "#1992FC" : "#ff5b5b",
                    borderRadius: 2,
                  }}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Time Labels at Bottom */}
      <View style={styles.timeLabels}>
        {data.map((d, i) => {
          // Show fewer labels when zoomed out
          const shouldShow = zoom > 1.5 || i % Math.ceil(3 / zoom) === 0;
          return shouldShow ? (
            <Text key={i} style={styles.timeLabel}>
              {formatDate(d.time)}
            </Text>
          ) : null;
        })}
      </View>
    </View>
  );
};

// 🔹 Trade Detail Screen
const TradeDetailScreen = ({ route }) => {
  const { trade = { name: "EURUSD" } } = route?.params || {};
  const walletBalance = useSelector((state) => state.balance?.amount ?? 0);
  const { sellPrice, buyPrice } = useLivePrice();

  const [zoom, setZoom] = useState(1);
  const [verticalZoom, setVerticalZoom] = useState(1);
  const [timeFrame, setTimeFrame] = useState(5); // Default to 5 minutes
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);

  const leftPercent = 31;
  const rightPercent = 69;

  const handleTimeFrameSelect = (selectedTimeFrame) => {
    setTimeFrame(selectedTimeFrame);
    setShowTimeFrameModal(false);
  };

  const getTimeFrameLabel = () => {
    const selected = timeFrames.find(tf => tf.value === timeFrame);
    return selected ? selected.label.split(' ')[1] : '5m';
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.balanceBar}>
        <View style={styles.balanceBox}>
          <Text style={styles.demoBadge}>Real</Text>
          <Text style={styles.balanceAmount}>
            {walletBalance ? `${walletBalance.toFixed(2)} USD` : "0.00 USD"}
          </Text>
          <Icon
            name="more-vertical"
            size={14}
            color="#111"
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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

      {/* Open / Pending Row */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Open 0</Text>
        <Text style={styles.statusText}>Pending 0</Text>
      </View>

      {/* Chart */}
      <View style={styles.chartBox}>
        <DynamicGraph 
          zoom={zoom} 
          setZoom={setZoom} 
          verticalZoom={verticalZoom}
          setVerticalZoom={setVerticalZoom}
          sellPrice={sellPrice}
          buyPrice={buyPrice}
          timeFrame={timeFrame}
        />
      </View>

      {/* ✅ Tools Row */}
      <View style={styles.toolsRow}>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="sliders" size={16} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolBtn} 
          activeOpacity={0.7}
          onPress={() => setShowTimeFrameModal(true)}
        >
          <Text style={{ fontWeight: "600", color: "#444" }}>{getTimeFrameLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="bar-chart-2" size={16} color="#777" />
        </TouchableOpacity>
      </View>

      {/* Time Frame Modal */}
      <TimeFrameModal
        visible={showTimeFrameModal}
        onClose={() => setShowTimeFrameModal(false)}
        onSelect={handleTimeFrameSelect}
        selectedTimeFrame={timeFrame}
      />

      {/* Buy/Sell Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#ff5b5b" }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTitle}>Sell</Text>
          <Text style={styles.actionPrice}>{sellPrice.toFixed(2)}</Text>
          <Text style={styles.actionSub}>{leftPercent}%</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#1992FC" }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTitle}>Buy</Text>
          <Text style={styles.actionPrice}>{buyPrice.toFixed(2)}</Text>
          <Text style={styles.actionSub}>{rightPercent}%</Text>
        </TouchableOpacity>
      </View>

      {/* Buy/Sell % Bar */}
      <View style={styles.percentBarWrapper}>
        <View style={[styles.percentBarLeft, { flex: leftPercent }]} />
        <View style={[styles.percentBarRight, { flex: rightPercent }]} />
      </View>
    </View>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  balanceBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  balanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    maxWidth: 160,
  },
  demoBadge: {
    backgroundColor: "#edeff5",
    color: "#999",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
  },
  balanceAmount: { fontWeight: "600", fontSize: 16, color: "#222" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  pairText: { fontSize: 18, fontWeight: "700", color: "#222" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  icon: { marginLeft: 14 },
  statusRow: {
    flexDirection: "row",
    paddingHorizontal: 19,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a2a8b4",
    marginRight: 18,
  },
  chartBox: {
    height: "50%",
    marginBottom: 30,
    marginHorizontal: 8,
    backgroundColor: "#fff",
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: -24,
    left: 0,
    right: 0,
    paddingHorizontal: 2,
  },
  timeLabel: { fontSize: 13, color: "#9b9b9b", fontWeight: "600" },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 4,
    zIndex: 100,
    transform: [{ translateX: -50 }, { translateY: -60 }],
  },
  tooltipText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 9,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  toolBtn: {
    marginHorizontal: 10,
    backgroundColor: "#ececec",
    paddingVertical: 7,
    paddingHorizontal: 23,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
  },
  bottomBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 32,
    width: "100%",
    height: 54,
    alignItems: "center",
  },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  actionPrice: { fontSize: 17, fontWeight: "700", color: "#fff" },
  actionSub: { fontSize: 12, fontWeight: "500", color: "#fff", marginTop: 2 },
  divider: { width: 1, backgroundColor: "#fff", height: "80%" },
  percentBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    height: 5,
    flexDirection: "row",
    width: "100%",
  },
  percentBarLeft: {
    backgroundColor: "#ff5b5b",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  percentBarRight: {
    backgroundColor: "#1992FC",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  timeFrameItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedTimeFrame: {
    backgroundColor: "#1992FC",
    borderRadius: 6,
  },
  timeFrameText: {
    fontSize: 16,
    color: "#333",
  },
  selectedTimeFrameText: {
    color: "white",
    fontWeight: "600",
  },
});

export default TradeDetailScreen;