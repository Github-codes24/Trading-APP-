/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

const FONT_BOLD = 'Satoshi-Bold';
const FONT_REGULAR = 'Satoshi-Regular';
const FONT_MEDIUM = 'Satoshi-Medium';

// Extract only 7 evenly spaced points
const getSevenBars = (
  data: { date: string; profit: number; loss: number }[],
) => {
  if (data.length <= 7) return data;

  const step = Math.floor(data.length / 6);
  const selected: { date: string; profit: number; loss: number }[] = [];

  for (let i = 0; i < data.length; i += step) {
    selected.push(data[i]);
    if (selected.length === 6) break;
  }

  selected.push(data[data.length - 1]); // always include last
  return selected;
};

const getXAxisLabels = (
  data: { date: string; profit: number; loss: number }[],
) => {
  if (data.length <= 7) return data.map(d => d.date);
  const step = Math.floor(data.length / 6);
  const labels: string[] = [];
  for (let i = 0; i < data.length; i += step) {
    labels.push(data[i].date);
    if (labels.length === 6) break;
  }
  labels.push(data[data.length - 1].date);
  return labels;
};

// Get performance data for all accounts
const getAllPerformanceData = () => {
  return {
    ordersData: [10, 13, 5, 15, 12, 10, 12],
    volumeData: [100000, 160000, 100000, 180000, 170000, 140000, 170000],
    volumeLabels: ['07 Oct', '08 Oct', '09 Oct', '10 Oct', '11 Oct', '12 Oct', '13 Oct'],
    totalOrders: 15,
    ordersPercentageChange: 300.0,
    ordersCount: 10,
    profitableOrders: 12,
    unprofitableOrders: 3,
    tradingVolume: '600,000.00 USD',
    lifetimeTradingVolume: '3,500,000.00 USD',
  };
};

