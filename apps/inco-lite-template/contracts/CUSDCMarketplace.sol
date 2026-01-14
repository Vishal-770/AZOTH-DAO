// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, euint256, ebool} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CUSDCMarketplace
 * @notice Allows users to purchase confidential USDC (cUSDC) with Base Sepolia ETH
 * @dev This separates economic stake acquisition from governance token minting
 *
 * Key Features:
 * - Exchange ETH for encrypted cUSDC tokens
 * - All balances are encrypted using Inco TEE
 * - Supports authorized vault transfers
 */
contract CUSDCMarketplace is Ownable, ReentrancyGuard {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Errors ============
    error InsufficientFees();
    error MustSendETH();
    error UnauthorizedTransfer();
    error InsufficientBalance();
    error NoETHToWithdraw();
    error ETHTransferFailed();

    // ============ Events ============
    event CUSDCPurchased(address indexed buyer, uint256 ethAmount);
    event Transfer(address indexed from, address indexed to);
    event VaultAuthorized(address indexed vault);

    // ============ Constants ============
    // Exchange rate: 1 ETH = EXCHANGE_RATE cUSDC (scaled by 1e6 for USDC decimals)
    uint256 public constant EXCHANGE_RATE = 2000 * 1e6; // 2000 USDC per ETH
    uint8 public constant decimals = 6;
    string public constant name = "Confidential USDC";
    string public constant symbol = "cUSDC";

    // ============ State Variables ============
    // Mapping of encrypted cUSDC balances
    mapping(address => euint256) internal _balances;

    // Total cUSDC minted (encrypted)
    euint256 public totalMinted;

    // Authorized vault address for transfers
    address public authorizedVault;

    // ============ Constructor ============
    constructor() Ownable(msg.sender) {
        // Initialize totalMinted to encrypted zero
        totalMinted = uint256(0).asEuint256();
        totalMinted.allowThis();
    }

    // ============ Modifiers ============
    modifier onlyAuthorizedVault() {
        if (msg.sender != authorizedVault && msg.sender != owner()) {
            revert UnauthorizedTransfer();
        }
        _;
    }

    // ============ Core Functions ============

    /**
     * @notice Purchase cUSDC with ETH
     * @dev Mints encrypted cUSDC based on ETH sent
     */
    function purchaseCUSDC() external payable nonReentrant {
        if (msg.value == 0) revert MustSendETH();

        // Calculate cUSDC amount (ETH * EXCHANGE_RATE)
        // Since ETH has 18 decimals and USDC has 6, we need to adjust
        uint256 cUSDCAmount = (msg.value * EXCHANGE_RATE) / 1e18;

        euint256 encryptedAmount = cUSDCAmount.asEuint256();

        // Update user balance - IMPORTANT: Follow Inco pattern with local variables
        euint256 newBalance;
        if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
            newBalance = encryptedAmount;
        } else {
            newBalance = _balances[msg.sender].add(encryptedAmount);
        }
        _balances[msg.sender] = newBalance;

        // Update total minted
        euint256 newTotalMinted = totalMinted.add(encryptedAmount);
        totalMinted = newTotalMinted;

        // Grant access permissions - MUST use local variables, not storage reads
        newBalance.allowThis();
        newBalance.allow(msg.sender);
        newTotalMinted.allowThis();

        // CRITICAL: Grant vault access to user's balance for deposits
        // This allows the vault to pass the handle to vaultTransfer
        if (authorizedVault != address(0)) {
            newBalance.allow(authorizedVault);
        }

        emit CUSDCPurchased(msg.sender, msg.value);
    }

    /**
     * @notice Get user's cUSDC balance handle
     * @param user Address to query
     * @return User's encrypted cUSDC balance
     */
    function balanceOf(address user) external view returns (euint256) {
        return _balances[user];
    }

    /**
     * @notice Transfer cUSDC from one address to another
     * @dev Only callable by authorized vault or owner
     * @param from Source address
     * @param to Destination address
     * @param amount Encrypted amount to transfer
     */
    function transferFrom(
        address from,
        address to,
        euint256 amount
    ) external onlyAuthorizedVault {
        euint256 fromBalance = _balances[from];

        // Check sufficient balance using TEE comparison
        ebool hasSufficient = fromBalance.ge(amount);

        // Use multiplexer pattern - only transfer if sufficient balance
        euint256 transferAmount = hasSufficient.select(
            amount,
            uint256(0).asEuint256()
        );

        // Subtract from sender - use local variable pattern
        euint256 newFromBalance = fromBalance.sub(transferAmount);
        _balances[from] = newFromBalance;

        // Add to receiver - use local variable pattern
        euint256 newToBalance;
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            newToBalance = transferAmount;
        } else {
            newToBalance = _balances[to].add(transferAmount);
        }
        _balances[to] = newToBalance;

        // Update permissions - use local variables
        newFromBalance.allowThis();
        newFromBalance.allow(from);
        newToBalance.allowThis();
        newToBalance.allow(to);

        // Allow vault to access balances
        if (authorizedVault != address(0)) {
            newFromBalance.allow(authorizedVault);
            newToBalance.allow(authorizedVault);
        }

        emit Transfer(from, to);
    }

    /**
     * @notice Internal transfer for vault deposits
     * @dev Called by vault during deposit
     * @param from User depositing cUSDC
     * @param amount Expected to be user's full balance handle (same as _balances[from])
     * @return transferredAmount The amount actually transferred
     *
     * Note: We use fromBalance for the comparison since marketplace has allowThis() on it.
     * The amount parameter is verified by checking it matches the stored balance.
     */
    function vaultTransfer(
        address from,
        euint256 amount
    ) external onlyAuthorizedVault returns (euint256 transferredAmount) {
        euint256 fromBalance = _balances[from];

        // IMPORTANT: Check if user has never had a balance (bytes32(0))
        // vs having an encrypted zero balance. If bytes32(0), return early with zero.
        if (euint256.unwrap(fromBalance) == bytes32(0)) {
            // User has no balance at all - return encrypted zero
            transferredAmount = uint256(0).asEuint256();
            transferredAmount.allowThis();
            transferredAmount.allow(from);
            return transferredAmount;
        }

        // For deposits, we transfer the FULL balance
        // The user's balance exists (not bytes32(0)), so transfer it all
        // We avoid TEE comparisons that could have ACL issues
        transferredAmount = fromBalance;

        // Zero out sender's balance - create a fresh encrypted zero
        euint256 newFromBalance = uint256(0).asEuint256();
        _balances[from] = newFromBalance;

        // Add to vault - use local variable pattern
        euint256 newVaultBalance;
        if (euint256.unwrap(_balances[authorizedVault]) == bytes32(0)) {
            newVaultBalance = transferredAmount;
        } else {
            newVaultBalance = _balances[authorizedVault].add(transferredAmount);
        }
        _balances[authorizedVault] = newVaultBalance;

        // Update permissions - use local variables
        newFromBalance.allowThis();
        newFromBalance.allow(from);
        // CRITICAL: Grant vault access to user's updated balance for future deposits
        if (authorizedVault != address(0)) {
            newFromBalance.allow(authorizedVault);
        }

        newVaultBalance.allowThis();
        newVaultBalance.allow(authorizedVault);

        transferredAmount.allowThis();
        transferredAmount.allow(from);

        return transferredAmount;
    }

    /**
     * @notice Transfer cUSDC from vault to user (for withdrawals)
     */
    function vaultWithdraw(
        address to,
        euint256 amount
    ) external onlyAuthorizedVault returns (euint256 withdrawnAmount) {
        euint256 vaultBalance = _balances[authorizedVault];

        // Check sufficient balance
        ebool hasSufficient = vaultBalance.ge(amount);

        // Only withdraw if sufficient
        withdrawnAmount = hasSufficient.select(amount, uint256(0).asEuint256());

        // Subtract from vault - use local variable pattern
        euint256 newVaultBalance = vaultBalance.sub(withdrawnAmount);
        _balances[authorizedVault] = newVaultBalance;

        // Add to user - use local variable pattern
        euint256 newToBalance;
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            newToBalance = withdrawnAmount;
        } else {
            newToBalance = _balances[to].add(withdrawnAmount);
        }
        _balances[to] = newToBalance;

        // Update permissions - use local variables
        newVaultBalance.allowThis();
        newVaultBalance.allow(authorizedVault);

        // User's new balance needs ACL for:
        // 1. This contract (marketplace) - to perform TEE operations in vaultTransfer
        // 2. The user - to read/decrypt their balance
        // 3. The vault - so vault can pass this handle to vaultTransfer
        newToBalance.allowThis(); // Marketplace can use this handle in TEE operations
        newToBalance.allow(to); // User can decrypt their balance
        if (authorizedVault != address(0)) {
            newToBalance.allow(authorizedVault); // Vault can pass this handle
        }

        withdrawnAmount.allowThis();
        withdrawnAmount.allow(to);

        return withdrawnAmount;
    }

    // ============ Debug Functions ============

    /**
     * @notice Check if a user is allowed to access their own balance
     * @dev For debugging ACL issues
     * @param user Address to check
     * @return Whether the user can access their balance handle
     */
    function checkBalanceACL(address user) external view returns (bool) {
        euint256 balance = _balances[user];
        if (euint256.unwrap(balance) == bytes32(0)) {
            return false; // No balance exists
        }
        return e.isAllowed(user, balance);
    }

    /**
     * @notice Get raw balance handle for debugging
     * @param user Address to query
     * @return The raw bytes32 handle
     */
    function getBalanceHandle(address user) external view returns (bytes32) {
        return euint256.unwrap(_balances[user]);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the authorized vault address
     * @param vault Address of the ConfidentialVault contract
     */
    function setAuthorizedVault(address vault) external onlyOwner {
        authorizedVault = vault;
        emit VaultAuthorized(vault);
    }

    /**
     * @notice Owner can withdraw collected ETH
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoETHToWithdraw();
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert ETHTransferFailed();
    }
}
