import React from 'react';
import { Alert, Image, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Import your local image
import ExnessLogo from '../../assets/images/exnessLogo.png';

const GOOGLE_LOGO_PNG = 'https://developers.google.com/identity/images/g-logo.png';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '303441476435-u8i2ndr7rdvanc7sp0s6bu9apikcs5rn.apps.googleusercontent.com',
  offlineAccess: true,
});

export default function MainScreen() {
  const navigation = useNavigation();

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    console.log('Google userInfo:', userInfo);
    Alert.alert('Google Sign-In Success', JSON.stringify(userInfo, null, 2));
  } catch (error: any) {
    // Log full error for debugging
    console.error('Google Sign-In Error:', error);

    // Build detailed message
    const errorDetails = `
Code: ${error.code ?? 'N/A'}
Message: ${error.message ?? 'N/A'}
Details: ${error.details ?? 'N/A'}
Stack: ${error.stack ?? 'N/A'}
Is Cancelled: ${error.code === statusCodes.SIGN_IN_CANCELLED}
In Progress: ${error.code === statusCodes.IN_PROGRESS}
Play Services Not Available: ${error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE}
    `;

    // Show in alert
    Alert.alert('Google Sign-In Failed', errorDetails);
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.grow} />
          <TouchableOpacity accessibilityRole="button" style={styles.helpButton}>
            <Icon name="help-circle" size={16} color="#111111" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image source={ExnessLogo} style={styles.logoImage} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text style={styles.primaryButtonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignIn' as never)}
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>or</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <View style={styles.googleContent}>
              <Image source={{ uri: GOOGLE_LOGO_PNG }} style={styles.googleIcon} />
              <Text style={styles.googleText}>Google</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  grow: { flex: 1 },
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 290, height: 84, resizeMode: 'contain' },
  footer: { paddingBottom: 24, gap: 12 },
  primaryButton: { backgroundColor: '#FFD100', height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#111111', fontSize: 14, fontWeight: '400' },
  secondaryButton: { backgroundColor: '#F2F4F7', height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#111111', fontSize: 14, fontWeight: '500' },
  separatorRow: { marginTop: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  separatorText: { color: '#6B7280', fontSize: 14 },
  googleButton: { backgroundColor: '#F2F4F7', height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  googleContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  googleIcon: { width: 18, height: 18, resizeMode: 'contain' },
  googleText: { color: '#111111', fontSize: 14, fontWeight: '400' },
});
