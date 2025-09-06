/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';   // ✅ Redux import
import { store } from './src/store';      
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBalance } from './src/store/balanceSlice';  // ✅ import action
import auth from '@react-native-firebase/auth';         // ✅ import firebase auth

// screens
import MainScreen from './src/screens/auth/MainScreen';
import RegisterScreen from './src/screens/auth/register/RegisterScreen';
import EmailScreen from './src/screens/auth/register/EmailScreen';
import EnterPassScreen from './src/screens/auth/register/EnterPassScreen';
import SignInScreen from './src/screens/auth/SignIn/SignInScreen';
import AccountScreen from './src/screens/auth/home/AccountScreen';
import PerformanceScreen from './src/screens/auth/home/PerformanceScreen';
import DepositScreen from './src/screens/DepositScreen';
import WithdrawlScreen from './src/screens/WithdrawlScreen';
import DepositStatusScreen from './src/screens/DepositStatusScreen';
import WithdrawStatusScreen from './src/screens/WithdrawStatusScreen';
import TradeDetailScreen from './src/screens/TradeDetailScreen';
import SetPasscodeScreen from './src/screens/SetPasscodeScreen';
import ReEnterPasscodeScreen from './src/screens/ReEnterPasscodeScreen';
import PasscodeLoginScreen from './src/screens/PasscodeLoginScreen';
import TradeScreen from './src/screens/auth/home/TradeScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <Provider store={store}>   
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </Provider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const Stack = createNativeStackNavigator();
  const dispatch = useDispatch();

  // ✅ load balance for current user on app start
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const uid = auth().currentUser?.uid;
        if (!uid) {
          console.log("No user logged in, skipping balance load");
          return;
        }
        const saved = await AsyncStorage.getItem(`balance_${uid}`);
        if (saved !== null) {
          dispatch(setBalance(JSON.parse(saved)));
        } else {
          dispatch(setBalance(0)); // default if not found
        }
      } catch (e) {
        console.log('Error loading balance:', e);
      }
    };

    loadBalance();
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Email" component={EmailScreen} />
        <Stack.Screen name="EnterPass" component={EnterPassScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Performance" component={PerformanceScreen} />

        <Stack.Screen name="DepositScreen" component={DepositScreen} />
        <Stack.Screen name="WithdrawlScreen" component={WithdrawlScreen} />
        <Stack.Screen name="DepositStatus" component={DepositStatusScreen} />
        <Stack.Screen name="WithdrawStatus" component={WithdrawStatusScreen} />

        <Stack.Screen name="SetPasscodeScreen" component={SetPasscodeScreen} />
        <Stack.Screen name="ReEnterPasscodeScreen" component={ReEnterPasscodeScreen} />
        <Stack.Screen name="PasscodeLoginScreen" component={PasscodeLoginScreen} />

        <Stack.Screen
          name="TradeDetail"
          component={TradeDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
