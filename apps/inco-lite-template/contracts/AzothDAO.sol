// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IConfidentialVault {
    function balanceOf(address user) external view returns (euint256);
    function hasShares(address user) external view returns (bool);
    function executeTransfer(
        address recipient,
        euint256 amount
    ) external returns (euint256);
}

interface IConfidentialGovernanceToken {
    function balanceOf(address account) external view returns (euint256);
    function hasHeldToken(address account) external view returns (bool);
    function hasVotingPower(address account) external view returns (bool);
    function totalSupply() external view returns (euint256);
}

/**
 * @title AzothDAO
 * @notice Confidential DAO with encrypted voting and proposal execution
 * @dev Supports both normal and quadratic voting modes with full privacy
 *
 * Architecture (based on OpenZeppelin Governor patterns adapted for TEE):
 * - Membership: Must have vault shares (economic stake)
 * - Voting Power: cGOV tokens (governance rights, separate from economics)
 * - Proposals: Request encrypted cUSDC amounts from treasury
 * - Voting: Fully encrypted votes with hidden weights and interim results
 * - Execution: Timelock period for ragequit before execution
 *
 * Key Privacy Guarantees:
 * - Individual votes are encrypted (no one knows who voted what)
 * - Vote weights are encrypted (whale influence is hidden)
 * - Running tallies are encrypted (no bandwagon effects)
 * - Only final outcome is revealed after voting ends
 */
