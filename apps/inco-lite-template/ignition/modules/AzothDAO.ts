// Hardhat Ignition deployment module for Azoth DAO
// Deploys all 4 contracts in the correct order with proper linking

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const AzothDAOModule = buildModule("AzothDAOModule", (m) => {
  // ============ Deployment Parameters ============
  // HACKATHON DEMO MODE: All timings set to very short durations (minutes, not days)
  // This allows for a complete demo within 10 minutes
  
  // cGOV mint price: 0.0001 ETH per token (low for demo)
  const initialCGovMintPrice = m.getParameter("cgov_mint_price", parseEther("0.0001"));
  
  // Voting delay: 1 block (~2 seconds on Base Sepolia)
  const votingDelay = m.getParameter("voting_delay", 1n);
  
  // Voting period: 30 blocks (~60 seconds on Base Sepolia)
  // Gives enough time for demo voting
  const votingPeriod = m.getParameter("voting_period", 30n);
  
  // Timelock period: 10 seconds (almost instant for demo)
  const timelockPeriod = m.getParameter("timelock_period", 10n);
  
  // Quorum: 10% (1000 basis points) - lower for easier demo
  const quorumBps = m.getParameter("quorum_bps", 1000n);
  
  // Approval threshold: 50% (5000 basis points)
  const approvalBps = m.getParameter("approval_bps", 5000n);

  // ============ Step 1: Deploy cUSDC Marketplace ============
  // This is the economic stake acquisition contract
  const cUSDCMarketplace = m.contract("CUSDCMarketplace", []);

  // ============ Step 2: Deploy Confidential Vault (ERC-4626) ============
  // This holds the DAO treasury with inflation attack protection
  const vault = m.contract("ConfidentialVault", [cUSDCMarketplace]);

  // ============ Step 3: Deploy cGOV Token ============
  // Non-transferable governance token
  const cGOV = m.contract("ConfidentialGovernanceToken", [initialCGovMintPrice]);

  // ============ Step 4: Deploy AzothDAO ============
  // Main governance contract
  const dao = m.contract("AzothDAO", [
    vault,
    cGOV,
    votingDelay,
    votingPeriod,
    timelockPeriod,
    quorumBps,
    approvalBps,
  ]);

  // ============ Step 5: Link Contracts ============
  // Set the vault as authorized in the marketplace
  m.call(cUSDCMarketplace, "setAuthorizedVault", [vault]);
  
  // Set the DAO as authorized in the vault
  m.call(vault, "setAuthorizedDAO", [dao]);
  
  // Set the cGOV as authorized in the vault (for burning on ragequit)
  m.call(vault, "setAuthorizedCGOV", [cGOV]);
  
  // Set the DAO as authorized in the cGOV token
  m.call(cGOV, "setAuthorizedDAO", [dao]);
  
  // Set the vault as authorized in the cGOV token (for burning on ragequit)
  m.call(cGOV, "setAuthorizedVault", [vault]);

  return {
    cUSDCMarketplace,
    vault,
    cGOV,
    dao,
  };
});

export default AzothDAOModule;
