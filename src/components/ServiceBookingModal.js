import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Available Service Categories
const SERVICE_TYPES = [
  {
    id: 'Installation',
    title: 'Installation',
    icon: '🛠️',
    description: 'New water purifier setup, wall mounting & plumbing connection',
  },
  {
    id: 'Repair',
    title: 'Repair',
    icon: '🔧',
    description: 'Fix leaks, motor/pump issue, no water flow, low pressure or noise',
  },
  {
    id: 'Maintenance',
    title: 'Maintenance',
    icon: '🧰',
    description: 'Filter replacement, RO membrane cleaning, TDS check & sanitation',
  },
];

// Available Time Slots
const TIME_SLOTS = [
  { id: 'Morning (09:00 AM - 12:00 PM)', label: 'Morning', time: '9 AM - 12 PM', icon: '🌅' },
  { id: 'Afternoon (12:00 PM - 03:00 PM)', label: 'Afternoon', time: '12 PM - 3 PM', icon: '☀️' },
  { id: 'Evening (03:00 PM - 06:00 PM)', label: 'Evening', time: '3 PM - 6 PM', icon: '🌆' },
];

/**
 * Generate upcoming 5 selectable days starting from tomorrow
 */
function getUpcomingDates(count = 5) {
  const dates = [];
  const today = new Date();

  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayName = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const label = `${dayName}, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

    dates.push({ label, value: formatted });
  }
  return dates;
}

export default function ServiceBookingModal({
  visible,
  onClose,
  currentUser = null,
  onOpenAuth,
}) {
  const upcomingDates = useMemo(() => getUpcomingDates(5), []);

  // Form State
  const [serviceType, setServiceType] = useState('Installation');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState(upcomingDates[0]?.value || '');
  const [preferredSlot, setPreferredSlot] = useState(TIME_SLOTS[0]?.id || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill customer name from email if signed in
  useEffect(() => {
    if (currentUser?.email && !customerName) {
      const emailName = currentUser.email.split('@')[0];
      setCustomerName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }
  }, [currentUser, customerName]);

  const resetForm = () => {
    setServiceType('Installation');
    setCustomerPhone('');
    setPreferredDate(upcomingDates[0]?.value || '');
    setPreferredSlot(TIME_SLOTS[0]?.id || '');
    setAddress('');
    setNotes('');
    setError('');
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setError('');
    onClose();
  };

  const handleSubmitBooking = async () => {
    setError('');

    if (!currentUser) {
      setError('Please sign in to book a service.');
      return;
    }

    const trimmedPhone = customerPhone.trim();
    const trimmedDate = preferredDate.trim();
    const trimmedAddress = address.trim();
    const trimmedName = customerName.trim();
    const trimmedNotes = notes.trim();

    if (!serviceType) {
      setError('Please select a service type.');
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter your contact phone number.');
      return;
    }

    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (!trimmedDate) {
      setError('Please select your preferred service date.');
      return;
    }

    if (!preferredSlot) {
      setError('Please select a preferred time slot.');
      return;
    }

    if (!trimmedAddress) {
      setError('Please enter the service address.');
      return;
    }

    if (trimmedAddress.length < 8) {
      setError('Please provide a complete address (House/Flat No., Street, Area, City, PIN code).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build booking payload strictly matching firestore.rules
      const bookingPayload = {
        userId: currentUser.uid,
        customerEmail: currentUser.email || '',
        customerPhone: trimmedPhone,
        serviceType: serviceType,
        preferredDate: trimmedDate,
        preferredSlot: preferredSlot,
        address: trimmedAddress,
        bookingStatus: 'requested',
        createdAt: serverTimestamp(),
      };

      if (trimmedName) {
        bookingPayload.customerName = trimmedName;
      }

      if (trimmedNotes) {
        bookingPayload.notes = trimmedNotes;
      }

      const docRef = await addDoc(collection(db, 'serviceBookings'), bookingPayload);

      // Successfully saved to Cloud Firestore
      setIsSubmitting(false);
      resetForm();
      onClose();

      Alert.alert(
        'Service Booking Requested! 🛠️',
        `Your service request has been registered.\n\nBooking ID: ${docRef.id}\nService: ${serviceType}\nDate: ${trimmedDate}\nSlot: ${preferredSlot}\n\nOur certified technician will contact you at ${trimmedPhone} before arrival.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      setIsSubmitting(false);
      const friendlyError = err?.message || 'Failed to submit service booking. Please check your connection and try again.';
      setError(friendlyError);
      Alert.alert('Booking Error', friendlyError);
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerIcon}>🛠️</Text>
            <Text style={styles.headerTitle}>Book a Service</Text>
          </View>
          <TouchableOpacity
            onPress={handleModalClose}
            style={styles.closeButton}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Guest View: Require Authentication */}
        {!currentUser ? (
          <View style={styles.guestCenterContainer}>
            <View style={styles.guestIconCircle}>
              <Text style={styles.guestIcon}>🔧</Text>
            </View>
            <Text style={styles.guestTitle}>Sign In to Book a Service</Text>
            <Text style={styles.guestSubtitle}>
              Please sign in or create a Califnco Water customer account to schedule installation, repair, or routine maintenance for your water purifier.
            </Text>
            <TouchableOpacity
              style={styles.guestSignInButton}
              onPress={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.guestSignInButtonText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Authenticated Service Booking Form */
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Informational Intro Banner */}
            <View style={styles.introBanner}>
              <Text style={styles.introBadge}>CERTIFIED TECHNICIANS</Text>
              <Text style={styles.introTitle}>Expert Water Purifier Care</Text>
              <Text style={styles.introSubtitle}>
                Genuine spare parts, transparent pricing, and doorstep service across all major models and brands.
              </Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Field 1: Service Type */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                SERVICE TYPE <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.serviceTypesList}>
                {SERVICE_TYPES.map((type) => {
                  const isSelected = serviceType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.serviceTypeCard,
                        isSelected && styles.serviceTypeCardSelected,
                      ]}
                      onPress={() => setServiceType(type.id)}
                      activeOpacity={0.7}
                      disabled={isSubmitting}
                    >
                      <View style={styles.serviceTypeHeader}>
                        <Text style={styles.serviceTypeIcon}>{type.icon}</Text>
                        <Text
                          style={[
                            styles.serviceTypeTitle,
                            isSelected && styles.serviceTypeTitleSelected,
                          ]}
                        >
                          {type.title}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.serviceTypeDescription,
                          isSelected && styles.serviceTypeDescriptionSelected,
                        ]}
                      >
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field 2: Preferred Service Date */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                PREFERRED DATE <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.datePillsRow}
                keyboardShouldPersistTaps="handled"
              >
                {upcomingDates.map((d) => {
                  const isSelected = preferredDate === d.value;
                  return (
                    <TouchableOpacity
                      key={d.value}
                      style={[
                        styles.datePill,
                        isSelected && styles.datePillSelected,
                      ]}
                      onPress={() => setPreferredDate(d.value)}
                      activeOpacity={0.7}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.datePillText,
                          isSelected && styles.datePillTextSelected,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                style={styles.customDateInput}
                placeholder="Or specify custom date (e.g. 28 Oct 2026)"
                placeholderTextColor="#94a3b8"
                value={preferredDate}
                onChangeText={setPreferredDate}
                editable={!isSubmitting}
              />
            </View>

            {/* Field 3: Preferred Time Slot */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                PREFERRED TIME SLOT <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.slotsRow}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = preferredSlot === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotCard,
                        isSelected && styles.slotCardSelected,
                      ]}
                      onPress={() => setPreferredSlot(slot.id)}
                      activeOpacity={0.7}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.slotIcon}>{slot.icon}</Text>
                      <Text
                        style={[
                          styles.slotLabel,
                          isSelected && styles.slotLabelSelected,
                        ]}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        style={[
                          styles.slotTime,
                          isSelected && styles.slotTimeSelected,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field 4: Customer Contact Info */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                CONTACT PHONE <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={15}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                editable={!isSubmitting}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                YOUR NAME <Text style={styles.optionalTag}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
                value={customerName}
                onChangeText={setCustomerName}
                editable={!isSubmitting}
              />
            </View>

            {/* Field 5: Service Address */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                SERVICE ADDRESS <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Flat / House No., Building, Street, Landmark, City, PIN code"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={address}
                onChangeText={setAddress}
                editable={!isSubmitting}
              />
            </View>

            {/* Field 6: Notes / Issue Details */}
            <View style={styles.sectionGroup}>
              <Text style={styles.fieldLabel}>
                PURIFIER DETAILS & NOTES <Text style={styles.optionalTag}>(Optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInputNotes]}
                placeholder="e.g. Kent / Aquaguard RO model, water leaking from pipe, TDS reading high..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
                editable={!isSubmitting}
              />
            </View>

            {/* Policy & Technicians Note */}
            <View style={styles.policyNotice}>
              <Text style={styles.policyNoticeIcon}>ℹ️</Text>
              <Text style={styles.policyNoticeText}>
                No advance payment required. Our technician will assess your purifier, explain required parts or services, and provide an official Califnco Water estimate on site.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitBooking}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.submitSpinner} />
                  <Text style={styles.submitButtonText}>Registering Request...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Request Service Booking</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  guestCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestIcon: {
    fontSize: 36,
  },
  guestTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  guestSignInButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  guestSignInButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introBanner: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  introBadge: {
    color: '#bae6fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  introTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  introSubtitle: {
    color: '#e0f2fe',
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  requiredAsterisk: {
    color: '#ef4444',
  },
  optionalTag: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'none',
  },
  serviceTypesList: {
    gap: 8,
  },
  serviceTypeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  serviceTypeCardSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
  },
  serviceTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  serviceTypeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  serviceTypeTitleSelected: {
    color: '#0284c7',
    fontWeight: '800',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0284c7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  serviceTypeDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginLeft: 26,
  },
  serviceTypeDescriptionSelected: {
    color: '#0369a1',
  },
  datePillsRow: {
    paddingVertical: 4,
    gap: 8,
  },
  datePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePillSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  datePillTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  customDateInput: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0f172a',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  slotCardSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
  },
  slotIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  slotLabelSelected: {
    color: '#0284c7',
  },
  slotTime: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  slotTimeSelected: {
    color: '#0369a1',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  multilineInput: {
    height: 72,
    paddingTop: 10,
    paddingBottom: 10,
  },
  multilineInputNotes: {
    height: 64,
    paddingTop: 10,
    paddingBottom: 10,
  },
  policyNotice: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  policyNoticeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  policyNoticeText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitSpinner: {
    marginRight: 8,
  },
});
