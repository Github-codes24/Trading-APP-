/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import MainScreen from './src/screens/auth/MainScreen';
import RegisterScreen from './src/screens/auth/register/RegisterScreen';
import EmailScreen from './src/screens/auth/register/EmailScreen';
import EnterPassScreen from './src/screens/auth/register/EnterPassScreen';
import SignInScreen from './src/screens/auth/SignIn/SignInScreen';
import AccountScreen from './src/screens/auth/home/AccountScreen';
import PerformanceScreen from './src/screens/auth/home/PerformanceScreen';
import WithdrawScreen from './src/screens/auth/home/WithdrawScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
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
        <Stack.Screen name="WithdrawScreen" component={WithdrawScreen} />
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
