import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import { SerializedSignature } from '@mysten/sui.js/cryptography';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { 
  genAddressSeed, 
  generateNonce, 
  generateRandomness, 
  getExtendedEphemeralPublicKey, 
  getZkLoginSignature,
  jwtToAddress
} from '@mysten/zklogin';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import axios from 'axios';

import { 
  GOOGLE_CLIENT_ID, 
  REDIRECT_URI, 
  FULLNODE_URL,
  SUI_PROVER_DEV_ENDPOINT,
  SUI_TESTNET_FAUCET,
  KEY_PAIR_SESSION_STORAGE_KEY,
  USER_SALT_LOCAL_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  JWT_SESSION_STORAGE_KEY,
  ZKLOGIN_USER_ADDRESS_KEY
} from '../config/zkLogin';

// Create Sui client instance
const suiClient = new SuiClient({ url: FULLNODE_URL });

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

export class ZkLoginService {
  private ephemeralKeyPair?: Ed25519Keypair;
  private randomness: string = '';
  private nonce: string = '';
  private maxEpoch: number = 0;
  private currentEpoch: string = '';
  private jwtToken: string = '';
  private decodedJwt?: JwtPayload;
  private userSalt?: string;
  private userAddress: string = '';
  private zkProof?: PartialZkLoginSignature;
  private extendedEphemeralPublicKey: string = '';

  constructor() {
    this.loadStoredState();
  }

  // Load any stored state from previous sessions
  private loadStoredState() {
    try {
      // Load ephemeral key pair
      const privateKey = window.sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
      if (privateKey) {
        this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
      }

      // Load randomness
      const randomness = window.sessionStorage.getItem(RANDOMNESS_SESSION_STORAGE_KEY);
      if (randomness) {
        this.randomness = randomness;
      }

      // Load user salt
      const userSalt = window.localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
      if (userSalt) {
        this.userSalt = userSalt;
      }

      // Load max epoch
      const maxEpoch = window.localStorage.getItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
      if (maxEpoch) {
        this.maxEpoch = Number(maxEpoch);
      }

      // Load JWT
      const jwtToken = window.sessionStorage.getItem(JWT_SESSION_STORAGE_KEY);
      if (jwtToken) {
        this.jwtToken = jwtToken;
        this.decodedJwt = jwtDecode(jwtToken);
      }

      // Load user address
      const userAddress = window.localStorage.getItem(ZKLOGIN_USER_ADDRESS_KEY);
      if (userAddress) {
        this.userAddress = userAddress;
      }
    } catch (error) {
      console.error('Error loading stored zkLogin state:', error);
    }
  }

  // Step 1: Generate Ephemeral Key Pair
  async generateEphemeralKeyPair(): Promise<string> {
    this.ephemeralKeyPair = Ed25519Keypair.generate();
    const publicKey = this.ephemeralKeyPair.getPublicKey().toBase64();
    window.sessionStorage.setItem(
      KEY_PAIR_SESSION_STORAGE_KEY,
      this.ephemeralKeyPair.export().privateKey
    );
    return publicKey;
  }

  // Step 2: Get Current Epoch and Generate Nonce
  async prepareForLogin(): Promise<string> {
    try {
      // Get current epoch from Sui
      const { epoch } = await suiClient.getLatestSuiSystemState();
      this.currentEpoch = epoch;
      
      // Set max epoch (current + 10 for validity period)
      this.maxEpoch = Number(epoch) + 10;
      window.localStorage.setItem(MAX_EPOCH_LOCAL_STORAGE_KEY, String(this.maxEpoch));

      // Generate randomness
      this.randomness = generateRandomness();
      window.sessionStorage.setItem(RANDOMNESS_SESSION_STORAGE_KEY, this.randomness);

      // Ensure we have an ephemeral key pair
      if (!this.ephemeralKeyPair) {
        await this.generateEphemeralKeyPair();
      }

      // Generate nonce using ephemeral key pair, max epoch, and randomness
      this.nonce = generateNonce(
        this.ephemeralKeyPair!.getPublicKey(),
        this.maxEpoch,
        this.randomness
      );

      return this.nonce;
    } catch (error) {
      console.error('Error preparing for login:', error);
      throw error;
    }
  }

