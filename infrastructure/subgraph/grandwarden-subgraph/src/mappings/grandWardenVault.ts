import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  VaultCreated as VaultCreatedEvent,
  VaultUpdated as VaultUpdatedEvent,
  VaultAccessed as VaultAccessedEvent,
  CredentialAdded as CredentialAddedEvent,
  VaultBlobUpdated as VaultBlobUpdatedEvent,
  BreachAlert as BreachAlertEvent,
  GenericVaultEvent as GenericVaultEventEvent,
  VaultEvent as VaultEventEvent,
  AtomicUpdateCompleted as AtomicUpdateCompletedEvent,
  EmergencyShutdown as EmergencyShutdownEvent,
} from "../../generated/GrandWardenVault/GrandWardenVault";
import {
  User,
  Vault,
  Credential,
  VaultBlobUpdate,
  BreachAlert,
  GenericVaultEvent,
  VaultEvent,
  AtomicUpdate,
  SystemEvent,
  DailyStats,
} from "../../generated/schema";

// Helper function to create or load User entity
function createOrLoadUser(address: Bytes): User {
  let user = User.load(address.toHex());
  if (user == null) {
    user = new User(address.toHex());
    user.totalVaults = BigInt.fromI32(0);
    user.totalCredentials = BigInt.fromI32(0);
    user.totalWallets = BigInt.fromI32(0);
    user.totalDevices = BigInt.fromI32(0);
    user.lastActivity = BigInt.fromI32(0);
    user.createdAt = BigInt.fromI32(0);
  }
  return user;
}

// Helper function to update daily stats
function updateDailyStats(timestamp: BigInt): void {
  let dayTimestamp = timestamp.toI32() / 86400; // Get day
  let dayId = dayTimestamp.toString();

  let dailyStats = DailyStats.load(dayId);
  if (dailyStats == null) {
    dailyStats = new DailyStats(dayId);
    dailyStats.date = new Date(dayTimestamp * 86400 * 1000)
      .toISOString()
      .split("T")[0];
    dailyStats.newUsers = BigInt.fromI32(0);
    dailyStats.newVaults = BigInt.fromI32(0);
    dailyStats.newWallets = BigInt.fromI32(0);
    dailyStats.newDevices = BigInt.fromI32(0);
    dailyStats.totalTransactions = BigInt.fromI32(0);
    dailyStats.totalBreachAlerts = BigInt.fromI32(0);
    dailyStats.totalUsers = BigInt.fromI32(0);
    dailyStats.totalVaults = BigInt.fromI32(0);
    dailyStats.totalWallets = BigInt.fromI32(0);
    dailyStats.activeUsers = BigInt.fromI32(0);
  }
  dailyStats.save();
}

export function handleVaultCreated(event: VaultCreatedEvent): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.totalVaults = user.totalVaults.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create vault entity
  let vault = new Vault(event.params.vaultId.toHex());
  vault.owner = user.id;
  vault.isActive = true;
  vault.createdAt = event.block.timestamp;
  vault.lastUpdated = event.block.timestamp;
  vault.lastAccessed = event.block.timestamp;
  vault.accessCount = BigInt.fromI32(0);
  vault.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.newVaults = dailyStats.newVaults.plus(BigInt.fromI32(1));
    dailyStats.save();
  }
}

export function handleVaultUpdated(event: VaultUpdatedEvent): void {
  // Load user and vault
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault != null) {
    vault.lastUpdated = event.block.timestamp;
    vault.save();
  }
}

export function handleVaultAccessed(event: VaultAccessedEvent): void {
  // Load user and vault
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault != null) {
    vault.lastAccessed = event.block.timestamp;
    vault.accessCount = vault.accessCount.plus(BigInt.fromI32(1));
    vault.save();
  }
}

export function handleCredentialAdded(event: CredentialAddedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.totalCredentials = user.totalCredentials.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create credential entity
  let credentialId =
    event.params.user.toHex() +
    "-" +
    event.params.vaultId.toHex() +
    "-" +
    event.params.domain;
  let credential = new Credential(credentialId);
  credential.user = user.id;
  credential.vault = event.params.vaultId.toHex();
  credential.domain = event.params.domain;
  credential.username = ""; // Username is not in the event for privacy
  credential.createdAt = event.block.timestamp;
  credential.lastUsed = event.block.timestamp;
  credential.blockNumber = event.block.number;
  credential.transactionHash = event.transaction.hash;
  credential.save();

  // Update vault
  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault != null) {
    vault.lastUpdated = event.block.timestamp;
    vault.save();
  }
}

