// ============ Azoth DAO Contract Addresses ============
// Deployed to Base Sepolia on January 12, 2026
// Version 13: Added finalizeProposal to determine pass/fail, only Succeeded can be queued

export const CUSDC_MARKETPLACE_ADDRESS = "0x637076397294eC96A92415Be58ca3e24fE44d529";
export const CGOV_TOKEN_ADDRESS = "0xdA9B7d018e06f4CE070e708653da7629781A101b";
export const CONFIDENTIAL_VAULT_ADDRESS = "0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82";
export const AZOTH_DAO_ADDRESS = "0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7";

// ============ cUSDC Marketplace ABI ============
export const CUSDC_MARKETPLACE_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "purchaseCUSDC",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EXCHANGE_RATE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMinted",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "checkBalanceACL",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getBalanceHandle",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "ethAmount", type: "uint256" },
    ],
    name: "CUSDCPurchased",
    type: "event",
  },
] as const;

// ============ cGOV Token ABI ============
export const CGOV_TOKEN_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "_initialMintPrice", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "euint256", name: "amount", type: "bytes32" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "burnAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "hasVotingPower",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasHeldToken",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "ethPaid", type: "uint256" },
    ],
    name: "TokensMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "from", type: "address" }],
    name: "TokensBurned",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "checkBalanceACL",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getBalanceHandle",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============ Confidential Vault ABI ============
export const CONFIDENTIAL_VAULT_ABI = [
  {
    inputs: [{ internalType: "address", name: "_cUSDCMarketplace", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [{ internalType: "euint256", name: "sharesReceived", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "euint256", name: "sharesToBurn", type: "bytes32" }],
    name: "withdraw",
    outputs: [{ internalType: "euint256", name: "assetsWithdrawn", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "shares",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasShares",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cUSDC",
    outputs: [{ internalType: "contract ICUSDCMarketplace", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "receiver", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "checkSharesACL",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getSharesHandle",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawAll",
    outputs: [{ internalType: "euint256", name: "assetsWithdrawn", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ============ Azoth DAO ABI ============
export const AZOTH_DAO_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_vault", type: "address" },
      { internalType: "address", name: "_cGOV", type: "address" },
      { internalType: "uint256", name: "_votingDelay", type: "uint256" },
      { internalType: "uint256", name: "_votingPeriod", type: "uint256" },
      { internalType: "uint256", name: "_timelockPeriod", type: "uint256" },
      { internalType: "uint256", name: "_quorumBps", type: "uint256" },
      { internalType: "uint256", name: "_approvalBps", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // Membership
  {
    inputs: [],
    name: "joinDAO",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "leaveDAO",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "checkMembership",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "memberCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Proposals
  {
    inputs: [
      { internalType: "string", name: "description", type: "string" },
      { internalType: "bytes", name: "encryptedAmount", type: "bytes" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint8", name: "votingMode", type: "uint8" },
    ],
    name: "propose",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "support", type: "uint8" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint256", name: "decryptedForVotes", type: "uint256" },
      { internalType: "uint256", name: "decryptedAgainstVotes", type: "uint256" },
    ],
    name: "finalizeProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "queueProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "executeProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "cancelProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalState",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposal",
    outputs: [
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "startBlock", type: "uint256" },
      { internalType: "uint256", name: "endBlock", type: "uint256" },
      { internalType: "uint8", name: "state", type: "uint8" },
      { internalType: "uint8", name: "votingMode", type: "uint8" },
      { internalType: "bool", name: "executed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getVotes",
    outputs: [
      { internalType: "euint256", name: "forVotes", type: "bytes32" },
      { internalType: "euint256", name: "againstVotes", type: "bytes32" },
      { internalType: "euint256", name: "abstainVotes", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Request ACL access to reveal vote results (only works after voting ends)
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "revealVotes",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address", name: "voter", type: "address" },
    ],
    name: "getReceipt",
    outputs: [
      { internalType: "bool", name: "hasVoted", type: "bool" },
      { internalType: "euint256", name: "votes", type: "bytes32" },
      { internalType: "uint8", name: "support", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Governance parameters
  {
    inputs: [],
    name: "votingDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "votingPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "timelockPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "quorumBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "approvalBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "member", type: "address" }],
    name: "MemberJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "member", type: "address" }],
    name: "MemberLeft",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
      { indexed: false, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "uint256", name: "startBlock", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endBlock", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "votingMode", type: "uint8" },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "support", type: "uint8" },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "executeTime", type: "uint256" },
    ],
    name: "ProposalQueued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "ProposalExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "ProposalCanceled",
    type: "event",
  },
  // Debug functions
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address", name: "voter", type: "address" },
    ],
    name: "checkVoteACL",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address", name: "voter", type: "address" },
    ],
    name: "getVoteHandle",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "checkProposalVoteTalliesACL",
    outputs: [
      { internalType: "bool", name: "forACL", type: "bool" },
      { internalType: "bool", name: "againstACL", type: "bool" },
      { internalType: "bool", name: "abstainACL", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============ Proposal States ============
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Queued = 4,
  Executed = 5,
  Canceled = 6,
}

// ============ Vote Types ============
export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

// ============ Voting Modes ============
export enum VotingMode {
  Normal = 0,
  Quadratic = 1,
}

// ============ Legacy Exports (for backwards compatibility) ============
export const CERC_CONTRACT_ADDRESS = CUSDC_MARKETPLACE_ADDRESS;
export const CERC_ABI = CUSDC_MARKETPLACE_ABI;
