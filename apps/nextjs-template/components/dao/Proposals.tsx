"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useRouter } from "next/navigation";
import {
  AZOTH_DAO_ADDRESS,
  AZOTH_DAO_ABI,
  CGOV_TOKEN_ADDRESS,
  CGOV_TOKEN_ABI,
  ProposalState,
  VoteType,
  VotingMode,
} from "@/utils/constants";
import { encryptValue, getFee, getConfig } from "@/utils/inco";
import { formatEther, parseUnits, formatUnits } from "viem";
import { useSessionKey } from "@/hooks/use-session-key";

interface Proposal {
  id: number;
  proposer: string;
  description: string;
  recipient: string;
  startBlock: bigint;
  endBlock: bigint;
  state: ProposalState;
  votingMode: VotingMode;
  executed: boolean;
}

interface VoteResults {
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}

const Proposals = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);

  const [isMember, setIsMember] = useState(false);
  const [hasVotingPower, setHasVotingPower] = useState(false);

  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [votingMode, setVotingMode] = useState<VotingMode>(VotingMode.Normal);
  const [isCreating, setIsCreating] = useState(false);
  const [fee, setFee] = useState<bigint>(0n);

  const [votingProposal, setVotingProposal] = useState<number | null>(null);
  
  // Vote reveal state
  const [revealingVotes, setRevealingVotes] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<Record<number, VoteResults>>({});
  const [finalizingProposal, setFinalizingProposal] = useState<number | null>(null);

  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use global session key from hook (persists in localStorage)
  const { sessionData, isSessionValid, createSession, isCreatingSession } = useSessionKey();

  useEffect(() => {
    const fetchData = async () => {
      if (!publicClient) return;

      setIsLoading(true);
      console.log("[Proposals] Fetching data...");
      
      try {
        const block = await publicClient.getBlockNumber();
        console.log("[Proposals] Current block:", block.toString());
        setCurrentBlock(block);

        console.log("[Proposals] Getting Inco fee...");
        const incoFee = await getFee();
        console.log("[Proposals] Fee:", formatEther(incoFee), "ETH");
        setFee(incoFee);

        if (address) {
          console.log("[Proposals] Checking eligibility for:", address);
          
          const memberStatus = await publicClient.readContract({
            address: AZOTH_DAO_ADDRESS,
            abi: AZOTH_DAO_ABI,
            functionName: "isMember",
            args: [address],
          }) as boolean;
          console.log("[Proposals] isMember:", memberStatus);
          setIsMember(memberStatus);

          const votingStatus = await publicClient.readContract({
            address: CGOV_TOKEN_ADDRESS,
            abi: CGOV_TOKEN_ABI,
            functionName: "hasVotingPower",
            args: [address],
          }) as boolean;
          console.log("[Proposals] hasVotingPower:", votingStatus);
          setHasVotingPower(votingStatus);
        }

        const count = (await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "proposalCount",
        })) as bigint;
        console.log("[Proposals] Proposal count:", count.toString());

        const proposalList: Proposal[] = [];
        for (let i = 1; i <= Number(count); i++) {
          const proposal = (await publicClient.readContract({
            address: AZOTH_DAO_ADDRESS,
            abi: AZOTH_DAO_ABI,
            functionName: "getProposal",
            args: [BigInt(i)],
          })) as [string, string, string, bigint, bigint, number, number, boolean];

          proposalList.push({
            id: i,
            proposer: proposal[0],
            description: proposal[1],
            recipient: proposal[2],
            startBlock: proposal[3],
            endBlock: proposal[4],
            state: proposal[5] as ProposalState,
            votingMode: proposal[6] as VotingMode,
            executed: proposal[7],
          });
        }

        setProposals(proposalList.reverse());
      } catch (err) {
        console.error("[Proposals] Failed to fetch data:", err);
        setError("Failed to load proposals. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [publicClient, address, txHash]);

  const handleCreateProposal = async () => {
    if (!walletClient || !address || !description || !recipient || !amount) {
      console.log("[Proposals] Missing fields for proposal creation");
      return;
    }

    setIsCreating(true);
    setError(null);
    setTxHash(null);

    console.log("[Proposals] Creating proposal...");
    console.log("[Proposals] Description:", description);
    console.log("[Proposals] Recipient:", recipient);
    console.log("[Proposals] Amount (cUSDC):", amount);
    console.log("[Proposals] Voting Mode:", votingMode === VotingMode.Normal ? "Normal" : "Quadratic");
    console.log("[Proposals] Required fee:", formatEther(fee), "ETH");

    try {
      const amountBigInt = parseUnits(amount, 6);
      console.log("[Proposals] Amount in wei:", amountBigInt.toString());
      
      console.log("[Proposals] Encrypting amount...");
      const encryptedAmount = await encryptValue({
        value: amountBigInt,
        address,
        contractAddress: AZOTH_DAO_ADDRESS,
      });
      console.log("[Proposals] Encrypted amount:", encryptedAmount);

      console.log("[Proposals] Sending transaction...");
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "propose",
        args: [description, encryptedAmount, recipient as `0x${string}`, votingMode],
        value: fee,
      });

      console.log("[Proposals] Transaction submitted:", hash);
      setTxHash(hash);
      setShowCreateForm(false);
      setDescription("");
      setRecipient("");
      setAmount("");

      if (publicClient) {
        console.log("[Proposals] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[Proposals] Confirmed in block:", receipt.blockNumber);
      }
    } catch (err: unknown) {
      console.error("[Proposals] Create proposal failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage.slice(0, 200));
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (proposalId: number, support: VoteType) => {
    if (!walletClient || !address) return;

    setVotingProposal(proposalId);
    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "castVote",
        args: [BigInt(proposalId), support],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Vote failed:", err);
      setError(err instanceof Error ? err.message : "Failed to cast vote");
    } finally {
      setVotingProposal(null);
    }
  };

  const handleQueueProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "queueProposal",
        args: [BigInt(proposalId)],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Queue failed:", err);
      setError(err instanceof Error ? err.message : "Failed to queue proposal");
    }
  };

  const handleExecuteProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "executeProposal",
        args: [BigInt(proposalId)],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Execute failed:", err);
      setError(err instanceof Error ? err.message : "Failed to execute proposal");
    }
  };

  // Finalize proposal - determines if it passed or failed based on decrypted votes
  const handleFinalizeProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    const results = voteResults[proposalId];
    if (!results) {
      setError("Please reveal votes first before finalizing");
      return;
    }

    setFinalizingProposal(proposalId);
    setError(null);
    setTxHash(null);

    try {
      // Convert vote results to wei (they're already in human-readable format)
      const forVotesWei = parseUnits(results.forVotes, 18);
      const againstVotesWei = parseUnits(results.againstVotes, 18);

      console.log("[Proposals] Finalizing with votes:", {
        forVotes: results.forVotes,
        againstVotes: results.againstVotes,
        forVotesWei: forVotesWei.toString(),
        againstVotesWei: againstVotesWei.toString(),
      });

      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "finalizeProposal",
        args: [BigInt(proposalId), forVotesWei, againstVotesWei],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        // Reload proposals to get updated state
        const block = await publicClient.getBlockNumber();
        setCurrentBlock(block);
      }
    } catch (err: unknown) {
      console.error("Finalize failed:", err);
      setError(err instanceof Error ? err.message : "Failed to finalize proposal");
    } finally {
      setFinalizingProposal(null);
    }
  };

  // Reveal vote results (only works after voting ends)
  const handleRevealVotes = async (proposalId: number) => {
    if (!publicClient || !address) return;

    // If no valid session, create one first
    if (!isSessionValid && walletClient) {
      console.log("[Proposals] No valid session, creating one...");
      await createSession();
      return;
    }

    if (!walletClient) return;

    setRevealingVotes(proposalId);
    setError(null);

    try {
      console.log("[Proposals] Requesting vote reveal for proposal", proposalId);
      
      // Step 1: Call revealVotes to get ACL access
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "revealVotes",
        args: [BigInt(proposalId)],
      });

      console.log("[Proposals] Waiting for ACL grant...", hash);
      await publicClient.waitForTransactionReceipt({ hash });

      // Step 2: Get vote handles
      const votes = await publicClient.readContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "getVotes",
        args: [BigInt(proposalId)],
      }) as [`0x${string}`, `0x${string}`, `0x${string}`];

      console.log("[Proposals] Vote handles:", votes);

      // Step 3: Prepare handles for batch decryption
      const [forHandle, againstHandle, abstainHandle] = votes;
      const handlesToDecrypt: `0x${string}`[] = [];
      const handleMap = { for: -1, against: -1, abstain: -1 };
      const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (forHandle !== ZERO_HANDLE) {
        handleMap.for = handlesToDecrypt.length;
        handlesToDecrypt.push(forHandle);
      }
      
      if (againstHandle !== ZERO_HANDLE) {
        handleMap.against = handlesToDecrypt.length;
        handlesToDecrypt.push(againstHandle);
      }
      
      if (abstainHandle !== ZERO_HANDLE) {
        handleMap.abstain = handlesToDecrypt.length;
        handlesToDecrypt.push(abstainHandle);
      }

      let forVotes = "0";
      let againstVotes = "0";
      let abstainVotes = "0";

      // Step 4: Batch decrypt with session key - NO NEW SIGNATURE NEEDED!
      if (handlesToDecrypt.length > 0 && sessionData) {
        console.log("[Proposals] Batch decrypting", handlesToDecrypt.length, "vote tallies with session key (no signature)...");
        
        const inco = await getConfig();

        // Use session key voucher - NO wallet signature popup!
        const results: Array<{ plaintext: { value: bigint | boolean } }> = await (inco.attestedDecryptWithVoucher as (
          kp: typeof sessionData.keypair,
          v: typeof sessionData.voucher,
          pc: typeof publicClient,
          h: `0x${string}`[]
        ) => Promise<Array<{ plaintext: { value: bigint | boolean } }>>)(
          sessionData.keypair,
          sessionData.voucher,
          publicClient,
          handlesToDecrypt
        );

        // Extract values from batch result
        if (handleMap.for !== -1) {
          const decrypted = results[handleMap.for].plaintext.value as bigint;
          forVotes = formatUnits(decrypted, 18);
        }

        if (handleMap.against !== -1) {
          const decrypted = results[handleMap.against].plaintext.value as bigint;
          againstVotes = formatUnits(decrypted, 18);
        }

        if (handleMap.abstain !== -1) {
          const decrypted = results[handleMap.abstain].plaintext.value as bigint;
          abstainVotes = formatUnits(decrypted, 18);
        }
      }

      console.log("[Proposals] Vote results:", { forVotes, againstVotes, abstainVotes });
      
      setVoteResults(prev => ({
        ...prev,
        [proposalId]: { forVotes, againstVotes, abstainVotes }
      }));

    } catch (err: unknown) {
      console.error("Reveal votes failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("VotingNotEnded")) {
        setError("Cannot reveal votes: Voting has not ended yet");
      } else if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Please try again in a few seconds");
      } else {
        setError(errorMessage.slice(0, 200));
      }
    } finally {
      setRevealingVotes(null);
    }
  };

  // Check if votes can be revealed (voting ended AND user is member)
  const canRevealVotes = (proposal: Proposal): boolean => {
    return currentBlock > proposal.endBlock && !proposal.executed && isMember;
  };

  const getStateLabel = (proposal: Proposal): { text: string; color: string } => {
    if (proposal.executed) {
      return { text: "Executed", color: "bg-green-900/30 text-green-400 border-green-700/30" };
    }
    if (proposal.state === ProposalState.Canceled) {
      return { text: "Canceled", color: "bg-black/40 text-[#e0f2fe]/40 border-[#e0f2fe]/10" };
    }
    if (proposal.state === ProposalState.Defeated) {
      return { text: "Defeated", color: "bg-red-500/10 text-red-400 border-red-500/30" };
    }
    if (proposal.state === ProposalState.Succeeded) {
      return { text: "Succeeded", color: "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/40" };
    }
    if (proposal.state === ProposalState.Queued) {
      return { text: "Queued", color: "bg-[#e0f2fe]/10 text-[#e0f2fe] border-[#e0f2fe]/30" };
    }
    if (currentBlock < proposal.startBlock) {
      return { text: "Pending", color: "bg-[#e0f2fe]/10 text-[#e0f2fe] border-[#e0f2fe]/20" };
    }
    if (currentBlock <= proposal.endBlock) {
      return { text: "Active", color: "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/40 animate-pulse" };
    }
    return { text: "Voting Ended", color: "bg-[#e0f2fe]/10 text-[#e0f2fe] border-[#e0f2fe]/30" };
  };

  const canVote = (proposal: Proposal): boolean => {
    return (
      currentBlock >= proposal.startBlock &&
      currentBlock <= proposal.endBlock &&
      proposal.state !== ProposalState.Canceled &&
      !proposal.executed &&
      isMember &&
      hasVotingPower
    );
  };

  // Check if proposal can be finalized (voting ended, has vote results, state is Active/Pending)
  const canFinalize = (proposal: Proposal): boolean => {
    const results = voteResults[proposal.id];
    return (
      currentBlock > proposal.endBlock &&
      (proposal.state === ProposalState.Active || proposal.state === ProposalState.Pending) &&
      !proposal.executed &&
      isMember &&
      results !== undefined
    );
  };

  const canQueue = (proposal: Proposal): boolean => {
    // Can only queue if proposal state is Succeeded
    return (
      proposal.state === ProposalState.Succeeded &&
      !proposal.executed &&
      isMember
    );
  };

  const canExecute = (proposal: Proposal): boolean => {
    return proposal.state === ProposalState.Queued && !proposal.executed && isMember;
  };

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-8 pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#00f5ff]/30 pb-6 gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight uppercase">Proposals</h2>
          <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-wider mt-1">Create and vote on DAO proposals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!isMember || !hasVotingPower}
          className="px-4 sm:px-6 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono font-bold text-xs tracking-widest hover:bg-[#00f5ff]/20 hover:border-[#00f5ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase whitespace-nowrap"
        >
          {showCreateForm ? "Cancel" : "+ New Proposal"}
        </button>
      </div>

      {/* Session Status Indicator */}
      <div className="bg-black/40 p-4 border border-[#e0f2fe]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase">
              Decryption Session Status
            </p>
            <p className="font-mono text-sm text-white mt-1">
              {isSessionValid ? (
                <span className="text-[#00f5ff]">
                  ✓ Active (expires {sessionData?.expiresAt.toLocaleTimeString()})
                </span>
              ) : (
                <span className="text-yellow-400">No Active Session</span>
              )}
            </p>
          </div>
          {isSessionValid && (
            <button
              onClick={() => {
                if (address) {
                  localStorage.removeItem(`azoth_session_${address.toLowerCase()}`);
                  window.location.reload();
                }
              }}
              className="px-3 py-1 text-xs font-mono text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-colors"
            >
              Revoke
            </button>
          )}
        </div>
        {!isSessionValid && (
          <p className="font-mono text-xs text-[#e0f2fe]/50 mt-2 leading-relaxed">
            Sign once to create a session, then decrypt vote results without repeated signatures. Session expires in 1 hour.
          </p>
        )}
      </div>

      {/* Eligibility Warning */}
      {(!isMember || !hasVotingPower) && (
        <div className="bg-[#00f5ff]/5 border border-[#00f5ff]/30 p-5 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff]"></div>
          <h4 className="font-mono text-sm font-bold text-[#00f5ff] mb-3 tracking-wider uppercase">Not Eligible to Create Proposals</h4>
          <ul className="font-mono text-xs text-[#e0f2fe]/70 space-y-2 leading-relaxed">
            {!isMember && <li>• You must be a DAO member (go to Membership tab and Join)</li>}
            {!hasVotingPower && <li>• You must have cGOV tokens (go to cGOV tab and Mint)</li>}
          </ul>
        </div>
      )}

      {/* Create Proposal Form */}
      {showCreateForm && isMember && hasVotingPower && (
        <div className="bg-black/60 p-6 space-y-5 border border-[#e0f2fe]/20">
          <h3 className="font-mono text-sm font-bold text-white tracking-widest uppercase">Create New Proposal</h3>

          <div>
            <label className="block font-mono text-[10px] font-medium text-[#e0f2fe]/60 mb-2 tracking-widest uppercase">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal..."
              className="w-full bg-black/60 border border-[#e0f2fe]/20 px-4 py-3 text-white font-mono focus:outline-none focus:border-[#00f5ff]/50 focus:bg-black/80 transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-medium text-[#e0f2fe]/60 mb-2 tracking-widest uppercase">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-black/60 border border-[#e0f2fe]/20 px-4 py-3 text-white font-mono focus:outline-none focus:border-[#00f5ff]/50 focus:bg-black/80 transition-all"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-medium text-[#e0f2fe]/60 mb-2 tracking-widest uppercase">
              Requested cUSDC Amount (Encrypted)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full bg-black/60 border border-[#e0f2fe]/20 px-4 py-3 text-white font-mono focus:outline-none focus:border-[#00f5ff]/50 focus:bg-black/80 transition-all"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-medium text-[#e0f2fe]/60 mb-2 tracking-widest uppercase">
              Voting Mode
            </label>
            <select
              value={votingMode}
              onChange={(e) => setVotingMode(Number(e.target.value) as VotingMode)}
              className="w-full bg-black/60 border border-[#e0f2fe]/20 px-4 py-3 text-white font-mono focus:outline-none focus:border-[#00f5ff]/50 focus:bg-black/80 transition-all"
            >
              <option value={VotingMode.Normal}>Normal (Linear)</option>
              <option value={VotingMode.Quadratic}>Quadratic</option>
            </select>
          </div>

          <div className="bg-[#00f5ff]/5 border border-[#00f5ff]/30 p-3">
            <p className="font-mono text-xs text-[#00f5ff]">
              Fee: {formatEther(fee)} ETH (for encryption)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (description) params.set("title", description.slice(0, 100));
                if (description) params.set("description", description);
                router.push(`/agent?${params.toString()}`);
              }}
              disabled={!description}
              className="flex-1 py-3 bg-[#e0f2fe]/10 border border-[#e0f2fe]/30 hover:bg-[#e0f2fe]/20 hover:border-[#e0f2fe]/50 disabled:opacity-30 text-white font-mono font-bold text-xs tracking-wider transition-all uppercase flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21" />
              </svg>
              Ask AI
            </button>
            <button
              onClick={handleCreateProposal}
              disabled={isCreating || !description || !recipient || !amount}
              className="flex-1 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono font-bold text-xs tracking-wider hover:bg-[#00f5ff]/20 hover:border-[#00f5ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
            >
              {isCreating ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {isLoading ? (
        <div className="text-center py-10 font-mono text-[#e0f2fe]/50 text-xs tracking-widest uppercase">Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-10 font-mono text-[#e0f2fe]/50 text-xs tracking-widest">
          No proposals yet. Create the first one!
        </div>
      ) : (
        <div className="space-y-5">
          {proposals.map((proposal) => {
            const stateLabel = getStateLabel(proposal);
            return (
              <div
                key={proposal.id}
                className="border border-[#e0f2fe]/20 p-4 sm:p-6 space-y-4 bg-black/40 hover:border-[#00f5ff]/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-[#e0f2fe]/60">
                        #{proposal.id}
                      </span>
                      <span
                        className={`px-3 py-1 text-[10px] font-mono font-bold tracking-widest border uppercase ${stateLabel.color}`}
                      >
                        {stateLabel.text}
                      </span>
                      <span className="font-mono text-[10px] text-[#e0f2fe]/40 tracking-wider uppercase">
                        {proposal.votingMode === VotingMode.Quadratic
                          ? "Quadratic"
                          : "Normal"}
                      </span>
                    </div>
                    <p className="text-white font-mono text-sm leading-relaxed break-words">{proposal.description}</p>
                    <p className="font-mono text-xs text-[#e0f2fe]/50 mt-3 break-all">
                      Recipient: {proposal.recipient.slice(0, 8)}...
                      {proposal.recipient.slice(-6)}
                    </p>
                    <p className="font-mono text-[10px] text-[#e0f2fe]/30 mt-1 break-words">
                      Blocks: {proposal.startBlock.toString()} -{" "}
                      {proposal.endBlock.toString()} (Current: {currentBlock.toString()})
                    </p>
                  </div>
                </div>

                {/* Voting Buttons */}
                {canVote(proposal) && (
                  <div className="space-y-2">
                    {/* Encrypted votes badge during voting */}
                    <div className="flex items-center space-x-2 text-[#00f5ff] text-xs">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="break-words">Votes are encrypted until voting ends</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.For)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm font-medium hover:bg-green-900/50 border border-green-700/30 disabled:opacity-50"
                      >
                        For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.Against)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-red-900/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/50 border border-red-700/30 disabled:opacity-50"
                      >
                        Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.Abstain)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 border border-gray-700 disabled:opacity-50"
                      >
                        Abstain
                      </button>
                    </div>
                  </div>
                )}

                {/* Vote Results Section - shows after voting ends */}
                {canRevealVotes(proposal) && (
                  <div className="space-y-2">
                    {voteResults[proposal.id] ? (
                      <div className="bg-black/60 border border-[#00f5ff]/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <span className="text-[#00f5ff] whitespace-nowrap">For:</span>
                          <span className="font-semibold text-white text-right break-all">{parseFloat(voteResults[proposal.id].forVotes).toFixed(4)} cGOV</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <span className="text-[#e0f2fe] whitespace-nowrap">Against:</span>
                          <span className="font-semibold text-white text-right break-all">{parseFloat(voteResults[proposal.id].againstVotes).toFixed(4)} cGOV</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <span className="text-[#e0f2fe]/60 whitespace-nowrap">Abstain:</span>
                          <span className="font-semibold text-white text-right break-all">{parseFloat(voteResults[proposal.id].abstainVotes).toFixed(4)} cGOV</span>
                        </div>
                        <div className="pt-2 border-t border-[#00f5ff]/20">
                          <div className="text-xs text-[#e0f2fe]/60">
                            Result: {parseFloat(voteResults[proposal.id].forVotes) > parseFloat(voteResults[proposal.id].againstVotes) 
                              ? <span className="text-[#00f5ff] font-bold">Passed</span> 
                              : <span className="text-[#e0f2fe]/60">Rejected</span>}
                          </div>
                        </div>
                        {/* Finalize Button - only shows when votes revealed and proposal not yet finalized */}
                        {canFinalize(proposal) && (
                          <button
                            onClick={() => handleFinalizeProposal(proposal.id)}
                            disabled={finalizingProposal === proposal.id}
                            className="w-full mt-2 py-2 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 disabled:opacity-50"
                          >
                            {finalizingProposal === proposal.id ? "Finalizing..." : "Finalize Proposal Outcome"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRevealVotes(proposal.id)}
                        disabled={revealingVotes === proposal.id || isCreatingSession}
                        className="w-full py-2 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="break-words text-left">
                          {isCreatingSession 
                            ? "Creating Session (Sign Once)..." 
                            : revealingVotes === proposal.id 
                              ? "Decrypting..." 
                              : isSessionValid
                                ? "Reveal Vote Results (No Signature)"
                                : "Reveal Vote Results (Create Session)"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Queue Button */}
                {canQueue(proposal) && (
                  <button
                    onClick={() => handleQueueProposal(proposal.id)}
                    className="w-full py-2 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50"
                  >
                    Queue for Execution
                  </button>
                )}

                {/* Execute Button */}
                {canExecute(proposal) && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    className="w-full py-2 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50"
                  >
                    Execute Proposal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="text-sm font-medium text-green-400">Transaction Successful!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-500 hover:text-green-400"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default Proposals;
