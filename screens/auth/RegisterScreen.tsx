import React from 'react';
import { Image, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [isConfirmedNonUSTaxResident, setIsConfirmedNonUSTaxResident] = React.useState<boolean>(false);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your residence</Text>
          <View style={styles.grow} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>Select your residence</Text>

          <TouchableOpacity accessibilityRole="button" style={styles.selectorRow}>
            <Text style={styles.selectorIcon}>🌐</Text>
            <Text style={styles.selectorText}>Country / region</Text>
            <View style={styles.grow} />
            <Text style={styles.chevron}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isConfirmedNonUSTaxResident }}
            onPress={() => setIsConfirmedNonUSTaxResident((v) => !v)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, isConfirmedNonUSTaxResident && styles.checkboxChecked]}>
              {isConfirmedNonUSTaxResident ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              I declare and confirm that I am not a citizen or
              {'\n'}resident of the US for tax purposes.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={!isConfirmedNonUSTaxResident}
            style={[styles.primaryButton, !isConfirmedNonUSTaxResident && styles.primaryButtonDisabled]}
            onPress={() => navigation.navigate('Email' as never)}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction}>
            <Text style={styles.partnerIcon}>👥</Text>
            <Text style={styles.secondaryText}>Partner code (Optional)</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#111111',
    includeFontPadding: false,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  grow: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F2F4F7',
  },
  selectorIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#111111',
  },
  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FFD100',
    borderColor: '#FFD100',
  },
  checkboxTick: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    color: '#111111',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#FFD100',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#FFEFB3',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  partnerIcon: {
    fontSize: 14,
  },
  secondaryText: {
    color: '#6B7280',
    fontSize: 14,
  },
});


