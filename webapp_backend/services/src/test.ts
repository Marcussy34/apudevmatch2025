import { CredentialService } from "./credential-service";

async function main() {
  console.log("🚀 Starting Grand Warden Backend Test");
  console.log("=====================================");

  const service = new CredentialService();

  console.log("💰 Wallet Address:", service.getWalletAddress());
  console.log("");

  // Test the full credential storage flow
  await service.testStorage();

  console.log("");
  console.log("🏁 Test completed!");
}

main().catch(console.error);
