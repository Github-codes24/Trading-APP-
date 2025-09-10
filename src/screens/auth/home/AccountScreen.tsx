/* eslint-disable react-hooks/exhaustive-deps */
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
import { Swipeable } from 'react-native-gesture-handler';
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
import { deposit, withdraw, loadBalance } from '../../../store/balanceSlice';
import { calculateProfit } from '../../../services/tradingApi';

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

export interface TradeModalProps {
  visible: boolean;
  trade: TradeData | null;
  currentPrice: number;
  onClose: () => void;
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

  // ✅ Reverted to include all trades, including duplicates, for instrument list
  const instruments = useMemo(
    () => ['All instruments', ...openTrades.map(t => t.symbol)],
    [openTrades],
  );

  // ✅ Filtered trades with null check
  const tradesToShow =
    selectedInstrument === 'All instruments'
      ? openTrades
      : openTrades.filter(t => t.symbol === selectedInstrument);

  // ✅ Grouping for profitable and losing trades
  const profitable = tradesToShow.filter(t => {
    if (!(t.status === 'open' || t.status === 'executed')) return false;
    if (!currentPrices || !currentPrices[t.symbol]) return false;

    return (
      (t.type === 'buy' && currentPrices[t.symbol] > t.price) ||
      (t.type === 'sell' && currentPrices[t.symbol] < t.price)
    );
  });

  const losing = tradesToShow.filter(t => {
    if (!(t.status === 'open' || t.status === 'executed')) return false;
    if (!currentPrices || !currentPrices[t.symbol]) return false;

    return (
      (t.type === 'buy' && currentPrices[t.symbol] < t.price) ||
      (t.type === 'sell' && currentPrices[t.symbol] > t.price)
    );
  });

  const buyTrades = tradesToShow.filter(t => t.type === 'buy');
  const sellTrades = tradesToShow.filter(t => t.type === 'sell');

  // Calculate total P&L for each group
 const calculateTotalPnL = (trades: TradeData[]): number => {
  if (!trades || !currentPrices) return 0;

  return trades.reduce((total, trade) => {
    if (!trade || !currentPrices[trade.symbol]) return total;

    const pnl = calculateProfit({
      symbol: trade.symbol,
      openPrice: trade.price,                // entry price
      closePrice: currentPrices[trade.symbol], // live/current price
      lotSize: trade.lotSize || 0,
      tradeType: trade.type,
    });

    return total + pnl;
  }, 0);
};

  const renderRow = (label: string, trades: TradeData[]) => {
    const totalPnL = calculateTotalPnL(trades);
    const isProfit = totalPnL >= 0;

    return (
      <TouchableOpacity
        key={label}
        style={styles.row}
        onPress={() => setSelectedAction(label)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <View style={styles.labelContainer}>
            <Text style={styles.rowLabel}>{label}</Text>
            {trades.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{trades.length}</Text>
              </View>
            )}
          </View>

          <View style={styles.pnlContainer}>
            {trades.length > 0 && (
              <Text
                style={[
                  styles.pnlText,
                  { color: isProfit ? COLORS.profit : COLORS.loss },
                ]}
              >
                {isProfit ? '+' : ''}
                {totalPnL.toFixed(2)} USD
              </Text>
            )}
            {selectedAction === label && (
              <Image
                source={require('../../../assets/images/check.png')}
                style={styles.checkmark}
                // resizeMode="contain"
              />
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
          <Text style={styles.title}>Close positions at the market price?</Text>

          {/* Instruments Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabRow}
          >
            {instruments.map((inst, index) => (
              <TouchableOpacity
                key={`${inst}-${index}`} // Unique key for duplicate symbols
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

          {/* Action Rows */}
          {renderRow('Close all', tradesToShow)}
          {renderRow('Close all Profitable', profitable)}
          {renderRow('Close all Losing', losing)}
          {renderRow('Close all Buy', buyTrades)}
          {renderRow('Close all Sell', sellTrades)}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Buttons */}
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

export const CloseAllTradeModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  pnl?: number; // ✅ optional prop for profit/loss
}> = ({ visible, onClose, title, message, pnl }) => {
  const messageColor =
    pnl !== undefined
      ? pnl >= 0
        ? COLORS.profit
        : COLORS.loss
      : COLORS.text;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.closeAllOrderOverlay}>
        <View style={styles.closeAllOrderCard}>
          <View style={styles.closeAllOrderHeader}>
            <Text style={styles.closeAllOrderTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeAllOrderClose}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.closeAllOrderMessage, { color: messageColor }]}>
            {message}
          </Text>
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

