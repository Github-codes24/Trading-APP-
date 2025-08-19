import React from 'react';
import { Image, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_LOGO_PNG = 'https://developers.google.com/identity/images/g-logo.png';

export default function MainScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.grow} />
          <TouchableOpacity accessibilityRole="button" style={styles.helpButton}>
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>exness</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.primaryButtonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => navigation.navigate('SignIn' as never)}>
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>or</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity accessibilityRole="button" style={styles.googleButton}>
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
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    includeFontPadding: false,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#000000',
  },
  footer: {
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD100',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F4F7',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
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
    height: 48,
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
    fontSize: 16,
    fontWeight: '500',
  },
});


