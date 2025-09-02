import { Alert } from 'react-native';
import { signInWithGoogle } from '../../services/googleSignIn';
import React from 'react';
import { Image, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Import your local image
import ExnessLogo from '../../assets/images/exnessLogo.png';

const GOOGLE_LOGO_PNG = 'https://developers.google.com/identity/images/g-logo.png';

export default function MainScreen() {
  const navigation = useNavigation();

  const handleGoogleSignIn = async () => {
    try {
      const userInfo = await signInWithGoogle();
      console.log('Google userInfo:', userInfo);
      Alert.alert('Google Sign-In Result', JSON.stringify(userInfo));
      // TODO: Find correct property for email and navigate
      // Example: navigation.navigate('SetPasscodeScreen', { email: userInfo?.user?.email });
    } catch (error: any) {
      // Error already handled in signInWithGoogle
      Alert.alert('Google Sign-In Failed', error?.message ? String(error.message) : 'Unknown error');
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
          {/* Replace text with image */}
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

          <TouchableOpacity accessibilityRole="button" style={styles.googleButton} onPress={handleGoogleSignIn}>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  grow: {
    flex: 1,
  },
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // New style for your logo image
  logoImage: {
    width: 290,
    height: 84,
    resizeMode: 'contain',
  },
  footer: {
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD100',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
  },
  secondaryButton: {
    backgroundColor: '#F2F4F7',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '500',
  },
  separatorRow: {
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#F2F4F7',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  googleText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '400',
  },
});
