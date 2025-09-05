// src/screens/DepositStatusScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { deposit } from "../store/balanceSlice";

export default function DepositStatusScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { amount } = route.params || { amount: "0.00" };
  const dispatch = useDispatch();

  // 🔥 Dispatch deposit once when screen mounts
  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      dispatch(deposit(Number(amount)));
    }
  }, [amount]);

  // 🔥 Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Account" }],
        });
        return true; // prevent default behavior
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);

      return () => subscription.remove(); // <-- correct way to remove listener
    }, [navigation])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Account" }],
            })
          }
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Status</Text>
      </View>

      {/* Status Message */}
      <Text style={styles.successTitle}>Deposit is in Your Account!</Text>
      <Text style={styles.subText}>
        Your deposit is accepted. You can start trading now.
      </Text>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.accepted}>● Accepted</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Transaction amount</Text>
          <Text style={styles.value}>{amount} USD</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", padding: 16,marginTop:15 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "600", marginLeft: 10, color: "#000" },
  successTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginTop: 10, color: "#000" },
  subText: { textAlign: "center", marginTop: 6, fontSize: 14, color: "#555" },
  card: { backgroundColor: "#fff", marginTop: 30, padding: 16, borderRadius: 8, elevation: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 15, color: "#333" },
  accepted: { fontSize: 15, color: "green", fontWeight: "600" },
  value: { fontSize: 15, color: "#000", fontWeight: "500" },
});
