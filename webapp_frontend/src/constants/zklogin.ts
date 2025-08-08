// zkLogin Configuration Constants
export const FULLNODE_URL = "https://fullnode.testnet.sui.io";

// Google OAuth Configuration
export const CLIENT_ID =
  "36098691154-3j95ku5omvh399otb0id12q542st42c9.apps.googleusercontent.com";
export const REDIRECT_URI = "http://localhost:5173/auth/callback";

// Sui Network Configuration
export const SUI_TESTNET_FAUCET = "https://faucet.testnet.sui.io/gas";
export const SUI_PROVER_TESTNET_ENDPOINT =
  "https://prover-dev.mystenlabs.com/v1";

// Storage Keys for Session/Local Storage
export const KEY_PAIR_SESSION_STORAGE_KEY = "grand_warden_ephemeral_key_pair";
export const USER_SALT_LOCAL_STORAGE_KEY = "grand_warden_user_salt";
export const RANDOMNESS_SESSION_STORAGE_KEY = "grand_warden_randomness";
export const MAX_EPOCH_LOCAL_STORAGE_KEY = "grand_warden_max_epoch";
export const ZKLOGIN_USER_ADDRESS_KEY = "grand_warden_zklogin_address";
export const JWT_TOKEN_KEY = "grand_warden_jwt_token";

// zkLogin Steps for UI
export const ZKLOGIN_STEPS = [
  "Generate Ephemeral Key Pair",
  "Fetch JWT from Google OAuth",
  "Decode JWT Token",
  "Generate User Salt",
  "Generate Sui Address",
  "Fetch ZK Proof",
  "Execute Transaction",
];

// Google OAuth Configuration
export const GOOGLE_OAUTH_BASE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
