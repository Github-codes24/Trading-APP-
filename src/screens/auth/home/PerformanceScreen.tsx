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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

const FONT_BOLD = 'Satoshi-Bold';
const FONT_REGULAR = 'Satoshi-Regular';
const FONT_MEDIUM = 'Satoshi-Medium';

const TABS = [{ label: 'Summary' }, { label: 'Exness benefits' }];

// ✅ Generate profit & loss for N days
const getLastNDays = (n: number) => {
  const today = new Date();
  const days = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const day = d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });

    const profit = +(Math.random() * 20).toFixed(2);
    const loss = +(Math.random() * 15).toFixed(2);

    days.push({ date: day, profit, loss });
  }

  return days;
};

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

const PerformanceScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 days');
  const [chartData, setChartData] = useState(getLastNDays(7));

  // ✅ Reduce chart data to max 7 bars
  const displayedData = getSevenBars(chartData);

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
  const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0);
  const totalLoss = chartData.reduce((sum, d) => sum + d.loss, 0);
  const netResult = totalProfit - totalLoss;
  const formattedProfit = `${netResult >= 0 ? '+' : ''}${netResult.toFixed(
    2,
  )} USD`;

  // ✅ Handle date range selection
  const handleSelectRange = (range: string) => {
    setSelectedRange(range);
    setModalVisible(false);

    let days = 7;
    if (range === 'Last 30 days') days = 30;
    if (range === 'Last 90 days') days = 90;

    setChartData(getLastNDays(days));
  };

  const xAxisLabels = getXAxisLabels(chartData);

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
                        backgroundColor: '#4ADE80',
                        borderRadius: 3,
                        position: 'absolute',
                        bottom: halfHeight,
                      }}
                    />
                    {/* Loss (downwards from 0) */}
                    <View
                      style={{
                        width: 12,
                        height: lossHeight,
                        backgroundColor: '#111827',
                        borderRadius: 3,
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
            <View style={styles.summaryDotGreen} />
            <Text style={styles.summaryLabel}>Profit</Text>
            <Text style={styles.summaryValue}>
              +{totalProfit.toFixed(2)} USD
            </Text>

            <View style={styles.summaryDotDark} />
            <Text style={styles.summaryLabel}>Loss</Text>
            <Text style={styles.summaryValue}>-{totalLoss.toFixed(2)} USD</Text>
          </View>
        </View>

        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
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
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  profitValue: {
    fontSize: 24,
    fontFamily: FONT_BOLD,
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
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
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
    backgroundColor: '#111827',
    marginLeft: 16,
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginRight: 2,
  },
  summaryValue: {
    fontSize: 14,
    color: '#111111',
    fontFamily: FONT_BOLD,
    marginRight: 8,
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
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONT_BOLD,
    marginBottom: 12,
    color: '#111',
  },
  modalOption: { paddingVertical: 12 },
  modalOptionActive: { backgroundColor: '#F3F4F6', borderRadius: 8 },
  modalOptionText: { fontSize: 16, fontFamily: FONT_REGULAR, color: '#111' },
  modalOptionTextActive: { fontFamily: FONT_BOLD, color: '#2563EB' },
  modalCloseButton: { marginTop: 16, alignSelf: 'flex-end' },
  modalCloseText: { fontSize: 16, color: '#EF4444', fontFamily: FONT_BOLD },
});

export default PerformanceScreen;