export function handleVaultBlobUpdated(event: VaultBlobUpdatedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create blob update entity
  let updateId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let blobUpdate = new VaultBlobUpdate(updateId);
  blobUpdate.user = user.id;
  blobUpdate.vault = event.params.vaultId.toHex();
  blobUpdate.newCID = event.params.newCID;
  blobUpdate.suiTxHash = event.params.suiTxHash;
  blobUpdate.timestamp = event.block.timestamp;
  blobUpdate.blockNumber = event.block.number;
  blobUpdate.transactionHash = event.transaction.hash;
  blobUpdate.save();

  // Update vault
  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault != null) {
    vault.walrusCID = event.params.newCID;
    vault.suiTxHash = event.params.suiTxHash;
    vault.lastUpdated = event.block.timestamp;
    vault.save();
  }
}

export function handleBreachAlert(event: BreachAlertEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create breach alert entity
  let alertId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let breachAlert = new BreachAlert(alertId);
  breachAlert.user = user.id;
  breachAlert.severity = event.params.severity;
  breachAlert.message = event.params.message;
  breachAlert.timestamp = event.block.timestamp;
  breachAlert.blockNumber = event.block.number;
  breachAlert.transactionHash = event.transaction.hash;
  breachAlert.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.totalBreachAlerts = dailyStats.totalBreachAlerts.plus(
      BigInt.fromI32(1)
    );
    dailyStats.save();
  }
}

export function handleGenericVaultEvent(event: GenericVaultEventEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create generic vault event entity
  let eventId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let vaultEvent = new GenericVaultEvent(eventId);
  vaultEvent.user = user.id;
  vaultEvent.eventType = event.params.eventType;
  vaultEvent.data = event.params.data;
  vaultEvent.timestamp = event.block.timestamp;
  vaultEvent.blockNumber = event.block.number;
  vaultEvent.transactionHash = event.transaction.hash;
  vaultEvent.save();
}

export function handleVaultFlowEvent(event: VaultEventEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create vault flow event entity
  let eventId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let vaultEvent = new VaultEvent(eventId);
  vaultEvent.user = user.id;
  vaultEvent.flowType = event.params.flowType;
  vaultEvent.step = event.params.step;
  vaultEvent.success = event.params.success;
  vaultEvent.data = event.params.data;
  vaultEvent.timestamp = event.block.timestamp;
  vaultEvent.blockNumber = event.block.number;
  vaultEvent.transactionHash = event.transaction.hash;
  vaultEvent.save();
}

export function handleAtomicUpdateCompleted(
  event: AtomicUpdateCompletedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create atomic update entity
  let updateId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let atomicUpdate = new AtomicUpdate(updateId);
  atomicUpdate.user = user.id;
  atomicUpdate.vault = event.params.vaultId.toHex();
  atomicUpdate.suiTxHash = event.params.suiTxHash;
  atomicUpdate.timestamp = event.block.timestamp;
  atomicUpdate.blockNumber = event.block.number;
  atomicUpdate.transactionHash = event.transaction.hash;
  atomicUpdate.save();

  // Update vault
  let vault = Vault.load(event.params.vaultId.toHex());
  if (vault != null) {
    vault.suiTxHash = event.params.suiTxHash;
    vault.lastUpdated = event.block.timestamp;
    vault.save();
  }
}

export function handleEmergencyShutdown(event: EmergencyShutdownEvent): void {
  // Create system event entity
  let eventId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let systemEvent = new SystemEvent(eventId);
  systemEvent.eventType = "emergency_shutdown";
  systemEvent.admin = event.params.admin;
  systemEvent.reason = event.params.reason;
  systemEvent.timestamp = event.block.timestamp;
  systemEvent.blockNumber = event.block.number;
  systemEvent.transactionHash = event.transaction.hash;
  systemEvent.save();
}