  // Step 3: Initiate Google OAuth Login
  async initiateGoogleLogin(): Promise<void> {
    if (!this.nonce) {
      await this.prepareForLogin();
    }
    
    // Delegate OAuth flow to background script
    return new Promise((resolve, reject) => {
      // Send message to background script to handle the OAuth flow
      chrome.runtime.sendMessage(
        { 
          type: 'ZKLOGIN_GOOGLE_AUTH',
          nonce: this.nonce
        }, 
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          if (!response || !response.success) {
            reject(new Error(response?.error || 'Google authentication failed'));
            return;
          }

          try {
            const { idToken } = response;
            
            if (!idToken) {
              reject(new Error('No ID token returned from authentication'));
              return;
            }

            // Store JWT token and decode it
            this.jwtToken = idToken;
            this.decodedJwt = jwtDecode(idToken);
            window.sessionStorage.setItem(JWT_SESSION_STORAGE_KEY, idToken);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Step 4: Generate or get User Salt
  async getUserSalt(): Promise<string> {
    if (this.userSalt) {
      return this.userSalt;
    }
    
    // Generate new salt if not exists
    const salt = generateRandomness();
    window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, salt);
    this.userSalt = salt;
    return salt;
  }

  // Step 5: Generate Sui Address from JWT and Salt
  async generateSuiAddress(): Promise<string> {
    if (!this.jwtToken || !this.userSalt) {
      throw new Error('JWT token or user salt not available');
    }

    const address = jwtToAddress(this.jwtToken, this.userSalt);
    this.userAddress = address;
    window.localStorage.setItem(ZKLOGIN_USER_ADDRESS_KEY, address);
    return address;
  }

  // Step 6: Get ZK Proof
  async getZkProof(): Promise<PartialZkLoginSignature> {
    if (!this.jwtToken || !this.userSalt || !this.maxEpoch || !this.randomness) {
      throw new Error('Missing required data for ZK proof');
    }

    // Get extended ephemeral public key
    if (!this.ephemeralKeyPair) {
      throw new Error('Ephemeral key pair not available');
    }

    this.extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      this.ephemeralKeyPair.getPublicKey()
    );

    try {
      // Request ZK proof from prover service
      const response = await axios.post(
        SUI_PROVER_DEV_ENDPOINT,
        {
          jwt: this.jwtToken,
          extendedEphemeralPublicKey: this.extendedEphemeralPublicKey,
          maxEpoch: this.maxEpoch,
          jwtRandomness: this.randomness,
          salt: this.userSalt,
          keyClaimName: 'sub',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.zkProof = response.data as PartialZkLoginSignature;
      return this.zkProof;
    } catch (error) {
      console.error('Error getting ZK proof:', error);
      throw error;
    }
  }

  // Step 7: Execute Transaction with ZkLogin Signature
  async executeTransaction(txb: TransactionBlock): Promise<string> {
    if (!this.ephemeralKeyPair || !this.zkProof || !this.decodedJwt || !this.userSalt || !this.userAddress) {
      throw new Error('Missing required data for transaction execution');
    }

    // Set sender address
    txb.setSender(this.userAddress);

    // Sign transaction with ephemeral keypair
    const { bytes, signature: userSignature } = await txb.sign({
      client: suiClient,
      signer: this.ephemeralKeyPair,
    });

    // Generate address seed
    if (!this.decodedJwt.sub || !this.decodedJwt.aud) {
      throw new Error('JWT missing required fields');
    }

    const addressSeed = genAddressSeed(
      BigInt(this.userSalt),
      'sub',
      this.decodedJwt.sub,
      this.decodedJwt.aud as string
    ).toString();

    // Create zkLogin signature
    const zkLoginSignature: SerializedSignature = getZkLoginSignature({
      inputs: {
        ...this.zkProof,
        addressSeed,
      },
      maxEpoch: this.maxEpoch,
      userSignature,
    });

    // Execute transaction
    const executeRes = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
    });

    return executeRes.digest;
  }

  // Request test tokens from faucet
  async requestFaucet(): Promise<void> {
    if (!this.userAddress) {
      throw new Error('User address not available');
    }

    await axios.post(SUI_TESTNET_FAUCET, {
      FixedAmountRequest: {
        recipient: this.userAddress,
      },
    });
  }

  // Get current user state
  getUserState() {
    return {
      isLoggedIn: !!this.jwtToken && !!this.userAddress,
      userAddress: this.userAddress,
      userInfo: this.decodedJwt,
    };
  }

  // Reset state
  reset() {
    // Clear session storage
    window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(RANDOMNESS_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(JWT_SESSION_STORAGE_KEY);
    
    // Don't clear localStorage by default as it contains the user salt
    // which is needed to recover the same address
    
    // Reset instance variables
    this.ephemeralKeyPair = undefined;
    this.randomness = '';
    this.nonce = '';
    this.jwtToken = '';
    this.decodedJwt = undefined;
    this.zkProof = undefined;
    this.extendedEphemeralPublicKey = '';
    this.userAddress = '';
  }

  // Clear everything including user salt (will change user's address)
  resetEverything() {
    this.reset();
    window.localStorage.removeItem(USER_SALT_LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(ZKLOGIN_USER_ADDRESS_KEY);
    this.userSalt = undefined;
    this.maxEpoch = 0;
  }
}

// Export singleton instance
export const zkLoginService = new ZkLoginService();