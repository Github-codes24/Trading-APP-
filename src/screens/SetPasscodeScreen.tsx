import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeBiometrics from "react-native-biometrics";

export default function SetPasscodeScreen() {
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [biometricDone, setBiometricDone] = useState(false); // track biometric

  useEffect(() => {
    const init = async () => {
      // Load user email
      const userEmail = await AsyncStorage.getItem("current_user_email");
      if (userEmail) setEmail(userEmail.trim());

      // Biometric authentication on mount
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { available } = await rnBiometrics.isSensorAvailable();

        if (available) {
          await rnBiometrics.simplePrompt({ promptMessage: "Confirm your identity" });
        }
      } catch (error) {
        console.log("Biometric error:", error);
      } finally {
        // after biometric (success or cancel), allow passcode entry
        setBiometricDone(true);
      }
    };

    init();
  }, []);

  const handleNumberPress = async (num: string) => {
    if (!biometricDone) return; // wait until biometric is done

    if (passcode.length < 6) {
      const newCode = passcode + num;
      setPasscode(newCode);

      if (newCode.length === 6) {
        if (!email) return;
        await AsyncStorage.setItem(`passcode_${email}`, newCode);
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
    if (!biometricDone) return;
    setPasscode(passcode.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color="#000" />
        <Text style={styles.headerTitle}>Set passcode</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Set a passcode now to access your account quickly and securely
      </Text>

      {/* Dots */}
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

      {/* Keypad */}
      {biometricDone && (
        <View style={styles.keypad}>
          {["1","2","3","4","5","6","7","8","9"].map((num) => (
            <TouchableOpacity key={num} style={styles.key} onPress={() => handleNumberPress(num)}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#000", marginLeft: 10 },
  subtitle: { marginTop: 15, textAlign: "left", fontSize: 14, color: "#555" },
  flexSpacer: { flex: 1, justifyContent: "center" },
  dotsContainer: { flexDirection: "row", justifyContent: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 6 },
  keypad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  key: { width: "30%", margin: "1.5%", aspectRatio: 1, justifyContent: "center", alignItems: "center" },
  keyText: { fontSize: 28, fontWeight: "500", color: "#000" },
});
