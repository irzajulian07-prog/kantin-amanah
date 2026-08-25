/**
 * Security and Cryptographic Utilities for AMANAH Smart Mart
 * Handles secure client-side PIN hashing and verification using Web Crypto SHA-256.
 * PIN is NEVER stored in plaintext.
 */

/**
 * Hashes a 6-digit numeric PIN using Web Crypto SHA-256 with a salt
 * @param pin 6-digit string PIN
 * @param salt Optional salt string (e.g. santri NIS)
 * @returns Promise<string> Hex-encoded hash
 */
export async function hashPin(pin: string, salt: string = 'amanah_salt_2025'): Promise<string> {
  const normalizedPin = pin.trim();
  const text = `${salt}:${normalizedPin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple bitwise hash for environments lacking subtle crypto (e.g. non-https dev)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

/**
 * Validates PIN against stored hash
 * @param inputPin Entered PIN (e.g. '123456')
 * @param storedHash Hash stored in Santriwati record
 * @param salt Salt used when hashing (typically NIS)
 * @returns Promise<boolean>
 */
export async function verifyPin(inputPin: string, storedHash: string, salt: string = 'amanah_salt_2025'): Promise<boolean> {
  if (!storedHash || !inputPin) return false;
  
  // Try primary salt (e.g. santri NIS)
  const computedPrimary = await hashPin(inputPin, salt);
  if (computedPrimary === storedHash) return true;

  // Try global default salt (used in seed data)
  if (salt !== 'amanah_salt_2025') {
    const computedGlobal = await hashPin(inputPin, 'amanah_salt_2025');
    if (computedGlobal === storedHash) return true;
  }

  // Try unsalted as fallback
  const computedUnsalted = await hashPin(inputPin, '');
  if (computedUnsalted === storedHash) return true;

  return false;
}

/**
 * Formats RFID UID into uppercase standard hex format (e.g. 'A1:B2:C3:D4' or 'A1B2C3D4')
 */
export function formatRfidUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
