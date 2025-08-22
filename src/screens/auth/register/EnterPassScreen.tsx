import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

const EnterPassScreen: React.FC = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  const passwordLength = password.length;
 
  const meetsLength = useMemo(() => passwordLength >= 8 && passwordLength <= 15, [passwordLength]);
  const hasUpperAndLower = useMemo(() => /[a-z]/.test(password) && /[A-Z]/.test(password), [password]);
  const hasNumbersOrSpecial = useMemo(() => /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password), [password]);

  const isFormValid = meetsLength && hasUpperAndLower && hasNumbersOrSpecial;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a password</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.inputLabel}>Password</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            secureTextEntry={isPasswordHidden}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isPasswordHidden ? 'Show password' : 'Hide password'}
            onPress={() => setIsPasswordHidden(prev => !prev)}
            style={styles.eyeButton}
          >
            <Icon name={isPasswordHidden ? "eye" : "eye-off"} size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.rulesContainer}>
          <View style={styles.ruleRow}>
            <View style={styles.bullet} />
            <Text style={styles.ruleText}>Use from 8 to 15 characters</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.counterText}>{passwordLength}</Text>
          </View>
          <View style={styles.ruleRow}>
            <View style={styles.bullet} />
            <Text style={styles.ruleText}>Use both uppercase and lowercase letters</Text>
          </View>
          <View style={styles.ruleRow}>
            <View style={styles.bullet} />
            <Text style={styles.ruleText}>
              Use a combination of numbers and English letters and supported special characters
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        disabled={!isFormValid}
        style={[styles.continueButton, !isFormValid ? styles.continueButtonDisabled : styles.continueButtonEnabled]}
        onPress={() => {}}
      >
        <Text style={[styles.continueButtonText, !isFormValid ? styles.continueTextDisabled : styles.continueTextEnabled]}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7A7F85',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 44,
    fontSize: 16,
    color: '#000000',
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
  },
  rulesContainer: {
    marginTop: 12,
    gap: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#AEB3B9',
    marginTop: 7,
    marginRight: 8,
  },
  ruleText: {
    color: '#52565A',
    fontSize: 13,
    flexShrink: 1,
  },
  counterText: {
    color: '#9BA1A6',
    fontSize: 12,
    marginLeft: 8,
  },
  continueButton: {
    paddingVertical: 14,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  continueButtonDisabled: {
    backgroundColor: '#F7F8FA',
    borderColor: '#E5E7EA',
  },
  continueButtonEnabled: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueTextDisabled: {
    color: '#B7BCC2',
  },
  continueTextEnabled: {
    color: '#000000',
  },
});

export default EnterPassScreen;


