/* eslint-disable @typescript-eslint/no-shadow */
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
  Modal,
  TextInput,
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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  deposit,
  withdraw,
  updateBalanceWithPnl,
} from '../../../store/balanceSlice';
import { USER_MODE } from '../../../services/tradingApi';

// WebSocket URL for fetching historical data
const WS_URL_HISTORY = 'ws://13.201.33.113:8000';

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}
export interface HistoryResponse {
  symbol: string;
  candles: Candle[];
}

interface TradeModalProps {
  visible: boolean;
  trade: TradeData | null;
  currentPrice: number;
  onClose: (trade: TradeData) => void;  // expects trade
  onForceClose: () => void;
}
export interface Trade {
  id: string;
  symbol: string;
  pnl: number;
  type: 'buy' | 'sell';
}
export interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (action: string, selectedInstrument: string) => void;
  openTrades: TradeData[];
  currentPrices: Record<string, number>;
}
export const CloseAllModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  openTrades = [],
  currentPrices = {},
}) => {
  const [selectedInstrument, setSelectedInstrument] =
    useState<string>('All instruments');
  const [selectedAction, setSelectedAction] = useState<string>('Close all');

  const instruments = useMemo(
    () => [
      'All instruments',
      ...new Set((openTrades || []).map(t => t.symbol)),
    ],
    [openTrades],
  );

  const tradesToShow =
    selectedInstrument === 'All instruments'
      ? openTrades || []
      : (openTrades || []).filter(t => t.symbol === selectedInstrument);

  const profitable = (tradesToShow || []).filter(t => {
    if (!(t.status === 'open' || t.status === 'executed')) return false;
    if (!currentPrices || !currentPrices[t.symbol]) return false;

    return (
      (t.type === 'buy' && currentPrices[t.symbol] > t.price) ||
      (t.type === 'sell' && currentPrices[t.symbol] < t.price)
    );
  });

  const losing = (tradesToShow || []).filter(t => {
    if (!(t.status === 'open' || t.status === 'executed')) return false;
    if (!currentPrices || !currentPrices[t.symbol]) return false;

    return (
      (t.type === 'buy' && currentPrices[t.symbol] < t.price) ||
      (t.type === 'sell' && currentPrices[t.symbol] > t.price)
    );
  });

  const buyTrades = (tradesToShow || []).filter(t => t.type === 'buy');
  const sellTrades = (tradesToShow || []).filter(t => t.type === 'sell');

  const calculateTotalPnL = (
    trades: TradeData[],
    user: 'real' | 'demo', // ✅ pass in user mode
  ) => {
    if (!trades || !currentPrices) return 0;

    return trades
      .filter(trade => trade.user === user) // ✅ only include trades for this user
      .reduce((total, trade) => {
        if (!trade || !currentPrices[trade.symbol]) return total;

        const lotSize = trade.lotSize || 0;

        const pnl =
          trade.type === 'buy'
            ? (currentPrices[trade.symbol] - trade.price) * lotSize * 100
            : (trade.price - currentPrices[trade.symbol]) * lotSize * 100;

        return total + pnl;
      }, 0);
  };

  const renderRow = (
    label: string,
    trades: TradeData[],
    user: 'real' | 'demo',
  ) => {
    // ✅ filter trades based on user
    const userTrades = (trades || []).filter(t => t.user === user);

    const totalPnL = calculateTotalPnL(userTrades, user);
    const isProfit = totalPnL >= 0;
    const count = userTrades.length;

    return (
      <TouchableOpacity
        key={label}
        style={styles.row}
        onPress={() => setSelectedAction(label)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <View style={styles.leftContainer}>
            <Text style={styles.rowLabel}>{label}</Text>
            {count > 0 && (
              <View style={styles.countCircleRight}>
                <Text style={styles.countTextRight}>{count}</Text>
              </View>
            )}
          </View>

          <View style={styles.pnlContainer}>
            {count > 0 && (
              <Text
                style={[
                  styles.pnlText,
                  { color: isProfit ? COLORS.profit : COLORS.loss },
                ]}
              >
                {isProfit ? '+' : ''}
                {totalPnL.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </Text>
            )}
            {selectedAction === label && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.topLine} />
          <Text style={styles.title}>Close positions at the market price?</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabRow}
          >
            {(instruments || []).map(inst => (
              <TouchableOpacity
                key={inst}
                style={[
                  styles.tab,
                  selectedInstrument === inst && styles.activeTab,
                ]}
                onPress={() => setSelectedInstrument(inst)}
              >
                <Text
                  style={{
                    color: selectedInstrument === inst ? '#fff' : '#000',
                    fontWeight: '500',
                  }}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {renderRow('Close all', tradesToShow, USER_MODE)}
          <View style={styles.divider} />
          {renderRow('Close all Profitable', profitable, USER_MODE)}
          <View style={styles.divider} />
          {renderRow('Close all Losing', losing, USER_MODE)}
          <View style={styles.divider} />
          {renderRow('Close all Buy', buyTrades, USER_MODE)}
          <View style={styles.divider} />
          {renderRow('Close all Sell', sellTrades, USER_MODE)}
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => onConfirm(selectedAction, selectedInstrument)}
          >
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const FetchTradeDetails = async (
  symbol: string,
  days: number,
): Promise<HistoryResponse | null> => {
  return new Promise((resolve, reject) => {
    try {
      const socket = new WebSocket(WS_URL_HISTORY);
      socket.onopen = () => {
        socket.send(JSON.stringify({ symbol, days }));
      };
      socket.onmessage = event => {
        try {
          const data: HistoryResponse = JSON.parse(event.data);
          resolve(data);
          socket.close();
        } catch (err) {
          reject(err);
          socket.close();
        }
      };
      socket.onerror = err => {
        reject(err);
      };
      socket.onclose = () => {};
    } catch (error) {
      reject(error);
    }
  });
};

export const TradeModal: React.FC<TradeModalProps> = ({
  visible,
  trade,
  currentPrice,
  onClose,
  onForceClose,
}) => {
  if (!trade) return null;

  const pnl =
    trade.type === 'buy'
      ? (currentPrice - trade.price) * trade.lotSize * 100
      : (trade.price - currentPrice) * trade.lotSize * 100;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onForceClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Accounts</Text>
            <Text style={styles.headerSubtitle}>Changes to trading hours</Text>
            <View style={styles.accountInfo}>
              <Text style={styles.standardText}>STANDARD # 259008790</Text>
              <Text style={styles.accountNumber}>#4000741</Text>
            </View>
          </View>

          <View style={styles.tradeDetails}>
            <Text style={styles.symbolText}>
              {trade.formattedSymbol || trade.symbol}
            </Text>
            <Text style={styles.tradeLabel}>
              {trade.type === 'buy' ? 'Buy' : 'Sell'}{' '}
              {trade.lotSize ? trade.lotSize.toFixed(2) : 'N/A'} lot at{' '}
              {trade.price.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.pnlText,
                { color: pnl >= 0 ? COLORS.profit : COLORS.loss },
              ]}
            >
              {pnl >= 0 ? '+' : ''}
              {pnl.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              USD
            </Text>
            <Text style={styles.currentPrice}>{currentPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              Time: {new Date(trade.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.profitLossContainer}>
            <View style={styles.profitLossRow}>
              <Text style={styles.profitLossLabel}>Take Profit</Text>
              <TouchableOpacity style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.noteSetRow}>
              <Text style={styles.noteSetText}>Note set</Text>
              <Text style={styles.priceText}>Price</Text>
            </View>

            <View style={styles.profitLossRow}>
              <Text style={styles.profitLossLabel}>Stop Loss</Text>
              <TouchableOpacity style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.noteSetRow}>
              <Text style={styles.noteSetText}>Not set</Text>
              <Text style={styles.priceText}>Price</Text>
            </View>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerButtonText}>View on chart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerButton} onPress={onClose}>
              <Text style={styles.footerButtonText}>Close order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type PositionsTab = 'Open' | 'Pending' | 'Closed';

export interface TradeData {
  closePrice?: number; // make optional since it's only available after closing
  id: string;
  symbol: string;
  formattedSymbol: string;
  type: 'buy' | 'sell';
  lotSize: number;
  price: number;
  timestamp: string;
  status: 'open' | 'pending' | 'closed';
  user: 'real' | 'demo'; // ✅ added user field
}

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
  profit: '#64D68C',
  loss: '#EF4444',
};

const SIZES = {
  header: 40,
  balance: 27,
  chip: 12,
  tab: 16,
  actionIcon: 50,
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

// ---------- TRADE ITEM COMPONENT ----------
interface TradeItemProps {
  trades: TradeData[];
  currentPrice: number;
  user: 'real' | 'demo';
}

const TradeItem: React.FC<TradeItemProps> = ({
  trades,
  currentPrice,
  user,
}) => {
  // ✅ Filter trades for this user
  const userTrades = trades.filter(t => t.user === user);

  if (userTrades.length === 0) return null; // no trades for this mode

  const totalLotSize = userTrades.reduce(
    (sum, trade) => sum + (trade.lotSize || 0),
    0,
  );

  const totalPnL = userTrades.reduce((sum, trade) => {
    const pnl =
      trade.type === 'buy'
        ? (currentPrice - trade.price) * (trade.lotSize || 0) * 100
        : (trade.price - currentPrice) * (trade.lotSize || 0) * 100;
    return sum + pnl;
  }, 0);

  const tradeCount = userTrades.length;
  const symbol = userTrades[0].symbol;
  const formattedSymbol = userTrades[0].formattedSymbol || symbol;
  const type = userTrades.every(t => t.type === 'buy')
    ? 'buy'
    : userTrades.every(t => t.type === 'sell')
    ? 'sell'
    : 'mixed';

  const getInstrumentIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSD':
        return require('../../../assets/images/bitcoin.png');
      case 'USTEC':
        return require('../../../assets/images/us.png');
      case 'USOIL':
        return require('../../../assets/images/crudeoilbig.png');
      default:
        return null;
    }
  };

  const getFlagIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
        return require('../../../assets/images/us.png');
      case 'ETH':
        return require('../../../assets/images/eth.png');
      case 'JPY':
        return require('../../../assets/images/japan.png');
      case 'EUR':
        return require('../../../assets/images/european-union.png');
      case 'GBP':
        return require('../../../assets/images/flag.png');
      case 'CAD':
        return require('../../../assets/images/canada.png');
      case 'XAU':
        return require('../../../assets/images/xau.png');
      case 'BTC':
        return require('../../../assets/images/bitcoin.png');
      default:
        return require('../../../assets/images/bitcoin.png');
    }
  };

  const formatInstrumentName = (name: string) => {
    if (name && name.length === 6 && /^[A-Z]{6}$/.test(name)) {
      return `${name.slice(0, 3)}/${name.slice(3)}`;
    }
    return name;
  };

  return (
    <View style={styles.tradeItem}>
      <View
        style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}
      >
        {formatInstrumentName(symbol).includes('/') ? (
          <View style={{ flexDirection: 'row', marginTop: -25 }}>
            <Image
              source={getFlagIcon(formatInstrumentName(symbol).slice(0, 3))}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                marginRight: -8,
                marginTop: -6,
              }}
              resizeMode="contain"
            />
            <Image
              source={getFlagIcon(formatInstrumentName(symbol).slice(4, 7))}
              style={{ width: 18, height: 18, borderRadius: 9 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Image
            source={getInstrumentIcon(symbol)}
            style={{ width: 20, height: 20, borderRadius: 10 }}
            resizeMode="contain"
          />
        )}
        <View style={styles.tradeHeader}>
          <View style={styles.tradeInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.tradeSymbol}>{formattedSymbol}</Text>
              {tradeCount > 1 && (
                <View style={styles.tradeCountBadge}>
                  <Text style={styles.tradeCountText}>{tradeCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.tradeType}>
              {type === 'mixed' ? 'Mixed' : type === 'buy' ? 'Buy' : 'Sell'}{' '}
              {totalLotSize.toFixed(2)} lot{' '}
              <Text style={{ color: 'black' }}>
                at{' '}
                {(
                  userTrades.reduce((sum, t) => sum + t.price, 0) /
                  userTrades.length
                ).toFixed(2)}
              </Text>
            </Text>
          </View>
          <View style={styles.tradePnlContainer}>
            <Text
              style={[
                styles.tradePnl,
                { color: totalPnL >= 0 ? COLORS.profit : COLORS.loss },
              ]}
            >
              {totalPnL >= 0 ? '+' : ''}
              {totalPnL.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              USD
            </Text>
            <Text style={styles.tradeValue}>{currentPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ---------- ACCOUNT CARD ----------
interface AccountCardProps {
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  navigation: any;
  totalPnL?: number;
}
const AccountCard: React.FC<AccountCardProps> = ({
  onDepositPress,
  onWithdrawPress,
  navigation,
  totalPnL = 0,
}) => {
  const balance = useSelector((state: RootState) => state.balance.amount);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [accountOptionsModalVisible, setAccountOptionsModalVisible] =
    useState(false);
  const [traderName, setTraderName] = useState('RISING TRADERS');
  const [accountNumber, setAccountNumber] = useState('#79555989');
  const [activeAccountType, setActiveAccountType] = useState('Real');

  useEffect(() => {
    const loadAccountDetails = async () => {
      try {
        const savedTraderName = await AsyncStorage.getItem('traderName');
        const savedAccountNumber = await AsyncStorage.getItem('accountNumber');
        if (savedTraderName) setTraderName(savedTraderName);
        if (savedAccountNumber) setAccountNumber(savedAccountNumber);
      } catch (error) {
        console.error('Error loading account details:', error);
      }
    };
    loadAccountDetails();
  }, []);

  const saveAccountDetails = async () => {
    try {
      await AsyncStorage.setItem('traderName', traderName);
      await AsyncStorage.setItem('accountNumber', accountNumber);
      setDetailsModalVisible(false);
    } catch (error) {
      console.error('Error saving account details:', error);
    }
  };

  const handleAccountOptionSelect = (option: string) => {
    setActiveAccountType(option);
    console.log(`Selected option: ${option}`);
  };

  const displayedBalance = balance + totalPnL;

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeaderRow}>
        <View>
          <Text style={styles.accountTitle}>
            {traderName} <Text style={styles.hashGrey}>{accountNumber}</Text>
          </Text>
          <View style={styles.chipsRow}>
            <Chip label="MT5" />
            <Chip label="Standard" />
            <Chip label={activeAccountType} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.circleSmall}
          onPress={() => setAccountOptionsModalVisible(true)}
        >
          <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.balanceText}>
        {displayedBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{' '}
        USD
      </Text>
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
        <ActionItem
          icon="more-horizontal"
          verticalDots
          label="Details"
          onPress={() => setDetailsModalVisible(true)}
        />
      </View>

      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.title}>Update Account Details</Text>
            <TextInput
              style={styles.input}
              value={traderName}
              onChangeText={setTraderName}
              placeholder="Enter Trader Name"
            />
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter Account Number"
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={saveAccountDetails}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={accountOptionsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAccountOptionsModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.accountTypeModal}>
            <View style={styles.modalHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Accounts</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.plusText}>+</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.accountOptionsContainer}
            >
              {['Real', 'Demo', 'Archived'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.accountOption}
                  onPress={() => handleAccountOptionSelect(option)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContainer}>
                    <Text
                      style={[
                        styles.accountOptionText,
                        activeAccountType === option && styles.activeTabText,
                      ]}
                    >
                      {option}
                    </Text>
                    {activeAccountType === option && (
                      <View style={styles.underline} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Account Card */}
            <TouchableOpacity
              style={styles.accountCardInModal}
              onPress={() => {
                setAccountOptionsModalVisible(false);
                if (activeAccountType === 'Demo') {
                  navigation.navigate('DemoAccountScreen', { balance: 0.0 });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.accountHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountTitle}>
                    {activeAccountType === 'Real'
                      ? 'Rising Trioo'
                      : 'Demo Trader'}{' '}
                    <Text style={styles.hashGrey}>
                      {activeAccountType === 'Real' ? '#3898989' : '#0000000'}
                    </Text>
                  </Text>
                  <View style={styles.chipsRow}>
                    <Chip label="MT5" />
                    <Chip
                      label={activeAccountType === 'Real' ? 'Standard' : 'Zero'}
                    />
                    <Chip label={activeAccountType} />
                  </View>
                </View>

                {/* Balance right side small font */}
                <Text style={styles.smallBalanceText}>
                  {activeAccountType === 'Real'
                    ? displayedBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0.00'}{' '}
                  USD
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const groupTradesByDate = (trades: TradeData[], user: 'real' | 'demo') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return trades
    .filter(trade => trade.user === user) // ✅ only include current user’s trades
    .reduce((groups: Record<string, TradeData[]>, trade) => {
      const tradeDate = new Date(trade.timestamp);
      tradeDate.setHours(0, 0, 0, 0);

      let dateKey: string;
      if (tradeDate.getTime() === today.getTime()) {
        dateKey =
          'Today, ' +
          tradeDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
          });
      } else if (tradeDate.getTime() === yesterday.getTime()) {
        dateKey =
          'Yesterday, ' +
          tradeDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
          });
      } else {
        dateKey = tradeDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(trade);
      return groups;
    }, {});
};


const groupTradesBySymbol = (trades: TradeData[], user: 'real' | 'demo') => {
  return trades
    .filter(trade => trade.user === user) // ✅ keep only trades for current user
    .reduce((groups: Record<string, TradeData[]>, trade) => {
      if (!trade || !trade.symbol) return groups;
      const symbol = trade.symbol;
      if (!groups[symbol]) groups[symbol] = [];
      groups[symbol].push(trade);
      return groups;
    }, {});
};


const AccountsUI: React.FC<{
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  setActiveTab: (tab: string) => void;
  closeAllModalPress: () => void;
}> = ({
  onDepositPress,
  onWithdrawPress,
  setActiveTab,
  closeAllModalPress,
}) => {
  const [positionsTab, setPositionsTab] = useState<PositionsTab>('Open');
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>(
    {},
  );
  const [totalPnL, setTotalPnL] = useState<number>(0);
  const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const balance = useSelector((state: RootState) => state.balance.amount);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const tradesJSON = await AsyncStorage.getItem('tradeHistory');
        if (tradesJSON) {
          const allTrades = JSON.parse(tradesJSON);

          // ✅ Filter trades based on current user mode
          const filteredTrades = allTrades.filter(
            (t: any) => t.user === USER_MODE,
          );

          setTrades(filteredTrades);
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Error loading trades:', error);
        setTrades([]);
      }
    };

    loadTrades();
  }, [USER_MODE]);

  useEffect(() => {
    let interval: any;

    const fetchCurrentPrices = async () => {
      const openTrades = trades.filter(
        trade => trade.status === 'executed' || trade.status === 'open',
      );
      const symbols = [...new Set(openTrades.map(trade => trade.symbol))];

      const prices: Record<string, number> = {};
      let totalPnl = 0;

      for (const symbol of symbols) {
        try {
          const historyData: any = await FetchTradeDetails(symbol, 7);
          if (historyData && historyData.data.length > 0) {
            const latestCandle = historyData.data[historyData.data.length - 1];
            const latestClose = latestCandle.close;

            prices[symbol] = latestClose;

            const symbolTrades = openTrades.filter(
              trade => trade.symbol === symbol,
            );
            for (const trade of symbolTrades) {
              const pnl =
                trade.type === 'buy'
                  ? (latestClose - trade.price) * trade.lotSize * 100
                  : (trade.price - latestClose) * trade.lotSize * 100;
              totalPnl += pnl;
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          prices[symbol] = 0;
        }
      }

      setCurrentPrices(prices);
      setTotalPnL(totalPnl);
    };

    if (trades.length > 0) {
      fetchCurrentPrices();
      interval = setInterval(fetchCurrentPrices, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trades, balance, dispatch]);

 const handleCloseTrade = async (trade: TradeData) => {
  try {
    const updatedTrades = trades.map(t =>
      (t.id === selectedTrade?.id && t.user === USER_MODE) // ✅ wrapped condition
        ? {
            ...t,
            status: 'closed',
            closePrice: currentPrices[selectedTrade.symbol] || selectedTrade.price,
          }
        : t
    );

    const exitPrice = currentPrices[selectedTrade?.symbol] || selectedTrade?.price;

    // ✅ Calculate PnL only if this trade belongs to the active user mode
    if (selectedTrade && selectedTrade.user === USER_MODE) {
      const pnl =
        selectedTrade.type === 'buy'
          ? (exitPrice - selectedTrade.price) * selectedTrade.lotSize * 100
          : (selectedTrade.price - exitPrice) * selectedTrade.lotSize * 100;

      dispatch(deposit(pnl));
    }

    setTrades(updatedTrades);
    await AsyncStorage.setItem('tradeHistory', JSON.stringify(updatedTrades));
    setModalVisible(false);
    setSelectedTrade(null);
  } catch (error) {
    console.error('Error closing trade:', error);
  }
};



  const openTrades = useMemo(
    () =>
      trades.filter(
        trade => trade.status === 'executed' || trade.status === 'open',
      ),
    [trades],
  );
  const closedTrades = useMemo(
    () => trades.filter(trade => trade.status === 'closed'),
    [trades],
  );
  const groupedOpenTrades = useMemo(
    () => groupTradesBySymbol(openTrades, USER_MODE),
    [openTrades],
  );

 const handleTradeItemPress = (trades: TradeData[]) => {
  // ✅ filter trades by active user mode
  const userTrades = trades.filter(t => t.user === USER_MODE);

  if (userTrades.length > 0) {
    setSelectedTrade(userTrades[0]); // pick the first trade for this user
    setModalVisible(true);
  }
};


  const [closeAllModelVisible, setcloseAllModelVisible] = useState(false);

  const handleCloseAllTrades = () => setcloseAllModelVisible(true);

  const handleConfirm = async (action: string, selectedInstrument: string) => {
    try {
      let tradesToClose = trades.filter(
        t =>
          (selectedInstrument === 'All instruments' ||
            t.symbol === selectedInstrument) &&
          (t.status === 'executed' || t.status === 'open'),
      );

      if (action === 'Close all Profitable') {
        tradesToClose = tradesToClose.filter(t => {
          const current = currentPrices[t.symbol];
          if (!current) return false;
          return (
            (t.type === 'buy' && current > t.price) ||
            (t.type === 'sell' && current < t.price)
          );
        });
      } else if (action === 'Close all Losing') {
        tradesToClose = tradesToClose.filter(t => {
          const current = currentPrices[t.symbol];
          if (!current) return false;
          return (
            (t.type === 'buy' && current < t.price) ||
            (t.type === 'sell' && current > t.price)
          );
        });
      } else if (action === 'Close all Buy') {
        tradesToClose = tradesToClose.filter(t => t.type === 'buy');
      } else if (action === 'Close all Sell') {
        tradesToClose = tradesToClose.filter(t => t.type === 'sell');
      }
      // For 'Close all', no additional filter needed

      const updatedTrades = trades.map(t =>
        tradesToClose.some(closeTrade => closeTrade.id === t.id)
          ? {
              ...t,
              status: 'closed',
              closePrice: currentPrices[t.symbol] || t.price,
            }
          : t,
      );

      let totalPnL = 0;
      tradesToClose.forEach(t => {
        const exitPrice = currentPrices[t.symbol] || t.price;
        const pnl =
          t.type === 'buy'
            ? (exitPrice - t.price) * t.lotSize * 100
            : (t.price - exitPrice) * t.lotSize * 100;
        totalPnL += pnl;
      });

      dispatch(deposit(totalPnL));
      setTrades(updatedTrades);
      await AsyncStorage.setItem('tradeHistory', JSON.stringify(updatedTrades));
      setcloseAllModelVisible(false);
    } catch (error) {
      console.error('Error closing trades:', error);
    }
  };

  const positionsContent = useMemo(() => {
    if (positionsTab === 'Open') {
      return (
        <View style={styles.positionsWrap}>
          {Object.keys(groupedOpenTrades).length > 0 ? (
            <>
              <View style={styles.openTotalProfitlossView}>
                <Text style={styles.openTotalProfitlossTextLb}>Total P/L</Text>
                <Text
                  style={[
                    styles.openTotalProfitlossValueLb,
                    { color: totalPnL >= 0 ? COLORS.profit : COLORS.loss },
                  ]}
                >
                  {totalPnL >= 0 ? '+' : ''}
                  {totalPnL.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  USD
                </Text>
              </View>
              {Object.entries(groupedOpenTrades).map(([symbol, trades]) => (
                <TouchableOpacity
                  key={symbol}
                  onPress={() => handleTradeItemPress(trades)}
                  activeOpacity={0.7}
                >
                  <TradeItem
                    trades={trades}
                    currentPrice={currentPrices[symbol] || trades[0].price}
                    user={USER_MODE} // ✅ add this
                  />
                </TouchableOpacity>
              ))}
              {openTrades.length > 1 && (
                <TouchableOpacity
                  style={styles.closeAllButton}
                  activeOpacity={0.7}
                  onPress={handleCloseAllTrades}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <Image
                      source={require('../../../assets/images/close.png')}
                      style={{ width: 14, height: 14, marginRight: 5 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.closeAllButtonText}>
                      Close all positions
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <CloseAllModal
                visible={closeAllModelVisible}
                onClose={() => setcloseAllModelVisible(false)}
                onConfirm={handleConfirm}
                openTrades={openTrades}
                currentPrices={currentPrices}
              />
            </>
          ) : (
            <>
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyTitle}>No open positions</Text>
              </View>
              <View style={styles.centeredBlock}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.btcRow}
                  onPress={() =>
                    navigation.navigate('TradeDetail', {
                      trade: { name: 'XAUUSD' },
                    })
                  }
                >
                  <View style={styles.btcIconWrap}>
                    <Fontisto name="bitcoin" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.btcText}>XAU/USD - Trade</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exploreMoreButton}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('trade')}
                >
                  <Feather name="menu" size={18} color="#23272F" />
                  <Text style={styles.exploreMoreText}>
                    Explore more instruments
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    if (positionsTab === 'Closed') {
      const grouped = groupTradesByDate(closedTrades, USER_MODE);
      return Object.keys(grouped).length > 0 ? (
        <ScrollView style={styles.positionsWrap}>
          {Object.entries(grouped).map(([date, trades]) => (
            <View key={date}>
              <Text
                style={{
                  paddingVertical: 12,
                  fontSize: 16,
                  fontWeight: '500',
                  color: COLORS.text,
                }}
              >
                {date}
              </Text>
              {trades.map(trade => (
                <TouchableOpacity key={trade.id} activeOpacity={0.7}>
                  <TradeItem
                    trades={[trade]}
                    currentPrice={trade.closePrice || trade.price} user={USER_MODE}                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyTitle}>No closed orders</Text>
        </View>
      );
    }
  }, [positionsTab, openTrades, closedTrades, currentPrices, totalPnL]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topToolbar}>
        <Image
          source={require('../../../assets/images/clockicon.png')}
          style={{
            width: SIZES.topIcon,
            height: SIZES.topIcon,
            marginRight: 16,
          }}
          resizeMode="contain"
        />
        <View style={styles.bellWrapper}>
          <Image
            source={require('../../../assets/images/bellicon.png')}
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

      <AccountCard
        onDepositPress={onDepositPress}
        onWithdrawPress={onWithdrawPress}
        navigation={navigation}
        totalPnL={totalPnL}
      />

      <View style={styles.segmentRow}>
        <View style={styles.segmentTabs}>
          {['Open', 'Pending', 'Closed'].map(t => {
            const active = positionsTab === t;
            const count =
              t === 'Open'
                ? openTrades.length
                : t === 'Pending'
                ? trades.filter(trade => trade.status === 'pending').length
                : closedTrades.length;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setPositionsTab(t as PositionsTab)}
              >
                <View style={styles.segmentTabItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.segmentLabel,
                        active && styles.segmentActive,
                      ]}
                    >
                      {t}
                    </Text>
                    {count > 0 && t !== 'Closed' && (
                      <View
                        style={[
                          styles.tradeCountBadge,
                          t === 'Open' && styles.openTradeCountBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tradeCountText,
                            t === 'Open' && styles.openTradeCountText,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </View>
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
      <TradeModal
        visible={modalVisible}
        trade={selectedTrade}
        currentPrice={
          selectedTrade
            ? currentPrices[selectedTrade.symbol] || selectedTrade.price
            : 0
        }
        onClose={handleCloseTrade}
        onForceClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
};

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
            onWithdrawPress={() => navigation.navigate('WithdrawalScreen')} // Corrected typo from 'WithdrawlScreen'
            setActiveTab={setActiveTab}
            closeAllModalPress={() => {}}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  accountTypeModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    paddingBottom: 10,
  },
  topLine: {
    height: 4,
    backgroundColor: '#E5E7EB',
    width: '20%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#758fa0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  countCircle: {
    backgroundColor: '#E5E7EB', // Light grey background
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000', // Black text
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countCircleRight: {
    backgroundColor: '#f8f8f8ff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countTextRight: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pnlText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 0,
  },
  confirmButton: {
    backgroundColor: '#FFD600',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  closeAllButton: {
    marginTop: 16,
    backgroundColor: '#eeeff1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeAllButtonText: {
    color: '#313236',
    fontSize: 14,
    fontWeight: '500',
    bottom: 2,
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  standardText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  accountNumber: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  symbolText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  profitLossContainer: {
    marginBottom: 16,
  },
  profitLossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profitLossLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  noteSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  noteSetText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  priceText: {
    fontSize: 14,
    color: COLORS.text,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.soft,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  container: { flex: 1, backgroundColor: COLORS.bg },
  mainContent: { flex: 1, paddingHorizontal: 16, backgroundColor: COLORS.bg },
  mainContentNoPad: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 300, backgroundColor: COLORS.bg },
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
    fontSize: 30,
    fontWeight: '500',
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
    borderRadius: 7,
    paddingVertical: 29,
    paddingHorizontal: 18,
    marginBottom: 18,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  accountCardInModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 16,
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
    marginBottom: 8,
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
    paddingBottom: 10,
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
  tradeCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6E8495',
    borderWidth: 0,
    borderColor: '#23272F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  openTradeCountBadge: {
    backgroundColor: '#6E8495',
    borderWidth: 0,
  },
  tradeCountText: {
    fontSize: SIZES.tab - 2,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 10,
  },
  openTradeCountText: {
    color: '#FFFFFF',
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
    marginTop: 0,
    marginBottom: 10,
  },
  positionsWrap: { paddingTop: 4, width: '100%', backgroundColor: COLORS.bg },
  centeredBlock: {
    width: '100%',
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  btcRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEFF1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  btcIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btcText: { fontSize: 17, fontWeight: '600', color: '#000000' },
  exploreMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
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
  tradeItem: {
    backgroundColor: COLORS.card,
    borderRadius: 2,
    padding: 10,
    width: '100%',
    marginBottom: -1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    height: 75,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
    width: '92%',
    bottom: 3,
  },
  tradeInfo: {
    flexDirection: 'column',
  },
  tradeSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  tradeType: {
    fontSize: 14,
    color: '#0070FF',
    marginTop: 7,
  },
  tradePrice: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  tradePnlContainer: {
    alignItems: 'flex-end',
  },
  tradePnl: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  tradeValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  openTotalProfitlossView: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    marginTop: -10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openTotalProfitlossTextLb: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  openTotalProfitlossValueLb: {
    fontSize: 16,
    fontWeight: '500',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  accountOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeAccountOption: {},
  accountOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  accountOptionsContainer: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  plusText: {
    fontSize: 26,
    color: '#111111',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  underline: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.active,
    marginTop: 4,
    borderRadius: 1,
  },
  activeTabText: {
    color: COLORS.active,
    fontWeight: '600',
  },
  accountCardInModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    height: 80, // smaller height
    justifyContent: 'center',
  },

  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallBalanceText: {
    fontSize: 14, // smaller font
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'right',
  },
});

export default AccountScreen;
