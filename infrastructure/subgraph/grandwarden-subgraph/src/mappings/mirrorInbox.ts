import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  VaultCreated,
  DeviceRegistered,
  BreachAlert,
  WalletImported,
  TransactionSigned,
  VaultBlobUpdated,
  VaultEvent,
  EventMirrored,
  MirrorInbox
} from "../../generated/MirrorInbox/MirrorInbox";
import {
  User,
  Vault,
  Device,
  Wallet,
  Transaction,
  BreachAlert as BreachAlertEntity,
  VaultBlobUpdate,
  VaultEvent as VaultEventEntity,
  GenericVaultEvent
} from "../../generated/schema";

// Helper function to get or create user
function getOrCreateUser(address: Bytes): User {
  let id = address.toHex();
  let user = User.load(id);
  
  if (user == null) {
    user = new User(id);
    user.totalVaults = BigInt.fromI32(0);
    user.totalCredentials = BigInt.fromI32(0);
    user.totalWallets = BigInt.fromI32(0);
    user.totalDevices = BigInt.fromI32(0);
    user.lastActivity = BigInt.fromI32(0);
    user.createdAt = BigInt.fromI32(0);
    user.save();
  }
  
  return user!;
}

export function handleVaultCreated(event: VaultCreated): void {
  log.info("Processing VaultCreated event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Create vault entity
  let vault = new Vault(event.params.vaultId.toHex());
  vault.owner = user.id;
  vault.isActive = true;
  vault.createdAt = event.params.timestamp;
  vault.lastUpdated = event.params.timestamp;
  vault.lastAccessed = event.params.timestamp;
  vault.accessCount = BigInt.fromI32(1);
  vault.save();
  
  // Update user stats
  user.totalVaults = user.totalVaults.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  if (user.createdAt.isZero()) {
    user.createdAt = event.block.timestamp;
  }
  user.save();
  
  log.info("VaultCreated processed successfully for user: {}, vault: {}", [
    event.params.user.toHex(),
    event.params.vaultId.toHex()
  ]);
}

export function handleDeviceRegistered(event: DeviceRegistered): void {
  log.info("Processing DeviceRegistered event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Create device entity
  let device = new Device(event.params.deviceId.toHex());
  device.owner = user.id;
  device.deviceName = event.params.deviceName;
  device.isAuthorized = true;
  device.isRevoked = false;
  device.registeredAt = event.params.timestamp;
  device.save();
  
  // Update user stats
  user.totalDevices = user.totalDevices.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("DeviceRegistered processed successfully for user: {}, device: {}", [
    event.params.user.toHex(),
    event.params.deviceId.toHex()
  ]);
}

export function handleBreachAlert(event: BreachAlert): void {
  log.info("Processing BreachAlert event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Create breach alert entity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let breachAlert = new BreachAlertEntity(id);
  breachAlert.user = user.id;
  breachAlert.severity = event.params.severity;
  breachAlert.message = event.params.message;
  breachAlert.timestamp = event.block.timestamp;
  breachAlert.blockNumber = event.block.number;
  breachAlert.transactionHash = event.transaction.hash;
  breachAlert.save();
  
  // Update user activity
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("BreachAlert processed successfully for user: {}, severity: {}", [
    event.params.user.toHex(),
    event.params.severity.toString()
  ]);
}

export function handleWalletImported(event: WalletImported): void {
  log.info("Processing WalletImported event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Create wallet entity
  let wallet = new Wallet(event.params.walletId.toHex());
  wallet.owner = user.id;
  wallet.name = event.params.name;
  wallet.isActive = true;
  wallet.supportedChains = [];
  wallet.createdAt = event.params.timestamp;
  wallet.lastUsed = event.params.timestamp;
  wallet.save();
  
  // Update user stats
  user.totalWallets = user.totalWallets.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("WalletImported processed successfully for user: {}, wallet: {}", [
    event.params.user.toHex(),
    event.params.walletId.toHex()
  ]);
}

export function handleTransactionSigned(event: TransactionSigned): void {
  log.info("Processing TransactionSigned event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Get wallet (should exist)
  let wallet = Wallet.load(event.params.walletId.toHex());
  if (wallet == null) {
    log.warning("Wallet not found for TransactionSigned event: {}", [event.params.walletId.toHex()]);
    return;
  }
  
  // Create transaction entity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let transaction = new Transaction(id);
  transaction.user = user.id;
  transaction.wallet = wallet.id;
  transaction.txHash = event.params.txHash;
  transaction.chainType = event.params.chainType;
  transaction.timestamp = event.params.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();
  
  // Update wallet
  wallet.lastUsed = event.params.timestamp;
  wallet.save();
  
  // Update user activity
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("TransactionSigned processed successfully for user: {}, wallet: {}", [
    event.params.user.toHex(),
    event.params.walletId.toHex()
  ]);
}

export function handleVaultBlobUpdated(event: VaultBlobUpdated): void {
  log.info("Processing VaultBlobUpdated event for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Get vault (should exist)
  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault == null) {
    log.warning("Vault not found for VaultBlobUpdated event: {}", [event.params.vaultId.toHex()]);
    return;
  }
  
  // Create blob update entity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let blobUpdate = new VaultBlobUpdate(id);
  blobUpdate.user = user.id;
  blobUpdate.vault = vault.id;
  blobUpdate.newCID = event.params.newCID;
  blobUpdate.suiTxHash = event.params.suiTxHash;
  blobUpdate.timestamp = event.block.timestamp;
  blobUpdate.blockNumber = event.block.number;
  blobUpdate.transactionHash = event.transaction.hash;
  blobUpdate.save();
  
  // Update vault
  vault.walrusCID = event.params.newCID;
  vault.suiTxHash = event.params.suiTxHash;
  vault.lastUpdated = event.block.timestamp;
  vault.save();
  
  // Update user activity
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("VaultBlobUpdated processed successfully for user: {}, vault: {}", [
    event.params.user.toHex(),
    event.params.vaultId.toHex()
  ]);
}

export function handleVaultEvent(event: VaultEvent): void {
  log.info("Processing VaultEvent for user: {}", [event.params.user.toHex()]);
  
  let user = getOrCreateUser(event.params.user);
  
  // Create vault event entity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let vaultEvent = new VaultEventEntity(id);
  vaultEvent.user = user.id;
  vaultEvent.flowType = BigInt.fromI32(event.params.flowType);
  vaultEvent.step = BigInt.fromI32(event.params.step);
  vaultEvent.success = event.params.success;
  vaultEvent.data = event.params.data;
  vaultEvent.timestamp = event.block.timestamp;
  vaultEvent.blockNumber = event.block.number;
  vaultEvent.transactionHash = event.transaction.hash;
  vaultEvent.save();
  
  // Update user activity
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("VaultEvent processed successfully for user: {}", [event.params.user.toHex()]);
}

export function handleEventMirrored(event: EventMirrored): void {
  log.info("Processing EventMirrored from Sui tx: {}", [event.params.suiTxHash.toHex()]);
  
  let user = getOrCreateUser(event.params.userAddress);
  
  // Create generic vault event entity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let genericEvent = new GenericVaultEvent(id);
  genericEvent.user = user.id;
  genericEvent.eventType = BigInt.fromI32(event.params.eventType);
  genericEvent.data = event.params.payload;
  genericEvent.timestamp = event.block.timestamp;
  genericEvent.blockNumber = event.block.number;
  genericEvent.transactionHash = event.transaction.hash;
  genericEvent.save();
  
  // Update user activity
  user.lastActivity = event.block.timestamp;
  user.save();
  
  log.info("EventMirrored processed successfully from Sui tx: {}, event type: {}", [
    event.params.suiTxHash.toHex(),
    event.params.eventType.toString()
  ]);
}
