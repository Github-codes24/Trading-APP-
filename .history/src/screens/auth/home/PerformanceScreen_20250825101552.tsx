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

const PerformanceScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
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
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.8}>
            <Icon name="calendar" size={16} color="#111" style={{ marginRight: 6 }} />
            <Text style={styles.filterText}>Last 7 days</Text>
          </TouchableOpacity>
        </View>

        {/* Profit / Loss */}
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

          {/* Chart */}
          <View style={styles.chartContainer}>
            {[10, 8, 6, 4, 2, 0].map((val) => (
              <View key={val} style={styles.chartRow}>
                <Text style={styles.chartYAxis}>{val.toFixed(2)}</Text>
                <View style={styles.chartGridLine} />
              </View>
            ))}
            <View style={styles.chartBarWrapper}>
              <View style={styles.chartBar} />
            </View>
            <View style={styles.chartXAxisRow}>
              {['05 Apr', '06 Apr', '07 Apr', '08 Apr', '09 Apr', '10 Apr', '11 Apr'].map((d) => (
                <Text key={d} style={styles.chartXAxisLabel}>{d}</Text>
              ))}
            </View>
          </View>

          {/* Summary */}
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

        {/* Equity */}
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
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONT_MEDIUM,
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

  // Filters
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#111111',
    marginRight: 4,
    fontFamily: FONT_REGULAR,
  },

  // Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
    marginTop: 8,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 20,
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
    shadowRadius: 6,
    elevation: 2,
  },

  // Profit Row
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profitValue: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentText: {
    color: '#E11D48',
    fontSize: 13,
    fontFamily: FONT_BOLD,
    marginHorizontal: 2,
  },

  // Chart
  chartContainer: {
    height: 140,
    marginVertical: 12,
    backgroundColor: '#F7F9FA',
    borderRadius: 12,
    paddingHorizontal: 6,
    justifyContent: 'flex-end',
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
    marginRight: 6,
  },
  chartGridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  chartBarWrapper: {
    position: 'absolute',
    left: 70,
    bottom: 28,
    width: 28,
    height: 85,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 28,
    height: 85,
    backgroundColor: '#22C55E',
    borderRadius: 6,
    opacity: 0.8,
  },
  chartXAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 44,
    marginRight: 8,
  },
  chartXAxisLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONT_REGULAR,
    width: 36,
    textAlign: 'center',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
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
    marginLeft: 12,
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginRight: 2,
  },
  summaryValue: {
    fontSize: 13,
    color: '#111111',
    fontFamily: FONT_BOLD,
    marginRight: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONT_REGULAR,
    marginTop: 6,
  },

  // Equity
  equityValue: {
    fontSize: 20,
    fontFamily: FONT_BOLD,
    color: '#111111',
    fontWeight: '800',
    marginBottom: 6,
  },
});

export default PerformanceScreen;
