import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

interface YearlyStat {
  _id: number;
  total_visitors: number;
  domestic: number;
  international: number;
}

interface TopCountry {
  _id: string;
  total: number;
}

interface MonthlyStat {
  _id: number;
  total: number;
  domestic: number;
  international: number;
}

interface AnalyticsSummary {
  available_years: number[];
  yearly_stats: YearlyStat[];
  top_countries: TopCountry[];
  total_records: number;
}

interface YearlyDetail {
  year: number;
  totals: {
    total: number;
    domestic: number;
    international: number;
  };
  monthly_stats: MonthlyStat[];
  top_countries: TopCountry[];
  domestic_sources: TopCountry[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toLocaleString();
};

export default function AnalyticsScreen() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearlyDetail, setYearlyDetail] = useState<YearlyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                       process.env.EXPO_PUBLIC_BACKEND_URL || 
                       '';

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchYearlyDetail(selectedYear);
    }
  }, [selectedYear]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/analytics/summary`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setSummary(data);
      
      // Auto-select latest year
      if (data.available_years?.length > 0) {
        setSelectedYear(data.available_years[data.available_years.length - 1]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyDetail = async (year: number) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/analytics/year/${year}`);
      if (!response.ok) throw new Error('Failed to fetch yearly data');
      const data = await response.json();
      setYearlyDetail(data);
    } catch (err: any) {
      console.error('Error fetching yearly detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderYearSelector = () => {
    if (!summary?.available_years) return null;
    
    return (
      <View style={styles.yearSelector}>
        <Text style={styles.sectionLabel}>Select Year</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.yearButtonsRow}>
            {summary.available_years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonActive
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderOverviewCard = () => {
    if (!yearlyDetail) return null;

    const { totals } = yearlyDetail;
    const domesticPercent = totals.total > 0 ? (totals.domestic / totals.total * 100).toFixed(1) : '0';
    const internationalPercent = totals.total > 0 ? (totals.international / totals.total * 100).toFixed(1) : '0';

    return (
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#10B981" />
          <Text style={styles.overviewTitle}>{selectedYear} Overview</Text>
        </View>
        
        <View style={styles.totalVisitors}>
          <Text style={styles.totalNumber}>{formatNumber(totals.total)}</Text>
          <Text style={styles.totalLabel}>Total Visitors</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: '#3B82F6' }]} />
            <View>
              <Text style={styles.statNumber}>{formatNumber(totals.domestic)}</Text>
              <Text style={styles.statLabel}>Domestic ({domesticPercent}%)</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
            <View>
              <Text style={styles.statNumber}>{formatNumber(totals.international)}</Text>
              <Text style={styles.statLabel}>International ({internationalPercent}%)</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMonthlyChart = () => {
    if (!yearlyDetail?.monthly_stats?.length) return null;

    const maxValue = Math.max(...yearlyDetail.monthly_stats.map(m => m.total));

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Visitors</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {yearlyDetail.monthly_stats.map((month) => (
              <View key={month._id} style={styles.barContainer}>
                <Text style={styles.barValue}>{formatNumber(month.total)}</Text>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.barInternational,
                      { height: (month.international / maxValue) * 120 }
                    ]}
                  />
                  <View 
                    style={[
                      styles.barDomestic,
                      { height: (month.domestic / maxValue) * 120 }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{MONTHS[month._id - 1]}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Domestic</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>International</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTopCountries = () => {
    if (!yearlyDetail?.top_countries?.length) return null;

    const maxValue = yearlyDetail.top_countries[0]?.total || 1;

    return (
      <View style={styles.countriesCard}>
        <View style={styles.countriesHeader}>
          <Ionicons name="globe-outline" size={22} color="#10B981" />
          <Text style={styles.countriesTitle}>Top Source Countries</Text>
        </View>
        {yearlyDetail.top_countries.slice(0, 8).map((country, index) => (
          <View key={country._id} style={styles.countryRow}>
            <View style={styles.countryRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{country._id}</Text>
              <View style={styles.countryBarBg}>
                <View 
                  style={[
                    styles.countryBarFill,
                    { width: `${(country.total / maxValue) * 100}%` }
                  ]}
                />
              </View>
            </View>
            <Text style={styles.countryCount}>{formatNumber(country.total)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderYearlyComparison = () => {
    if (!summary?.yearly_stats?.length || summary.yearly_stats.length < 2) return null;

    const stats = summary.yearly_stats;
    const maxTotal = Math.max(...stats.map(s => s.total_visitors));

    return (
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonTitle}>Year-over-Year Growth</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.comparisonContainer}>
            {stats.map((stat, index) => {
              const prevStat = index > 0 ? stats[index - 1] : null;
              const growth = prevStat 
                ? ((stat.total_visitors - prevStat.total_visitors) / prevStat.total_visitors * 100)
                : 0;
              
              return (
                <View key={stat._id} style={styles.yearCompareItem}>
                  <View style={styles.compareBarWrapper}>
                    <View 
                      style={[
                        styles.compareBar,
                        { 
                          height: (stat.total_visitors / maxTotal) * 100,
                          backgroundColor: selectedYear === stat._id ? '#10B981' : '#4B5563'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.compareYear}>{stat._id}</Text>
                  <Text style={styles.compareTotal}>{formatNumber(stat.total_visitors)}</Text>
                  {index > 0 && (
                    <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ? '#065F46' : '#991B1B' }]}>
                      <MaterialCommunityIcons 
                        name={growth >= 0 ? 'trending-up' : 'trending-down'} 
                        size={12} 
                        color="#fff" 
                      />
                      <Text style={styles.growthText}>{Math.abs(growth).toFixed(0)}%</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load analytics</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSummary}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-bar" size={28} color="#10B981" />
        <Text style={styles.headerTitle}>Visitor Analytics</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderYearSelector()}
        
        {detailLoading ? (
          <View style={styles.detailLoading}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        ) : (
          <>
            {renderOverviewCard()}
            {renderMonthlyChart()}
            {renderTopCountries()}
            {renderYearlyComparison()}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data from {summary?.available_years?.[0]} - {summary?.available_years?.[summary.available_years.length - 1]}
          </Text>
          <Text style={styles.footerSubtext}>
            {summary?.total_records?.toLocaleString()} records • Sarawak Tourism Board
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  yearSelector: {
    padding: 16,
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  yearButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 20,
    marginRight: 8,
  },
  yearButtonActive: {
    backgroundColor: '#10B981',
  },
  yearButtonText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 15,
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  detailLoading: {
    padding: 40,
    alignItems: 'center',
  },
  overviewCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  totalVisitors: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#10B981',
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 40,
  },
  barValue: {
    color: '#9CA3AF',
    fontSize: 10,
    marginBottom: 4,
  },
  barWrapper: {
    width: 28,
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barDomestic: {
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  barInternational: {
    backgroundColor: '#F59E0B',
    width: '100%',
  },
  barLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  countriesCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  countriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countriesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  countryInfo: {
    flex: 1,
    marginRight: 12,
  },
  countryName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  countryBarBg: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
  },
  countryBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  countryCount: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
  comparisonCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  comparisonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  yearCompareItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 60,
  },
  compareBarWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  compareBar: {
    width: 40,
    borderRadius: 6,
  },
  compareYear: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  compareTotal: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  growthText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 13,
  },
  footerSubtext: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 4,
  },
});
