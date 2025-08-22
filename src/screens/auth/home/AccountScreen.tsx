import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import  Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTabs from '../../../components/BottomTabs'; 
import PerformanceScreen from './PerformanceScreen';
import ProfileScreen from './ProfileScreen';
import TradeScreen from './TradeScreen';
import { ArrowUpDown } from 'lucide-react-native';

const Chip: React.FC<{ label: string }> = ({ label }) => (
	<View style={styles.chip}>
		<Text style={styles.chipText}>{label}</Text>
	</View>
);

const CircleIconButton: React.FC<{ name: string; onPress?: () => void }> = ({ name }) => (
	<View style={styles.circleIconButton}>
		<Icon name={name} size={20} color="#111111" />
	</View>
);

const ActionItem: React.FC<{ icon: string; label: string; active?: boolean }> = ({ icon, label, active }) => (
	<View style={styles.actionItem}>
		<View style={[styles.actionIconWrap, active ? styles.actionIconActive : styles.actionIconIdle]}>
			<Icon name={icon} size={25} color="#000000" />
		</View>
		<Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
	</View>
);



const AccountScreen: React.FC = () => {
	const [activeTab, setActiveTab] = useState('accounts');
	const [positionsTab, setPositionsTab] = useState<'Open' | 'Pending' | 'Closed'>('Open');

	const handleTabPress = (tabKey: string) => {
		setActiveTab(tabKey);
	};

	const AccountsUI = () => (
		<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
			{/* Top toolbar icons */}
			<View style={styles.topToolbar}>
				<MaterialIcons name="access-alarm" size={24} color="#000000" style={{ marginRight: 22,  }} />
				<View style={{ position: 'relative' }}>
					<Fontisto name="bell" size={24} color="#000000" />
				</View>
			</View>

			{/* Header */}
			<View style={styles.headerRow}>
				<Text style={styles.headerTitle}>Accounts</Text>
				<View style={{ flex: 1 }} />
				<CircleIconButton name="plus" />
			</View>

			{/* Account card */}
			<View style={styles.accountCard}>
				<View style={styles.accountHeaderRow}>
					<View>
						<Text style={styles.accountTypeText}>APRIL 2025 5828 # 405331194</Text>
						<View style={styles.chipsRow}>
							<Chip label="MT5" />
							<Chip label="Zero" />
							<Chip label="Real" />
						</View>
					</View>
					<View style={styles.circleSmall}>
						<Icon name="chevron-right" size={20} color="#6B7280" />
					</View>
				</View>

				<Text style={styles.balanceText}>0.00 INR</Text>

				<View style={styles.actionsRow}>
					{/* Changed icon for Trade to 'activity' for better visual approximation */}
					<ActionItem icon="activity" label="Trade" active />
					<ActionItem icon="arrow-down-circle" label="Deposit" />
					<ActionItem icon="arrow-up-right" label="Withdraw" />
					<ActionItem icon="more-vertical" label="Details" />
				</View>
			</View>

			{/* Positions tabs */}
			<View style={styles.segmentRow}>
				<View style={styles.segmentTabs}>
					<TouchableOpacity onPress={() => setPositionsTab('Open')}>
						<View style={styles.segmentTabItem}>
							<Text style={[
								styles.segmentLabel,
								positionsTab === 'Open' && styles.segmentActive,
							]}>Open</Text>
							{positionsTab === 'Open' && <View style={styles.segmentIndicator} />}
						</View>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setPositionsTab('Pending')}>
						<View style={styles.segmentTabItem}>
							<Text style={[
								styles.segmentLabel,
								positionsTab === 'Pending' && styles.segmentActive,
							]}>Pending</Text>
							{positionsTab === 'Pending' && <View style={styles.segmentIndicator} />}
						</View>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setPositionsTab('Closed')}>
						<View style={styles.segmentTabItem}>
							<Text style={[
								styles.segmentLabel,
								positionsTab === 'Closed' && styles.segmentActive,
							]}>Closed</Text>
							{positionsTab === 'Closed' && <View style={styles.segmentIndicator} />}
						</View>
					</TouchableOpacity>
				</View>
				{/* Sort control */}
				<View style={styles.sortButton}>
				<ArrowUpDown size={20} color="#6B7280" />
				</View>
			</View>
			
			{renderPositionsContent()}
		</ScrollView>
	);

	const renderPositionsContent = () => {
    switch (positionsTab) {
        case 'Open':
            return (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyTitle}>No open orders</Text>
                    <Text style={styles.emptySubtitle}>
                        Use the opportunity to trade on the world's{'\n'}major financial markets
                    </Text>
                </View>
            );
        case 'Pending':
            return (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyTitle}>No pending orders</Text>
                </View>
            );
        case 'Closed':
            return (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyTitle}>No closed orders</Text>
                </View>
            );
        default:
            return null;
    }
};

	return (
		<SafeAreaView style={styles.container}>
			<View style={(activeTab === 'performance' || activeTab === 'trade') ? styles.mainContentNoPad : styles.mainContent}>
				{activeTab === 'accounts' && <AccountsUI />}
				{activeTab === 'trade' && <TradeScreen />}
				{activeTab === 'performance' && <PerformanceScreen />}
                {activeTab === 'profile' && <ProfileScreen />}
			</View>
			<BottomTabs activeTab={activeTab} onTabPress={handleTabPress} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAFA', // changed to match screenshot
	},
	mainContent: {
		flex: 1,
		paddingHorizontal: 16,
	},
    mainContentNoPad: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 24,
	},
	topToolbar: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		paddingBottom: 6,
		paddingLeft	:8,
		paddingRight:8,
	},
	headerRow: {
		marginTop:12,
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: 12,
	},
	headerTitle: {
		fontSize: 38,
		fontWeight: '700',
		color: '#111111',
		letterSpacing:1
	},
	circleIconButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#EEEFF1',
	},
	accountCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	accountHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	accountTypeText: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 8,
		letterSpacing: 0.4,
	},
	chipsRow: {
		flexDirection: 'row',
		gap: 8,
	},
	chip: {
		backgroundColor: '#F3F4F6',
		
		borderRadius: 999,
		paddingVertical: 2,
		paddingHorizontal: 6,
	},
	chipText: {
		fontSize: 14,
		color: '#24292D',
		fontWeight:500
	},
	circleSmall: {
		marginLeft: 'auto',
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F5F6F8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	balanceText: {
		fontSize: 28,
		fontWeight: '800',
		color: '#111111',
		marginBottom: 16,
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginHorizontal:-18
	},
	actionItem: {
		width: '25%',
		alignItems: 'center',
	},
	actionIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F3F4F6',
	},
	actionIconIdle: {
		backgroundColor: '#F3F4F6',
	},
	actionIconActive: {
		backgroundColor: '#FFD100',
	},
	actionLabel: {
		marginTop: 6,
		fontSize: 13,
		color: '#6B7280',
		lineHeight: 16,
		fontWeight: '600',
	},
	actionLabelActive: {
		
		fontWeight: '600',
	},
	segmentRow: {
		marginTop: 24,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 0,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		backgroundColor: '#FAFAFA',
	},
	segmentTabs: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 'auto',
	},
	segmentTabItem: {
		position: 'relative',
		paddingHorizontal: 12,
		paddingBottom: 8,
	},
	segmentLabel: {
		fontSize: 18,
		color: '#6B7280',
		fontWeight: '400',
	},
	segmentActive: {
		color: '#23272F',
		fontWeight: '500',
	},
	segmentIndicator: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: -2,
		height: 3,
		backgroundColor: '#23272F',
		borderRadius: 2,
	},
	sortButton: {
		width: 36,
		height: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#23272F',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#23272F',
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.7,
    },
    tabContent: {
        alignItems: 'center',
        paddingVertical: 10, // Increased padding to match the image's empty space
    },
    noPositionsText: {
        fontSize: 16,
        color: '#000000',
        marginBottom: 20,
        textAlign: 'center',
    },
    dateRangeText: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    xauUsdTradeButton: {
		width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
		alignItems: 'center',
        backgroundColor: '#EEEFF1',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 15, // Spacing to next component
        gap: 8, // Spacing between items inside the button
    },
    xauUsdFlag: {
        fontSize: 18, // Adjust size to match image
    },
    xauUsdText: {		
        fontSize: 18,
        color: '#000',
		fontWeight:600
    },
    exploreMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    exploreMoreText: {
        fontSize: 16,
        color: '#000000',
        marginLeft: 8,
    },
});

export default AccountScreen;