// Get performance data based on account number
const getPerformanceData = (accountNumber: string) => {
  // Simple hash to alternate between two datasets
  const hash = accountNumber.replace(/[#]/g, '').split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 2;
  if (hash === 0) {
    return {
      ordersData: [8, 12, 6, 10, 14, 9, 13],
      volumeData: [120000, 180000, 90000, 150000, 210000, 130000, 190000],
      volumeLabels: ['13 Jul', '18 Jul', '23 Jul', '28 Jul', '02 Aug', '07 Aug', '12 Aug'],
      totalOrders: 13,
      ordersPercentageChange: 550.0,
      ordersCount: 8,
      profitableOrders: 9,
      unprofitableOrders: 4,
      tradingVolume: '536,836.99 USD',
      lifetimeTradingVolume: '3,100,614.91 USD',
    };
  } else {
    return {
      ordersData: [5, 15, 3, 20, 7, 18, 10],
      volumeData: [80000, 200000, 50000, 250000, 90000, 220000, 150000],
      volumeLabels: ['10 Jul', '15 Jul', '20 Jul', '25 Jul', '30 Jul', '05 Aug', '10 Aug'],
      totalOrders: 20,
      ordersPercentageChange: 120.0,
      ordersCount: 12,
      profitableOrders: 15,
      unprofitableOrders: 5,
      tradingVolume: '750,000.00 USD',
      lifetimeTradingVolume: '4,500,000.00 USD',
    };
  }
};

// Default empty custom dates for all accounts
const defaultAllCustomDates = [
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
];

// Default empty custom dates for specific account
const defaultCustomDates = [
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
  { date: '', profit: '', loss: '' },
];

// Chart components
const OrdersChart: React.FC<{ data: number[] }> = ({ data }) => {
  const maxValue = Math.max(...data, 1);
  const chartHeight = 100;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBarsContainer}>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          return (
            <View key={index} style={styles.chartBarWrapper}>
              <View
                style={{
                  width: 5,
                  height: barHeight,
                  backgroundColor: '#4ADE80',
                  borderRadius: 0,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const VolumeChart: React.FC<{ data: number[] }> = ({ data }) => {
  const maxValue = Math.max(...data, 1);
  const chartHeight = 100;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBarsContainer}>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          return (
            <View key={index} style={styles.chartBarWrapper}>
              <View
                style={{
                  width: 5,
                  height: barHeight,
                  backgroundColor: '#2d404e',
                  borderRadius: 0,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Simplified Account Card for Modal
const SimplifiedAccountCard: React.FC<{
  traderName: string;
  accountNumber: string;
  balance: number;
  isSelected: boolean;
}> = ({ traderName, accountNumber, balance, isSelected }) => {
  return (
    <View style={[styles.simplifiedAccountCard, isSelected && styles.greyBg]}>
      <View style={styles.simplifiedAccountHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.simplifiedAccountTitle}>
            {traderName} <Text style={styles.hashGrey}>{accountNumber}</Text>
          </Text>
          <View style={styles.chipsRow}>
            <View style={styles.chip}><Text style={styles.chipText}>MT5</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Zero</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Real</Text></View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.balanceText}>{balance.toFixed(2)} INR</Text>
          {isSelected && <Icon name="check" size={20} color="#111" style={{ marginLeft: 10 }} />}
        </View>
      </View>
    </View>
  );
};

const PerformanceScreen: React.FC = () => {
  const balanceAmount = useSelector((state: any) => state.balance.amount || 0);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [customDateModalVisible, setCustomDateModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 days');
  const [pendingRange, setPendingRange] = useState('Last 7 days');
  const [selectedMode, setSelectedMode] = useState<'all' | 'specific'>('all');
  const [allCustomDates, setAllCustomDates] = useState(defaultAllCustomDates);
  const [specificCustomDates, setSpecificCustomDates] = useState(defaultCustomDates);
  const [customDates, setCustomDates] = useState(defaultAllCustomDates);
  const [pendingCustomDates, setPendingCustomDates] = useState(defaultAllCustomDates);
  const [traderName, setTraderName] = useState('RISING TRADERS');
  const [accountNumber, setAccountNumber] = useState('#79555989');
  const [performanceData, setPerformanceData] = useState(getAllPerformanceData());

  // Load account details from AsyncStorage on mount
  useEffect(() => {
    const loadAccountDetails = async () => {
      try {
        const savedTraderName = await AsyncStorage.getItem('traderName');
        const savedAccountNumber = await AsyncStorage.getItem('accountNumber');
        if (savedTraderName && savedAccountNumber) {
          setTraderName(savedTraderName);
          setAccountNumber(savedAccountNumber);
          setSelectedMode('specific');
        } else {
          setSelectedMode('all');
        }
      } catch (error) {
        console.error('Error loading account details:', error);
      }
    };
    loadAccountDetails();
  }, []);

  // Load custom dates from AsyncStorage on mount
  useEffect(() => {
    const loadCustomDates = async () => {
      try {
        const allSaved = await AsyncStorage.getItem('allCustomDates');
        const specificSaved = await AsyncStorage.getItem('specificCustomDates');

        if (allSaved) {
          setAllCustomDates(JSON.parse(allSaved));
        } else {
          setAllCustomDates(defaultAllCustomDates);
          await AsyncStorage.setItem('allCustomDates', JSON.stringify(defaultAllCustomDates));
        }

        if (specificSaved) {
          setSpecificCustomDates(JSON.parse(specificSaved));
        } else {
          setSpecificCustomDates(defaultCustomDates);
          await AsyncStorage.setItem('specificCustomDates', JSON.stringify(defaultCustomDates));
        }
      } catch (error) {
        console.error('Error loading custom dates:', error);
      }
    };
    loadCustomDates();
  }, []);

  // Update performance data and custom dates when mode or account changes
  useEffect(() => {
    if (selectedMode === 'all') {
      setPerformanceData(getAllPerformanceData());
      setCustomDates(allCustomDates);
    } else {
      setPerformanceData(getPerformanceData(accountNumber));
      setCustomDates(specificCustomDates);
    }
  }, [selectedMode, accountNumber, allCustomDates, specificCustomDates]);

  const {
    ordersData,
    volumeData,
    volumeLabels,
    totalOrders,
    ordersPercentageChange,
    ordersCount,
    profitableOrders,
    unprofitableOrders,
    tradingVolume,
    lifetimeTradingVolume,
  } = performanceData;

  const customDatesForChart = customDates.map(item => ({
    date: item.date,
    profit: item.profit ? parseFloat(item.profit) : 0,
    loss: item.loss ? parseFloat(item.loss) : 0,
  }));

  // Reduce chart data to max 7 bars
  const displayedData = getSevenBars(customDatesForChart);

  const maxProfit = Math.max(...displayedData.map(d => d.profit), 0);
  const maxLoss = Math.max(...displayedData.map(d => d.loss), 0);

  const chartHeight = 200;
  const halfHeight = chartHeight / 2;

  // Y-axis values
  const stepUp = maxProfit / 2.5;
  const stepDown = maxLoss / 2.5;
  const yAxisValues: number[] = [];
  for (let i = 3; i > 0; i--) yAxisValues.push(stepUp * i);
  yAxisValues.push(0);
  for (let i = 1; i <= 3; i++) yAxisValues.push(-stepDown * i);

  // Totals
  const totalProfit = displayedData.reduce((sum, d) => sum + d.profit, 0);
  const totalLoss = displayedData.reduce((sum, d) => sum + d.loss, 0);
  const netResult = totalProfit - totalLoss;
  const formattedProfit = `${netResult >= 0 ? '+' : ''}${netResult.toFixed(2)} USD`;

  const totalInvestment = totalProfit + totalLoss;
  const percentageChange = totalInvestment > 0 ? (netResult / totalInvestment) * 100 : 0;
  const isProfit = netResult >= 0;
  const formattedPercentage = `${isProfit ? '+' : ''}${percentageChange.toFixed(2)}%`;

  const filterText = selectedMode === 'all' ? 'All real accounts' : `${traderName} ${accountNumber}`;

  // Handle date range selection
  const handleSelectRange = (range: string) => {
    setPendingRange(range);
    setPendingCustomDates(customDates.map(d => ({ ...d })));
    setModalVisible(false);
    setCustomDateModalVisible(true);
  };

  // Handle custom date input
  const handleCustomDateInput = async () => {
    const isValid = pendingCustomDates.every(
      item =>
        item.date &&
        item.profit &&
        item.loss &&
        !isNaN(parseFloat(item.profit)) &&
        !isNaN(parseFloat(item.loss)),
    );

    if (!isValid) {
      Alert.alert('Error', 'Please fill all fields with valid numbers');
      return;
    }

    try {
      if (selectedMode === 'all') {
        setAllCustomDates(pendingCustomDates);
        await AsyncStorage.setItem('allCustomDates', JSON.stringify(pendingCustomDates));
      } else {
        setSpecificCustomDates(pendingCustomDates);
        await AsyncStorage.setItem('specificCustomDates', JSON.stringify(pendingCustomDates));
      }
      setCustomDates(pendingCustomDates);
      setSelectedRange(pendingRange);
      setCustomDateModalVisible(false);
    } catch (error) {
      console.error('Error saving custom dates:', error);
      Alert.alert('Error', 'Failed to save data');
    }
  };

  // Handle canceling custom date input
  const handleCancelCustomDate = () => {
    setCustomDateModalVisible(false);
    setPendingRange(selectedRange);
  };

  // Update pending custom date field
  const updatePendingCustomDateField = (index: number, field: string, value: string) => {
    setPendingCustomDates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const xAxisLabels = getXAxisLabels(displayedData);

  const now = new Date();

  // Handle card click - select account
  const handleCardClick = async () => {
    if (selectedMode !== 'specific') {
      setSelectedMode('specific');
    }
    try {
      await AsyncStorage.setItem('traderName', traderName);
      await AsyncStorage.setItem('accountNumber', accountNumber);
      setAccountModalVisible(false);
      // Data updates automatically via useEffect
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save account data');
    }
  };

  // Handle all accounts selection
  const handleAllAccountsClick = async () => {
    setSelectedMode('all');
    try {
      await AsyncStorage.removeItem('traderName');
      await AsyncStorage.removeItem('accountNumber');
    } catch (error) {
      console.error('Error clearing account details:', error);
    }
    setAccountModalVisible(false);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const time = `${hours}:${minutes} ${ampm}`;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) {
      return `Today ${time}`;
    } else if (checkDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${time}`;
    } else {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${time}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance</Text>
        </View>

        <View style={styles.tabDivider} />

        {/* Filters */}
        <View style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8} onPress={() => setAccountModalVisible(true)}>
            <Text style={[styles.filterText, { flexShrink: 1 }]} numberOfLines={1}>{filterText}</Text>
            <Icon name="chevron-down" size={16} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChip}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
          >
            <Icon
              name="calendar"
              size={16}
              color="#111"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.filterText}>{selectedRange}</Text>
          </TouchableOpacity>
        </View>

        {/* Profit / Loss Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Profit / Loss</Text>
          <Icon name="info" size={23} color="#111" />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.profitRow}>
            <Text style={styles.profitValue}>{formattedProfit}</Text>
            <View
              style={[
                styles.percentBadge,
                {
                  backgroundColor: isProfit ? '#eaf2fd' : '#FEE2E2',
                },
              ]}
            >
              <Icon
                name={isProfit ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={isProfit ? '#4f7fa5' : '#E11D48'}
              />
              <Text
                style={[
                  styles.percentText,
                  {
                    color: isProfit ? '#4f7fa5' : '#E11D48',
                  },
                ]}
              >
                {formattedPercentage}
              </Text>
              <Icon
                name="info"
                size={14}
                color={isProfit ? '#4f7fa5' : '#E11D48'}
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {/* Y-axis */}
            <View style={styles.chartYAxisContainer}>
              {yAxisValues.map(val => (
                <View key={val} style={styles.chartRow}>
                  <Text style={styles.chartYAxis}>{val.toFixed(2)}</Text>
                  <View style={styles.chartGridLine} />
                </View>
              ))}
            </View>

            {/* Bars (anchored at 0-line) */}
            <View style={styles.chartBarsContainer}>
              {displayedData.map((item, index) => {
                const profitHeight = (item.profit / (maxProfit || 1)) * halfHeight;
                const lossHeight = (item.loss / (maxLoss || 1)) * halfHeight;

                return (
                  <View key={item.date} style={styles.chartBarWrapper}>
                    {/* Profit (upwards from 0) */}
                    <View
                      style={{
                        width: 7,
                        height: profitHeight,
                        backgroundColor: '#45cd7b',
                        position: 'absolute',
                        bottom: halfHeight,
                      }}
                    />
                    {/* Loss (downwards from 0) */}
                    <View
                      style={{
                        width: 7,
                        height: lossHeight,
                        backgroundColor: '#2d404e',
                        position: 'absolute',
                        top: halfHeight,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            {/* X-axis */}
            <View style={styles.chartXAxisRow}>
              {xAxisLabels.map(date => (
                <Text key={date} style={styles.chartXAxisLabel}>
                  {date}
                </Text>
              ))}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryDotGreen} />
              <Text style={styles.summaryLabel}>Profit</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                +{totalProfit.toFixed(2)} USD
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryDotDark} />
              <Text style={styles.summaryLabel}>Loss</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                -{totalLoss.toFixed(2)} USD
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.lastupdateHeader}>
          <Text style={styles.lastupdatedDateLabel}>
            Last Updated: {formatDate(now)}
          </Text>
        </View>

        {/* Total Orders Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Total orders</Text>
          <Icon name="info" size={20} color="#111" />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.totalOrdersRow}>
            <View style={styles.totalOrdersLeft}>
              <Text style={styles.totalOrdersValue}>{totalOrders}</Text>
              <View style={styles.ordersPercentBadge}>
                <Icon name="arrow-up-right" size={14} color="#16A34A" />
                <Text style={styles.ordersPercentText}>
                  +{ordersPercentageChange.toFixed(2)}%
                </Text>
              </View>
            </View>
            <View style={styles.totalOrdersRight}>
              <Text style={styles.ordersLabel}>Orders</Text>
              <Text style={styles.ordersCount}>{ordersCount}</Text>
            </View>
          </View>

          {/* Orders Chart */}
          <View style={styles.ordersChartContainer}>
            <OrdersChart data={ordersData} />
            <View style={styles.ordersChartXAxis}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <Text key={index} style={styles.ordersChartXAxisLabel}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.ordersDivider} />

          <View style={styles.ordersSummaryRow}>
            <View style={styles.ordersSummaryItem}>
              <View style={styles.profitableDot} />
              <Text style={styles.ordersSummaryLabel}>Profitable</Text>
              <Text style={styles.ordersSummaryValue}>{profitableOrders}</Text>
            </View>
            <View style={styles.ordersSummaryItem}>
              <View style={styles.unprofitableDot} />
              <Text style={styles.ordersSummaryLabel}>Unprofitable</Text>
              <Text style={styles.ordersSummaryValue}>
                {unprofitableOrders}
              </Text>
            </View>
          </View>
        </View>

        {/* Trading Volume Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Trading volume</Text>
          <Icon name="info" size={20} color="#111" />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.tradingVolumeValue}>{tradingVolume}</Text>

          {/* Trading Volume Chart */}
          <View style={styles.volumeChartContainer}>
            <VolumeChart data={volumeData} />
            <View style={styles.volumeChartXAxis}>
              {volumeLabels.map((label, index) => (
                <Text key={index} style={styles.volumeChartXAxisLabel}>
                  {label}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.lifetimeVolumeRow}>
            <Icon name="bar-chart-2" size={16} color="#6B7280" />
            <Text style={styles.lifetimeVolumeText}>
              Lifetime Trading Volume
            </Text>
            <Text style={styles.lifetimeVolumeValue}>
              {lifetimeTradingVolume}
            </Text>
          </View>
        </View>

        {/* Range Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select period</Text>
              {['Last 7 days', 'Last 30 days', 'Last 90 days'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[styles.modalOption]}
                  onPress={() => handleSelectRange(range)}
                >
                  <Text style={[styles.modalOptionText]}>{range}</Text>
                  {selectedRange === range && (
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row-reverse',
                        width: '100%',
                        height: '100%',
                        marginRight: 10,
                      }}
                    >
                      <Image
                        source={require('../../../assets/images/check.png')}
                        style={styles.checkIcon}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Custom Date Input Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={customDateModalVisible}
          onRequestClose={() => setCustomDateModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCustomDateModalVisible(false)}
          >
            <View
              style={[styles.modalContent, { maxHeight: '80%' }]}
            >
              <Text style={styles.modalTitle}>Enter Profit/Loss</Text>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: 'center' },
                  ]}
                >
                  Date
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: 'center' },
                  ]}
                >
                  Profit
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: 'center' },
                  ]}
                >
                  Loss
                </Text>
              </View>

              <ScrollView style={{ width: '100%' }}>
                {pendingCustomDates.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <TextInput
                      style={[
                        styles.tableInput,
                        { flex: 1, textAlign: 'center' },
                      ]}
                      placeholder="DD/MM"
                      placeholderTextColor="#d0d2d7ff"
                      value={item.date}
                      onChangeText={text =>
                        updatePendingCustomDateField(index, 'date', text)
                      }
                    />
                    <TextInput
                      style={[styles.tableInput, { flex: 1 }]}
                      placeholder="Profit"
                      keyboardType="numeric"
                      value={item.profit}
                      onChangeText={text =>
                        updatePendingCustomDateField(index, 'profit', text)
                      }
                    />
                    <TextInput
                      style={[styles.tableInput, { flex: 1 }]}
                      placeholder="Loss"
                      keyboardType="numeric"
                      value={item.loss}
                      onChangeText={text =>
                        updatePendingCustomDateField(index, 'loss', text)
                      }
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.customDateButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={handleCancelCustomDate}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSubmitButton]}
                  onPress={handleCustomDateInput}
                >
                  <Text style={styles.modalSubmitText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Account Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={accountModalVisible}
          onRequestClose={() => setAccountModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAccountModalVisible(false)}
          >
            <View style={[styles.modalContent, { alignItems: 'flex-start', width: '100%' }]}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity
                style={[
                  styles.allAccountOption,
                  selectedMode === 'all' && styles.greyBg
                ]}
                onPress={handleAllAccountsClick}
              >
                <Text style={styles.allAccountTitle}>All real accounts</Text>
                {selectedMode === 'all' && <Icon name="check" size={20} color="#111" style={{ marginLeft: 10 }} />}
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity style={{ width: '100%' }} onPress={handleCardClick}>
                <SimplifiedAccountCard
                  traderName={traderName}
                  accountNumber={accountNumber}
                  balance={balanceAmount}
                  isSelected={selectedMode === 'specific'}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FA' },
  header: { paddingHorizontal: 24 },
  headerTitle: {
    fontSize: 30,
    marginTop: 15,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '500',
  },
  tabsRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: 24 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#111111' },
  tabText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: FONT_MEDIUM,
    fontWeight: '700',
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: '#000',
  },
  tabTextActive: { color: '#111111', fontFamily: FONT_BOLD },
  tabDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 15,
    marginTop: 10,
    marginHorizontal: 24,
  },
  chartXAxisRow: {
    position: 'absolute',
    left: 52,
    bottom: 0,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartXAxisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'center',
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flex: 1,
    maxWidth: '50%',
  },
  filterText: {
    fontSize: 16,
    color: '#111111',
    marginRight: 6,
    fontFamily: FONT_REGULAR,
    flexShrink: 1,
  },
  specificFilterText: {
    fontSize: 14,
    color: '#111111',
    marginRight: 6,
    fontFamily: FONT_REGULAR,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 13,
    marginTop: 8,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '500',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    // shadowColor: '#000',
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // elevation: 2,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
    width: '100%',
  },
  tableHeaderText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#111',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  tableInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  profitValue: {
    fontSize: 19,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    gap: 2,
  },
  percentText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    marginLeft: 2,
    marginRight: 2,
    color: '#111111',
    fontWeight: '800',
  },
  chartContainer: {
    height: 280,
    marginVertical: 16,
    borderRadius: 9,
    padding: 10,
    position: 'relative',
  },
  chartYAxisContainer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 200,
    justifyContent: 'space-between',
  },
  chartRow: { flexDirection: 'row', alignItems: 'center', height: 40 },
  chartYAxis: {
    width: 70,
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'right',
    marginRight: 8,
    marginHorizontal: -14
  },
  chartGridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  chartBarsContainer: {
    position: 'absolute',
    left: 52,
    bottom: 40,
    right: 16,
    height: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: 30,
    height: 200,
    position: 'relative',
  },
  summaryRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    marginBottom: 3,
  },
  lastupdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 30,
    marginTop: -10,
    marginBottom: 15,
  },
  summaryDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
  summaryDotDark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d404e',
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginRight: 4,
    flexShrink: 1,
  },
  lastupdatedDateLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginRight: 4,
    flexShrink: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#111111',
    fontFamily: FONT_BOLD,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111',
    alignSelf: 'flex-start',
    fontFamily: FONT_MEDIUM,
  },
  modalOption: {
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
  },
  modalOptionText: { fontSize: 14, fontFamily: FONT_REGULAR, color: '#111' },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  customDateLabel: {
    width: 60,
    fontSize: 14,
    fontFamily: FONT_REGULAR,
    color: '#111',
  },
  customDateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    fontSize: 14,
  },
  customDateButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#111',
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
  modalSubmitButton: {
    backgroundColor: '#2563EB',
  },
  modalSubmitText: {
    color: 'white',
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 12,
  },
  allAccountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  allAccountTitle: {
    fontSize: 16,
    fontFamily: FONT_REGULAR,
    color: '#111',
    flex: 1,
  },
  greyBg: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  simplifiedAccountCard: {
    width: '100%',
  },
  simplifiedAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  simplifiedAccountTitle: {
    fontSize: 14,
    fontFamily: FONT_MEDIUM,
    color: '#111111',
  },
  hashGrey: {
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#111111',
    textAlign: 'right',
  },
  // Total Orders Styles
  totalOrdersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalOrdersLeft: {
    alignItems: 'flex-start',
  },
  totalOrdersValue: {
    fontSize: 34,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
    marginBottom: 4,
  },
  ordersPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ordersPercentText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#16A34A',
    marginLeft: 4,
  },
  totalOrdersRight: {
    alignItems: 'flex-end',
  },
  ordersLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginBottom: 4,
  },
  ordersCount: {
    fontSize: 18,
    fontFamily: FONT_BOLD,
    color: '#111111',
  },
  ordersDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  ordersSummaryRow: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  ordersSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
  },
  unprofitableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
    marginRight: 8,
  },
  ordersSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginRight: 8,
  },
  ordersSummaryValue: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#111111',
  },
  // Trading Volume Styles
  tradingVolumeValue: {
    fontSize: 24,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
    marginBottom: 16,
  },
  tradingVolumeChart: {
    height: 200,
    marginBottom: 16,
    position: 'relative',
  },
  tradingVolumePlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  tradingVolumePlaceholderText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
  },
  tradingVolumeXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tradingVolumeXAxisLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
  },
  lifetimeVolumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  lifetimeVolumeText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginLeft: 8,
    marginRight: 'auto',
  },
  lifetimeVolumeValue: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#111111',
  },
  // New styles for orders and volume charts
  ordersChartContainer: {
    height: 140,
    marginBottom: 16,
  },
  ordersChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  ordersChartXAxisLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'center',
    flex: 1,
  },
  volumeChartContainer: {
    height: 140,
    marginBottom: 16,
  },
  volumeChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  volumeChartXAxisLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'center',
    flex: 1,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountTitle: {
    fontSize: 14,
    fontFamily: FONT_MEDIUM,
    color: '#111111',
  },
  hashGrey: {
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
  },
  editButton: {
    marginRight: 8,
  },
  circleSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
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
    backgroundColor: '#f4f5f7',
  },
});

export default PerformanceScreen;