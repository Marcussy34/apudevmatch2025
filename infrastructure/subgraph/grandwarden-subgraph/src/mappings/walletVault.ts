import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  WalletImported as WalletImportedEvent,
  BalancesFetched as BalancesFetchedEvent,
  TransactionSigned as TransactionSignedEvent,
  GenericVaultEvent as GenericVaultEventEvent,
  UserFlowEvent as UserFlowEventEvent,
  ChainBalanceUpdated as ChainBalanceUpdatedEvent,
} from "../../generated/WalletVault/WalletVault";
import {
  User,
  Wallet,
  Transaction,
  ChainBalance,
  DerivedAddress,
  GenericVaultEvent,
  VaultEvent,
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

export function handleWalletImported(event: WalletImportedEvent): void {
  // Create or load user
  let user = createOrLoadUser(event.params.user);
  if (user.createdAt == BigInt.fromI32(0)) {
    user.createdAt = event.block.timestamp;
  }
  user.totalWallets = user.totalWallets.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create wallet entity
  let wallet = new Wallet(event.params.walletId.toHex());
  wallet.owner = user.id;
  wallet.name = event.params.name;
  wallet.isActive = true;
  wallet.supportedChains = [];
  wallet.createdAt = event.block.timestamp;
  wallet.lastUsed = event.block.timestamp;
  wallet.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.newWallets = dailyStats.newWallets.plus(BigInt.fromI32(1));
    dailyStats.save();
  }
}

export function handleBalancesFetched(event: BalancesFetchedEvent): void {
  // Load user and wallet
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  let wallet = Wallet.load(event.params.walletId.toHex());
  if (wallet != null) {
    wallet.lastUsed = event.block.timestamp;
    wallet.save();
  }

  // Create or update chain balance entity for total value
  let balanceId =
    event.params.user.toHex() + "-" + event.params.walletId.toHex() + "-total";
  let chainBalance = ChainBalance.load(balanceId);
  if (chainBalance == null) {
    chainBalance = new ChainBalance(balanceId);
    chainBalance.user = user.id;
    chainBalance.wallet = event.params.walletId.toHex();
    chainBalance.chainType = 0; // 0 for total/aggregated
    chainBalance.balance = BigInt.fromI32(0);
  }
  chainBalance.totalValue = event.params.totalValue;
  chainBalance.lastUpdated = event.block.timestamp;
  chainBalance.save();
}

export function handleTransactionSigned(event: TransactionSignedEvent): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create transaction entity
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.wallet = event.params.walletId.toHex();
  transaction.txHash = event.params.txHash;
  transaction.timestamp = event.block.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  // Update wallet last used
  let wallet = Wallet.load(event.params.walletId.toHex());
  if (wallet != null) {
    wallet.lastUsed = event.block.timestamp;
    wallet.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.totalTransactions = dailyStats.totalTransactions.plus(
      BigInt.fromI32(1)
    );
    dailyStats.save();
  }
}

export function handleTransactionSignedWithChain(
  event: TransactionSignedEvent
): void {
  // Load user
  let user = createOrLoadUser(event.params.user);
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create transaction entity with chain type (this handler expects 4 params)
  let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.wallet = event.params.walletId.toHex();
  transaction.txHash = event.params.txHash;
  // Note: chainType would be in event.params[3] if the event has 4 parameters
  transaction.timestamp = event.block.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  // Update wallet last used
  let wallet = Wallet.load(event.params.walletId.toHex());
  if (wallet != null) {
    wallet.lastUsed = event.block.timestamp;
    wallet.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  let dayId = (event.block.timestamp.toI32() / 86400).toString();
  let dailyStats = DailyStats.load(dayId);
  if (dailyStats != null) {
    dailyStats.totalTransactions = dailyStats.totalTransactions.plus(
      BigInt.fromI32(1)
    );
    dailyStats.save();
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

  // Create or update derived address entity
  let derivedAddressId =
    event.params.walletId.toHex() + "-" + event.params.chainType.toString();
  let derivedAddress = DerivedAddress.load(derivedAddressId);
  if (derivedAddress == null) {
    derivedAddress = new DerivedAddress(derivedAddressId);
    derivedAddress.wallet = event.params.walletId.toHex();
    derivedAddress.chainType = event.params.chainType;
    derivedAddress.address = Bytes.fromI32(0); // Would need to get from contract
    derivedAddress.save();
  }
  chainBalance.derivedAddress = derivedAddress.id;
  chainBalance.save();
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

export function handleUserFlowEvent(event: UserFlowEventEvent): void {
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
