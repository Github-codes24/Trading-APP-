/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");

// 🔹 Live Buy/Sell Price Hook
const useLivePrice = () => {
  const [sellPrice, setSellPrice] = useState(110223.61);
  const [buyPrice, setBuyPrice] = useState(110245.21);

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

// API CALLING 

const callPostApi = async () => {
    try {
      const response = await fetch("http://13.201.33.113:8000/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: "EURUSD",
          days: 7,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

// 🔹 Candle Data
const candleData = [
  { time: "12:45", open: 111510, high: 111600, low: 111500, close: 111530 },
  { time: "12:46", open: 111510, high: 111680, low: 111420, close: 111000 },
  { time: "12:50", open: 111530, high: 111540, low: 111430, close: 111450 },
  { time: "12:55", open: 111450, high: 111500, low: 111410, close: 111480 },
  { time: "13:00", open: 111480, high: 111600, low: 111480, close: 111590 },
  { time: "13:05", open: 111590, high: 111610, low: 111500, close: 111566 },
  { time: "13:10", open: 111566, high: 111700, low: 111500, close: 111470 },
  { time: "13:15", open: 111470, high: 111600, low: 111450, close: 111400 },
  { time: "13:20", open: 111400, high: 111410, low: 111250, close: 111220 },
  { time: "13:25", open: 111220, high: 111300, low: 111000, close: 111060 },
  { time: "13:30", open: 111060, high: 111100, low: 110800, close: 110650 },
  { time: "13:35", open: 110650, high: 110700, low: 110220, close: 110245 },
  { time: "13:40", open: 110245, high: 110500, low: 110200, close: 110223 },
];

// 🔹 Dynamic Candlestick Graph
const DynamicGraph = ({ zoom }) => {
  const data = candleData;
  const maxPrice = Math.max(...data.map((d) => d.high));
  const minPrice = Math.min(...data.map((d) => d.low));
  const priceRange = maxPrice - minPrice || 1;
  const chartHeight = 400;

  // base candle width × zoom factor
  const candleSlotWidth = 30 * zoom;
  const barWidth = candleSlotWidth * 0.55;

  // Levels for grid & labels
  const levels = [maxPrice, (maxPrice + minPrice) / 2, minPrice];

  // ✅ total width depends on zoom
  const totalWidth = data.length * candleSlotWidth + 60;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Price Labels on Right Side (fixed) */}
      {levels.map((val, i) => {
        const top = (i / (levels.length - 1)) * chartHeight;
        return (
          <Text
            key={`label-${i}`}
            style={{
              position: "absolute",
              right: 2,
              top: top - 8,
              fontSize: 12,
              fontWeight: "600",
              color: "#9b9b9b",
              backgroundColor: "#fff",
              zIndex: 2,
            }}
          >
            {val.toFixed(2)}
          </Text>
        );
      })}

      {/* Scrollable Candles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          height: chartHeight,
          width: totalWidth, // ✅ zoom affects width
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: chartHeight,
            position: "relative",
          }}
        >
          {/* Grid Lines (stick behind candles) */}
          {levels.map((_, i) => {
            const top = (i / (levels.length - 1)) * chartHeight;
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
              Math.abs(((item.close - item.open) / priceRange) * chartHeight) ||
              2;
            const wickHeight =
              ((item.high - item.low) / priceRange) * chartHeight;
            const bottomWick =
              ((item.low - minPrice) / priceRange) * chartHeight;
            const bottomBody =
              ((Math.min(item.open, item.close) - minPrice) / priceRange) *
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
        {data.map((d, i) => (
          <Text key={i} style={styles.timeLabel}>
            {d.time}
          </Text>
        ))}
      </View>
    </View>
  );
};

// 🔹 Trade Detail Screen
const TradeDetailScreen = ({ route }) => {
  const { trade = { name: "BTCUSD" } } = route?.params || {};
  const walletBalance = useSelector((state) => state.balance?.amount ?? 0);
  const { sellPrice, buyPrice } = useLivePrice();

  const [zoom, setZoom] = useState(1);

  const leftPercent = 14;
  const rightPercent = 86;

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
            name="bitcoin"
            size={22}
            color="#FFA638"
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
        <DynamicGraph zoom={zoom} />
      </View>

      {/* Zoom Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom((z) => Math.max(0.5, z - 0.2))}
        >
          <Text style={{ fontWeight: "700", fontSize: 16 }}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom((z) => Math.min(3, z + 0.2))}
        >
          <Text style={{ fontWeight: "700", fontSize: 16 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Timeframe + Icons */}
      <View style={styles.toolsRow}>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="sliders" size={16} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Text style={{ fontWeight: "600", color: "#444" }}>5 m</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="bar-chart-2" size={16} color="#777" />
        </TouchableOpacity>
      </View>

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
    height: 400,
    marginBottom: 18,
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
  zoomBtn: {
    marginHorizontal: 10,
    backgroundColor: "#ececec",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
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
});

export default TradeDetailScreen;
