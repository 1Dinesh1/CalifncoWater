import React from 'react';
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

export default function AccountScreen({
  currentUser,
  dealerStatus,
  onOpenDealer,
  onOpenOrders,
  onOpenService,
  onOpenAuth,
  onBackToHome,
}) {
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
          badgeStyle: styles.badgeApproved,
          textStyle: styles.badgeApprovedText,
          title: 'Dealership Active',
          desc: 'Your account is an approved Califnco Water dealership partner with wholesale access.',
          buttonText: 'View Dealership Details →',
        };
      case 'pending':
        return {
          badgeText: '⏳ APPLICATION UNDER REVIEW',
          badgeStyle: styles.badgePending,
          textStyle: styles.badgePendingText,
          title: 'Application Pending Review',
          desc: 'Your dealer application has been submitted and is currently awaiting admin verification.',
          buttonText: 'View Application Status →',
        };
      case 'rejected':
        return {
          badgeText: '❌ NOT APPROVED',
          badgeStyle: styles.badgeRejected,
          textStyle: styles.badgeRejectedText,
          title: 'Application Declined',
          desc: 'Your dealer application could not be approved at this time. Tap below to view details.',
          buttonText: 'View Application Details →',
        };
      default:
        return {
          badgeText: '🏢 PARTNER NETWORK',
          badgeStyle: styles.badgeDefault,
          textStyle: styles.badgeDefaultText,
          title: 'Become an Authorized Dealer',
          desc: 'Partner with Califnco Water to access wholesale lots, bulk ordering, and high distributor margins.',
          buttonText: 'Apply for Dealership →',
        };
    }
  };

  const dealerInfo = getDealerStatusBadge();

  return (
    <View style={styles.screen}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHome}
          activeOpacity={0.7}
          accessibilityLabel="Back to catalogue"
        >
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Store</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Account</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentUser ? (
          /* ==================================================== */
          /* SIGNED-IN USER VIEW                                  */
          /* ==================================================== */
          <>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(currentUser.email || 'U')[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {currentUser.email}
                </Text>

                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>Verified Customer Account</Text>
                </View>

                <Text style={styles.uidText}>
                  ID: #{currentUser.uid.slice(0, 8)}...
                </Text>
              </View>
            </View>

            {/* Dealership Program Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>DEALERSHIP & WHOLESALE</Text>

              <View style={styles.cardBox}>
                <View style={[styles.statusBadge, dealerInfo.badgeStyle]}>
                  <Text style={[styles.statusBadgeText, dealerInfo.textStyle]}>
                    {dealerInfo.badgeText}
                  </Text>
                </View>

                <Text style={styles.cardTitle}>{dealerInfo.title}</Text>
                <Text style={styles.cardDescription}>{dealerInfo.desc}</Text>

                <TouchableOpacity
                  style={styles.cardActionButton}
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
              <Text style={styles.sectionHeader}>QUICK SERVICES</Text>

              <View style={styles.menuBox}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={onOpenOrders}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
                      <Text style={styles.menuIcon}>📦</Text>
                    </View>
                    <View>
                      <Text style={styles.menuTitle}>My Orders</Text>
                      <Text style={styles.menuSubtitle}>View past orders, delivery & payment status</Text>
                    </View>
                  </View>
                  <Text style={styles.menuArrow}>→</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={onOpenService}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#dcfce7' }]}>
                      <Text style={styles.menuIcon}>🛠️</Text>
                    </View>
                    <View>
                      <Text style={styles.menuTitle}>Book Service & Repair</Text>
                      <Text style={styles.menuSubtitle}>Doorstep installation, filter change & maintenance</Text>
                    </View>
                  </View>
                  <Text style={styles.menuArrow}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Care & Information */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>SUPPORT & ASSISTANCE</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Help & Inquiries</Text>
                  <Text style={styles.infoValue}>support@califnco.com</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Support Hours</Text>
                  <Text style={styles.infoValue}>Mon – Sat, 9 AM – 7 PM</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoLabel}>App Version</Text>
                  <Text style={styles.infoValue}>v1.0.0 (Expo SDK 58)</Text>
                </View>
              </View>
            </View>

            {/* Sign Out Action Button */}
            <View style={styles.signOutSection}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOutConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutIcon}>🚪</Text>
                <Text style={styles.signOutButtonText}>Sign Out of Account</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ==================================================== */
          /* GUEST (SIGNED-OUT) VIEW                              */
          /* ==================================================== */
          <>
            <View style={styles.guestCard}>
              <View style={styles.guestIconCircle}>
                <Text style={styles.guestIconText}>👤</Text>
              </View>
              <Text style={styles.guestHeading}>Welcome to Califnco Water</Text>
              <Text style={styles.guestSubtitle}>
                Sign in or register an account to place orders, track delivery, request purifier service, or apply for wholesale dealership.
              </Text>

              <TouchableOpacity
                style={styles.guestSignInButton}
                onPress={onOpenAuth}
                activeOpacity={0.85}
              >
                <Text style={styles.guestSignInButtonText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>

            {/* Dealership Program Preview for Guests */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>DEALERSHIP OPPORTUNITY</Text>

              <View style={styles.cardBox}>
                <View style={[styles.statusBadge, styles.badgeDefault]}>
                  <Text style={[styles.statusBadgeText, styles.badgeDefaultText]}>
                    🏢 PARTNER NETWORK
                  </Text>
                </View>

                <Text style={styles.cardTitle}>Become a Califnco Dealer</Text>
                <Text style={styles.cardDescription}>
                  Registered dealers and water purifier technicians get access to exclusive bulk wholesale margins. Sign in to submit your dealership application.
                </Text>

                <TouchableOpacity
                  style={styles.cardActionButton}
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
              <Text style={styles.sectionHeader}>CUSTOMER SUPPORT</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email Support</Text>
                  <Text style={styles.infoValue}>support@califnco.com</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoLabel}>App Version</Text>
                  <Text style={styles.infoValue}>v1.0.0 (Expo SDK 58)</Text>
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
  badgeApproved: {
    backgroundColor: '#dcfce7',
  },
  badgeApprovedText: {
    color: '#15803d',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgePendingText: {
    color: '#b45309',
  },
  badgeRejected: {
    backgroundColor: '#fee2e2',
  },
  badgeRejectedText: {
    color: '#b91c1c',
  },
  badgeDefault: {
    backgroundColor: '#e0f2fe',
  },
  badgeDefaultText: {
    color: '#0369a1',
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
});
