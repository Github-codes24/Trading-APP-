import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SetPasscodeScreen() {
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Load current user email from AsyncStorage
  useEffect(() => {
    const fetchEmail = async () => {
      const userEmail = await AsyncStorage.getItem("current_user_email");
      if (userEmail) setEmail(userEmail.trim());
    };
    fetchEmail();
  }, []);

  const handleNumberPress = (num: string) => {
    if (passcode.length < 6) {
      const newCode = passcode + num;
      setPasscode(newCode);

      if (newCode.length === 6) {
        if (!email) {
          Alert.alert("Error", "User email not loaded yet");
          return;
        }
        setTimeout(() => {
          navigation.navigate("ReEnterPasscodeScreen", {
            passcode: newCode,
            email,
          });
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPasscode(passcode.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set passcode</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Set a passcode now to access your account quickly and securely
      </Text>

      {/* Dots (centered vertically) */}
      <View style={styles.flexSpacer}>
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
      </View>

      {/* Keypad pinned bottom */}
      <View style={styles.keypadContainer}>
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
          <TouchableOpacity style={styles.key} onPress={() => handleNumberPress("0")}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          {passcode.length > 0 ? (
            <TouchableOpacity style={styles.key} onPress={handleDelete}>
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
          ) : (
            <View style={styles.key} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginLeft: 10,
  },
  subtitle: {
    marginTop: 15, // 🔹 more spacing like screenshot
    textAlign: "left",
    fontSize: 14,
    color: "#555",
  },
  flexSpacer: {
    flex: 1,
    justifyContent: "center", // 🔹 dots vertically centered
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  keypadContainer: {
    justifyContent: "flex-end",
    paddingBottom: 50, // 🔹 pushes keypad to bottom like screenshot
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
