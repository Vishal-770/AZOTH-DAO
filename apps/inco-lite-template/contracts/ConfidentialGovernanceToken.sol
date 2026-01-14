// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for DAO membership check
interface IAzothDAO {
    function isMember(address account) external view returns (bool);
}

/**
 * @title ConfidentialGovernanceToken (cGOV)
 * @notice Non-transferable confidential governance token for voting power
 * @dev cGOV is separate from economic stake (cUSDC vault shares)
 *
 * Key Design Principles (from Azoth DAO architecture):
 * - Non-transferable (soulbound to address) - prevents vote buying
 * - Minted via ETH payment (anti-spam mechanism)
 * - REQUIRES DAO membership (must have vault shares first)
 * - Can be burned on voluntary exit
 * - Voting power only, no economic claim
 * - Balances are encrypted using Inco TEE
 *
 * This creates a dual-layer protection:
 * 1. ETH payment for cUSDC (economic stake)
 * 2. ETH payment for cGOV (governance power)
 */
contract ConfidentialGovernanceToken is Ownable, ReentrancyGuard {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Errors ============
    error PriceMustBePositive();
    error InsufficientETH();
    error AmountTooSmall();
    error UnauthorizedAccess();
    error NoETHToWithdraw();
    error ETHTransferFailed();
    error NonTransferable();
    error NotDAOMember();
    error DAONotSet();

    // ============ Events ============
    event TokensMinted(address indexed to, uint256 ethPaid);
    event TokensBurned(address indexed from);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event DAOAuthorized(address indexed dao);
    event VaultAuthorized(address indexed vault);

    // ============ Constants ============
    string public constant name = "Azoth Governance Token";
    string public constant symbol = "cGOV";
    uint8 public constant decimals = 18;

    // ============ State Variables ============

    // Cost to mint 1 cGOV token (in wei)
    // This creates economic commitment and prevents Sybil attacks
    uint256 public mintPrice;

    // Encrypted balances
    mapping(address => euint256) private _balances;

    // Total supply (encrypted)
    euint256 private _totalSupply;

    // Track if address has ever held cGOV (for membership checks)
    mapping(address => bool) public hasHeldToken;

    // Authorized DAO contract for balance access
    address public authorizedDAO;

    // Authorized Vault contract for burning on ragequit
    address public authorizedVault;

    // ============ Constructor ============

    constructor(uint256 _initialMintPrice) Ownable(msg.sender) {
        if (_initialMintPrice == 0) revert PriceMustBePositive();
        mintPrice = _initialMintPrice;

        // Initialize totalSupply to encrypted zero
        _totalSupply = uint256(0).asEuint256();
        _totalSupply.allowThis();
    }

    // ============ Core Functions ============

    /**
     * @notice Mint cGOV tokens by paying ETH
     * @dev Amount minted = msg.value / mintPrice
     * REQUIRES: User must be a DAO member (have vault shares and joined)
     *
     * Example: If mintPrice = 0.001 ETH, sending 0.01 ETH mints 10 cGOV
     */
    function mint() external payable nonReentrant {
        // CRITICAL: Must be a DAO member to mint governance tokens
        if (authorizedDAO == address(0)) revert DAONotSet();
        if (!IAzothDAO(authorizedDAO).isMember(msg.sender))
            revert NotDAOMember();

        if (msg.value < mintPrice) revert InsufficientETH();

        // Calculate tokens to mint based on ETH sent
        uint256 tokenAmount = (msg.value * 1e18) / mintPrice;
        if (tokenAmount == 0) revert AmountTooSmall();

        euint256 encryptedAmount = tokenAmount.asEuint256();

        // Update user balance - use local variable pattern
        euint256 newBalance;
        if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
            newBalance = encryptedAmount;
        } else {
            newBalance = _balances[msg.sender].add(encryptedAmount);
        }
        _balances[msg.sender] = newBalance;

        // Update total supply - use local variable pattern
        euint256 newTotalSupply = _totalSupply.add(encryptedAmount);
        _totalSupply = newTotalSupply;

        // Mark that this address has held cGOV
        hasHeldToken[msg.sender] = true;

        // Set permissions - use local variables
        newBalance.allowThis();
        newBalance.allow(msg.sender);
        newTotalSupply.allowThis();

        // Allow DAO to access balance for voting
        if (authorizedDAO != address(0)) {
            newBalance.allow(authorizedDAO);
        }

        emit TokensMinted(msg.sender, msg.value);
    }

    /**
     * @notice Burn cGOV tokens (voluntary exit from governance)
     * @dev Uses multiplexer pattern to handle insufficient balance gracefully
     * @param amount Encrypted amount to burn
     */
    function burn(euint256 amount) external nonReentrant {
        if (!e.isAllowed(msg.sender, amount)) revert UnauthorizedAccess();

        euint256 userBalance = _balances[msg.sender];
        ebool hasSufficient = userBalance.ge(amount);

        // Only burn if user has sufficient balance (multiplexer pattern)
        euint256 burnAmount = hasSufficient.select(
            amount,
            uint256(0).asEuint256()
        );

        // Update balances - use local variable pattern
        euint256 newBalance = userBalance.sub(burnAmount);
        euint256 newTotalSupply = _totalSupply.sub(burnAmount);
        _balances[msg.sender] = newBalance;
        _totalSupply = newTotalSupply;

        // Set permissions - use local variables
        newBalance.allowThis();
        newBalance.allow(msg.sender);
        newTotalSupply.allowThis();

        emit TokensBurned(msg.sender);
    }

    /**
     * @notice Burn all cGOV tokens for a user (ragequit helper)
     * @dev Burns entire balance
     */
    function burnAll() external nonReentrant {
        euint256 userBalance = _balances[msg.sender];

        // Update balances - use local variable pattern
        euint256 newBalance = uint256(0).asEuint256();
        euint256 newTotalSupply = _totalSupply.sub(userBalance);
        _balances[msg.sender] = newBalance;
        _totalSupply = newTotalSupply;

        // Set permissions - use local variables
        newBalance.allowThis();
        newBalance.allow(msg.sender);
        newTotalSupply.allowThis();

        emit TokensBurned(msg.sender);
    }

    /**
     * @notice Burn all cGOV tokens for a user (called by vault on ragequit)
     * @dev Only callable by authorized vault
     * @param user Address to burn tokens for
     */
    function burnAllFor(address user) external nonReentrant {
        // Only vault can call this (for ragequit)
        // Note: We need to add vault authorization
        if (msg.sender != authorizedVault) revert UnauthorizedAccess();

        euint256 userBalance = _balances[user];

        // Skip if no balance
        if (euint256.unwrap(userBalance) == bytes32(0)) return;

        // Update balances - use local variable pattern
        euint256 newBalance = uint256(0).asEuint256();
        euint256 newTotalSupply = _totalSupply.sub(userBalance);
        _balances[user] = newBalance;
        _totalSupply = newTotalSupply;

        // Set permissions - use local variables
        newBalance.allowThis();
        newBalance.allow(user);
        newTotalSupply.allowThis();

        emit TokensBurned(user);
    }

    // ============ View Functions ============

    /**
     * @notice Get encrypted balance of an address
     * @param account Address to query
     * @return Encrypted cGOV balance
     */
    function balanceOf(address account) external view returns (euint256) {
        return _balances[account];
    }

    /**
     * @notice Get total supply (encrypted)
     * @return Encrypted total supply
     */
    function totalSupply() external view returns (euint256) {
        return _totalSupply;
    }

    /**
     * @notice Check if address has voting power handle (for DAO membership)
     * @dev Note: This only checks if a handle exists, not if balance > 0
     * @param account Address to check
     * @return True if user has ever minted cGOV
     */
    function hasVotingPower(address account) external view returns (bool) {
        return euint256.unwrap(_balances[account]) != bytes32(0);
    }

    /**
     * @notice Get balance handle for voting calculations
     * @dev Used by DAO contract for vote weight
     */
    function getVotingPower(address account) external view returns (euint256) {
        return _balances[account];
    }

    // ============ Admin Functions ============

    /**
     * @notice Update mint price (governance can adjust anti-spam cost)
     * @param newPrice New price in wei per 1e18 tokens
     */
    function updateMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert PriceMustBePositive();
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Set the authorized DAO contract
     * @param dao Address of the AzothDAO contract
     */
    function setAuthorizedDAO(address dao) external onlyOwner {
        authorizedDAO = dao;
        emit DAOAuthorized(dao);
    }

    /**
     * @notice Set the authorized vault contract
     * @param vault Address of the ConfidentialVault contract
     */
    function setAuthorizedVault(address vault) external onlyOwner {
        authorizedVault = vault;
        emit VaultAuthorized(vault);
    }

    /**
     * @notice Withdraw collected ETH
     * @dev ETH from minting goes to treasury/owner
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoETHToWithdraw();
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert ETHTransferFailed();
    }

    // ============ Debug Functions ============

    /**
     * @notice Check if a user is allowed to access their own cGOV balance
     * @dev For debugging ACL issues
     * @param user Address to check
     * @return Whether the user can access their balance handle
     */
    function checkBalanceACL(address user) external view returns (bool) {
        euint256 userBalance = _balances[user];
        if (euint256.unwrap(userBalance) == bytes32(0)) {
            return false; // No balance exists
        }
        return e.isAllowed(user, userBalance);
    }

    /**
     * @notice Get raw balance handle for debugging
     * @param user Address to query
     * @return The raw bytes32 handle
     */
    function getBalanceHandle(address user) external view returns (bytes32) {
        return euint256.unwrap(_balances[user]);
    }

    // ============ Transfer Prevention ============

    /**
     * @notice Transfer is disabled - cGOV is non-transferable (soulbound)
     * @dev This is intentional to prevent vote buying/selling
     */
    function transfer(address, euint256) external pure returns (bool) {
        revert NonTransferable();
    }

    /**
     * @notice TransferFrom is disabled - cGOV is non-transferable (soulbound)
     * @dev This is intentional to prevent vote buying/selling
     */
    function transferFrom(
        address,
        address,
        euint256
    ) external pure returns (bool) {
        revert NonTransferable();
    }
}
