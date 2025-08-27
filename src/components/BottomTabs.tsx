/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface TabItem {
  key: string;
  title: string;
  icon?: any;
  featherIcon?: string;
}

interface BottomTabsProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

const tabItems: TabItem[] = [
  { key: 'accounts', title: 'Accounts', icon: require('../assets/images/Accountsicon.png') },
  { key: 'trade', title: 'Trade', icon: require('../assets/images/tradeIconn.png') },
  { key: 'insights', title: 'Insights', featherIcon: 'globe' },
  { key: 'performance', title: 'Performance', icon: require('../assets/images/performanceIcon.png') },
  { key: 'profile', title: 'Profile', icon: require('../assets/images/profileIcon.png') },
];

const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topShadow} />
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
              {tab.icon ? (
                <Image
                  source={tab.icon}
                  style={[styles.icon, { tintColor: isActive ? '#1F2937' : '#9CA3AF' }]}
                  resizeMode="contain"
                />
              ) : (
                <Icon
                  name={tab.featherIcon!}
                  size={24}
                  color={isActive ? '#1F2937' : '#9CA3AF'}
                  style={styles.icon}
                />
              )}
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
  },
  topShadow: {
    height: 1,
    backgroundColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  container: {
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
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