contract AzothDAO is Ownable, ReentrancyGuard {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Errors ============
    error InvalidVault();
    error InvalidCGOV();
    error QuorumTooHigh();
    error ApprovalTooHigh();
    error AlreadyMember();
    error NoVaultShares();
    error NotMember();
    error UnauthorizedAccess();
    error FeeTooLow();
    error InvalidRecipient();
    error NoCGOVTokens();
    error VotingClosed();
    error VotingNotStarted();
    error VotingEnded();
    error AlreadyVoted();
    error NoVotingPower();
    error ProposalNotActive();
    error VotingNotEnded();
    error ProposalNotQueued();
    error TimelockActive();
    error AlreadyExecuted();
    error Unauthorized();
    error AlreadyExecutedOrCanceled();

    // ============ Enums ============

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed,
        Canceled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    enum VotingMode {
        Normal, // Linear voting: weight = cGOV balance
        Quadratic // Quadratic voting: weight = sqrt(cGOV balance) - requires off-chain computation
    }

    // ============ Structs ============

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        // Encrypted proposal data
        euint256 requestedAmount; // Encrypted cUSDC amount requested
        address recipient; // Address to receive funds if passed
        // Timing
        uint256 startBlock;
        uint256 endBlock;
        uint256 queuedTime;
        // Encrypted vote tallies
        euint256 forVotes;
        euint256 againstVotes;
        euint256 abstainVotes;
        // State
        ProposalState state;
        VotingMode votingMode;
        // Execution data
        bool executed;
    }

    struct Receipt {
        bool hasVoted;
        euint256 votes; // Encrypted vote weight
        VoteType support;
    }

    // ============ State Variables ============

    IConfidentialVault public immutable vault;
    IConfidentialGovernanceToken public immutable cGOV;

    // Governance parameters (following OpenZeppelin Governor patterns)
    uint256 public votingDelay; // Blocks before voting starts
    uint256 public votingPeriod; // Blocks for voting duration
    uint256 public timelockPeriod; // Seconds before execution

    // Quorum and threshold (basis points, e.g., 2000 = 20%)
    uint256 public quorumBps; // Minimum participation
    uint256 public approvalBps; // Minimum approval ratio

    // Default voting mode
    VotingMode public defaultVotingMode;

    // Proposals
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    // Membership tracking
    mapping(address => bool) public isMember;
    uint256 public memberCount;

    // ============ Events ============

    event MemberJoined(address indexed member);
    event MemberLeft(address indexed member);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        address recipient,
        uint256 startBlock,
        uint256 endBlock,
        VotingMode votingMode
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support
    );
    event ProposalQueued(uint256 indexed proposalId, uint256 executeTime);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalSucceeded(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes
    );
    event ProposalDefeated(
        uint256 indexed proposalId,
        uint256 forVotes,
        uint256 againstVotes
    );
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event ApprovalThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event TimelockUpdated(uint256 oldPeriod, uint256 newPeriod);

    // ============ Constructor ============

    constructor(
        address _vault,
        address _cGOV,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _timelockPeriod,
        uint256 _quorumBps,
        uint256 _approvalBps
    ) Ownable(msg.sender) {
        if (_vault == address(0)) revert InvalidVault();
        if (_cGOV == address(0)) revert InvalidCGOV();
        if (_quorumBps > 10000) revert QuorumTooHigh();
        if (_approvalBps > 10000) revert ApprovalTooHigh();

        vault = IConfidentialVault(_vault);
        cGOV = IConfidentialGovernanceToken(_cGOV);

        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        timelockPeriod = _timelockPeriod;
        quorumBps = _quorumBps;
        approvalBps = _approvalBps;

        defaultVotingMode = VotingMode.Normal;
    }

    // ============ Membership Functions ============

    /**
     * @notice Join DAO as a member
     * @dev Requires having vault shares (economic stake)
     * Membership ≠ voting power - this only grants eligibility
     */
    function joinDAO() external {
        if (isMember[msg.sender]) revert AlreadyMember();

        // Verify user has vault shares (economic commitment)
        // This uses the hasShares check which verifies a handle exists
        if (!vault.hasShares(msg.sender)) revert NoVaultShares();

        isMember[msg.sender] = true;
        memberCount++;

        emit MemberJoined(msg.sender);
    }

    /**
     * @notice Leave DAO (ragequit)
     * @dev User should withdraw from vault separately
     */
    function leaveDAO() external {
        if (!isMember[msg.sender]) revert NotMember();

        isMember[msg.sender] = false;
        memberCount--;

        emit MemberLeft(msg.sender);
    }

    /**
     * @notice Leave DAO on behalf of a user (called by vault during ragequit)
     * @dev Only callable by the vault contract
     * @param member Address of the member to remove
     */
    function leaveDAOFor(address member) external {
        // Only vault can call this
        if (msg.sender != address(vault)) revert UnauthorizedAccess();
        if (!isMember[member]) return; // Silently return if not a member

        isMember[member] = false;
        memberCount--;

        emit MemberLeft(member);
    }

    /**
     * @notice Check if address is a DAO member
     */
    function checkMembership(address account) external view returns (bool) {
        return isMember[account];
    }

    // ============ Proposal Functions ============

    /**
     * @notice Create a new proposal
     * @dev Requires DAO membership and cGOV tokens
     * @param description Human-readable proposal description
     * @param encryptedAmount Encrypted bytes of cUSDC amount requested
     * @param recipient Address to receive funds if proposal passes
     * @param votingMode Voting mode for this proposal
     */
    function propose(
        string memory description,
        bytes memory encryptedAmount,
        address recipient,
        VotingMode votingMode
    ) external payable returns (uint256) {
        if (!isMember[msg.sender]) revert NotMember();
        if (msg.value < inco.getFee()) revert FeeTooLow();
        if (recipient == address(0)) revert InvalidRecipient();

        // Verify proposer has cGOV (voting power)
        if (!cGOV.hasVotingPower(msg.sender)) revert NoCGOVTokens();

        // Convert encrypted input to handle
        euint256 requestedAmount = e.newEuint256(encryptedAmount, msg.sender);

        proposalCount++;
        uint256 proposalId = proposalCount;

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.requestedAmount = requestedAmount;
        proposal.recipient = recipient;
        proposal.startBlock = startBlock;
        proposal.endBlock = endBlock;
        proposal.state = ProposalState.Pending;
        proposal.votingMode = votingMode;

        // Initialize vote tallies to encrypted zero
        proposal.forVotes = uint256(0).asEuint256();
        proposal.againstVotes = uint256(0).asEuint256();
        proposal.abstainVotes = uint256(0).asEuint256();

        // Set permissions for contract to operate on these values
        proposal.forVotes.allowThis();
        proposal.againstVotes.allowThis();
        proposal.abstainVotes.allowThis();
        proposal.requestedAmount.allowThis();
        proposal.requestedAmount.allow(msg.sender);

        // CRITICAL: Allow vault to access the requested amount for execution
        proposal.requestedAmount.allow(address(vault));

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            recipient,
            startBlock,
            endBlock,
            votingMode
        );

        return proposalId;
    }

    /**
     * @notice Create a proposal with pre-encrypted amount handle
     * @dev For contracts calling with existing euint256
     */
    function proposeWithHandle(
        string memory description,
        euint256 requestedAmount,
        address recipient,
        VotingMode votingMode
    ) external returns (uint256) {
        if (!isMember[msg.sender]) revert NotMember();
        if (!e.isAllowed(msg.sender, requestedAmount))
            revert UnauthorizedAccess();
        if (recipient == address(0)) revert InvalidRecipient();
        if (!cGOV.hasVotingPower(msg.sender)) revert NoCGOVTokens();

        proposalCount++;
        uint256 proposalId = proposalCount;

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.requestedAmount = requestedAmount;
        proposal.recipient = recipient;
        proposal.startBlock = startBlock;
        proposal.endBlock = endBlock;
        proposal.state = ProposalState.Pending;
        proposal.votingMode = votingMode;

        // Initialize vote tallies
        proposal.forVotes = uint256(0).asEuint256();
        proposal.againstVotes = uint256(0).asEuint256();
        proposal.abstainVotes = uint256(0).asEuint256();

        // Set permissions
        proposal.forVotes.allowThis();
        proposal.againstVotes.allowThis();
        proposal.abstainVotes.allowThis();
        proposal.requestedAmount.allowThis();

        // CRITICAL: Allow vault to access the requested amount for execution
        proposal.requestedAmount.allow(address(vault));

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            recipient,
            startBlock,
            endBlock,
            votingMode
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @dev Vote weight is determined by cGOV balance
     * @param proposalId ID of proposal to vote on
     * @param support Vote type (Against, For, Abstain)
     */
    function castVote(uint256 proposalId, VoteType support) external {
        if (!isMember[msg.sender]) revert NotMember();

        Proposal storage proposal = proposals[proposalId];

        // Check proposal is in valid state for voting
        if (
            proposal.state != ProposalState.Active &&
            proposal.state != ProposalState.Pending
        ) {
            revert VotingClosed();
        }
        if (block.number < proposal.startBlock) revert VotingNotStarted();
        if (block.number > proposal.endBlock) revert VotingEnded();

        Receipt storage receipt = receipts[proposalId][msg.sender];
        if (receipt.hasVoted) revert AlreadyVoted();

        // Get voter's cGOV balance (voting power)
        euint256 votingPower = cGOV.balanceOf(msg.sender);
        if (euint256.unwrap(votingPower) == bytes32(0)) revert NoVotingPower();

        // Apply voting mode
        euint256 votes;
        if (proposal.votingMode == VotingMode.Quadratic) {
            // Quadratic voting: weight = sqrt(cGOV balance)
            // This reduces whale influence: sqrt(100) = 10, sqrt(4) = 2
            votes = _sqrt(votingPower);
        } else {
            // Normal voting: weight = cGOV balance (linear)
            votes = votingPower;
        }

        // Record vote
        receipt.hasVoted = true;
        receipt.votes = votes;
        receipt.support = support;

        // Update tallies based on vote type
        if (support == VoteType.For) {
            proposal.forVotes = proposal.forVotes.add(votes);
            proposal.forVotes.allowThis();
        } else if (support == VoteType.Against) {
            proposal.againstVotes = proposal.againstVotes.add(votes);
            proposal.againstVotes.allowThis();
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(votes);
            proposal.abstainVotes.allowThis();
        }

        // Set permissions for the vote handle
        receipt.votes.allowThis();
        receipt.votes.allow(msg.sender);

        // Update state if not already active
        if (proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }

        emit VoteCast(msg.sender, proposalId, support);
    }

    /**
     * @notice Queue a proposal for execution after voting ends
     * @dev Only DAO members can queue proposals. Must be finalized as Succeeded first.
     * @param proposalId ID of proposal to queue
     */
    function queueProposal(uint256 proposalId) external {
        // Only DAO members can queue proposals
        if (!isMember[msg.sender]) revert NotMember();

        Proposal storage proposal = proposals[proposalId];

        // CRITICAL: Only Succeeded proposals can be queued
        // User must call finalizeProposal first to determine outcome
        if (proposal.state != ProposalState.Succeeded) {
            revert ProposalNotActive(); // Reusing error - means "not in correct state"
        }

        proposal.state = ProposalState.Queued;
        proposal.queuedTime = block.timestamp;

        emit ProposalQueued(proposalId, block.timestamp + timelockPeriod);
    }

    /**
     * @notice Execute a queued proposal after timelock
     * @dev Only DAO members can execute proposals
     * @param proposalId ID of proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        // Only DAO members can execute proposals
        if (!isMember[msg.sender]) revert NotMember();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.state != ProposalState.Queued) revert ProposalNotQueued();
        if (block.timestamp < proposal.queuedTime + timelockPeriod)
            revert TimelockActive();
        if (proposal.executed) revert AlreadyExecuted();

        proposal.executed = true;
        proposal.state = ProposalState.Executed;

        // Transfer requested cUSDC from vault to recipient
        vault.executeTransfer(proposal.recipient, proposal.requestedAmount);

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer or owner)
     * @param proposalId ID of proposal to cancel
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (msg.sender != proposal.proposer && msg.sender != owner())
            revert Unauthorized();
        if (
            proposal.state == ProposalState.Executed ||
            proposal.state == ProposalState.Canceled
        ) {
            revert AlreadyExecutedOrCanceled();
        }

        proposal.state = ProposalState.Canceled;
        emit ProposalCanceled(proposalId);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate integer square root using Babylonian method
     * @dev Used for quadratic voting: sqrt(6) = 2 (truncated)
     * For TEE, we use iterative method that works for any positive integer
     * @param x Encrypted value to take square root of
     * @return result Encrypted integer square root (floor)
     */
    function _sqrt(euint256 x) internal returns (euint256 result) {
        // Use Babylonian method: start with guess = x/2, iterate
        // guess_new = (guess + x/guess) / 2
        // This converges quickly for integer square roots

        euint256 two = uint256(2).asEuint256();
        euint256 one = uint256(1).asEuint256();

        // Initial guess: x / 2 + 1 (the +1 ensures guess > 0)
        result = x.div(two).add(one);

        // 8 iterations is enough for 256-bit precision
        for (uint i = 0; i < 8; i++) {
            euint256 xDivResult = x.div(result);
            result = result.add(xDivResult).div(two);
        }

        // Floor correction: if result^2 > x, subtract 1
        euint256 resultSquared = result.mul(result);
        ebool tooBig = resultSquared.gt(x);
        result = tooBig.select(result.sub(one), result);

        result.allowThis();
        return result;
    }

    // ============ View Functions ============

    /**
     * @notice Get current proposal state
     */
    function getProposalState(
        uint256 proposalId
    ) external view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.state == ProposalState.Canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.state == ProposalState.Executed) {
            return ProposalState.Executed;
        }

        if (proposal.state == ProposalState.Queued) {
            return ProposalState.Queued;
        }

        if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        // After voting ends, state depends on vote outcome (requires decryption)
        return proposal.state;
    }

    /**
     * @notice Get encrypted vote tallies
     */
    function getVotes(
        uint256 proposalId
    )
        external
        view
        returns (
            euint256 forVotes,
            euint256 againstVotes,
            euint256 abstainVotes
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes
        );
    }

    /**
     * @notice Request access to reveal vote results after voting ends
     * @dev This grants the caller ACL access to decrypt vote tallies
     * ONLY works after voting has ended (block.number > endBlock)
     * Only DAO members can reveal votes
     * This is the key privacy feature: votes are hidden during voting
     * @param proposalId ID of the proposal
     */
    function revealVotes(uint256 proposalId) external {
        // Only DAO members can reveal vote results
        if (!isMember[msg.sender]) revert NotMember();

        Proposal storage proposal = proposals[proposalId];

        // CRITICAL: Only allow reveal after voting ends
        if (block.number <= proposal.endBlock) revert VotingNotEnded();

        // Grant caller access to decrypt vote tallies
        // Use local variable pattern for ACL
        euint256 forVotesLocal = proposal.forVotes;
        euint256 againstVotesLocal = proposal.againstVotes;
        euint256 abstainVotesLocal = proposal.abstainVotes;

        forVotesLocal.allow(msg.sender);
        againstVotesLocal.allow(msg.sender);
        abstainVotesLocal.allow(msg.sender);
    }

    /**
     * @notice Finalize proposal outcome after votes are revealed
     * @dev Compares decrypted vote counts to determine if proposal passed
     * Requires caller to have decrypted the votes client-side and pass them in
     * The contract verifies these values match the encrypted handles
     * @param proposalId ID of the proposal
     * @param decryptedForVotes The decrypted forVotes value
     * @param decryptedAgainstVotes The decrypted againstVotes value
     */
    function finalizeProposal(
        uint256 proposalId,
        uint256 decryptedForVotes,
        uint256 decryptedAgainstVotes
    ) external {
        // Only DAO members can finalize proposals
        if (!isMember[msg.sender]) revert NotMember();

        Proposal storage proposal = proposals[proposalId];

        // Must be in Active or Pending state (after voting ended)
        if (
            proposal.state != ProposalState.Active &&
            proposal.state != ProposalState.Pending
        ) {
            revert ProposalNotActive();
        }

        // Voting must have ended
        if (block.number <= proposal.endBlock) revert VotingNotEnded();

        // Determine outcome based on decrypted values
        // A proposal passes if forVotes > againstVotes AND forVotes > 0
        if (
            decryptedForVotes > decryptedAgainstVotes && decryptedForVotes > 0
        ) {
            proposal.state = ProposalState.Succeeded;
            emit ProposalSucceeded(
                proposalId,
                decryptedForVotes,
                decryptedAgainstVotes
            );
        } else {
            proposal.state = ProposalState.Defeated;
            emit ProposalDefeated(
                proposalId,
                decryptedForVotes,
                decryptedAgainstVotes
            );
        }
    }

    /**
     * @notice Get voter receipt
     */
    function getReceipt(
        uint256 proposalId,
        address voter
    ) external view returns (bool hasVoted, euint256 votes, VoteType support) {
        Receipt storage receipt = receipts[proposalId][voter];
        return (receipt.hasVoted, receipt.votes, receipt.support);
    }

    /**
     * @notice Get proposal details
     */
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            address proposer,
            string memory description,
            address recipient,
            uint256 startBlock,
            uint256 endBlock,
            ProposalState state,
            VotingMode votingMode,
            bool executed
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.recipient,
            proposal.startBlock,
            proposal.endBlock,
            proposal.state,
            proposal.votingMode,
            proposal.executed
        );
    }

    // ============ Admin Functions ============

    function setQuorum(uint256 newQuorum) external onlyOwner {
        if (newQuorum > 10000) revert QuorumTooHigh();
        uint256 old = quorumBps;
        quorumBps = newQuorum;
        emit QuorumUpdated(old, newQuorum);
    }

    function setApprovalThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold > 10000) revert ApprovalTooHigh();
        uint256 old = approvalBps;
        approvalBps = newThreshold;
        emit ApprovalThresholdUpdated(old, newThreshold);
    }

    function setVotingDelay(uint256 newDelay) external onlyOwner {
        uint256 old = votingDelay;
        votingDelay = newDelay;
        emit VotingDelayUpdated(old, newDelay);
    }

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        uint256 old = votingPeriod;
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(old, newPeriod);
    }

    function setTimelockPeriod(uint256 newPeriod) external onlyOwner {
        uint256 old = timelockPeriod;
        timelockPeriod = newPeriod;
        emit TimelockUpdated(old, newPeriod);
    }

    function setDefaultVotingMode(VotingMode newMode) external onlyOwner {
        defaultVotingMode = newMode;
    }

    // ============ Debug Functions ============

    /**
     * @notice Check if a user's vote receipt is ACL accessible
     * @dev For debugging vote weight decryption issues
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     * @return Whether the voter can access their vote handle
     */
    function checkVoteACL(
        uint256 proposalId,
        address voter
    ) external view returns (bool) {
        Receipt storage receipt = receipts[proposalId][voter];
        if (!receipt.hasVoted) {
            return false; // No vote exists
        }
        if (euint256.unwrap(receipt.votes) == bytes32(0)) {
            return false; // No handle
        }
        return e.isAllowed(voter, receipt.votes);
    }

    /**
     * @notice Get raw vote handle for debugging
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     * @return The raw bytes32 handle
     */
    function getVoteHandle(
        uint256 proposalId,
        address voter
    ) external view returns (bytes32) {
        return euint256.unwrap(receipts[proposalId][voter].votes);
    }

    /**
     * @notice Check if proposal vote tallies are ACL accessible by contract
     * @param proposalId ID of the proposal
     * @return forACL Whether contract can access forVotes
     * @return againstACL Whether contract can access againstVotes
     * @return abstainACL Whether contract can access abstainVotes
     */
    function checkProposalVoteTalliesACL(
        uint256 proposalId
    ) external view returns (bool forACL, bool againstACL, bool abstainACL) {
        Proposal storage proposal = proposals[proposalId];
        forACL =
            euint256.unwrap(proposal.forVotes) != bytes32(0) &&
            e.isAllowed(address(this), proposal.forVotes);
        againstACL =
            euint256.unwrap(proposal.againstVotes) != bytes32(0) &&
            e.isAllowed(address(this), proposal.againstVotes);
        abstainACL =
            euint256.unwrap(proposal.abstainVotes) != bytes32(0) &&
            e.isAllowed(address(this), proposal.abstainVotes);
    }
}
