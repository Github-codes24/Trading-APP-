import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import AccountScreen from '../screens/auth/home/AccountScreen';
import PerformanceScreen from '../screens/auth/home/PerformanceScreen';
import TradeScreen from '../screens/auth/home/TradeScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens for other tabs
const InsightsScreen = () => (
  <AccountScreen />
);

const ProfileScreen = () => (
  <AccountScreen />
);

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Accounts':
              iconName = 'grid';
              break;
            case 'Trade':
              iconName = 'bar-chart-2';
              break;
            case 'Insights':
              iconName = 'globe';
              break;
            case 'Performance':
              iconName = 'bar-chart';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1F2937',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#F9FAFB',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 20,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '400',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accounts" component={AccountScreen} />
      <Tab.Screen name="Trade" component={TradeScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
