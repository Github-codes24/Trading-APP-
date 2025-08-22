import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface TabItem {
  key: string;
  title: string;
  icon: string;
  iconActive: string;
}

interface BottomTabsProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

const tabItems: TabItem[] = [
  {
    key: 'accounts',
    title: 'Accounts',
    icon: 'grid',
    iconActive: 'grid'
  },
  {
    key: 'trade',
    title: 'Trade',
    icon: 'bar-chart-2',
    iconActive: 'bar-chart-2'
  },
  {
    key: 'insights',
    title: 'Insights',
    icon: 'globe',
    iconActive: 'globe'
  },
  {
    key: 'performance',
    title: 'Performance',
    icon: 'bar-chart',
    iconActive: 'bar-chart'
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'user',
    iconActive: 'user'
  }
];

const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {tabItems.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={isActive ? '#1F2937' : '#9CA3AF'}
              style={styles.icon}
            />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 8,
    },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default BottomTabs;
