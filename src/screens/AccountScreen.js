import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../theme/ThemeContext';
import { getReferralCode, shareReferralCode } from '../utils/referral';

export default function AccountScreen({
  currentUser,
  dealerStatus,
  onOpenDealer,
  onOpenOrders,
  onOpenService,
  onOpenAuth,
  onBackToHome,
}) {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const referralCode = getReferralCode(currentUser);

  const handleShareReferral = async () => {
    if (!referralCode) return;
    const res = await shareReferralCode(referralCode, currentUser?.email);
    if (!res.success && res.error) {
      Alert.alert('Share', res.error);
    }
  };

  const handleCopyReferral = () => {
    if (!referralCode) return;
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    Alert.alert(
      'Referral Code Ready',
      `Your personal code is:\n\n${referralCode}\n\nShare this invitation code with friends, technicians, or dealers!`,
      [{ text: 'OK' }]
    );
  };

  const handleSignOutConfirm = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Califnco Water account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (err) {
              Alert.alert('Sign Out Error', err?.message || 'Failed to sign out.');
            }
          },
        },
      ]
    );
  };

  const getDealerStatusBadge = () => {
    switch (dealerStatus) {
      case 'approved':
        return {
          badgeText: '✅ AUTHORIZED DEALER',
          badgeStyle: { backgroundColor: isDark ? '#064e3b' : '#dcfce7' },
          textStyle: { color: isDark ? '#34d399' : '#15803d' },
          title: 'Dealership Active',
          desc: 'Your account is an approved Califnco Water dealership partner with wholesale access.',
          buttonText: 'View Dealership Details →',
        };
      case 'pending':
        return {
          badgeText: '⏳ APPLICATION UNDER REVIEW',
          badgeStyle: { backgroundColor: isDark ? '#78350f' : '#fef3c7' },
          textStyle: { color: isDark ? '#fbbf24' : '#b45309' },
          title: 'Application Pending Review',
          desc: 'Your dealer application has been submitted and is currently awaiting admin verification.',
          buttonText: 'View Application Status →',
        };
      case 'rejected':
        return {
          badgeText: '❌ NOT APPROVED',
          badgeStyle: { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' },
          textStyle: { color: isDark ? '#f87171' : '#b91c1c' },
          title: 'Application Declined',
          desc: 'Your dealer application could not be approved at this time. Tap below to view details.',
          buttonText: 'View Application Details →',
        };
      default:
        return {
          badgeText: '🏢 PARTNER NETWORK',
          badgeStyle: { backgroundColor: isDark ? '#082f49' : '#e0f2fe' },
          textStyle: { color: isDark ? '#38bdf8' : '#0369a1' },
          title: 'Become an Authorized Dealer',
          desc: 'Partner with Califnco Water to access wholesale lots, bulk ordering, and high distributor margins.',
          buttonText: 'Apply for Dealership →',
        };
    }
  };

  const dealerInfo = getDealerStatusBadge();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surfaceSubtle }]}
          onPress={onBackToHome}
          activeOpacity={0.7}
          accessibilityLabel="Back to catalogue"
        >
          <Text style={[styles.backButtonIcon, { color: theme.primary }]}>←</Text>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>Store</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Account</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance & Theme Selector (Feature A - Universal) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>APPEARANCE & THEME</Text>
          <View style={[styles.themeBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.themeOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.themePill,
                  themeMode === 'light' && [styles.themePillActive, { backgroundColor: isDark ? '#0284c7' : '#e0f2fe', borderColor: theme.primary }],
                ]}
                onPress={() => setThemeMode('light')}
                activeOpacity={0.8}
              >
                <Text style={styles.themePillIcon}>☀️</Text>
                <Text
                  style={[
                    styles.themePillText,
                    { color: theme.text },
                    themeMode === 'light' && { color: theme.primaryDark, fontWeight: '800' },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themePill,
                  themeMode === 'dark' && [styles.themePillActive, { backgroundColor: isDark ? '#082f49' : '#e0f2fe', borderColor: theme.primary }],
                ]}
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.8}
              >
                <Text style={styles.themePillIcon}>🌙</Text>
                <Text
                  style={[
                    styles.themePillText,
                    { color: theme.text },
                    themeMode === 'dark' && { color: theme.primary, fontWeight: '800' },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themePill,
                  themeMode === 'system' && [styles.themePillActive, { backgroundColor: isDark ? '#082f49' : '#e0f2fe', borderColor: theme.primary }],
                ]}
                onPress={() => setThemeMode('system')}
                activeOpacity={0.8}
              >
                <Text style={styles.themePillIcon}>📱</Text>
                <Text
                  style={[
                    styles.themePillText,
                    { color: theme.text },
                    themeMode === 'system' && { color: theme.primary, fontWeight: '800' },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.themeSubtitle, { color: theme.textMuted }]}>
              {themeMode === 'system'
                ? `System default active (${isDark ? 'Dark Mode' : 'Light Mode'})`
                : `${themeMode === 'dark' ? 'Dark' : 'Light'} theme selected`}
            </Text>
          </View>
        </View>

        {currentUser ? (
          /* ==================================================== */
          /* SIGNED-IN USER VIEW                                  */
          /* ==================================================== */
          <>
            {/* User Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.primaryDark }]}>
                <Text style={styles.avatarInitial}>
                  {(currentUser.email || 'U')[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <Text style={[styles.profileEmail, { color: theme.text }]} numberOfLines={1}>
                  {currentUser.email}
                </Text>

                <View style={styles.verifiedRow}>
                  <View style={[styles.verifiedDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.verifiedText, { color: theme.success }]}>Verified Customer Account</Text>
                </View>

                <Text style={[styles.uidText, { color: theme.textSubtle }]}>
                  ID: #{currentUser.uid.slice(0, 8)}...
                </Text>
              </View>
            </View>

            {/* Feature D: Referral System Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>REFERRAL PROGRAM</Text>
              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.statusBadge, { backgroundColor: isDark ? '#082f49' : '#e0f2fe' }]}>
                  <Text style={[styles.statusBadgeText, { color: theme.primary }]}>
                    🎁 CUSTOMER INVITATION
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Invite Friends & Partners
                </Text>
                <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                  Share your unique referral code with family, technicians, and local dealers. When they register in the Califnco Water app, their profile is securely connected to your invitation.
                </Text>

                <View style={[styles.referralCodeBox, { backgroundColor: isDark ? '#0b1120' : '#f8fafc', borderColor: theme.border }]}>
                  <View style={styles.referralCodeLeft}>
                    <Text style={[styles.referralCodeLabel, { color: theme.textSubtle }]}>Your Personal Code</Text>
                    <Text style={[styles.referralCodeValue, { color: theme.primary }]}>{referralCode}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.referralCopyBtn, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
                    onPress={handleCopyReferral}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.referralCopyText, { color: theme.text }]}>
                      {copyFeedback ? '✓ Copied' : '📋 Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: theme.primaryDark, marginTop: 12 }]}
                  onPress={handleShareReferral}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionButtonText}>
                    📤 Share Invitation Code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dealership Program Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>DEALERSHIP & WHOLESALE</Text>

              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.statusBadge, dealerInfo.badgeStyle]}>
                  <Text style={[styles.statusBadgeText, dealerInfo.textStyle]}>
                    {dealerInfo.badgeText}
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>{dealerInfo.title}</Text>
                <Text style={[styles.cardDescription, { color: theme.textMuted }]}>{dealerInfo.desc}</Text>

                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: theme.primaryDark }]}
                  onPress={onOpenDealer}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionButtonText}>
                    {dealerInfo.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions Navigation */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>QUICK SERVICES</Text>

              <View style={[styles.menuBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={onOpenOrders}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#082f49' : '#e0f2fe' }]}>
                      <Text style={styles.menuIcon}>📦</Text>
                    </View>
                    <View>
                      <Text style={[styles.menuTitle, { color: theme.text }]}>My Orders</Text>
                      <Text style={[styles.menuSubtitle, { color: theme.textMuted }]}>View past orders, delivery & payment status</Text>
                    </View>
                  </View>
                  <Text style={[styles.menuArrow, { color: theme.textSubtle }]}>→</Text>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: theme.borderSubtle }]} />

                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={onOpenService}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                      <Text style={styles.menuIcon}>🛠️</Text>
                    </View>
                    <View>
                      <Text style={[styles.menuTitle, { color: theme.text }]}>Book Service & Repair</Text>
                      <Text style={[styles.menuSubtitle, { color: theme.textMuted }]}>Doorstep installation, filter change & maintenance</Text>
                    </View>
                  </View>
                  <Text style={[styles.menuArrow, { color: theme.textSubtle }]}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Care & Information */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>SUPPORT & ASSISTANCE</Text>

              <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Help & Inquiries</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>support@califnco.com</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Support Hours</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>Mon – Sat, 9 AM – 7 PM</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>App Version</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>v1.0.0 (Expo SDK 58)</Text>
                </View>
              </View>
            </View>

            {/* Sign Out Action Button */}
            <View style={styles.signOutSection}>
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: isDark ? '#1e1b2e' : '#ffffff', borderColor: isDark ? '#7f1d1d' : '#fca5a5' }]}
                onPress={handleSignOutConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutIcon}>🚪</Text>
                <Text style={[styles.signOutButtonText, { color: isDark ? '#f87171' : '#dc2626' }]}>Sign Out of Account</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ==================================================== */
          /* GUEST (SIGNED-OUT) VIEW                              */
          /* ==================================================== */
          <>
            <View style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.guestIconCircle, { backgroundColor: theme.primaryLight }]}>
                <Text style={styles.guestIconText}>👤</Text>
              </View>
              <Text style={[styles.guestHeading, { color: theme.text }]}>Welcome to Califnco Water</Text>
              <Text style={[styles.guestSubtitle, { color: theme.textMuted }]}>
                Sign in or register an account to place orders, track delivery, request purifier service, or apply for wholesale dealership.
              </Text>

              <TouchableOpacity
                style={[styles.guestSignInButton, { backgroundColor: theme.primaryDark }]}
                onPress={onOpenAuth}
                activeOpacity={0.85}
              >
                <Text style={styles.guestSignInButtonText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>

            {/* Referral Preview for Guests */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>REFERRAL INVITATION</Text>
              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.statusBadge, { backgroundColor: isDark ? '#082f49' : '#e0f2fe' }]}>
                  <Text style={[styles.statusBadgeText, { color: theme.primary }]}>
                    🎁 INVITATION CODE
                  </Text>
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Have a Referral Code?</Text>
                <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                  Got invited by a friend or dealer? Enter their referral code during registration to connect your account.
                </Text>
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: theme.primaryDark }]}
                  onPress={onOpenAuth}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionButtonText}>
                    Register with Code →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dealership Program Preview for Guests */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>DEALERSHIP OPPORTUNITY</Text>

              <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.statusBadge, styles.badgeDefault]}>
                  <Text style={[styles.statusBadgeText, styles.badgeDefaultText]}>
                    🏢 PARTNER NETWORK
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>Become a Califnco Dealer</Text>
                <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                  Registered dealers and water purifier technicians get access to exclusive bulk wholesale margins. Sign in to submit your dealership application.
                </Text>

                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: theme.primaryDark }]}
                  onPress={onOpenAuth}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionButtonText}>
                    Sign In to Apply →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Care info for Guests */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSubtle }]}>CUSTOMER SUPPORT</Text>

              <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Email Support</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>support@califnco.com</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>App Version</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>v1.0.0 (Expo SDK 58)</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  backButtonIcon: {
    fontSize: 16,
    color: '#0284c7',
    fontWeight: '800',
  },
  backButtonText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRightSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  themeBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  themePillActive: {
    borderWidth: 1,
  },
  themePillIcon: {
    fontSize: 15,
  },
  themePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileDetails: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  verifiedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  uidText: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  referralCodeLeft: {
    flex: 1,
  },
  referralCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  referralCodeValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  referralCopyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  referralCopyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  menuBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 62,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  signOutSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 13,
  },
  signOutIcon: {
    fontSize: 16,
  },
  signOutButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestIconText: {
    fontSize: 28,
  },
  guestHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  guestSignInButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  guestSignInButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  badgeDefault: {
    backgroundColor: '#e0f2fe',
  },
  badgeDefaultText: {
    color: '#0369a1',
  },
});
