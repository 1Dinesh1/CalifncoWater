import React, { useState } from 'react';
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
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useTheme } from '../theme/ThemeContext';
import { recordReferralAttribution, isValidReferralCode } from '../utils/referral';

export default function AuthModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setReferralCode('');
    setErrorMessage('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
  };

  const getFriendlyErrorMessage = (error) => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled in Firebase Console. Please enable it in Firebase Console > Authentication > Sign-in method.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact Califnco support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please register first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your credentials.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please wait a few moments and try again.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connectivity.';
      default:
        return error?.message || 'Authentication failed. Please try again.';
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();

    // Field validation
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        setErrorMessage('Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }

      // Feature D: Validate referral code format if entered
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        if (!isValidReferralCode(cleanRef)) {
          setErrorMessage('Invalid referral code format. Valid codes start with CALIF- followed by 4-10 characters.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        resetForm();
        onClose();
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const newUserId = userCred.user.uid;

        // Feature D: Safely attribute referral without failing signup
        let referralNote = '';
        if (referralCode.trim()) {
          const cleanRef = referralCode.trim().toUpperCase();
          const attributionRes = await recordReferralAttribution(db, newUserId, trimmedEmail, cleanRef);
          if (attributionRes.recorded) {
            referralNote = `\n\nReferral code ${cleanRef} successfully applied!`;
          }
        }

        resetForm();
        onClose();
        Alert.alert(
          'Account Created',
          `Welcome to Califnco Water! You are now signed in as ${trimmedEmail}.${referralNote}`
        );
      }
    } catch (err) {
      if (mode === 'register') {
        const configuredKey = 'AIzaSyBuzTE2I3nCp2Z_TiT2P1GVaPsv67sx2V8';
        const keyMatches = auth?.app?.options?.apiKey === configuredKey;
        const projectId = auth?.app?.options?.projectId || 'N/A';
        const code = err?.code || 'unknown-code';
        const rawMessage = err?.message || 'No message';
        const friendlyMsg = getFriendlyErrorMessage(err);

        console.log('[Auth Diagnostic] Registration Error:');
        console.log('  - err.code:', code);
        console.log('  - err.message:', rawMessage);
        console.log('  - err.customData?.appName:', err?.customData?.appName);
        console.log('  - auth.app.options.projectId:', projectId);
        console.log('  - apiKey equals configured key:', keyMatches);

        setErrorMessage(
          `${friendlyMsg}\n\n[Firebase Diagnostic]\n• Error Code: ${code}\n• Error Message: ${rawMessage}\n• Project ID: ${projectId}\n• Key Matches Config: ${keyMatches}`
        );
      } else {
        setErrorMessage(getFriendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.keyboardContainer, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Text style={styles.brandIcon}>💧</Text>
              <Text style={[styles.brandTitle, { color: theme.text }]}>Califnco Water</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.surfaceSubtle }]}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Title & Subtitle */}
            <Text style={[styles.formTitle, { color: theme.text }]}>
              {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.textMuted }]}>
              {mode === 'login'
                ? 'Sign in to access your Califnco Water customer account.'
                : 'Join Califnco Water for quick ordering, service, and referral benefits.'}
            </Text>

            {/* Mode Switcher Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSubtle }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  mode === 'login' && [styles.tabActive, { backgroundColor: isDark ? theme.surfaceElevated : '#ffffff' }],
                ]}
                onPress={() => handleSwitchMode('login')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.textMuted },
                    mode === 'login' && [styles.tabTextActive, { color: theme.primary }],
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  mode === 'register' && [styles.tabActive, { backgroundColor: isDark ? theme.surfaceElevated : '#ffffff' }],
                ]}
                onPress={() => handleSwitchMode('register')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.textMuted },
                    mode === 'register' && [styles.tabTextActive, { color: theme.primary }],
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Alert */}
            {errorMessage ? (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? '#450a0a' : '#fef2f2' }]}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorText, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="customer@example.com"
                  placeholderTextColor={theme.textSubtle}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={theme.textSubtle}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.showPasswordText, { color: theme.primary }]}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {mode === 'register' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <Text style={styles.inputIcon}>🔐</Text>
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={theme.textSubtle}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Feature D: Referral Invitation Code Field */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Referral Invitation Code <Text style={{ fontSize: 11, fontWeight: '400', color: theme.textSubtle }}>(Optional)</Text>
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <Text style={styles.inputIcon}>🎁</Text>
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder="e.g. CALIF-AB12CD"
                      placeholderTextColor={theme.textSubtle}
                      value={referralCode}
                      onChangeText={(text) => {
                        setReferralCode(text.toUpperCase());
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.primaryDark },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.loadingText}>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch Mode Prompt */}
            <View style={styles.switchPromptContainer}>
              <Text style={[styles.switchPromptText, { color: theme.textMuted }]}>
                {mode === 'login'
                  ? "Don't have an account yet?"
                  : 'Already have an account?'}
              </Text>
              <TouchableOpacity
                onPress={() => handleSwitchMode(mode === 'login' ? 'register' : 'login')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.switchActionText, { color: theme.primary }]}>
                  {mode === 'login' ? ' Register here' : ' Sign In here'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  showPasswordBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showPasswordText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  switchPromptText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchActionText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '700',
  },
});
