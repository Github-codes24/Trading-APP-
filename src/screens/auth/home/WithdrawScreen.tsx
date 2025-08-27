import React, { useState } from "react";
import {
//   View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";

const WithdrawScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const handleWithdraw = () => {
    if (!amount || !bankAccount) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    Alert.alert("Success", `Withdrawal of $${amount} requested!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Withdraw Funds</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Bank Account"
        value={bankAccount}
        onChangeText={setBankAccount}
      />
      <TouchableOpacity style={styles.button} onPress={handleWithdraw}>
        <Text style={styles.buttonText}>Submit Withdraw</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2e86de",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
