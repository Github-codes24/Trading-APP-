/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Provider } from 'react-redux';   // ✅ Redux import
import { store } from './src/store';      // ✅ aapne banaya hua store

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

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <Provider store={store}>   {/* ✅ Wrap entire app */}
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </Provider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const Stack = createNativeStackNavigator();

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
