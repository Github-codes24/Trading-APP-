import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const PasscodeLoginScreen = () => {
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState("");
  const [savedPasscode, setSavedPasscode] = useState("");

  useEffect(() => {
    // 🔹 fetch saved passcode from storage
    const loadPasscode = async () => {
      const code = await AsyncStorage.getItem("user_passcode");
      if (code) setSavedPasscode(code);
    };
    loadPasscode();
  }, []);

  const handleNumberPress = (num: string) => {
    if (passcode.length < 6) {
      const newCode = passcode + num;
      setPasscode(newCode);

      if (newCode.length === 6) {
        setTimeout(() => {
          if (newCode === savedPasscode) {
            // ✅ Passcode matched → navigate to AccountsScreen
            navigation.replace("AccountsScreen" as never);
          } else {
            Alert.alert("Wrong Passcode", "Please try again.");
            setPasscode("");
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPasscode(passcode.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>
      <Text style={styles.subtitle}>Login securely using your passcode</Text>

      {/* Passcode Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < passcode.length ? "#FFD700" : "#E0E0E0" },
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.key}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.key} />
        <TouchableOpacity
          style={styles.key}
          onPress={() => handleNumberPress("0")}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PasscodeLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600", color: "#000", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 40 },
  dotsContainer: { flexDirection: "row", justifyContent: "center", marginVertical: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 6 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 30,
  },
  key: {
    width: "30%",
    margin: "1.5%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { fontSize: 28, fontWeight: "500", color: "#000" },
});
