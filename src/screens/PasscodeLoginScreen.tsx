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
import ReactNativeBiometrics from "react-native-biometrics";

const PasscodeLoginScreen = () => {
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState("");
  const [savedPasscode, setSavedPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [biometricDone, setBiometricDone] = useState(false); // track biometric

  useEffect(() => {
    const init = async () => {
      try {
        const userEmail = await AsyncStorage.getItem("current_user_email");
        if (!userEmail) return;
        const trimmedEmail = userEmail.trim();
        setEmail(trimmedEmail);

        const code = await AsyncStorage.getItem(`passcode_${trimmedEmail}`);
        if (code) setSavedPasscode(code);

        // 🔹 Trigger biometric only if passcode exists
        if (code) {
          const rnBiometrics = new ReactNativeBiometrics();
          const { available } = await rnBiometrics.isSensorAvailable();

          if (available) {
            const { success } = await rnBiometrics.simplePrompt({
              promptMessage: "Login with fingerprint",
            });

            if (success) {
              navigation.navigate("Account" as never);
              return; // skip keypad if biometric succeeds
            } else {
              console.log("Biometric canceled or failed");
            }
          } else {
            console.log("Biometric not available");
          }
        }
      } catch (error) {
        console.log("Biometric init error:", error);
      } finally {
        // allow keypad after biometric attempt
        setBiometricDone(true);
      }
    };

    init();
  }, []);

  const handleNumberPress = (num: string) => {
    if (!biometricDone) return; // wait until biometric is done

    if (passcode.length < 6) {
      const newCode = passcode + num;
      setPasscode(newCode);

      if (newCode.length === 6) {
        setTimeout(() => {
          if (newCode === savedPasscode) {
            navigation.navigate("Account" as never);
          } else {
            Alert.alert("Wrong Passcode", "Please try again.");
            setPasscode("");
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (!biometricDone) return;
    setPasscode(passcode.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>
      <Text style={styles.subtitle}>Login securely using your passcode</Text>

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

      {biometricDone && (
        <View style={styles.keypadWrapper}>
          <View style={styles.keypad}>
            {["1","2","3","4","5","6","7","8","9"].map((num) => (
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
      )}
    </View>
  );
};

export default PasscodeLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 40,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 6 },
  keypadWrapper: {
    flex: 1,
    justifyContent: "flex-end",
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
