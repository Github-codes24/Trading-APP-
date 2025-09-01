/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';

const FONT_BOLD = 'Satoshi-Bold';
const FONT_REGULAR = 'Satoshi-Regular';
const FONT_MEDIUM = 'Satoshi-Medium';

const TABS = [{ label: 'Summary' }, { label: 'Exness benefits' }];

// ✅ Extract only 7 evenly spaced points
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

const PerformanceScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [customDateModalVisible, setCustomDateModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 days');
  const [pendingRange, setPendingRange] = useState('Last 7 days');
  const [customDates, setCustomDates] = useState([
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
    { date: '', profit: '', loss: '' },
  ]);

  // Dummy data for charts
  const ordersData = [8, 12, 6, 10, 14, 9, 13];
  const volumeData = [120000, 180000, 90000, 150000, 210000, 130000, 190000];
  const volumeLabels = ['13 Jul', '18 Jul', '23 Jul', '28 Jul', '02 Aug', '07 Aug', '12 Aug'];

  const customDatesForChart = customDates.map(item => ({
    date: item.date,
    profit: item.profit ? parseFloat(item.profit) : 0,
    loss: item.loss ? parseFloat(item.loss) : 0,
  }));

  // ✅ Reduce chart data to max 7 bars
  const displayedData = getSevenBars(customDatesForChart);

  const maxProfit = Math.max(...displayedData.map(d => d.profit), 0);
  const maxLoss = Math.max(...displayedData.map(d => d.loss), 0);

  const chartHeight = 200;
  const halfHeight = chartHeight / 2;

  // ✅ Y-axis values
  const stepUp = maxProfit / 3;
  const stepDown = maxLoss / 3;
  const yAxisValues: number[] = [];
  for (let i = 3; i > 0; i--) yAxisValues.push(stepUp * i);
  yAxisValues.push(0);
  for (let i = 1; i <= 3; i++) yAxisValues.push(-stepDown * i);

  // ✅ Totals
  const totalProfit = displayedData.reduce((sum, d) => sum + d.profit, 0);
  const totalLoss = displayedData.reduce((sum, d) => sum + d.loss, 0);
  const netResult = totalProfit - totalLoss;
  const formattedProfit = `${netResult >= 0 ? '+' : ''}${netResult.toFixed(
    2,
  )} USD`;

  const totalInvestment = totalProfit + totalLoss;
  const percentageChange =
    totalInvestment > 0 ? (netResult / totalInvestment) * 100 : 0;
  const isProfit = netResult >= 0;
  const formattedPercentage = `${isProfit ? '+' : ''}${percentageChange.toFixed(
    2,
  )}%`;

  // ✅ Handle date range selection
  const handleSelectRange = (range: string) => {
    setPendingRange(range);
    setModalVisible(false);

    // Open custom date modal for any range selection
    setCustomDateModalVisible(true);
  };

  // ✅ Handle custom date input
  const handleCustomDateInput = () => {
    // Validate inputs
    const isValid = customDates.every(
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

    // Convert to chart data format
    const newChartData = customDates.map(item => ({
      date: item.date,
      profit: item.profit ? parseFloat(item.profit) : 0,
      loss: item.loss ? parseFloat(item.loss) : 0,
    }));
    setCustomDates(newChartData);
    setSelectedRange(pendingRange);
    setCustomDateModalVisible(false);
  };

  // ✅ Handle canceling custom date input
  const handleCancelCustomDate = () => {
    setCustomDateModalVisible(false);
    // Reset pending range to the currently selected range
    setPendingRange(selectedRange);
  };

  // ✅ Update custom date field
  const updateCustomDateField = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedDates = [...customDates];
    updatedDates[index] = { ...updatedDates[index], [field]: value };
    setCustomDates(updatedDates);
  };

  const xAxisLabels = getXAxisLabels(displayedData);

  // Mock data for the new sections
  const totalOrders = 13;
  const ordersPercentageChange = 550.0;
  const ordersCount = 8;
  const profitableOrders = 9;
  const unprofitableOrders = 4;
  const tradingVolume = '536,836.99 USD';
  const lifetimeTradingVolume = '3,100,614.91 USD';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === idx && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabDivider} />

        {/* Filters */}
        <View style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8}>
            <Text style={styles.filterText}>All real accounts</Text>
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
          <Icon name="info" size={20} color="#111" />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.profitRow}>
            <Text style={styles.profitValue}>{formattedProfit}</Text>
            <View
              style={[
                styles.percentBadge,
                {
                  backgroundColor: isProfit ? '#DCFCE7' : '#FEE2E2',
                },
              ]}
            >
              <Icon
                name={isProfit ? 'arrow-up-right' : 'arrow-down-right'}
                size={14}
                color={isProfit ? '#16A34A' : '#E11D48'}
              />
              <Text
                style={[
                  styles.percentText,
                  {
                    color: isProfit ? '#16A34A' : '#E11D48',
                  },
                ]}
              >
                {formattedPercentage}
              </Text>
              <Icon
                name="info"
                size={14}
                color={isProfit ? '#16A34A' : '#E11D48'}
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {/* ✅ Y-axis */}
            <View style={styles.chartYAxisContainer}>
              {yAxisValues.map(val => (
                <View key={val} style={styles.chartRow}>
                  <Text style={styles.chartYAxis}>{val.toFixed(2)}</Text>
                  <View style={styles.chartGridLine} />
                </View>
              ))}
            </View>

            {/* ✅ Bars (anchored at 0-line) */}
            <View style={styles.chartBarsContainer}>
              {displayedData.map(item => {
                const profitHeight =
                  (item.profit / (maxProfit || 1)) * halfHeight;
                const lossHeight = (item.loss / (maxLoss || 1)) * halfHeight;

                return (
                  <View key={item.date} style={styles.chartBarWrapper}>
                    {/* Profit (upwards from 0) */}
                    <View
                      style={{
                        width: 12,
                        height: profitHeight,
                        backgroundColor: '#45cd7b',
                        position: 'absolute',
                        bottom: halfHeight,
                      }}
                    />
                    {/* Loss (downwards from 0) */}
                    <View
                      style={{
                        width: 12,
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

            <View style={styles.chartXAxisRow}>
              {' '}
              {xAxisLabels.map(date => (
                <Text key={date} style={styles.chartXAxisLabel}>
                  {' '}
                  {date}{' '}
                </Text>
              ))}{' '}
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
              <Text style={styles.modalTitle}>Select Range</Text>
              {['Last 7 days', 'Last 30 days', 'Last 90 days'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.modalOption,
                    selectedRange === range && styles.modalOptionActive,
                  ]}
                  onPress={() => handleSelectRange(range)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedRange === range && styles.modalOptionTextActive,
                    ]}
                  >
                    {range}
                  </Text>
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
              style={[styles.modalContent, { maxHeight: '80%', padding: 16 }]}
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
                {customDates.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    {/* Date Input - Centered */}
                    <TextInput
                      style={[
                        styles.tableInput,
                        { flex: 1, textAlign: 'center' },
                      ]}
                      placeholder="DD/MM"
                      value={item.date}
                      onChangeText={text =>
                        updateCustomDateField(index, 'date', text)
                      }
                    />

                    {/* Profit Input */}
                    <TextInput
                      style={[styles.tableInput, { flex: 1 }]}
                      placeholder="Profit"
                      keyboardType="numeric"
                      value={item.profit}
                      onChangeText={text =>
                        updateCustomDateField(index, 'profit', text)
                      }
                    />

                    {/* Loss Input */}
                    <TextInput
                      style={[styles.tableInput, { flex: 1 }]}
                      placeholder="Loss"
                      keyboardType="numeric"
                      value={item.loss}
                      onChangeText={text =>
                        updateCustomDateField(index, 'loss', text)
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FA' },
  header: { paddingHorizontal: 24 },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
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
  tabTextActive: { color: '#111111', fontFamily: FONT_BOLD },
  tabDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
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
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'center',
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  filterText: {
    fontSize: 16,
    color: '#111111',
    marginRight: 6,
    fontFamily: FONT_REGULAR,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
    marginTop: 8,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Add these to your StyleSheet
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
    fontSize: 24,
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
    borderRadius: 12,
    padding: 16,
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
    width: 36,
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    textAlign: 'right',
    marginRight: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
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
    fontFamily: FONT_BOLD,
    marginBottom: 12,
    color: '#111',
    alignSelf: 'flex-start',
  },
  modalOption: {
    paddingVertical: 12,
    width: '100%',
  },
  modalOptionActive: { backgroundColor: '#F3F4F6', borderRadius: 8 },
  modalOptionText: { fontSize: 16, fontFamily: FONT_REGULAR, color: '#111' },
  modalOptionTextActive: { fontFamily: FONT_BOLD, color: '#2563EB' },
  // Custom Date Input Styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});

export default PerformanceScreen;