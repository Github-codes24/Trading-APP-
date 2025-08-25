import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

// Replace with your actual font names from assets/fonts
const FONT_BOLD = 'Satoshi-Bold';
const FONT_REGULAR = 'Satoshi-Regular';
const FONT_MEDIUM = 'Satoshi-Medium';

const TABS = [
  { label: 'Summary' },
  { label: 'Exness benefits' },
];

// Sample chart data - replace with your actual data
const CHART_DATA = [
  { date: '05 Apr', value: 0 },
  { date: '06 Apr', value: 0 },
  { date: '07 Apr', value: 0 },
  { date: '08 Apr', value: 0 },
  { date: '09 Apr', value: 9.21 },
  { date: '10 Apr', value: 0 },
  { date: '11 Apr', value: 0 },
];

const PerformanceScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const maxValue = Math.max(...CHART_DATA.map(d => d.value));
  const chartHeight = 120;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance</Text>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabDivider} />

        <View style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8}>
            <Text style={styles.filterText}>All real accounts</Text>
            <Icon name="chevron-down" size={16} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8}>
            <Icon name="calendar" size={16} color="#111" style={{ marginRight: 8 }} />
            <Text style={styles.filterText}>Last 7 days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Profit / Loss</Text>
          <Icon name="info" size={20} color="#111" />
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.profitRow}>
            <Text style={styles.profitValue}>+9.21 USD</Text>
            <View style={styles.percentBadge}>
              <Icon name="arrow-down-right" size={14} color="#E11D48" />
              <Text style={styles.percentText}>-2.00%</Text>
              <Icon name="info" size={14} color="#E11D48" style={{ marginLeft: 2 }} />
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            {/* Y-axis labels and grid lines */}
            <View style={styles.chartYAxisContainer}>
              {[10, 8, 6, 4, 2].map((val, i) => (
                <View key={val} style={styles.chartRow}>
                  <Text style={styles.chartYAxis}>{val.toFixed(2)}</Text>
                  <View style={styles.chartGridLine} />
                </View>
              ))}
            </View>
            
            {/* Chart bars */}
            <View style={styles.chartBarsContainer}>
              {CHART_DATA.map((item, index) => {
                const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
                return (
                  <View key={item.date} style={styles.chartBarWrapper}>
                    <View style={[
                      styles.chartBar, 
                      { 
                        height: barHeight,
                        backgroundColor: item.value > 0 ? '#4ADE80' : '#E5E7EB'
                      }
                    ]} />
                  </View>
                );
              })}
            </View>
            
            {/* X-axis labels */}
            <View style={styles.chartXAxisRow}>
              {CHART_DATA.map((item) => (
                <Text key={item.date} style={styles.chartXAxisLabel}>{item.date}</Text>
              ))}
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryDotGreen} />
            <Text style={styles.summaryLabel}>Profit</Text>
            <Text style={styles.summaryValue}>+9.21 USD</Text>
            <View style={styles.summaryDotDark} />
            <Text style={styles.summaryLabel}>Loss</Text>
            <Text style={styles.summaryValue}>+0.00 USD</Text>
          </View>
          <Text style={styles.lastUpdated}>Last updated: Today, 10:21 am</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Equity</Text>
          <Icon name="info" size={20} color="#111" />
        </View>
        <View style={styles.sectionCard}>
          <Text style={styles.equityValue}>0.00 USD</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  header: {
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#111111',
  },
  tabText: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: FONT_MEDIUM,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#111111',
    fontFamily: FONT_BOLD,
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
    marginHorizontal: 24,
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
    color: '#E11D48',
    fontSize: 14,
    fontFamily: FONT_BOLD,
    marginLeft: 2,
    marginRight: 2,
  },
  chartContainer: {
    height: 180,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  chartYAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 16,
    width: '100%',
    height: 120,
    justifyContent: 'space-between',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
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
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 2,
  },
  chartXAxisRow: {
    position: 'absolute',
    left: 52,
    bottom: 16,
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
  lastUpdated: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginTop: 8,
  },
  equityValue: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
    marginBottom: 8,
  },
});

export default PerformanceScreen;