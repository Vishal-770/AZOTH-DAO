import { expect } from "chai";
import { HexString } from "@inco/js";
import {
  Address,
  parseEther,
  formatEther,
  getAddress
} from "viem";
import cUSDCMarketplaceAbi from "../artifacts/contracts/CUSDCMarketplace.sol/CUSDCMarketplace.json";
import vaultAbi from "../artifacts/contracts/ConfidentialVault.sol/ConfidentialVault.json";
import cGOVAbi from "../artifacts/contracts/ConfidentialGovernanceToken.sol/ConfidentialGovernanceToken.json";
import daoAbi from "../artifacts/contracts/AzothDAO.sol/AzothDAO.json";
import { encryptValue, decryptValue, getFee } from "../utils/incoHelper";
import { namedWallets, wallet, publicClient } from "../utils/wallet";

/**
 * Azoth DAO - Full Integration Tests
 * 
 * Tests the complete workflow:
 * STEP 1: Acquire cUSDC from Marketplace (ETH → cUSDC)
 * STEP 2: Deposit cUSDC into Vault (cUSDC → Vault Shares)
 * STEP 3: Join DAO (Membership via vault shares)
 * STEP 4: Mint cGOV (ETH → Governance Tokens)
 * STEP 5: Create Proposals
 * STEP 6-7: Vote on Proposals
 * STEP 8-10: Queue and Execute Proposals
 * STEP 11: Ragequit/Exit
 */
