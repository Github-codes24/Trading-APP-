import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");

const useLivePrice = () => {
  const [sellPrice, setSellPrice] = useState(1.1658);
  const [buyPrice, setBuyPrice] = useState(1.1659);

  useEffect(() => {
    const interval = setInterval(() => {
      setSellPrice(prev => parseFloat((prev + (Math.random() - 0.5) * 0.0001).toFixed(5)));
      setBuyPrice(prev => parseFloat((prev + (Math.random() - 0.5) * 0.0001).toFixed(5)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { sellPrice, buyPrice };
};

const formatInstrumentName = (name: string) => {
  if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
    return `${name.slice(0, 3)}/${name.slice(3)}`;
  }
  return name;
};

const DynamicGraph = () => {
  const data = [
    { time: "03:25", open: 1.16280, high: 1.16280, low: 1.16280, close: 1.16280 },
    { time: "07:35", open: 1.16460, high: 1.16460, low: 1.16460, close: 1.16460 },
    { time: "11:45", open: 1.16550, high: 1.16550, low: 1.16550, close: 1.16550 },
    { time: "15:55", open: 1.16586, high: 1.16586, low: 1.16586, close: 1.16586 },
    { time: "20:05", open: 1.16595, high: 1.16595, low: 1.16595, close: 1.16595 },
  ];
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;
  const barWidth = (width - 32) / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.graphArea}>
        {data.map((item, index) => {
          const isBullish = item.close >= item.open;
          const bodyHeight = Math.abs(((item.close - item.open) / priceRange) * 200);
          const bottom = ((Math.min(item.open, item.close) - minPrice) / priceRange) * 200;

          return (
            <View key={index} style={styles.candleStickContainer}>
              {/* Wick (High to Low) */}
              <View
                style={{
                  height: ((item.high - item.low) / priceRange) * 200,
                  backgroundColor: isBullish ? "#3b82f6" : "#ef4444",
                  width: 2,
                  alignSelf: "center",
                  position: "absolute",
                  bottom: ((item.low - minPrice) / priceRange) * 200,
                }}
              />
              {/* Body */}
              <View
                style={{
                  height: bodyHeight,
                  backgroundColor: isBullish ? "#3b82f6" : "#ef4444",
                  width: barWidth * 0.6,
                  alignSelf: "center",
                  position: "absolute",
                  bottom,
                }}
              />
            </View>
          );
        })}
        {/* Grid Lines */}
        {[maxPrice, ((maxPrice + minPrice) / 2), minPrice].map((price, index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: "#e5e7eb",
              top: `${(1 - (price - minPrice) / priceRange) * 100}%`,
            }}
          />
        ))}
      </View>
      <View style={styles.priceLabelsRight}>
        <Text style={styles.priceLabel}>{maxPrice.toFixed(5)}</Text>
        <Text style={styles.priceLabel}>{((maxPrice + minPrice) / 2).toFixed(5)}</Text>
        <Text style={styles.priceLabel}>{minPrice.toFixed(5)}</Text>
      </View>
      <View style={styles.timeLabels}>
        {data.map((item, index) => (
          <Text key={index} style={styles.timeLabel}>{item.time}</Text>
        ))}
      </View>
    </View>
  );
};

const TradeDetailScreen = ({ route }: any) => {
  const { trade } = route.params;
  const walletBalance = useSelector((state: any) => state.balance?.amount ?? 0);
  const { sellPrice, buyPrice } = useLivePrice();

  return (
    <View style={styles.container}>
      {/* Top Balance Capsule */}
      <View style={styles.balanceBar}>
        <View style={styles.balanceBox}>
          <Text style={styles.demoBadge}>Real</Text>
          <Text style={styles.balanceAmount}>
            {walletBalance ? `${walletBalance.toFixed(2)} INR` : "0.00 INR"}
          </Text>
          <Icon name="more-vertical" size={14} color="#111" style={{ marginLeft: 4 }} />
        </View>
        <Icon name="more-horizontal" size={20} color="#111" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pairText}>{formatInstrumentName(trade.name)}</Text>
        <View style={styles.headerIcons}>
          <Icon name="clock" size={20} color="#111" style={styles.icon} />
          <Icon name="settings" size={20} color="#111" style={styles.icon} />
          <Icon name="maximize" size={20} color="#111" style={styles.icon} />
          <Icon name="more-vertical" size={20} color="#111" />
        </View>
      </View>

      {/* Open / Pending Row */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Open 0</Text>
        <Text style={styles.statusText}>Pending 0</Text>
      </View>

      {/* Graph */}
      <View style={styles.chartBox}>
        <DynamicGraph />
      </View>

      {/* Timeframe + Icons */}
      <View style={styles.toolsRow}>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="sliders" size={16} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Text style={{ fontWeight: "600" }}>5m</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} activeOpacity={0.7}>
          <Icon name="bar-chart-2" size={16} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Bottom Buy / Sell Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#ef4444" }]} activeOpacity={0.85}>
          <Text style={styles.actionTitle}>Sell</Text>
          <Text style={styles.actionPrice}>{sellPrice}</Text>
          <Text style={styles.actionSub}>62%</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#3b82f6" }]} activeOpacity={0.85}>
          <Text style={styles.actionTitle}>Buy</Text>
          <Text style={styles.actionPrice}>{buyPrice}</Text>
          <Text style={styles.actionSub}>38%</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Updated Styles
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
    justifyContent: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    maxWidth: 160,
  },
  demoBadge: {
    backgroundColor: "#d1fae5",
    color: "#059669",
    fontWeight: "700",
    fontSize: 12,
    marginRight: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceAmount: { fontWeight: "600", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "space-between",
  },
  pairText: { fontSize: 18, fontWeight: "600" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  icon: { marginLeft: 14 },
  statusRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusText: { fontSize: 14, fontWeight: "500", marginRight: 20 },
  chartContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  graphArea: {
    flexDirection: "row",
    height: 200,
    alignItems: "flex-end",
    position: "relative",
  },
  candleStickContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  priceLabelsRight: {
    flexDirection: "column",
    justifyContent: "space-between",
    height: 200,
    position: "absolute",
    right: 0,
    paddingRight: 4,
  },
  priceLabel: { fontSize: 12, color: "#6b7280" },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
    width: width - 32,
  },
  timeLabel: { fontSize: 12, color: "#6b7280" },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  toolBtn: {
    marginHorizontal: 12,
    backgroundColor: "#f9fafb",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  bottomBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    height: 60,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 12, fontWeight: "700", color: "#fff" },
  actionPrice: { fontSize: 14, fontWeight: "700", color: "#fff", marginVertical: 1 },
  actionSub: { fontSize: 10, fontWeight: "500", color: "#fff" },
  divider: { width: 1, backgroundColor: "#fff" },
});

export default TradeDetailScreen;