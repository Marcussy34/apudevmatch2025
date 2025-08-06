import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { 
  generateNonce, 
  generateRandomness, 
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  genAddressSeed,
  getZkLoginSignature
} from "@mysten/zklogin";
import { JwtPayload, jwtDecode } from "jwt-decode";
import axios from "axios";
import { 
  CLIENT_ID, 
  REDIRECT_URI, 
  SUI_PROVER_DEV_ENDPOINT,
  KEY_PAIR_SESSION_STORAGE_KEY,
  USER_SALT_LOCAL_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  GOOGLE_OAUTH_BASE_URL
} from "../constants/zklogin";

export type PartialZkLoginSignature = {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
};

export interface ZkLoginUserProfile {
  name: string;
  email: string;
  suiAddress: string;
  provider: string;
  jwtToken: string;
  userSalt: string;
}

export class ZkLoginService {
  // Step 1: Generate Ephemeral Key Pair
  static generateEphemeralKeyPair(): Ed25519Keypair {
    const ephemeralKeyPair = new Ed25519Keypair();
    
    // Store in session storage
    sessionStorage.setItem(KEY_PAIR_SESSION_STORAGE_KEY, ephemeralKeyPair.export().privateKey);
    
    return ephemeralKeyPair;
  }

  // Step 2: Generate Nonce for OAuth
  static generateNonceForOAuth(ephemeralKeyPair: Ed25519Keypair, maxEpoch: number, randomness: string): string {
    return generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
  }

  // Step 3: Generate Randomness
  static generateRandomness(): string {
    const randomness = generateRandomness();
    sessionStorage.setItem(RANDOMNESS_SESSION_STORAGE_KEY, randomness);
    return randomness;
  }

  // Step 4: Get or Generate User Salt
  static getUserSalt(): string {
    let userSalt = localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
    
    if (!userSalt) {
      // Generate a random salt if none exists
      userSalt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
      localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, userSalt);
    }
    
    return userSalt;
  }

  // Step 5: Decode JWT Token
  static decodeJwt(jwtToken: string): JwtPayload {
    return jwtDecode(jwtToken);
  }

  // Step 6: Generate Sui Address from JWT
  static generateSuiAddress(jwtToken: string, userSalt: string): string {
    return jwtToAddress(jwtToken, userSalt);
  }

  // Step 7: Get Extended Ephemeral Public Key
  static getExtendedEphemeralPublicKey(ephemeralKeyPair: Ed25519Keypair): string {
    return getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
  }

  // Step 8: Fetch ZK Proof
  static async fetchZkProof(
    jwtToken: string,
    extendedEphemeralPublicKey: string,
    maxEpoch: number,
    randomness: string,
    userSalt: string
  ): Promise<PartialZkLoginSignature> {
    try {
      const response = await axios.post(
        SUI_PROVER_DEV_ENDPOINT,
        {
          jwt: jwtToken,
          extendedEphemeralPublicKey: extendedEphemeralPublicKey,
          maxEpoch: maxEpoch,
          jwtRandomness: randomness,
          salt: userSalt,
          keyClaimName: "sub",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data as PartialZkLoginSignature;
    } catch (error) {
      console.error("Error fetching ZK proof:", error);
      throw new Error("Failed to fetch ZK proof");
    }
  }

  // Step 9: Generate Address Seed
  static generateAddressSeed(userSalt: string, sub: string, aud: string): string {
    return genAddressSeed(BigInt(userSalt), "sub", sub, aud).toString();
  }

  // Step 10: Complete zkLogin Flow
  static async completeZkLoginFlow(jwtToken: string): Promise<ZkLoginUserProfile> {
    // Get or generate user salt
    const userSalt = this.getUserSalt();
    
    // Decode JWT
    const decodedJwt = this.decodeJwt(jwtToken);
    
    // Generate Sui address
    const suiAddress = this.generateSuiAddress(jwtToken, userSalt);
    
    // Create user profile
    const userProfile: ZkLoginUserProfile = {
      name: decodedJwt.name || "zkLogin User",
      email: decodedJwt.email || "user@zklogin.com",
      suiAddress: suiAddress,
      provider: "Google zkLogin",
      jwtToken: jwtToken,
      userSalt: userSalt
    };

    // Store in localStorage
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    localStorage.setItem(JWT_TOKEN_KEY, jwtToken);
    localStorage.setItem(ZKLOGIN_USER_ADDRESS_KEY, suiAddress);

    return userProfile;
  }

  // Step 11: Initialize zkLogin OAuth Flow
  static initiateZkLoginFlow(): void {
    // Generate ephemeral key pair
    const ephemeralKeyPair = this.generateEphemeralKeyPair();
    
    // Generate randomness
    const randomness = this.generateRandomness();
    
    // Calculate max epoch (current epoch + 10)
    const currentEpoch = Math.floor(Date.now() / 1000 / 24 / 3600); // Approximate epoch calculation
    const maxEpoch = currentEpoch + 10;
    sessionStorage.setItem(MAX_EPOCH_LOCAL_STORAGE_KEY, maxEpoch.toString());
    
    // Generate nonce
    const nonce = this.generateNonceForOAuth(ephemeralKeyPair, maxEpoch, randomness);
    
    // Construct OAuth URL with proper parameters
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "id_token",
      scope: "openid",
      nonce: nonce,
    });
    
    const oauthUrl = `${GOOGLE_OAUTH_BASE_URL}?${params}`;
    window.location.href = oauthUrl;
  }

  // Step 12: Handle OAuth Callback
  static handleOAuthCallback(urlParams: URLSearchParams): ZkLoginUserProfile | null {
    const idToken = urlParams.get('id_token');
    const error = urlParams.get('error');
    
    if (error) {
      console.error("OAuth error:", error);
      return null;
    }
    
    if (!idToken) {
      console.error("No ID token received");
      return null;
    }

    // Complete the zkLogin flow
    return this.completeZkLoginFlow(idToken);
  }

  // Step 13: Get Stored User Profile
  static getStoredUserProfile(): ZkLoginUserProfile | null {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  }

  // Step 14: Clear zkLogin Data
  static clearZkLoginData(): void {
    // Clear session storage
    sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(RANDOMNESS_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
    
    // Clear local storage
    localStorage.removeItem("userProfile");
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(ZKLOGIN_USER_ADDRESS_KEY);
  }
} 