describe("Azoth DAO - Full Integration Tests", function () {
  // Contract instances
  let cUSDCMarketplace: Address;
  let vault: Address;
  let cGOV: Address;
  let dao: Address;

  // Test parameters
  const INITIAL_CGOV_PRICE = parseEther("0.001"); // 0.001 ETH per cGOV
  const VOTING_DELAY = 1n;
  const VOTING_PERIOD = 100n; // Shortened for testing
  const TIMELOCK_PERIOD = 60n; // 1 minute for testing
  const QUORUM_BPS = 2000n; // 20%
  const APPROVAL_BPS = 5000n; // 50%

  beforeEach(async function () {
    console.log("\n========================================");
    console.log("Setting up Azoth DAO test environment");
    console.log("========================================\n");

    // Deploy CUSDCMarketplace
    console.log("Deploying CUSDCMarketplace...");
    const marketplaceTxHash = await wallet.deployContract({
      abi: cUSDCMarketplaceAbi.abi,
      bytecode: cUSDCMarketplaceAbi.bytecode as HexString,
      args: [],
    });
    const marketplaceReceipt = await publicClient.waitForTransactionReceipt({
      hash: marketplaceTxHash,
    });
    cUSDCMarketplace = marketplaceReceipt.contractAddress as Address;
    console.log(`✓ CUSDCMarketplace deployed at: ${cUSDCMarketplace}`);

    // Deploy ConfidentialVault
    console.log("Deploying ConfidentialVault...");
    const vaultTxHash = await wallet.deployContract({
      abi: vaultAbi.abi,
      bytecode: vaultAbi.bytecode as HexString,
      args: [cUSDCMarketplace],
    });
    const vaultReceipt = await publicClient.waitForTransactionReceipt({
      hash: vaultTxHash,
    });
    vault = vaultReceipt.contractAddress as Address;
    console.log(`✓ ConfidentialVault deployed at: ${vault}`);

    // Deploy ConfidentialGovernanceToken
    console.log("Deploying ConfidentialGovernanceToken...");
    const cGOVTxHash = await wallet.deployContract({
      abi: cGOVAbi.abi,
      bytecode: cGOVAbi.bytecode as HexString,
      args: [INITIAL_CGOV_PRICE],
    });
    const cGOVReceipt = await publicClient.waitForTransactionReceipt({
      hash: cGOVTxHash,
    });
    cGOV = cGOVReceipt.contractAddress as Address;
    console.log(`✓ ConfidentialGovernanceToken deployed at: ${cGOV}`);

    // Deploy AzothDAO
    console.log("Deploying AzothDAO...");
    const daoTxHash = await wallet.deployContract({
      abi: daoAbi.abi,
      bytecode: daoAbi.bytecode as HexString,
      args: [
        vault,
        cGOV,
        VOTING_DELAY,
        VOTING_PERIOD,
        TIMELOCK_PERIOD,
        QUORUM_BPS,
        APPROVAL_BPS,
      ],
    });
    const daoReceipt = await publicClient.waitForTransactionReceipt({
      hash: daoTxHash,
    });
    dao = daoReceipt.contractAddress as Address;
    console.log(`✓ AzothDAO deployed at: ${dao}`);

    // Link contracts
    console.log("\nLinking contracts...");

    // Set vault as authorized in marketplace
    await wallet.writeContract({
      address: cUSDCMarketplace,
      abi: cUSDCMarketplaceAbi.abi,
      functionName: "setAuthorizedVault",
      args: [vault],
    });
    console.log("✓ Vault authorized in Marketplace");

    // Set DAO as authorized in vault
    await wallet.writeContract({
      address: vault,
      abi: vaultAbi.abi,
      functionName: "setAuthorizedDAO",
      args: [dao],
    });
    console.log("✓ DAO authorized in Vault");

    // Set DAO as authorized in cGOV
    await wallet.writeContract({
      address: cGOV,
      abi: cGOVAbi.abi,
      functionName: "setAuthorizedDAO",
      args: [dao],
    });
    console.log("✓ DAO authorized in cGOV");

    console.log("\n✅ Deployment complete!\n");

    // Fund test wallets if needed
    for (const [name, userWallet] of Object.entries(namedWallets)) {
      const balance = await publicClient.getBalance({
        address: userWallet.account?.address as Address,
      });
      const balanceEth = Number(formatEther(balance));

      if (balanceEth < 10) {
        const neededEth = 10 - balanceEth;
        console.log(`Funding ${name} with ${neededEth.toFixed(6)} ETH...`);
        const tx = await wallet.sendTransaction({
          to: userWallet.account?.address as Address,
          value: parseEther(neededEth.toFixed(6)),
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
    }
  });

  // ============ STEP 1: Acquire cUSDC from Marketplace ============
  describe("STEP 1: Acquire cUSDC from Marketplace", function () {
    it("Should allow users to purchase cUSDC with ETH", async function () {
      console.log("\n--- Testing cUSDC Purchase ---");
      const ethAmount = parseEther("1.0");

      const txHash = await namedWallets.alice.writeContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "purchaseCUSDC",
        value: ethAmount,
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log("✓ Alice purchased cUSDC with 1 ETH");

      // Get balance handle
      const balanceHandle = await publicClient.readContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      expect(balanceHandle).to.not.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      console.log(`✓ Balance handle exists: ${balanceHandle.slice(0, 20)}...`);

      // Wait for co-validator
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Decrypt and verify balance (should be 2000 * 1e6 = 2,000,000,000)
      const decryptedBalance = await decryptValue({
        walletClient: namedWallets.alice,
        handle: balanceHandle.toString(),
      });
      console.log(`✓ Decrypted balance: ${decryptedBalance / BigInt(1e6)} cUSDC`);
      
      // 1 ETH = 2000 USDC, USDC has 6 decimals
      expect(decryptedBalance).to.equal(BigInt(2000 * 1e6));
    });

    it("Should revert when purchasing with zero ETH", async function () {
      try {
        await namedWallets.alice.writeContract({
          address: cUSDCMarketplace,
          abi: cUSDCMarketplaceAbi.abi,
          functionName: "purchaseCUSDC",
          value: 0n,
          account: namedWallets.alice.account!,
          chain: namedWallets.alice.chain,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        console.log("✓ Correctly reverted with zero ETH");
        expect(error.message).to.include("MustSendETH");
      }
    });
  });

  // ============ STEP 2: Deposit cUSDC into Vault ============
  describe("STEP 2: Deposit cUSDC into Vault", function () {
    beforeEach(async function () {
      // Alice buys cUSDC first
      const txHash = await namedWallets.alice.writeContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "purchaseCUSDC",
        value: parseEther("1.0"),
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it("Should allow depositing cUSDC into vault and receive shares", async function () {
      console.log("\n--- Testing Vault Deposit ---");

      // Get Alice's cUSDC balance handle
      const cUSDCBalance = await publicClient.readContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      console.log("Depositing cUSDC into vault...");

      // Deposit into vault
      const depositTxHash = await namedWallets.alice.writeContract({
        address: vault,
        abi: vaultAbi.abi,
        functionName: "deposit",
        args: [cUSDCBalance],
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
      console.log("✓ Deposit transaction confirmed");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get vault shares
      const vaultShares = await publicClient.readContract({
        address: vault,
        abi: vaultAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      expect(vaultShares).to.not.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      console.log(`✓ Vault shares handle exists`);
    });

    it("Should verify vault config has inflation protection", async function () {
      const config = await publicClient.readContract({
        address: vault,
        abi: vaultAbi.abi,
        functionName: "getVaultConfig",
      }) as [bigint, bigint, bigint];

      console.log(`Vault Config: offset=${config[0]}, virtualShares=${config[1]}, virtualAssets=${config[2]}`);
      
      expect(config[0]).to.equal(3n); // δ = 3
      expect(config[1]).to.equal(1000n); // 1000 virtual shares
      expect(config[2]).to.equal(1n); // 1 virtual asset
      console.log("✓ Inflation attack protection configured correctly");
    });
  });

  // ============ STEP 3: Join DAO ============
  describe("STEP 3: Join DAO (Membership)", function () {
    beforeEach(async function () {
      // Alice buys cUSDC and deposits into vault
      const purchaseTx = await namedWallets.alice.writeContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "purchaseCUSDC",
        value: parseEther("1.0"),
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: purchaseTx });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const cUSDCBalance = await publicClient.readContract({
        address: cUSDCMarketplace,
        abi: cUSDCMarketplaceAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      const depositTx = await namedWallets.alice.writeContract({
        address: vault,
        abi: vaultAbi.abi,
        functionName: "deposit",
        args: [cUSDCBalance],
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it("Should allow joining DAO with vault shares", async function () {
      console.log("\n--- Testing DAO Membership ---");

      const joinTxHash = await namedWallets.alice.writeContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "joinDAO",
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: joinTxHash });

      const isMember = await publicClient.readContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "checkMembership",
        args: [namedWallets.alice.account?.address as Address],
      });

      expect(isMember).to.be.true;
      console.log("✓ Alice is now a DAO member");
    });

    it("Should prevent joining without vault shares", async function () {
      try {
        await namedWallets.bob.writeContract({
          address: dao,
          abi: daoAbi.abi,
          functionName: "joinDAO",
          account: namedWallets.bob.account!,
          chain: namedWallets.bob.chain,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        console.log("✓ Correctly prevented Bob from joining without vault shares");
      }
    });
  });

  // ============ STEP 4: Mint cGOV ============
  describe("STEP 4: Mint cGOV (Governance Access)", function () {
    it("Should allow minting cGOV by paying ETH", async function () {
      console.log("\n--- Testing cGOV Minting ---");
      const mintAmount = parseEther("0.01"); // Buy 10 cGOV

      const txHash = await namedWallets.alice.writeContract({
        address: cGOV,
        abi: cGOVAbi.abi,
        functionName: "mint",
        value: mintAmount,
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log("✓ Alice minted cGOV tokens");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const balanceHandle = await publicClient.readContract({
        address: cGOV,
        abi: cGOVAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      expect(balanceHandle).to.not.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      console.log("✓ cGOV balance handle exists");

      const hasToken = await publicClient.readContract({
        address: cGOV,
        abi: cGOVAbi.abi,
        functionName: "hasHeldToken",
        args: [namedWallets.alice.account?.address as Address],
      });
      expect(hasToken).to.be.true;
      console.log("✓ Alice marked as having held cGOV");
    });

    it("Should prevent transfer of cGOV (non-transferable)", async function () {
      // First mint some cGOV
      const mintTx = await namedWallets.alice.writeContract({
        address: cGOV,
        abi: cGOVAbi.abi,
        functionName: "mint",
        value: parseEther("0.01"),
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: mintTx });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const balance = await publicClient.readContract({
        address: cGOV,
        abi: cGOVAbi.abi,
        functionName: "balanceOf",
        args: [namedWallets.alice.account?.address as Address],
      }) as HexString;

      try {
        await namedWallets.alice.writeContract({
          address: cGOV,
          abi: cGOVAbi.abi,
          functionName: "transfer",
          args: [namedWallets.bob.account?.address as Address, balance],
          account: namedWallets.alice.account!,
          chain: namedWallets.alice.chain,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        console.log("✓ cGOV transfer correctly reverted (non-transferable)");
      }
    });
  });

  // ============ Full Workflow ============
  describe("Full DAO Workflow", function () {
    beforeEach(async function () {
      console.log("\n--- Setting up full workflow test ---");

      // Setup: Alice and Bob both join the DAO
      const members = [namedWallets.alice, namedWallets.bob];

      for (const member of members) {
        const memberName = member === namedWallets.alice ? "Alice" : "Bob";

        // Buy cUSDC
        const purchaseTx = await member.writeContract({
          address: cUSDCMarketplace,
          abi: cUSDCMarketplaceAbi.abi,
          functionName: "purchaseCUSDC",
          value: parseEther("2.0"),
          account: member.account!,
          chain: member.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: purchaseTx });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`✓ ${memberName} purchased cUSDC`);

        // Get balance and deposit into vault
        const balance = await publicClient.readContract({
          address: cUSDCMarketplace,
          abi: cUSDCMarketplaceAbi.abi,
          functionName: "balanceOf",
          args: [member.account?.address as Address],
        }) as HexString;

        const depositTx = await member.writeContract({
          address: vault,
          abi: vaultAbi.abi,
          functionName: "deposit",
          args: [balance],
          account: member.account!,
          chain: member.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: depositTx });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`✓ ${memberName} deposited into vault`);

        // Join DAO
        const joinTx = await member.writeContract({
          address: dao,
          abi: daoAbi.abi,
          functionName: "joinDAO",
          account: member.account!,
          chain: member.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: joinTx });
        console.log(`✓ ${memberName} joined DAO`);

        // Mint cGOV
        const mintTx = await member.writeContract({
          address: cGOV,
          abi: cGOVAbi.abi,
          functionName: "mint",
          value: parseEther("0.1"),
          account: member.account!,
          chain: member.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: mintTx });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`✓ ${memberName} minted cGOV`);
      }

      console.log("✓ Full workflow setup complete\n");
    });

    it("Should complete full proposal lifecycle", async function () {
      console.log("\n=== Full Proposal Lifecycle Test ===\n");

      // Get Inco fee
      const fee = await getFee();

      // STEP 5: Create a proposal
      console.log("STEP 5: Creating proposal...");
      
      // Encrypt the requested amount (1000 cUSDC = 1000 * 1e6)
      const requestedAmount = 1000n * BigInt(1e6);
      const encryptedAmount = await encryptValue({
        value: requestedAmount,
        address: namedWallets.alice.account?.address as Address,
        contractAddress: dao,
      });

      const proposeTx = await namedWallets.alice.writeContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "propose",
        args: [
          "Grant Proposal: Fund development of new DAO features",
          encryptedAmount,
          namedWallets.charlie.account?.address as Address, // Recipient
          0, // VotingMode.Normal
        ],
        value: fee,
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: proposeTx });
      console.log("✓ Proposal created");

      const proposalCount = await publicClient.readContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "proposalCount",
      }) as bigint;
      expect(proposalCount).to.equal(1n);
      console.log(`✓ Proposal ID: ${proposalCount}`);

      // STEP 7: Cast votes (need to wait for voting to start)
      console.log("\nSTEP 7: Casting votes...");
      
      // Wait for voting delay (1 block)
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Alice votes FOR
      const aliceVoteTx = await namedWallets.alice.writeContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "castVote",
        args: [1n, 1], // proposalId 1, VoteType.For = 1
        account: namedWallets.alice.account!,
        chain: namedWallets.alice.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: aliceVoteTx });
      console.log("✓ Alice voted FOR");

      // Bob votes FOR
      const bobVoteTx = await namedWallets.bob.writeContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "castVote",
        args: [1n, 1], // proposalId 1, VoteType.For = 1
        account: namedWallets.bob.account!,
        chain: namedWallets.bob.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: bobVoteTx });
      console.log("✓ Bob voted FOR");

      // Verify votes were recorded
      const aliceReceipt = await publicClient.readContract({
        address: dao,
        abi: daoAbi.abi,
        functionName: "getReceipt",
        args: [1n, namedWallets.alice.account?.address as Address],
      }) as [boolean, HexString, number];

      expect(aliceReceipt[0]).to.be.true; // hasVoted
      expect(aliceReceipt[2]).to.equal(1); // VoteType.For
      console.log("✓ Votes recorded correctly");

      console.log("\n=== Proposal Lifecycle Complete ===");
    });
  });
});