  // Calculate P&L
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Accounts</Text>
            <Text style={styles.headerSubtitle}>Changes to trading hours</Text>
            <View style={styles.accountInfo}>
              <Text style={styles.standardText}>STANDARD # 259008790</Text>
              <Text style={styles.accountNumber}>#4000741</Text>
            </View>
          </View>

          {/* Trade Details */}
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
              {pnl.toFixed(2)} USD
            </Text>
            <Text style={styles.currentPrice}>{currentPrice.toFixed(2)}</Text>
          </View>

          {/* Time */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              Time: {new Date(trade.timestamp).toLocaleString()}
            </Text>
          </View>

          {/* Take Profit & Stop Loss */}
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

          {/* Footer Actions */}
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
  id: string;
  symbol: string;
  formattedSymbol: string;
  type: 'buy' | 'sell';
  lotSize: number;
  price: number;
  timestamp: string;
  status: string;
  closePrice?: number;
}

const COLORS = {
  bg: '#f9f9f9',
  text: '#111111',
  textMuted: '#6B7280',
  chipBg: '#F5F6F7',
  chipText: '#5c5e5d',
  card: '#FFFFFF',
  circle: '#efeff1',
  soft: '#F3F4F6',
  divider: '#E5E7EB',
  active: '#23272F',
  actionActive: '#fddf03',
  profit: '#6ac391',
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
const TradeItem: React.FC<{
  trade: TradeData;
  currentPrice: number;
  onClose?: (trade: TradeData) => void;
}> = ({ trade, currentPrice, onClose }) => {
  // Calculate P/L for this trade
  const pnl = calculateProfit({
    symbol: trade.symbol,
    openPrice: trade.price, // entry price
    closePrice: currentPrice, // live market price
    lotSize: trade.lotSize, // user lot size
    tradeType: trade.type, // buy or sell
  });

  const getInstrumentIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSD':
        return require('../../../assets/images/bitcoin.png');
      case 'ETHUSD':
        return require('../../../assets/images/eth.png');
      case 'USTEC':
        return require('../../../assets/images/us.png');
      case 'USOIL':
        return require('../../../assets/images/crudeoilbig.png');
      case 'BTC':
        return require('../../../assets/images/bitcoin.png');
      default:
        return null; // handled in forex pair case
    }
  };

