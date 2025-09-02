/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import BottomTabs from '../../../components/BottomTabs';
import PerformanceScreen from './PerformanceScreen';
import ProfileScreen from './ProfileScreen';
import TradeScreen from './TradeScreen';
import InsightsScreen from './InsightsScreen';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ redux
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

type PositionsTab = 'Open' | 'Pending' | 'Closed';

const COLORS = {
  bg: '#f9f9f9',
  text: '#111111',
  textMuted: '#6B7280',
  chipBg: '#F5F6F7',
  chipText: '#6B7280',
  card: '#FFFFFF',
  circle: '#efeff1',
  soft: '#F3F4F6',
  divider: '#E5E7EB',
  active: '#23272F',
  actionActive: '#fddf03',
  loss: '#FF3B30',
  profit: '#34C759',
};

const SIZES = {
  header: 38,
  balance: 27,
  chip: 12,
  tab: 16,
  actionIcon: 42,
  chevronCircle: 35,
  topIcon: 28,
};

// ---------- CHIP ----------
const Chip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const CircleButton: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <View style={styles.circleIconButton}>{children}</View>;

// ---------- ACTION ITEM ----------
const ActionItem: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  verticalDots?: boolean;
  onPress?: () => void;
}> = ({ icon, label, active, verticalDots, onPress }) => (
  <TouchableOpacity
    style={styles.actionItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.actionIconWrap,
        active ? styles.actionIconActive : styles.actionIconIdle,
      ]}
    >
      {label === 'Trade' ? (
        <Image
          source={require('../../../assets/images/tradeIconn.png')}
          style={styles.tradeIcon}
          resizeMode="contain"
        />
      ) : label === 'Deposit' ? (
        <Image
          source={require('../../../assets/images/depositIcon.png')}
          style={styles.depositIcon}
          resizeMode="contain"
        />
      ) : label === 'Withdraw' ? (
        <Image
          source={require('../../../assets/images/withdrawIconn.png')}
          style={styles.withdrawIcon}
          resizeMode="contain"
        />
      ) : label === 'Details' ? (
        <Image
          source={require('../../../assets/images/detailsIcon.png')}
          style={[
            styles.detailsIcon,
            verticalDots && { transform: [{ rotate: '90deg' }] },
          ]}
          resizeMode="contain"
        />
      ) : (
        <Feather name={icon} size={22} color={active ? '#fff' : '#000000'} />
      )}
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ---------- ACCOUNT CARD ----------
const AccountCard: React.FC<{
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  navigation: any;
}> = ({ onDepositPress, onWithdrawPress, navigation }) => {
  const balance = useSelector((state: RootState) => state.balance.amount);

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeaderRow}>
        <View>
          <Text style={styles.accountTitle}>
            RISING TRADERS <Text style={styles.hashGrey}>#79555989</Text>
          </Text>
          <View style={styles.chipsRow}>
            <Chip label="MT5" />
            <Chip label="Standard" />
            <Chip label="Real" />
          </View>
        </View>
        <View style={styles.circleSmall}>
          <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
        </View>
      </View>

      <Text style={styles.balanceText}>{balance.toFixed(2)} INR</Text>

      <View style={styles.actionsRow}>
        <ActionItem
          icon="activity"
          label="Trade"
          active
          onPress={() =>
            navigation.navigate('TradeDetail', { trade: { name: 'XAUUSD' } })
          }
        />
        <ActionItem
          icon="arrow-down-circle"
          label="Deposit"
          onPress={onDepositPress}
        />
        <ActionItem
          icon="arrow-up-circle"
          label="Withdraw"
          onPress={onWithdrawPress}
        />
        <ActionItem icon="more-horizontal" label="Details" verticalDots />
      </View>
    </View>
  );
};

// ✅ Trade history getter
const getTradeHistory = async () => {
  try {
    const tradesJSON = await AsyncStorage.getItem('tradeHistory');
    return tradesJSON ? JSON.parse(tradesJSON) : [];
  } catch (error) {
    console.error('Error retrieving trade history:', error);
    return [];
  }
};

