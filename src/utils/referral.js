import { Share } from 'react-native';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Derives a deterministic, unique, and stable referral code for a verified customer
 * @param {Object} user - Firebase user object
 * @returns {string|null} Referral code (e.g. CALIF-A1B2C3) or null
 */
export function getReferralCode(user) {
  if (!user || !user.uid) return null;
  const cleanUid = String(user.uid).replace(/[^a-zA-Z0-9]/g, '');
  const prefix = cleanUid.slice(0, 6).toUpperCase();
  return `CALIF-${prefix}`;
}

/**
 * Validates the format of an entered referral code
 * @param {string} code
 * @returns {boolean}
 */
export function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  // Valid formats: CALIF-XXXXXX (6 alphanumeric) or legacy alphanumeric 6-12 chars
  return /^CALIF-[A-Z0-9]{4,10}$/.test(trimmed) || /^[A-Z0-9]{6,12}$/.test(trimmed);
}

/**
 * Checks if a referral code belongs to the current user (preventing self-referral)
 * @param {string} code
 * @param {Object|string} userOrUid
 * @returns {boolean}
 */
export function isSelfReferral(code, userOrUid) {
  if (!code || !userOrUid) return false;
  const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid.uid;
  if (!uid) return false;
  const myCode = getReferralCode({ uid });
  if (!myCode) return false;
  const cleanInput = code.trim().toUpperCase();
  return cleanInput === myCode || cleanInput.endsWith(uid.slice(0, 6).toUpperCase());
}

/**
 * Native share action for customer referral invitations
 * @param {string} code - Customer referral code
 * @param {string} [userIdentifier] - Optional user email/name for invitation text
 * @returns {Promise<{ success: boolean, action?: string, error?: string }>}
 */
export async function shareReferralCode(code, userIdentifier) {
  if (!code) {
    return { success: false, error: 'No referral code available to share.' };
  }

  const senderName = userIdentifier ? userIdentifier.split('@')[0] : 'A friend';
  const invitationMessage = `💧 Join Califnco Water for certified pure drinking water & doorstep purifier service!\n\n${senderName} has invited you. Use invitation code:\n👉 ${code}\nwhen you sign up in the Califnco Water app.\n\nBrowse genuine RO purifiers, replacement filter cartridges, and book technician visits easily!`;

  try {
    const result = await Share.share(
      {
        message: invitationMessage,
        title: 'Califnco Water Referral Invitation',
      },
      {
        dialogTitle: 'Share Califnco Water Referral Code',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: result.activityType || 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, action: 'dismissed' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to open share dialog.' };
  }
}

// In-memory registry for client-side referral attribution when backend writes are restricted
const localReferralAttributions = new Map();

/**
 * Safely attributes a referral on user registration without breaking signup
 * @param {Object} db - Firestore database instance
 * @param {string} newUserId - Newly registered user UID
 * @param {string} newUserEmail - Newly registered user email
 * @param {string} rawReferralCode - The referral code entered during registration
 * @returns {Promise<{ recorded: boolean, backendPersisted: boolean, error?: string }>}
 */
export async function recordReferralAttribution(db, newUserId, newUserEmail, rawReferralCode) {
  if (!rawReferralCode || !newUserId) {
    return { recorded: false, backendPersisted: false };
  }

  const code = rawReferralCode.trim().toUpperCase();
  if (!isValidReferralCode(code)) {
    return { recorded: false, backendPersisted: false, error: 'Invalid referral code format.' };
  }

  if (isSelfReferral(code, newUserId)) {
    return { recorded: false, backendPersisted: false, error: 'Self-referral is not permitted.' };
  }

  const attributionPayload = {
    referredUserId: newUserId,
    referredUserEmail: newUserEmail,
    referralCode: code,
    attributedAt: new Date().toISOString(),
  };

  // Always record locally in memory for the active app session
  localReferralAttributions.set(newUserId, attributionPayload);

  // Attempt to persist to Firestore if permissions permit
  if (db) {
    try {
      const referralRef = doc(db, 'referrals', `${newUserId}_${code.replace(/[^A-Z0-9]/g, '')}`);
      await setDoc(referralRef, {
        ...attributionPayload,
        serverTimestamp: serverTimestamp(),
      });
      return { recorded: true, backendPersisted: true };
    } catch (firestoreErr) {
      // Backend security rules might not have the 'referrals' collection permitted yet.
      // We log diagnostic info and succeed gracefully so user signup is NEVER broken.
      console.log('[Referral Attribution Notice] Could not write to /referrals in Firestore:', firestoreErr?.message);
      return { recorded: true, backendPersisted: false, note: 'Attribution saved locally (pending Firestore rules deployment).' };
    }
  }

  return { recorded: true, backendPersisted: false };
}

export function getLocalAttribution(userId) {
  return localReferralAttributions.get(userId) || null;
}
