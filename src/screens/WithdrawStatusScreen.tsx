// src/screens/WithdrawStatusScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { withdraw } from "../store/balanceSlice";

export default function WithdrawStatusScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { amount } = (route.params as { amount?: number }) || { amount: 0 };

  // Update balance in Redux after withdrawal
  useEffect(() => {
    if (amount > 0) {
      dispatch(withdraw(amount));
    }
  }, [amount, dispatch]);

  // 🔥 Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Account" }],
        });
        return true; // prevent default back behavior
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);

      return () => subscription.remove();
    }, [navigation])
  );

  const handleClose = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Account" }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Status</Text>
      </View>

      {/* Status Message */}
      <Text style={styles.successTitle}>Withdrawal Done</Text>
      <Text style={styles.subText}>Your withdrawal is accepted.</Text>

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
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
    marginTop:15
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 10,
    color: "#000",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
    color: "#000",
  },
  subText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    color: "#555",
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 30,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: "#333",
  },
  accepted: {
    fontSize: 15,
    color: "green",
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
});
