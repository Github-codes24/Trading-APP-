import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Alert 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FONT_BOLD = Platform.select({ ios: 'HartwellAlt-Black', android: 'hartwell_alt_black' });
const FONT_SEMIBOLD = Platform.select({ ios: 'Hartwell-Semibold', android: 'hartwell_semibold' });
const FONT_MEDIUM = Platform.select({ ios: 'Hartwell-Medium', android: 'hartwell_medium' });
const FONT_REGULAR = Platform.select({ ios: 'Hartwell-Regular', android: 'hartwell_regular' });

const ListItem: React.FC<{ 
  icon: string; 
  title: string; 
  subtitle?: string; 
  rightText?: string; 
  badge?: boolean; 
  customRightTextStyle?: any 
}> = ({ icon, title, subtitle, rightText, badge, customRightTextStyle }) => (
  <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
    <View style={styles.itemLeft}>
      <View style={styles.itemIconWrap}>
        <Feather name={icon as any} size={20} color="#111518" />
      </View>
      <View>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <View style={styles.itemRight}>
      {rightText ? (
        badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{rightText}</Text>
          </View>
        ) : (
          <Text style={customRightTextStyle || styles.rightText}>{rightText}</Text>
        )
      ) : null}
      <Feather name="chevron-right" size={22} color="#9CA3AF" />
    </View>
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) setUserEmail(currentUser.email);
  }, []);

const handleLogout = async () => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    // 1️⃣ Firestore update
    await firestore()
      .collection("users")
      .doc(currentUser.uid)
      .set({ isLoggedIn: false, deviceId: null }, { merge: true });

    // 2️⃣ Firebase sign out
    await auth().signOut();

    // 3️⃣ Clear AsyncStorage & Redux state
    await AsyncStorage.clear(); // ya selectively balance + passcode
    dispatch(resetBalance()); // ✅ reset Redux balance

    // 4️⃣ Navigate to Main screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to log out");
  }
};



  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.settingsBtn}>
            <Feather name="settings" size={22} color="#111518" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Verification</Text>
        <ListItem icon="user" title="Verification progress" rightText="Not verified" badge />

        <View style={styles.banner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconWrap}>
              <Feather name="user" size={20} color="#111518" />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>
                Hello. Fill in your account details to make your first deposit
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Complete profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Benefits</Text>
        <ListItem icon="aperture" title="Swap–free" />
        <ListItem icon="shield" title="Negative Balance Protection" />
        <ListItem icon="server" title="Virtual Private Server" />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Crypto wallet</Text>
        <ListItem 
          icon="credit-card" 
          title="Balance" 
          rightText="0.00 USD" 
          customRightTextStyle={styles.balanceText} 
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Referral program</Text>
        <ListItem icon="users" title="Friends" />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Support</Text>
        <View style={styles.group}>
          <ListItem icon="heart" title="Support hub" subtitle="Find answers to your questions" />
          <View style={styles.separator} />
          <ListItem icon="message-square" title="Open a ticket" subtitle="Fill the request form and we'll get back to you" />
          <View style={styles.separator} />
          <ListItem icon="message-circle" title="LiveChat" subtitle="Feel free to contact our customer support" />
          <View style={styles.separator} />
          <ListItem icon="sun" title="Suggest a feature" subtitle="Help us become better" />
          <View style={styles.separator} />
          <ListItem icon="file-text" title="Legal Documents" subtitle="Exness (SC) Ltd" />
          <View style={styles.separator} />
          <ListItem icon="thumbs-up" title="Rate the app" subtitle="Please rate us in Google Play" />
          <View style={styles.separator} />
          <ListItem icon="download" title="Update the app" subtitle="Download the latest version of the app" />
          <View style={styles.separator} />
          <ListItem icon="info" title="About the app" />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.8}>
          <View style={styles.logoutLeft}>
            <View style={styles.logoutIconWrap}>
              <Feather name="log-out" size={20} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.logoutTitle}>Log Out</Text>
              <Text style={styles.logoutEmail}>{userEmail || ''}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', paddingHorizontal: 18, paddingBottom: 8 },
  settingsBtn: { alignSelf: 'flex-end', paddingVertical: 6 },
  headerTitle: { fontSize: 34, paddingBottom: 20, color: '#111518', fontFamily: FONT_BOLD },
  sectionTitle: { fontSize: 20, color: '#0F172A', paddingHorizontal: 18, marginTop: 12, marginBottom: 8, fontFamily: FONT_SEMIBOLD },
  sectionTitleFirst: { marginTop: 0 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 16, color: '#111518', fontFamily: FONT_MEDIUM },
  itemSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: FONT_REGULAR },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightText: { color: '#6B7280', fontSize: 12, fontFamily: FONT_MEDIUM },
  balanceText: { color: '#000000', fontSize: 14, fontFamily: FONT_BOLD },
  badge: { backgroundColor: '#FEE2E2', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, marginRight: 4 },
  badgeText: { color: '#B91C1C', fontSize: 12, fontFamily: FONT_MEDIUM },
  banner: { marginHorizontal: 18, marginTop: 8, backgroundColor: '#FFF5CC', borderRadius: 10, padding: 14 },
  bannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  bannerIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEFA6', alignItems: 'center', justifyContent: 'center' },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 14, color: '#111518', lineHeight: 20, fontFamily: FONT_REGULAR },
  bannerButton: { height: 44, borderRadius: 8, backgroundColor: '#FFD100', alignItems: 'center', justifyContent: 'center' },
  bannerButtonText: { fontSize: 16, color: '#111518', fontFamily: FONT_SEMIBOLD },
  cardRow: { marginTop: 16, marginHorizontal: 18, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  cardIconGreen: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6FFFA', alignItems: 'center', justifyContent: 'center' },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 16, color: '#0F172A', fontFamily: FONT_MEDIUM },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: FONT_REGULAR },
  group: { backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 18, paddingVertical: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 18 + 36 + 12 },
  logoutCard: { marginTop: 18, marginHorizontal: 18, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F1F5F9' },
  logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' },
  logoutTitle: { fontSize: 16, color: '#0F172A', fontFamily: FONT_MEDIUM },
  logoutEmail: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: FONT_REGULAR },
});

export default ProfileScreen;
