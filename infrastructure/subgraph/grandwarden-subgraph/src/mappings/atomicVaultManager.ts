import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AtomicUpdateStarted as AtomicOperationStartedEvent,
  AtomicUpdateCompleted as AtomicOperationCompletedEvent,
  AtomicUpdateFailed as AtomicOperationFailedEvent,
  OperationRolledBack as OperationRevertedEvent,
} from "../../generated/AtomicVaultManager/AtomicVaultManager";
import { User, AtomicOperation } from "../../generated/schema";

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

export function handleAtomicOperationStarted(
  event: AtomicOperationStartedEvent
): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create atomic operation entity
  let operation = new AtomicOperation(event.params.vaultId.toHex());
  operation.user = user.id;
  operation.operationType = 1; // Default operation type since it's not in the event
  operation.isCompleted = false;
  operation.isReverted = false;
  operation.startedAt = event.block.timestamp;
  operation.startTxHash = event.transaction.hash;
  operation.save();
}

export function handleAtomicOperationCompleted(
  event: AtomicOperationCompletedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update atomic operation
  let operation = AtomicOperation.load(event.params.vaultId.toHex());
  if (operation != null) {
    operation.isCompleted = true;
    operation.isSuccessful = true; // Completed means successful
    operation.completedAt = event.block.timestamp;
    operation.completeTxHash = event.transaction.hash;
    operation.save();
  }
}

export function handleAtomicOperationFailed(
  event: AtomicOperationFailedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update atomic operation
  let operation = AtomicOperation.load(event.params.vaultId.toHex());
  if (operation != null) {
    operation.isCompleted = true;
    operation.isSuccessful = false;
    operation.revertReason = event.params.reason;
    operation.completedAt = event.block.timestamp;
    operation.completeTxHash = event.transaction.hash;
    operation.save();
  }
}

export function handleOperationReverted(event: OperationRevertedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update atomic operation
  let operation = AtomicOperation.load(event.params.operationId.toHex());
  if (operation != null) {
    operation.isReverted = true;
    operation.isCompleted = true;
    operation.isSuccessful = false;
    operation.revertReason = event.params.reason;
    operation.completedAt = event.block.timestamp;
    operation.completeTxHash = event.transaction.hash;
    operation.save();
  }
}
