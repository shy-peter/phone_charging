/**
 * Fingerprint Scanner Integration Utility
 * Uses WebAuthn API for hardware fingerprint scanner support
 */

export interface FingerprintData {
  id: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: string[];
  timestamp: number;
}

export interface FingerprintRegistration {
  credentialId: string;
  publicKey: string;
  counter: number;
  timestamp: number;
}

export interface FingerprintVerification {
  success: boolean;
  credentialId?: string;
  message: string;
}

// Check if the device supports WebAuthn
export const isWebAuthnSupported = (): boolean => {
  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined &&
    navigator.credentials.create !== undefined &&
    navigator.credentials.get !== undefined
  );
};

// Check if fingerprint/platform authenticator is available
export const isFingerprintAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) {
    return false;
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

// Generate a random challenge
const generateChallenge = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(32));
};

// Convert ArrayBuffer to Base64 string for storage
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert Base64 string back to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Register a new fingerprint for a device
 * Stores the fingerprint credential for future authentication
 */
export const registerFingerprint = async (
  userId: string,
  userName: string
): Promise<FingerprintRegistration> => {
  if (!isWebAuthnSupported()) {
    throw new Error(
      'WebAuthn is not supported on this device. Please use a supported browser and device.'
    );
  }

  const available = await isFingerprintAvailable();
  if (!available) {
    throw new Error(
      'Fingerprint scanner not available. Please ensure your device has a fingerprint sensor.'
    );
  }

  try {
    const challenge = generateChallenge();

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Device Charging Station',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 30000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        attestation: 'direct',
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Fingerprint registration cancelled by user');
    }

    const attestationObject = credential.response as AuthenticatorAttestationResponse;
    const credentialId = arrayBufferToBase64(credential.rawId);

    // Extract public key from attestation
    const publicKeyBase64 = arrayBufferToBase64(attestationObject.getPublicKey()!);

    return {
      credentialId,
      publicKey: publicKeyBase64,
      counter: (attestationObject as any).getTransports?.()[0] ? 0 : 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Fingerprint registration failed: ${error.message}`);
    }
    throw new Error('Fingerprint registration failed');
  }
};

/**
 * Verify a fingerprint against stored credentials
 * Used during device retrieval to authenticate users
 */
export const verifyFingerprint = async (
  storedCredentials: FingerprintRegistration[]
): Promise<FingerprintVerification> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported on this device');
  }

  const available = await isFingerprintAvailable();
  if (!available) {
    throw new Error('Fingerprint scanner not available');
  }

  try {
    const challenge = generateChallenge();

    // Convert stored credentials to the format expected by get()
    const allowCredentials = storedCredentials.map((cred) => ({
      id: new Uint8Array(base64ToArrayBuffer(cred.credentialId)),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 30000,
        userVerification: 'required',
        allowCredentials,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) {
      return {
        success: false,
        message: 'Fingerprint verification cancelled by user',
      };
    }

    const credentialId = arrayBufferToBase64(assertion.rawId);

    // Verify the credential ID matches one of our stored credentials
    const matchedCredential = storedCredentials.find(
      (cred) => cred.credentialId === credentialId
    );

    if (!matchedCredential) {
      return {
        success: false,
        message: 'Fingerprint does not match any registered device',
      };
    }

    return {
      success: true,
      credentialId,
      message: 'Fingerprint verified successfully',
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('NotAllowedError')) {
        return {
          success: false,
          message: 'Fingerprint verification failed. Please try again.',
        };
      }
      return {
        success: false,
        message: `Fingerprint verification error: ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Fingerprint verification failed',
    };
  }
};

/**
 * Get human-readable error messages for WebAuthn errors
 */
export const getFingerprintErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('NotSupported')) {
      return 'Your browser does not support fingerprint authentication';
    }
    if (error.message.includes('NotAllowed')) {
      return 'Fingerprint authentication was cancelled or timed out';
    }
    if (error.message.includes('InvalidState')) {
      return 'This credential is already registered';
    }
    return error.message;
  }
  return 'An unknown error occurred during fingerprint authentication';
};
