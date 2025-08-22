import React from 'react';
import { TouchableOpacity, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

export default function SignInScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [isPasswordHidden, setIsPasswordHidden] = React.useState<boolean>(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={styles.grow} />
        </View>

        <View style={styles.body}>
          <Text style={styles.helper}>Please enter your email address and password</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder=""
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
                placeholder=""
                secureTextEntry={isPasswordHidden}
                autoCapitalize="none"
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsPasswordHidden((v) => !v)}
                style={styles.eyeButton}
              >
                <Icon name={isPasswordHidden ? "eye" : "eye-off"} size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={() => navigation.navigate('Account' as never)}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>I forgot my password</Text>
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
    paddingTop: 8,
  },
  helper: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  secondaryText: {
    color: '#6B7280',
    fontSize: 14,
  },
});


