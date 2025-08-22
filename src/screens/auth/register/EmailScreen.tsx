import React from 'react';
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


const EmailScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter your email</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.introText}>Use this email to sign in to Exness</Text>

        <Text style={styles.inputLabel}>Your email address</Text>
        <TextInput
          style={styles.textInput}
          placeholder=""
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
onPress={() => navigation.navigate('EnterPass' as never)}
        style={styles.continueButton}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingTop: 24,
  },
  introText: {
    fontSize: 16,
    color: '#52565A',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7A7F85',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#FFD600',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#000000', 
    fontSize: 18,
    fontWeight: 'bold',
  },
 
});

export default EmailScreen;