import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [loading, setLoading] = useState(false); // ⬅ loading state

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

    setLoading(true); // ⬅ start spinner

    try {
      const deviceId = getUniqueId();
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      const userDocRef = firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      const now = Date.now();

      if (userDoc.exists()) {
        const data = userDoc.data();
        const lastLogin = data?.lastLogin || 0;
        if (data?.isLoggedIn && data?.deviceId !== deviceId && now - lastLogin < 5 * 60 * 1000) {
          Alert.alert('Error', 'User is already logged in on another device.');
          setLoading(false);
          return;
        }
      }

      // Navigate immediately
      const isPasscodeSet = await AsyncStorage.getItem(`isPasscodeSet_${email}`);
      navigation.navigate(isPasscodeSet === 'true' ? 'PasscodeLoginScreen' : 'SetPasscodeScreen');

      // Firestore write in background
      userDocRef.set(
        { isLoggedIn: true, deviceId, lastLogin: now },
        { merge: true }
      ).catch(err => console.log('Firestore login set error:', err));

      // Save current user email
      AsyncStorage.setItem('current_user_email', email).catch(err => console.log(err));

      // Load balance in parallel
      AsyncStorage.getItem(`balance_${uid}`).then(savedBalance =>
        dispatch(setBalance(savedBalance ? JSON.parse(savedBalance) : 0))
      );

    } catch (error: any) {
      Alert.alert('Login Failed', getFriendlyError(error.code || 'unknown'));
    } finally {
      setLoading(false); // ⬅ stop spinner
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
          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleSignIn}
            disabled={loading} // ⬅ disable while loading
          >
            {loading ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
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