  // helper to map country codes to flags
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
      default:
        return require('../../../assets/images/bitcoin.png');
    }
  };

  const formatInstrumentName = (name: string) => {
    if (name && name === 'BTCUSD') {
      return `${name.slice(0, 3)}`;
    }
    if (name && name === 'ETHUSD') {
      return `${name.slice(0, 3)}`;
    }
    if (
      name &&
      name.length === 6 &&
      /^[A-Z]{6}$/.test(name) &&
      name !== 'BTCUSD'
    ) {
      return `${name.slice(0, 3)}/${name.slice(3)}`;
    }
    return name;
  };

  // Render right swipe action (red "Close" button)
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.closeAction}
      onPress={() => onClose?.(trade)}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../../assets/images/cancel.png')}
          style={styles.closeIcon}
          resizeMode="contain"
        />
        <Text style={styles.closeActionText}>Close</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={onClose !== undefined} // Enable swipe only for open trades
    >
      <View style={styles.tradeItem}>
        <View style={{ flexDirection: 'row', width: '100%' }}>
          {formatInstrumentName(trade.symbol).includes('/') ? (
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={getFlagIcon(
                  formatInstrumentName(trade.symbol).slice(0, 3),
                )}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  marginRight: -8,
                  marginTop: -4,
                }}
                resizeMode="contain"
              />
              <Image
                source={getFlagIcon(
                  formatInstrumentName(trade.symbol).slice(4, 7),
                )}
                style={{ width: 14, height: 14, borderRadius: 7 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Image
              source={getInstrumentIcon(trade.symbol)}
              style={{ width: 20, height: 20, borderRadius: 10 }}
              resizeMode="contain"
            />
          )}
          <View style={styles.tradeHeader}>
            <View style={styles.tradeInfo}>
              <Text style={styles.tradeSymbol}>
                {trade.formattedSymbol || trade.symbol}
              </Text>
              <Text style={styles.tradeType}>
                {trade.type === 'buy' ? 'Buy' : 'Sell'}{' '}
                {trade.lotSize.toFixed(2)}{' '}
                <Text style={{ color: '#2d3132' }}>
                  at {trade.price.toFixed(2)}
                </Text>
              </Text>
            </View>
            <View style={styles.tradePnlContainer}>
              <Text
                style={[
                  styles.tradePnl,
                  { color: pnl >= 0 ? COLORS.profit : COLORS.loss },
                ]}
              >
                {pnl >= 0 ? '+' : ''}
                {pnl.toFixed(2)} USD
              </Text>
              <Text style={[styles.tradeValue, { color: '#808182' }]}>
                {currentPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

// ---------- ACCOUNT CARD ----------
const AccountCard: React.FC<{
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  navigation: any;
  livePnL: number;
}> = ({ onDepositPress, onWithdrawPress, navigation, livePnL }) => {
  const balance = useSelector((state: RootState) => state.balance.amount);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [accountOptionsModalVisible, setAccountOptionsModalVisible] =
    useState(false);
  const [traderName, setTraderName] = useState('RISING TRADERS');
  const [accountNumber, setAccountNumber] = useState('#79555989');
  const [activeAccountType, setActiveAccountType] = useState('Real');

  const displayedBalance = useMemo(
    () => Math.max(0, balance + livePnL),
    [balance, livePnL],
  );

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
    setAccountOptionsModalVisible(false);
  };

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeaderRow}>
        <View>
          <Text style={styles.accountTitle}>
            {traderName} <Text style={styles.hashGrey}>{accountNumber}</Text>
          </Text>
          <View style={styles.chipsRow}>
            <Chip label="MT5" />
            <Chip label="Zero" />
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

      {/* Details Modal */}
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

      {/* Account Type Modal */}
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
              <TouchableOpacity
                style={[
                  styles.accountOption,
                  activeAccountType === 'Real' && styles.activeAccountOption,
                ]}
                onPress={() => handleAccountOptionSelect('Real')}
                activeOpacity={0.7}
              >
                <Text style={styles.accountOptionText}>Real</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountOption,
                  activeAccountType === 'Demo' && styles.activeAccountOption,
                ]}
                onPress={() => handleAccountOptionSelect('Demo')}
                activeOpacity={0.7}
              >
                <Text style={styles.accountOptionText}>Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountOption,
                  activeAccountType === 'Archived' &&
                    styles.activeAccountOption,
                ]}
                onPress={() => handleAccountOptionSelect('Archived')}
                activeOpacity={0.7}
              >
                <Text style={styles.accountOptionText}>Archived</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.accountCardInModal}>
              <View style={styles.accountHeaderRow}>
                <View>
                  <Text style={styles.accountTitle}>
                    RISING TRADERS{' '}
                    <Text style={styles.hashGrey}>#356578493</Text>
                  </Text>
                  <View style={styles.chipsRow}>
                    <Chip label="MT5" />
                    <Chip label="Standard" />
                    <Chip label={activeAccountType} />
                  </View>
                </View>
                <TouchableOpacity style={styles.circleSmall}>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <Text>1000.00 USD</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const groupTradesByDate = (trades: TradeData[]) => {
  return trades.reduce((groups: Record<string, TradeData[]>, trade) => {
    const date = new Date(trade.timestamp).toISOString().split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(trade);
    return groups;
  }, {});
};

