import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const topMovers = [
  { pair: "BTC/XAU", value: "33.29151", change: "+1.63%" },
  { pair: "BTC/AUD", value: "173437.60", change: "+1.54%" },
  { pair: "BTC/THB", value: "3636493.00", change: "+1.49%" },
  { pair: "BTC", value: "112862.77", change: "+1.45%" },
];

const tradingSignals = [
  {
    title: "XAG/USD: rebound expected",
    time: "10:22 AM",
    image: "https://dummyimage.com/200x120/cccccc/000000&text=Silver",
  },
  {
    title: "XAU/USD: intraday support around 3384.00",
    time: "10:21 AM",
    image: "https://dummyimage.com/200x120/cccccc/000000&text=Gold",
  },
];

const events = [
  { title: "6-Month T-Bill Auction", flag: "🇸🇬", time: "10:30 AM – 25 minutes ago" },
  { title: "Balance of Trade", flag: "🇸🇪", time: "11:30 AM – In 34 minutes" },
  { title: "Unemployment Rate", flag: "🇭🇺", time: "12:00 PM – In 1 hour" },
];

const news = [
  {
    title: "Stellar Price Forecast: XLM shows early signs of recovery",
    time: "34 minutes ago",
    image: "https://dummyimage.com/80x80/cccccc/000000&text=News",
  },
];

const InsightsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.realTag}>REAL</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balance}>0.00 USD</Text>
          <TouchableOpacity>
            <MaterialIcons name="more-vert" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Insights title */}
      <Text style={styles.header}>Insights</Text>

      {/* Top Movers */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>TOP MOVERS</Text>
          <TouchableOpacity>
            <Text style={styles.showMore}>Show more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={topMovers}
          keyExtractor={(item) => item.pair}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.moverCard}>
              <Text style={styles.moverPair}>{item.pair}</Text>
              <Text style={styles.moverValue}>{item.value}</Text>
              <Text style={styles.moverChange}>{item.change}</Text>
            </View>
          )}
        />
      </View>

      {/* Trading Signals */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>TRADING SIGNALS</Text>
          <TouchableOpacity>
            <Text style={styles.showMore}>Show more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={tradingSignals}
          keyExtractor={(item) => item.title}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.signalCard}>
              <Image source={{ uri: item.image }} style={styles.signalImage} />
              <Text style={styles.signalTitle}>{item.title}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.signalTag}>Intraday</Text>
                <Text style={styles.signalTime}>{item.time}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
          <TouchableOpacity>
            <Text style={styles.showMore}>Show more</Text>
          </TouchableOpacity>
        </View>
        {events.map((item, index) => (
          <View key={index} style={styles.eventCard}>
            <Text style={styles.eventFlag}>{item.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Top News */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>TOP NEWS</Text>
          <TouchableOpacity>
            <Text style={styles.showMore}>Show more</Text>
          </TouchableOpacity>
        </View>
        {news.map((item, index) => (
          <View key={index} style={styles.newsCard}>
            <Image source={{ uri: item.image }} style={styles.newsImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  realTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balance: { fontSize: 16, fontWeight: "700", color: "#111", marginRight: 4 },

  header: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#111" },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  showMore: { fontSize: 13, fontWeight: "500", color: "#0062ea" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  moverCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  moverPair: { fontSize: 13, fontWeight: "600", color: "#333" },
  moverValue: { fontSize: 14, marginVertical: 4, fontWeight: "500" },
  moverChange: { fontSize: 13, color: "#16a34a", fontWeight: "600" },

  signalCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginRight: 12,
    borderRadius: 8,
    width: 200,
  },
  signalImage: { width: "100%", height: 100, borderRadius: 6, marginBottom: 8 },
  signalTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  signalTag: { fontSize: 12, color: "#0062ea", fontWeight: "600" },
  signalTime: { fontSize: 12, color: "#666" },

  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  eventFlag: { fontSize: 20, marginRight: 10 },
  eventTitle: { fontSize: 14, fontWeight: "500", color: "#111" },
  eventTime: { fontSize: 12, color: "#666" },

  newsCard: { flexDirection: "row", marginBottom: 12, alignItems: "center" },
  newsImage: { width: 60, height: 60, borderRadius: 6, marginRight: 10 },
  newsTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  newsTime: { fontSize: 12, color: "#666", marginTop: 4 },
});

export default InsightsScreen;
