import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import CountryPicker, { Country } from 'react-native-country-picker-modal';

export default function RegisterScreen() {
  const [isConfirmedNonUSTaxResident, setIsConfirmedNonUSTaxResident] = useState(false);
  const [country, setCountry] = useState<Country | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const navigation = useNavigation();

  const onSelectCountry = (selectedCountry: Country) => {
    setCountry(selectedCountry);
    setIsPickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your residence</Text>
          <View style={styles.grow} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>Select your residence</Text>

          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setIsPickerVisible(true)}
          >
            <Icon name="globe" size={18} color="#111111" style={styles.selectorIcon} />
            <Text style={styles.selectorText}>
              {country ? country.name : 'Country / region'}
            </Text>
            <View style={styles.grow} />
            <Icon name="chevron-right" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Country Picker Modal */}
          {isPickerVisible && (
            <CountryPicker
              visible={isPickerVisible}
              withFilter
              withFlag
              withAlphaFilter
              withCallingCode={false}
              withEmoji
              onSelect={onSelectCountry}
              onClose={() => setIsPickerVisible(false)}
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isConfirmedNonUSTaxResident }}
            onPress={() => setIsConfirmedNonUSTaxResident((v) => !v)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, isConfirmedNonUSTaxResident && styles.checkboxChecked]}>
              {isConfirmedNonUSTaxResident ? <Icon name="check" size={14} color="#111111" /> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              I declare and confirm that I am not a citizen or
              {'\n'}resident of the US for tax purposes.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!isConfirmedNonUSTaxResident || !country}
            style={[styles.primaryButton, (!isConfirmedNonUSTaxResident || !country) && styles.primaryButtonDisabled]}
            onPress={() => navigation.navigate('Email' as never, { country: country?.name })}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction}>
            <Icon name="users" size={14} color="#6B7280" />
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
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#111111',
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
  secondaryText: {
    color: '#6B7280',
    fontSize: 14,
  },
});


