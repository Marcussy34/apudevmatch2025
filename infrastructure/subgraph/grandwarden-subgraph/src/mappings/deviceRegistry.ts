import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  DeviceRegistered as DeviceRegisteredEvent,
  DeviceAuthorized as DeviceAuthorizedEvent,
  DeviceRevoked as DeviceRevokedEvent,
  AccessGranted as AccessGrantedEvent,
  AccessRevoked as AccessRevokedEvent,
  SecurityAlert as SecurityAlertEvent,
  UnauthorizedAccess as UnauthorizedAccessEvent,
} from "../../generated/DeviceRegistry/DeviceRegistry";
import {
  User,
  Device,
  AccessGrant,
  SecurityAlert,
  UnauthorizedAccess,
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
  let dayTimestamp = timestamp.toI32() / 86400;
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

export function handleDeviceRegistered(event: DeviceRegisteredEvent): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.totalDevices = user.totalDevices.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create device entity
  let device = new Device(event.params.deviceId.toHex());
  device.owner = user.id;
  device.deviceName = event.params.deviceName;
  device.isAuthorized = false; // Initially registered but not authorized
  device.isRevoked = false;
  device.registeredAt = event.block.timestamp;
  device.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.newDevices = dailyStats.newDevices.plus(BigInt.fromI32(1));
    dailyStats.save();
  }
}

export function handleDeviceAuthorized(event: DeviceAuthorizedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update device authorization
  let device = Device.load(event.params.deviceId.toHex());
  if (device != null) {
    device.deviceAddress = event.params.deviceAddress;
    device.isAuthorized = true;
    device.save();
  }
}

export function handleDeviceRevoked(event: DeviceRevokedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update device revocation
  let device = Device.load(event.params.deviceId.toHex());
  if (device != null) {
    device.isRevoked = true;
    device.isAuthorized = false;
    device.revokedAt = event.params.timestamp;
    device.save();
  }
}

export function handleAccessGranted(event: AccessGrantedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create access grant entity
  let grantId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let accessGrant = new AccessGrant(grantId);
  accessGrant.user = user.id;
  accessGrant.resourceId = event.params.resourceId;
  accessGrant.grantee = event.params.grantee;
  accessGrant.isRevoked = false;
  accessGrant.grantedAt = event.block.timestamp;
  accessGrant.blockNumber = event.block.number;
  accessGrant.transactionHash = event.transaction.hash;
  accessGrant.save();

  // Try to link to device if grantee matches device address
  let device = Device.load(event.params.resourceId.toHex());
  if (device != null) {
    if (
      device.deviceAddress !== null &&
      device.deviceAddress!.equals(event.params.grantee)
    ) {
      accessGrant.device = device.id;
      accessGrant.save();
    }
  }
}

export function handleAccessRevoked(event: AccessRevokedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Find and update access grant
  // Note: This is a simplified approach - in a real implementation,
  // you might want to track grants by resource+grantee combination
  let grantId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let accessGrant = new AccessGrant(grantId);
  accessGrant.user = user.id;
  accessGrant.resourceId = event.params.resourceId;
  accessGrant.grantee = event.params.revokee;
  accessGrant.isRevoked = true;
  accessGrant.grantedAt = BigInt.fromI32(0); // Unknown original grant time
  accessGrant.revokedAt = event.block.timestamp;
  accessGrant.blockNumber = event.block.number;
  accessGrant.transactionHash = event.transaction.hash;
  accessGrant.save();
}

export function handleSecurityAlert(event: SecurityAlertEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create security alert entity
  let alertId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let securityAlert = new SecurityAlert(alertId);
  securityAlert.user = user.id;
  securityAlert.alertType = event.params.alertType;
  securityAlert.description = event.params.description;
  securityAlert.timestamp = event.params.timestamp;
  securityAlert.blockNumber = event.block.number;
  securityAlert.transactionHash = event.transaction.hash;
  securityAlert.save();
}

export function handleUnauthorizedAccess(event: UnauthorizedAccessEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create unauthorized access entity
  let accessId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let unauthorizedAccess = new UnauthorizedAccess(accessId);
  unauthorizedAccess.user = user.id;
  unauthorizedAccess.unauthorized = event.params.unauthorized;
  unauthorizedAccess.resource = event.params.resource;
  unauthorizedAccess.timestamp = event.block.timestamp;
  unauthorizedAccess.blockNumber = event.block.number;
  unauthorizedAccess.transactionHash = event.transaction.hash;
  unauthorizedAccess.save();
}
