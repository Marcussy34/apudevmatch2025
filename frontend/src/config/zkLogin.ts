// zkLogin configuration for Grand Warden Chrome Extension

// Google Auth Client ID provided by the user
export const GOOGLE_CLIENT_ID = '36098691154-oi9pm05ra1f70ov7pb43t9c0cg94isuo.apps.googleusercontent.com';

// Chrome extension ID
export const EXTENSION_ID = 'mnnidhhmneiafdhjceocgfifeglnnmpd';

// Redirect URI for OAuth flow
// For Chrome extensions, Google automatically uses this format
export const REDIRECT_URI = `https://${EXTENSION_ID}.chromiumapp.org/`;

// Sui fullnode URL (using testnet as requested)
export const FULLNODE_URL = 'https://fullnode.testnet.sui.io';

// Sui prover endpoint
export const SUI_PROVER_DEV_ENDPOINT = 'https://prover-testnet.mystenlabs.com/v1';

// Sui testnet faucet endpoint
export const SUI_TESTNET_FAUCET = 'https://faucet.testnet.sui.io/gas';

// Keys for storing data in storage
export const KEY_PAIR_SESSION_STORAGE_KEY = 'gw_ephemeral_key_pair';
export const USER_SALT_LOCAL_STORAGE_KEY = 'gw_user_salt_key_pair';
export const RANDOMNESS_SESSION_STORAGE_KEY = 'gw_randomness_key_pair';
export const MAX_EPOCH_LOCAL_STORAGE_KEY = 'gw_max_epoch_key_pair';
export const JWT_SESSION_STORAGE_KEY = 'gw_jwt_token';
export const ZKLOGIN_USER_ADDRESS_KEY = 'gw_zklogin_user_address';