/* eslint-disable no-alert */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function DepositScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState("");

  const handleContinue = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    navigation.navigate("DepositStatus", { amount });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
      </View>

      {/* Enter Deposit Amount */}
      <View style={styles.content}>
        <Text style={styles.label}>Enter deposit amount</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#999"
          />
          <Text style={styles.currency}>USD</Text>
        </View>

        <Text style={styles.rangeText}>0.00 – 10,000,000,000.00 USD</Text>
      </View>

      {/* Bottom Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 12,
    color: "#000",
  },
  content: {
    marginTop: 20,
  },
  label: {
    textAlign: "center",
    fontSize: 15,
    color: "#333",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: "#000",
  },
  currency: {
    fontSize: 16,
    color: "#333",
  },
  rangeText: {
    marginTop: 8,
    fontSize: 13,
    color: "#555",
    marginLeft: 10,
  },
  button: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
function alert(arg0: string) {
  throw new Error("Function not implemented.");
}