// ---------- MAIN UI ----------
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

  const [allTradeCloseModalVisible, setAllTradeCloseModalVisible] = useState(false);
  const [allTradeCloseModalTitle, setAllTradeCloseModalTitle] = useState('');
  const [allTradeCloseModalMessage, setAllTradeCloseModalMessage] = useState('');
  
  const [closeAllTradePnL, setCloseAllTradePnL] = useState(0);

  const [closeAllModelVisible, setcloseAllModelVisible] = useState(false);

  const handleCloseAllTrades = () => setcloseAllModelVisible(true);

  // Load saved trades from storage
  useEffect(() => {
    const loadTrades = async () => {
      try {
        const tradesJSON = await AsyncStorage.getItem('tradeHistory');
        if (tradesJSON) setTrades(JSON.parse(tradesJSON));
      } catch (error) {
        console.error('Error loading trades:', error);
      }
    };
    loadTrades();
  }, []);

  // Load balance on component mount to ensure sync with AsyncStorage
  useEffect(() => {
    const initBalance = async () => {
      const loadedBalance = await loadBalance();
      dispatch(setBalance(loadedBalance.amount));
    };
    initBalance();
  }, [dispatch]);

  // Fetch prices and recalc live PnL for UI only
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchCurrentPrices = async () => {
      const openTrades = trades.filter(
        trade => trade.status === 'executed' || trade.status === 'open',
      );
      const symbols = openTrades.map(trade => trade.symbol);

      const prices: Record<string, number> = {};

      for (const symbol of new Set(symbols)) {
        try {
          const historyData: any = await FetchTradeDetails(symbol, 7);

          if (
            historyData &&
            historyData.data &&
            Array.isArray(historyData.data) &&
            historyData.data.length > 0
          ) {
            const latestCandle = historyData.data[historyData.data.length - 1];
            const latestClose = latestCandle.close || 0;

            prices[symbol] = latestClose;
          } else {
            prices[symbol] = 0;
            console.warn(`No valid data for ${symbol}`);
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          prices[symbol] = 0;
        }
      }

      // Calculate total P&L using reduce and calculateProfit
      const totalProfitLoss = openTrades.reduce((total: number, trade: any) => {
        const currentPrice = prices[trade.symbol] || 0;
        const tradePnl = calculateProfit({
          symbol: trade.symbol,
          openPrice: trade.price, // entry price
          closePrice: currentPrice, // latest fetched price
          lotSize: trade.lotSize || 0,
          tradeType: trade.type, // buy or sell
        });
        return total + tradePnl;
      }, 0);

      setCurrentPrices(prices);
      setTotalPnL(totalProfitLoss);
    };

    if (trades.length > 0) {
      fetchCurrentPrices();
      interval = setInterval(fetchCurrentPrices, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trades]);

  // Close trade
  const handleCloseTrade = async (trade: TradeData) => {
    try {
      const currentPrice = currentPrices[trade.symbol] || trade.price;
      const pnl = calculateProfit({
        symbol: trade.symbol,
        openPrice: trade.price, // entry price
        closePrice: currentPrice, // live market price
        lotSize: trade.lotSize, // user lot size
        tradeType: trade.type, // buy or sell
      });

      const updatedTrades = trades.map(t =>
        t.id === trade.id
          ? { ...t, status: 'closed', closePrice: currentPrice }
          : t,
      );

      // Dispatch based on pnl sign
      if (pnl >= 0) {
        dispatch(deposit(pnl));
      } else {
        dispatch(withdraw(Math.abs(pnl)));
      }

      setTrades(updatedTrades);
      await AsyncStorage.setItem('tradeHistory', JSON.stringify(updatedTrades));
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  // Trade filtering
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

  const handleTradeItemPress = (trade: TradeData) => {
    setSelectedTrade(trade);
    setModalVisible(true);
  };

  // Handle close all
 const handleConfirm = async (action: string, selectedInstrument: string) => {
  try {
    let tradesToClose = trades.filter(
      t =>
        (selectedInstrument === "All instruments" || t.symbol === selectedInstrument) &&
        (t.status === "executed" || t.status === "open"),
    );

    if (action === "Close all Buy") {
      tradesToClose = tradesToClose.filter(t => t.type === "buy");
    } else if (action === "Close all Sell") {
      tradesToClose = tradesToClose.filter(t => t.type === "sell");
    } else if (action === "Close all Profitable") {
      tradesToClose = tradesToClose.filter(t => {
        const currentPrice = currentPrices[t.symbol] || t.price;
        const pnl = calculateProfit({
          symbol: t.symbol,
          openPrice: t.price,
          closePrice: currentPrice,
          lotSize: t.lotSize || 0,
          tradeType: t.type,
        });
        return pnl >= 0;
      });
    } else if (action === "Close all Losing") {
      tradesToClose = tradesToClose.filter(t => {
        const currentPrice = currentPrices[t.symbol] || t.price;
        const pnl = calculateProfit({
          symbol: t.symbol,
          openPrice: t.price,
          closePrice: currentPrice,
          lotSize: t.lotSize || 0,
          tradeType: t.type,
        });
        return pnl < 0;
      });
    }

    // ✅ Close selected trades
    const updatedTrades = trades.map(t =>
      tradesToClose.some(closeTrade => closeTrade.id === t.id)
        ? {
            ...t,
            status: "closed",
            closePrice: currentPrices[t.symbol] || t.price,
          }
        : t,
    );

    // ✅ Calculate total PnL using utility
    let totalPnL = 0;
    tradesToClose.forEach(t => {
      const exitPrice = currentPrices[t.symbol] || t.price;
      totalPnL += calculateProfit({
        symbol: t.symbol,
        openPrice: t.price,
        closePrice: exitPrice,
        lotSize: t.lotSize || 0,
        tradeType: t.type,
      });
    });

    // ✅ Dispatch balance update
    if (totalPnL >= 0) {
      dispatch(deposit(totalPnL));
    } else {
      dispatch(withdraw(Math.abs(totalPnL)));
    }

    setTrades(updatedTrades);

    await AsyncStorage.setItem("tradeHistory", JSON.stringify(updatedTrades));

    setcloseAllModelVisible(false);

    setCloseAllTradePnL(totalPnL);

    setAllTradeCloseModalTitle(`${tradesToClose.length} Orders are closed`);
    setAllTradeCloseModalMessage(`${totalPnL.toFixed(2)} USD`);

    setAllTradeCloseModalVisible(true);

    setTimeout(() => {
      setAllTradeCloseModalVisible(false);
    }, 5000);
  } catch (error) {
    console.error("Error closing trades:", error);
  }
};


  // Positions content
  const positionsContent = useMemo(() => {
    if (positionsTab === 'Open') {
      return (
        <View style={styles.positionsWrap}>
          {openTrades.length > 0 ? (
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
                  {totalPnL.toFixed(2)} USD
                </Text>
              </View>
              {openTrades.map(trade => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  currentPrice={currentPrices[trade.symbol] || trade.price}
                  onClose={handleCloseTrade}
                />
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

              <CloseAllTradeModal
                visible={allTradeCloseModalVisible}
                onClose={() => setAllTradeCloseModalVisible(false)}
                title={allTradeCloseModalTitle}
                message={allTradeCloseModalMessage}
                pnl={closeAllTradePnL}
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
      const grouped = groupTradesByDate(closedTrades);
      return Object.keys(grouped).length > 0 ? (
        <ScrollView style={styles.positionsWrap}>
          {Object.entries(grouped).map(([date, trades]) => (
            <View key={date}>
              <Text style={{ paddingVertical: 12 }}>
                {new Date(date).toDateString()}
              </Text>
              {trades.map(trade => (
                <TouchableOpacity
                  key={trade.id}
                  onPress={() => handleTradeItemPress(trade)}
                  activeOpacity={0.7}
                >
                  <TradeItem
                    trade={trade}
                    currentPrice={trade.closePrice || trade.price}
                  />
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
  }, [
    positionsTab,
    openTrades,
    closedTrades,
    currentPrices,
    totalPnL,
    navigation,
    setActiveTab,
  ]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
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

      <AccountCard
        onDepositPress={onDepositPress}
        onWithdrawPress={onWithdrawPress}
        navigation={navigation}
        livePnL={totalPnL}
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

// ---------- STYLES ----------
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
  countBadge: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#4e4e4e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
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
  closeAllOrderOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 100,
  },
  closeAllOrderCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  closeAllOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  closeAllOrderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  closeAllOrderClose: {
    fontSize: 20,
    fontWeight: 'bold', 
    color: '#555',
  },
  closeAllOrderMessage: {
    fontSize: 14,
    color: '#333',
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
    borderRadius: 5,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 17,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 0.5,
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
    marginBottom: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -18,
  },
  actionItem: { width: '22%', alignItems: 'center' },
  actionIconWrap: {
    width: SIZES.actionIcon,
    height: SIZES.actionIcon,
    borderRadius: SIZES.actionIcon / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  actionIconIdle: { backgroundColor: COLORS.soft },
  actionIconActive: { backgroundColor: COLORS.actionActive },
  actionLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#4f5153',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
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
    color: COLORS.chipText,
    fontWeight: '500',
    lineHeight: 18,
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
    borderRadius: 4,
    padding: 10,
    width: '100%',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 69,
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
    color: '#2695eaff',
    marginTop: 7,
    opacity: 1,
    fontWeight: '400',
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
    fontWeight: '400',
    marginBottom: 8,
  },
  tradeValue: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text,
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
    fontWeight: '400',
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
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    height: 17,
    width: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  closeAction: {
    backgroundColor: '#ec4a3f',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderBottomRightRadius: 4,
    borderTopRightRadius: 4,
    flexDirection: 'row',
    gap: 4,
  },
  closeActionText: {
    color: '#e2ffff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeIcon: {
    width: 14,
    height: 14,
    tintColor: '#e2ffff',
    marginBottom: 6,
  },
});

export default AccountScreen;
