import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ReEnterPasscodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { passcode: initialPasscode, email } = route.params as {
    passcode: string;
    email: string;
  };

  const [passcode, setPasscode] = useState("");

  const handleNumberPress = (num: string) => {
    if (passcode.length < 6) {
      const newCode = passcode + num;
      setPasscode(newCode);

      if (newCode.length === 6) {
        verifyPasscode(newCode);
      }
    }
  };

  const handleDelete = () => {
    setPasscode(passcode.slice(0, -1));
  };

  const verifyPasscode = async (enteredPasscode: string) => {
    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    if (enteredPasscode === initialPasscode) {
      await AsyncStorage.setItem(`passcode_${email}`, enteredPasscode);
      await AsyncStorage.setItem(`isPasscodeSet_${email}`, "true");
      Alert.alert("Success", "Passcode set successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Account" as never),
        },
      ]);
    } else {
      Alert.alert("Error", "Passcodes do not match");
      setPasscode("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Re-enter passcode</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Re-enter the passcode to confirm</Text>

      {/* Dots */}
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
      <View style={styles.keypadWrapper}>
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
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#000" },
  subtitle: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  keypadWrapper: {
    flex: 1,
    justifyContent: "flex-end", // push keypad down
    marginBottom: 20,
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
