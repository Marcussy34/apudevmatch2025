import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  CrossChainOperationStarted as CrossChainOperationStartedEvent,
  CrossChainOperationCompleted as CrossChainOperationCompletedEvent,
  ChainBalanceUpdated as ChainBalanceUpdatedEvent,
} from "../../generated/MultiChainRPC/MultiChainRPC";
import {
  User,
  CrossChainOperation,
  ChainBalance,
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

export function handleCrossChainOperationStarted(
  event: CrossChainOperationStartedEvent
): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create cross-chain operation entity
  let operation = new CrossChainOperation(event.params.operationId.toHex());
  operation.user = user.id;
  operation.operationId = event.params.operationId;
  operation.sourceChain = event.params.sourceChain;
  operation.targetChain = event.params.targetChain;
  operation.isCompleted = false;
  operation.startedAt = event.block.timestamp;
  operation.startTxHash = event.transaction.hash;
  operation.save();
}

export function handleCrossChainOperationCompleted(
  event: CrossChainOperationCompletedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Update cross-chain operation
  let operation = CrossChainOperation.load(event.params.operationId.toHex());
  if (operation != null) {
    operation.isCompleted = true;
    operation.isSuccessful = event.params.success;
    operation.completedAt = event.block.timestamp;
    operation.completeTxHash = event.transaction.hash;
    operation.save();
  }
}

export function handleChainBalanceUpdated(
  event: ChainBalanceUpdatedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create or update chain balance entity
  let balanceId =
    event.params.user.toHex() +
    "-" +
    event.params.walletId.toHex() +
    "-" +
    event.params.chainType.toString();
  let chainBalance = ChainBalance.load(balanceId);
  if (chainBalance == null) {
    chainBalance = new ChainBalance(balanceId);
    chainBalance.user = user.id;
    chainBalance.wallet = event.params.walletId.toHex();
    chainBalance.chainType = event.params.chainType;
    chainBalance.totalValue = BigInt.fromI32(0);
  }
  chainBalance.balance = event.params.newBalance;
  chainBalance.lastUpdated = event.block.timestamp;
  chainBalance.save();
}