// ---------- MAIN UI ----------
const AccountsUI: React.FC<{
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  setActiveTab: (tab: string) => void;
}> = ({ onDepositPress, onWithdrawPress, setActiveTab }) => {
  const [positionsTab, setPositionsTab] = useState<PositionsTab>('Open');
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTrades = async () => {
      const trades = await getTradeHistory();
      setTradeHistory(trades);
    };
    fetchTrades();
  }, []);

  const positionsContent = useMemo(() => {
    if (positionsTab === 'Open') {
      if (tradeHistory.length > 0) {
        return (
          <View style={styles.positionsWrap}>
            {tradeHistory.map((trade, index) => (
              <View key={index} style={styles.tradeCard}>
                <View style={styles.tradeRow}>
                  <Fontisto name="bitcoin" size={18} color="#F7931A" />
                  <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                  <Text
                    style={[
                      styles.tradePL,
                      { color: (trade.pl || 0) >= 0 ? COLORS.profit : COLORS.loss },
                    ]}
                  >
                    {(trade.pl || 0) >= 0 ? '+' : ''}
                    {(trade.pl || 0).toFixed(2)} USD
                  </Text>
                </View>
                <Text style={styles.tradeDetails}>
                  {trade.side} {trade.lot} lot at {trade.entryPrice}
                </Text>
              </View>
            ))}
          </View>
        );
      }
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyTitle}>No open positions</Text>
        </View>
      );
    }
    if (positionsTab === 'Pending') {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyTitle}>No pending orders</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyTitle}>No closed orders</Text>
      </View>
    );
  }, [positionsTab, tradeHistory]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topToolbar}>
        <Image
          source={require('../../../assets/images/clockIcon.png')}
          style={{
            width: SIZES.topIcon,
            height: SIZES.topIcon,
            marginRight: 16,
          }}
          resizeMode="contain"
        />
        <View style={styles.bellWrapper}>
          <Image
            source={require('../../../assets/images/BellIcon.png')}
            style={{ width: SIZES.topIcon, height: SIZES.topIcon }}
            resizeMode="contain"
          />
          <View style={styles.badge} />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Accounts</Text>
        <View style={{ flex: 1 }} />
        <CircleButton>
          <Feather name="plus" size={20} color="#111111" />
        </CircleButton>
      </View>

      {/* ✅ Account card with Redux balance */}
      <AccountCard
        onDepositPress={onDepositPress}
        onWithdrawPress={onWithdrawPress}
        navigation={navigation}
      />

      {/* Tabs */}
      <View style={styles.segmentRow}>
        <View style={styles.segmentTabs}>
          {['Open', 'Pending', 'Closed'].map(t => {
            const active = positionsTab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setPositionsTab(t as PositionsTab)}
              >
                <View style={styles.segmentTabItem}>
                  <Text
                    style={[
                      styles.segmentLabel,
                      active && styles.segmentActive,
                    ]}
                  >
                    {t}
                  </Text>
                  {active && <View style={styles.segmentIndicator} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.sortButton}>
          <Image
            source={require('../../../assets/images/upDownArrow.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.belowTabsDivider} />

      {positionsContent}
    </ScrollView>
  );
};

// ---------- SCREEN ----------
const AccountScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={
          activeTab === 'accounts'
            ? styles.mainContent
            : styles.mainContentNoPad
        }
      >
        {activeTab === 'accounts' && (
          <AccountsUI
            onDepositPress={() => navigation.navigate('DepositScreen')}
            onWithdrawPress={() => navigation.navigate('WithdrawlScreen')}
            setActiveTab={setActiveTab} // pass setter for tab switching
          />
        )}
        {activeTab === 'trade' && <TradeScreen />}
        {activeTab === 'performance' && <PerformanceScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
      </View>

      <BottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
};

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mainContent: { flex: 1, paddingHorizontal: 16, backgroundColor: COLORS.bg },
  mainContentNoPad: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 24, backgroundColor: COLORS.bg },

  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 35,
    marginBottom: 8,
  },
  bellWrapper: { position: 'relative', marginRight: 8 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: SIZES.header,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.circle,
  },

  accountCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 18,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },

  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  hashGrey: { color: COLORS.textMuted, fontWeight: '400', fontSize: 13 },
  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  chip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  chipText: { fontSize: SIZES.chip, fontWeight: '500', color: COLORS.chipText },

  circleSmall: {
    marginLeft: 'auto',
    width: SIZES.chevronCircle,
    height: SIZES.chevronCircle,
    borderRadius: SIZES.chevronCircle / 2,
    backgroundColor: COLORS.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginRight: 5,
  },

  balanceText: {
    fontSize: SIZES.balance,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 16,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -18,
  },
  actionItem: { width: '25%', alignItems: 'center' },
  actionIconWrap: {
    width: SIZES.actionIcon,
    height: SIZES.actionIcon,
    borderRadius: SIZES.actionIcon / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconIdle: { backgroundColor: COLORS.soft },
  actionIconActive: { backgroundColor: COLORS.actionActive },
  actionLabel: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  tradeIcon: { width: 24, height: 24, alignSelf: 'center' },
  depositIcon: { width: 26, height: 26, alignSelf: 'center' },
  withdrawIcon: { width: 26, height: 26, alignSelf: 'center' },
  detailsIcon: { width: 26, height: 26, alignSelf: 'center' },

  segmentRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  segmentTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
  },
  segmentTabItem: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  segmentLabel: {
    fontSize: SIZES.tab,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  segmentActive: { color: COLORS.active, fontWeight: '600' },
  segmentIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: COLORS.active,
    borderRadius: 1,
  },
  sortButton: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  belowTabsDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginTop: 6,
    marginBottom: 10,
  },

  positionsWrap: {
    paddingTop: 4,
    width: '100%',
    backgroundColor: COLORS.bg,
  },

  tradeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tradeSymbol: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.text,
  },
  tradePL: {
    fontSize: 14,
    fontWeight: '600',
  },
  tradeDetails: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 26,
  },

  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 6,
    backgroundColor: COLORS.bg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#23272F',
    textAlign: 'center',
      },

  // ---------- Additional Styles ----------
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  noDataIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
    tintColor: COLORS.textMuted,
    alignSelf: 'center',
  },

  // generic button style (optional, for reuse)
  buttonPrimary: {
    backgroundColor: COLORS.active,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // divider for card sections
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 8,
  },

  // placeholder for future states (like loader/spinner)
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default AccountScreen;