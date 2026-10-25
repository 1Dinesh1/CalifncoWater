import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../theme/ThemeContext';

/**
 * Format timestamp into human-readable date
 */
function formatApplicationDate(timestamp) {
  if (!timestamp) return 'Recently';
  let dateObj = null;
  try {
    if (typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (timestamp.seconds != null) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    }
  } catch {
    return 'Recently';
  }

  if (!dateObj || isNaN(dateObj.getTime())) return 'Recently';

  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DealerApplyModal({
  visible,
  onClose,
  currentUser = null,
  onOpenAuth,
  onStatusUpdated,
}) {
  const { theme, isDark } = useTheme();
  const [existingApp, setExistingApp] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Reset form inputs
  const resetForm = () => {
    setBusinessName('');
    setPhone('');
    setCity('');
    setGstNumber('');
    setValidationError('');
  };

  // Fetch existing dealer application if signed in
  const fetchDealerProfile = useCallback(async () => {
    if (!currentUser?.uid) {
      setExistingApp(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setValidationError('');

    try {
      const dealerDocRef = doc(db, 'dealers', currentUser.uid);
      const snap = await getDoc(dealerDocRef);

      if (snap.exists()) {
        const data = snap.data();
        setExistingApp({ id: snap.id, ...data });
        if (onStatusUpdated) {
          onStatusUpdated(data.status || 'pending');
        }
      } else {
        setExistingApp(null);
        if (onStatusUpdated) {
          onStatusUpdated(null);
        }
      }
    } catch (err) {
      console.warn('Error fetching dealer application:', err);
      // Non-fatal: if rules deny read or user not found, treat as no application
      setExistingApp(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser, onStatusUpdated]);

  // Load existing profile when modal opens
  useEffect(() => {
    if (visible && currentUser) {
      fetchDealerProfile();
    } else if (!visible) {
      resetForm();
    }
  }, [visible, currentUser, fetchDealerProfile]);

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setValidationError('');

    if (!currentUser?.uid) {
      setValidationError('Please sign in to submit a dealer application.');
      return;
    }

    const trimmedBusiness = businessName.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const trimmedCity = city.trim();
    const trimmedGst = gstNumber.trim().toUpperCase();

    // Validation
    if (!trimmedBusiness) {
      setValidationError('Please enter your business or dealership name.');
      return;
    }
    if (trimmedBusiness.length < 3) {
      setValidationError('Business name must be at least 3 characters long.');
      return;
    }

    if (!cleanPhone) {
      setValidationError('Please enter your contact mobile number.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setValidationError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (!trimmedCity) {
      setValidationError('Please enter your city/town location.');
      return;
    }
    if (trimmedCity.length < 2) {
      setValidationError('City name must be at least 2 characters long.');
      return;
    }

    if (trimmedGst.length > 0 && trimmedGst.length !== 15) {
      setValidationError('GSTIN must be 15 characters long if provided, or leave it blank.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: currentUser.uid,
        email: currentUser.email || '',
        businessName: trimmedBusiness,
        phone: cleanPhone,
        city: trimmedCity,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      if (trimmedGst) {
        payload.gstNumber = trimmedGst;
      }

      const dealerRef = doc(db, 'dealers', currentUser.uid);
      await setDoc(dealerRef, payload);

      // Successfully submitted
      setExistingApp({
        id: currentUser.uid,
        ...payload,
        createdAt: new Date(),
      });

      if (onStatusUpdated) {
        onStatusUpdated('pending');
      }

      resetForm();

      Alert.alert(
        'Application Submitted',
        `Thank you! Your dealer application for "${trimmedBusiness}" has been submitted for review. Once approved by Califnco management, dealer wholesale pricing will be enabled.`
      );
    } catch (err) {
      console.error('Dealer application error:', err);
      setValidationError(
        err?.message || 'Failed to submit dealer application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView
        style={[styles.keyboardView, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header Bar */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: theme.primaryLight }]}>
                <Text style={styles.headerIcon}>🏢</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Dealership Program</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                  Califnco Authorized Partner Network
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.surfaceSubtle }]}
              onPress={handleModalClose}
              activeOpacity={0.7}
              accessibilityLabel="Close dealer application"
            >
              <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          {!currentUser ? (
            /* Guest Prompt */
            <View style={[styles.guestContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.guestIconBox, { backgroundColor: theme.primaryLight }]}>
                <Text style={styles.guestIcon}>🔐</Text>
              </View>
              <Text style={[styles.guestTitle, { color: theme.text }]}>Sign In Required</Text>
              <Text style={[styles.guestSubtitle, { color: theme.textMuted }]}>
                You must have an active Califnco account to apply for dealership status and access wholesale rates.
              </Text>
              <TouchableOpacity
                style={[styles.guestSignInButton, { backgroundColor: theme.primaryDark }]}
                onPress={() => {
                  handleModalClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestSignInText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          ) : loadingProfile ? (
            /* Loading Profile State */
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>Checking dealership status...</Text>
            </View>
          ) : existingApp ? (
            /* Existing Application Status View */
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Banner */}
              {existingApp.status === 'approved' ? (
                <View style={[styles.statusBanner, styles.bannerApproved, { backgroundColor: isDark ? '#064e3b' : '#dcfce7', borderColor: isDark ? '#059669' : '#86efac' }]}>
                  <View style={styles.statusBannerIconBox}>
                    <Text style={styles.statusBannerIcon}>✅</Text>
                  </View>
                  <View style={styles.statusBannerTextCol}>
                    <Text style={[styles.statusBannerTitle, styles.titleApproved, { color: isDark ? '#34d399' : '#15803d' }]}>
                      Dealership Approved
                    </Text>
                    <Text style={[styles.statusBannerSubtitle, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                      Congratulations! Your business is an authorized Califnco Water dealer.
                    </Text>
                  </View>
                </View>
              ) : existingApp.status === 'rejected' ? (
                <View style={[styles.statusBanner, styles.bannerRejected, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2', borderColor: isDark ? '#ef4444' : '#fca5a5' }]}>
                  <View style={styles.statusBannerIconBox}>
                    <Text style={styles.statusBannerIcon}>❌</Text>
                  </View>
                  <View style={styles.statusBannerTextCol}>
                    <Text style={[styles.statusBannerTitle, styles.titleRejected, { color: isDark ? '#f87171' : '#b91c1c' }]}>
                      Application Not Approved
                    </Text>
                    <Text style={[styles.statusBannerSubtitle, { color: isDark ? '#fecaca' : '#991b1b' }]}>
                      Your application could not be approved at this time. Please contact support@califnco.com for inquiries.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.statusBanner, styles.bannerPending, { backgroundColor: isDark ? '#78350f' : '#fef3c7', borderColor: isDark ? '#f59e0b' : '#fcd34d' }]}>
                  <View style={styles.statusBannerIconBox}>
                    <Text style={styles.statusBannerIcon}>⏳</Text>
                  </View>
                  <View style={styles.statusBannerTextCol}>
                    <Text style={[styles.statusBannerTitle, styles.titlePending, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                      Application Under Review
                    </Text>
                    <Text style={[styles.statusBannerSubtitle, { color: isDark ? '#fde68a' : '#92400e' }]}>
                      Your dealership request has been received and is awaiting administrative approval.
                    </Text>
                  </View>
                </View>
              )}

              {/* Application Details Card */}
              <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.detailsCardHeading, { color: theme.textMuted }]}>SUBMITTED BUSINESS DETAILS</Text>

                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Business Name</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{existingApp.businessName || '—'}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Contact Phone</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>+91 {existingApp.phone || '—'}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>City / Town</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{existingApp.city || '—'}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>GST Number</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {existingApp.gstNumber || 'Not provided'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Account Email</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{existingApp.email || currentUser.email}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Applied Date</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {formatApplicationDate(existingApp.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Informational Guidance */}
              <View style={[styles.infoBox, { backgroundColor: isDark ? '#0c2d48' : '#f0f9ff', borderColor: isDark ? '#0284c7' : '#bae6fd' }]}>
                <Text style={[styles.infoBoxTitle, { color: isDark ? '#38bdf8' : '#0369a1' }]}>💡 What Happens Next?</Text>
                <Text style={[styles.infoBoxText, { color: isDark ? '#bae6fd' : '#0369a1' }]}>
                  • Califnco operational staff verifies your business credentials.{'\n'}
                  • Once approved, wholesale prices and bulk ordering tools become active on your mobile catalogue.{'\n'}
                  • Applications cannot be overwritten to protect your verified status.
                </Text>
              </View>

              {/* Done Button */}
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: isDark ? '#334155' : '#0f172a' }]}
                onPress={handleModalClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneButtonText}>Close Window</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* New Application Form */
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Form Intro Banner */}
              <View style={[styles.introBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.introBadge}>WHOLESALE & DISTRIBUTION</Text>
                <Text style={[styles.introTitle, { color: theme.text }]}>Apply for Dealership</Text>
                <Text style={[styles.introSubtitle, { color: theme.textMuted }]}>
                  Partner with Califnco Water to access exclusive dealer margins, bulk lot pricing, and priority dispatch.
                </Text>
              </View>

              {/* Validation Error Banner */}
              {validationError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              ) : null}

              {/* Account Email (Context) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Registered Account Email</Text>
                <View style={[styles.disabledInputBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                  <Text style={[styles.disabledInputText, { color: theme.textMuted }]}>{currentUser.email}</Text>
                </View>
                <Text style={[styles.inputHelperText, { color: theme.textMuted }]}>
                  Your dealership will be linked to this account.
                </Text>
              </View>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Business / Dealership Name <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g. Apex Water Technologies"
                  placeholderTextColor={theme.textMuted}
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (validationError) setValidationError('');
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Contact Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Contact Phone Number <Text style={styles.requiredMark}>*</Text>
                </Text>
                <View style={styles.phoneInputRow}>
                  <View style={[styles.prefixBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
                    <Text style={[styles.prefixText, { color: theme.text }]}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (validationError) setValidationError('');
                    }}
                  />
                </View>
              </View>

              {/* City / Location */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  City / Town <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g. Mumbai, Pune, Nagpur"
                  placeholderTextColor={theme.textMuted}
                  value={city}
                  onChangeText={(val) => {
                    setCity(val);
                    if (validationError) setValidationError('');
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Optional GSTIN */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  GSTIN (Optional)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="characters"
                  maxLength={15}
                  value={gstNumber}
                  onChangeText={(val) => {
                    setGstNumber(val);
                    if (validationError) setValidationError('');
                  }}
                />
                <Text style={[styles.inputHelperText, { color: theme.textMuted }]}>
                  Provide 15-character GSTIN for B2B input tax credit invoices.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Dealer Application</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestIcon: {
    fontSize: 32,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestSignInButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  guestSignInText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  introBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  introBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  disabledInputBox: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabledInputText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  inputHelperText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prefixBox: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  phoneInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  bannerPending: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  bannerApproved: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  bannerRejected: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  statusBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBannerIcon: {
    fontSize: 18,
  },
  statusBannerTextCol: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  titlePending: {
    color: '#92400e',
  },
  titleApproved: {
    color: '#166534',
  },
  titleRejected: {
    color: '#991b1b',
  },
  statusBannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  detailsCardHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 19,
  },
  doneButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
