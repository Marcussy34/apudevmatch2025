import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  RecoveryInitiated as RecoveryInitiatedEvent,
  GuardianApproved as GuardianApprovedEvent,
  RecoveryCompleted as RecoveryCompletedEvent,
} from "../../generated/RecoveryManager/RecoveryManager";
import {
  User,
  RecoverySession,
  Guardian,
  GuardianApproval,
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

export function handleRecoveryInitiated(event: RecoveryInitiatedEvent): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create recovery session entity
  let session = new RecoverySession(event.params.recoveryId.toHex());
  session.user = user.id;
  session.isCompleted = false;
  session.isCancelled = false;
  session.requiredApprovals = event.params.threshold.toI32();
  session.currentApprovals = 0;
  session.initiatedAt = event.block.timestamp;
  session.save();
}

export function handleGuardianApproved(event: GuardianApprovedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create or load guardian
  let guardian = Guardian.load(event.params.guardian.toHex());
  if (guardian == null) {
    guardian = new Guardian(event.params.guardian.toHex());
    guardian.user = user.id;
    guardian.guardianAddress = event.params.guardian;
    guardian.isActive = true;
    guardian.save();
  }

  // Create guardian approval entity
  let approvalId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let approval = new GuardianApproval(approvalId);
  approval.recoverySession = event.params.recoveryId.toHex();
  approval.guardian = guardian.id;
  approval.approvedAt = event.block.timestamp;
  approval.blockNumber = event.block.number;
  approval.transactionHash = event.transaction.hash;
  approval.save();

  // Update recovery session approval count
  let session = RecoverySession.load(event.params.recoveryId.toHex());
  if (session != null) {
    session.currentApprovals = session.currentApprovals + 1;
    session.save();
  }
}

export function handleRecoveryCompleted(event: RecoveryCompletedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update recovery session
  let session = RecoverySession.load(event.params.recoveryId.toHex());
  if (session != null) {
    session.isCompleted = true;
    session.completedAt = event.params.timestamp; // Use timestamp from event
    session.save();
  }
}
