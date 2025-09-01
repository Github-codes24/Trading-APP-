/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setBalance } from '../../../store/balanceSlice';
import { getUniqueId } from 'react-native-device-info';

export default function SignInScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [isPasswordHidden, setIsPasswordHidden] = React.useState<boolean>(true);

  const getFriendlyError = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const deviceId = getUniqueId(); // unique device ID
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      const userDocRef = firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const data = userDoc.data();
        if (data?.isLoggedIn && data?.deviceId !== deviceId) {
          Alert.alert('Error', 'User is already logged in on another device.');
          return;
        }
      }

      // ✅ Mark user as logged in on this device
      await userDocRef.set(
        { isLoggedIn: true, deviceId },
        { merge: true }
      );

      // ✅ Save current user email locally
      await AsyncStorage.setItem('current_user_email', email);

      // ✅ Load user-specific balance
      const savedBalance = await AsyncStorage.getItem(`balance_${uid}`);
      dispatch(setBalance(savedBalance ? JSON.parse(savedBalance) : 0));

      // ✅ Navigate based on passcode
      const isPasscodeSet = await AsyncStorage.getItem(`isPasscodeSet_${email}`);
      navigation.navigate(isPasscodeSet === 'true' ? 'PasscodeLoginScreen' : 'SetPasscodeScreen');
    } catch (error: any) {
      console.log('Login error full:', error);
      Alert.alert('Login Failed', getFriendlyError(error.code || 'unknown'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={styles.grow} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.helper}>Please enter your email address and password</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={isPasswordHidden}
                autoCapitalize="none"
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity onPress={() => setIsPasswordHidden(v => !v)} style={styles.eyeButton}>
                <Icon name={isPasswordHidden ? 'eye' : 'eye-off'} size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>I forgot my password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111111' },
  grow: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  helper: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  passwordRow: { position: 'relative' },
  passwordInput: {},
  eyeButton: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 'auto', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  primaryButton: { backgroundColor: '#FFD100', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#111111', fontSize: 16, fontWeight: '600' },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  secondaryText: { color: '#6B7280', fontSize: 14 },
});
