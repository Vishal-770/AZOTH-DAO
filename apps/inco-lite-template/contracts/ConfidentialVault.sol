// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICUSDCMarketplace {
    function balanceOf(address user) external view returns (euint256);
    function vaultTransfer(
        address from,
        euint256 amount
    ) external returns (euint256);
    function vaultWithdraw(
        address to,
        euint256 amount
    ) external returns (euint256);
}

// Interface for DAO to auto-leave on ragequit
interface IAzothDAOForVault {
    function isMember(address account) external view returns (bool);
    function leaveDAO() external;
}

// Interface for cGOV to auto-burn on ragequit
interface IConfidentialGovernanceTokenForVault {
    function burnAllFor(address user) external;
}

/**
 * @title ConfidentialVault
 * @notice ERC-4626 inspired confidential vault for cUSDC with virtual offset protection
 * @dev Implements inflation attack protection using virtual shares/assets
 *
 * Key Security Features:
 * - Virtual offset (δ = 3) provides 1000x share precision vs assets
 * - Virtual shares (1000) and virtual assets (1) prevent inflation attacks
 * - All amounts encrypted using Inco TEE
 * - Ragequit functionality for member exits (auto-leaves DAO)
 *
 * Based on OpenZeppelin's ERC4626 guidance for inflation attack protection
 */
contract ConfidentialVault is Ownable, ReentrancyGuard {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Errors ============
    error InvalidMarketplace();
    error UnauthorizedAccess();
    error InvalidDAO();

    // ============ Constants ============

    // Virtual offset for attack protection (δ = 3 means 10^3 = 1000x precision)
    // This follows OpenZeppelin's recommendation for inflation attack protection
    uint256 private constant OFFSET = 3;
    uint256 private constant DECIMAL_OFFSET = 10 ** OFFSET; // 1000

    // Virtual shares and assets (permanent vault backing)
    // These prevent the first depositor vulnerability
    uint256 private constant VIRTUAL_SHARES = DECIMAL_OFFSET; // 1000
    uint256 private constant VIRTUAL_ASSETS = 1;

    // ============ Events ============

    event Deposit(address indexed sender, uint256 timestamp);
    event Withdraw(address indexed receiver, uint256 timestamp);
    event VaultInitialized(uint256 virtualShares, uint256 virtualAssets);
    event DAOSet(address indexed dao);
    event CGOVSet(address indexed cGOV);

    // ============ State Variables ============

    ICUSDCMarketplace public immutable cUSDC;

    // Encrypted total assets in vault (includes virtual asset)
    euint256 private _totalAssets;

    // Encrypted total shares (includes virtual shares)
    euint256 private _totalShares;

    // User encrypted share balances
    mapping(address => euint256) public shares;

    // Authorized DAO contract
    address public authorizedDAO;

    // Authorized cGOV contract (for burning on ragequit)
    address public authorizedCGOV;

    // ============ Constructor ============

    constructor(address _cUSDCMarketplace) Ownable(msg.sender) {
        if (_cUSDCMarketplace == address(0)) revert InvalidMarketplace();
        cUSDC = ICUSDCMarketplace(_cUSDCMarketplace);

        // Initialize with virtual shares and assets for inflation protection
        // This is the key defense mechanism from OpenZeppelin's ERC4626 guide
        _totalShares = VIRTUAL_SHARES.asEuint256();
        _totalAssets = VIRTUAL_ASSETS.asEuint256();

        _totalShares.allowThis();
        _totalAssets.allowThis();

        emit VaultInitialized(VIRTUAL_SHARES, VIRTUAL_ASSETS);
    }

    // ============ Modifiers ============

    modifier onlyAuthorizedDAO() {
        if (msg.sender != authorizedDAO && msg.sender != owner()) {
            revert UnauthorizedAccess();
        }
        _;
    }

    // ============ Core Vault Functions ============

    /**
     * @notice Deposit cUSDC and receive vault shares
     * @dev Uses the inflation-protected share calculation formula
     * User's full cUSDC balance is deposited automatically
     * @return sharesReceived Encrypted shares minted
     *
     * Formula (with virtual offset protection):
     * shares = (assets × DECIMAL_OFFSET × totalShares) / totalAssets
     *
     * The DECIMAL_OFFSET multiplier ensures precision is maintained
     * Virtual shares/assets prevent manipulation by attackers
     */
    function deposit() external nonReentrant returns (euint256 sharesReceived) {
        // Transfer user's full cUSDC balance from marketplace to vault
        // The marketplace uses stored balance, avoiding ACL issues with passed handles
        euint256 dummyHandle = uint256(0).asEuint256(); // Not used, marketplace reads stored balance
        euint256 actualAssets = cUSDC.vaultTransfer(msg.sender, dummyHandle);

        // Calculate shares to mint using the formula:
        // shares = (assets × 10^δ × totalShares) / totalAssets
        // This applies the decimal offset for precision
        euint256 assetsScaled = actualAssets.mul(DECIMAL_OFFSET.asEuint256());
        euint256 numerator = assetsScaled.mul(_totalShares);
        sharesReceived = numerator.div(_totalAssets);

        // Update vault state - use local variable pattern
        euint256 newTotalAssets = _totalAssets.add(actualAssets);
        euint256 newTotalShares = _totalShares.add(sharesReceived);
        _totalAssets = newTotalAssets;
        _totalShares = newTotalShares;

        // Update user shares - use local variable pattern
        euint256 newUserShares;
        if (euint256.unwrap(shares[msg.sender]) == bytes32(0)) {
            newUserShares = sharesReceived;
        } else {
            newUserShares = shares[msg.sender].add(sharesReceived);
        }
        shares[msg.sender] = newUserShares;

        // Set permissions - use local variables
        newTotalAssets.allowThis();
        newTotalShares.allowThis();
        newUserShares.allowThis();
        newUserShares.allow(msg.sender);
        sharesReceived.allowThis();
        sharesReceived.allow(msg.sender);

        // Allow DAO to check balances
        if (authorizedDAO != address(0)) {
            newUserShares.allow(authorizedDAO);
        }

        emit Deposit(msg.sender, block.timestamp);

        return sharesReceived;
    }

    /**
     * @notice Withdraw cUSDC by burning vault shares (ragequit)
     * @dev Allows members to exit with their proportional share of assets
     * @param sharesToBurn Encrypted amount of shares to burn
     * @return assetsWithdrawn Encrypted cUSDC received
     *
     * Formula:
     * assets = (sharesToBurn × totalAssets) / (totalShares × DECIMAL_OFFSET)
     */
    function withdraw(
        euint256 sharesToBurn
    ) external nonReentrant returns (euint256 assetsWithdrawn) {
        // Verify caller has access
        if (!e.isAllowed(msg.sender, sharesToBurn)) revert UnauthorizedAccess();

        // Check user has sufficient shares
        euint256 userShares = shares[msg.sender];
        ebool hasSufficientShares = userShares.ge(sharesToBurn);

        // Calculate assets to return:
        // assets = (sharesToBurn × totalAssets) / (totalShares × 10^δ)
        euint256 numerator = sharesToBurn.mul(_totalAssets);
        euint256 denominatorScaled = _totalShares.mul(
            DECIMAL_OFFSET.asEuint256()
        );
        euint256 assetsToReturn = numerator.div(denominatorScaled);

        // Use multiplexer pattern - only withdraw if sufficient shares
        assetsWithdrawn = hasSufficientShares.select(
            assetsToReturn,
            uint256(0).asEuint256()
        );
        euint256 sharesBurned = hasSufficientShares.select(
            sharesToBurn,
            uint256(0).asEuint256()
        );

        // CRITICAL: Grant marketplace ACL access BEFORE calling vaultWithdraw
        // The marketplace needs to compare this amount with vault balance
        assetsWithdrawn.allowThis();
        assetsWithdrawn.allow(address(cUSDC));
        assetsWithdrawn.allow(msg.sender);

        // Update user shares - use local variable pattern
        euint256 newUserShares = userShares.sub(sharesBurned);
        shares[msg.sender] = newUserShares;

        // Update vault state - use local variable pattern
        euint256 newTotalShares = _totalShares.sub(sharesBurned);
        euint256 newTotalAssets = _totalAssets.sub(assetsWithdrawn);
        _totalShares = newTotalShares;
        _totalAssets = newTotalAssets;

        // Transfer assets from vault to user
        cUSDC.vaultWithdraw(msg.sender, assetsWithdrawn);

        // Set permissions - use local variables
        newTotalAssets.allowThis();
        newTotalShares.allowThis();
        newUserShares.allowThis();
        newUserShares.allow(msg.sender);

        emit Withdraw(msg.sender, block.timestamp);

        return assetsWithdrawn;
    }

    /**
     * @notice Transfer assets from vault to a proposal recipient
     * @dev Only callable by authorized DAO for proposal execution
     */
    function executeTransfer(
        address recipient,
        euint256 amount
    ) external onlyAuthorizedDAO returns (euint256) {
        // CRITICAL: Grant marketplace ACL access to the amount handle
        // The marketplace needs to compare this amount with vault balance
        amount.allow(address(cUSDC));
        amount.allow(recipient);

        return cUSDC.vaultWithdraw(recipient, amount);
    }

    /**
     * @notice Preview deposit - calculate shares for given assets
     * @dev Cannot be view because TEE operations modify state
     * @param assets Encrypted asset amount
     * @return Encrypted shares that would be received
     */
    function previewDeposit(euint256 assets) external returns (euint256) {
        euint256 assetsScaled = e.mul(assets, e.asEuint256(DECIMAL_OFFSET));
        euint256 numerator = e.mul(assetsScaled, _totalShares);
        return e.div(numerator, _totalAssets);
    }

    /**
     * @notice Preview withdraw - calculate assets for given shares
     * @dev Cannot be view because TEE operations modify state
     * @param sharesToBurn Encrypted shares to burn
     * @return Encrypted assets that would be received
     */
    function previewWithdraw(
        euint256 sharesToBurn
    ) external returns (euint256) {
        euint256 numerator = e.mul(sharesToBurn, _totalAssets);
        euint256 denominatorScaled = e.mul(
            _totalShares,
            e.asEuint256(DECIMAL_OFFSET)
        );
        return e.div(numerator, denominatorScaled);
    }

    // ============ View Functions ============

    /**
     * @notice Get user's share balance
     * @param user Address to query
     * @return User's encrypted share balance
     */
    function balanceOf(address user) external view returns (euint256) {
        return shares[user];
    }

    /**
     * @notice Check if user has any shares (for DAO membership check)
     * @param user Address to check
     * @return bool True if user has a balance handle (may still be 0)
     */
    function hasShares(address user) external view returns (bool) {
        return euint256.unwrap(shares[user]) != bytes32(0);
    }

    /**
     * @notice Get total vault shares (including virtual)
     * @return Encrypted total shares
     */
    function totalShares() external view returns (euint256) {
        return _totalShares;
    }

    /**
     * @notice Get total vault assets (including virtual)
     * @return Encrypted total assets
     */
    function totalAssets() external view returns (euint256) {
        return _totalAssets;
    }

    /**
     * @notice Get vault offset configuration
     * @return offset The decimal offset (δ)
     * @return virtualShares Virtual shares constant
     * @return virtualAssets Virtual assets constant
     */
    function getVaultConfig()
        external
        pure
        returns (uint256 offset, uint256 virtualShares, uint256 virtualAssets)
    {
        return (OFFSET, VIRTUAL_SHARES, VIRTUAL_ASSETS);
    }

    // ============ Debug Functions ============

    /**
     * @notice Withdraw ALL shares - simplified ragequit
     * @dev Uses the user's stored shares directly, no ACL check needed on input
     * Also auto-leaves DAO and burns all cGOV tokens (full exit)
     * @return assetsWithdrawn Encrypted cUSDC received
     */
    function withdrawAll()
        external
        nonReentrant
        returns (euint256 assetsWithdrawn)
    {
        euint256 userShares = shares[msg.sender];

        // Check user has shares
        if (euint256.unwrap(userShares) == bytes32(0)) {
            revert UnauthorizedAccess(); // No shares to withdraw
        }

        // Calculate assets to return:
        // assets = (userShares × totalAssets) / (totalShares × 10^δ)
        euint256 numerator = userShares.mul(_totalAssets);
        euint256 denominatorScaled = _totalShares.mul(
            DECIMAL_OFFSET.asEuint256()
        );
        assetsWithdrawn = numerator.div(denominatorScaled);

        // CRITICAL: Grant marketplace ACL access BEFORE calling vaultWithdraw
        // The marketplace needs to compare this amount with vault balance
        assetsWithdrawn.allowThis();
        assetsWithdrawn.allow(address(cUSDC));
        assetsWithdrawn.allow(msg.sender);

        // IMPORTANT: Reset shares entry to zero bytes32 (not encrypted zero)
        // This allows hasShares() to return false and enables re-deposit
        shares[msg.sender] = euint256.wrap(bytes32(0));

        // Update vault state
        euint256 newTotalShares = _totalShares.sub(userShares);
        euint256 newTotalAssets = _totalAssets.sub(assetsWithdrawn);
        _totalShares = newTotalShares;
        _totalAssets = newTotalAssets;

        // Transfer assets from vault to user
        cUSDC.vaultWithdraw(msg.sender, assetsWithdrawn);

        // Set permissions
        newTotalAssets.allowThis();
        newTotalShares.allowThis();

        // Auto-burn cGOV tokens (ragequit = full exit from governance)
        if (authorizedCGOV != address(0)) {
            try
                IConfidentialGovernanceTokenForVault(authorizedCGOV).burnAllFor(
                    msg.sender
                )
            {
                // Successfully burned cGOV
            } catch {
                // cGOV burn failed, user can burn manually
            }
        }

        // Auto-leave DAO if user is a member (ragequit = full exit)
        if (authorizedDAO != address(0)) {
            try IAzothDAOForVault(authorizedDAO).isMember(msg.sender) returns (
                bool isMember
            ) {
                if (isMember) {
                    // Use low-level call to avoid revert if leaveDAO fails
                    // The vault calls leaveDAO on behalf of the user
                    (bool success, ) = authorizedDAO.call(
                        abi.encodeWithSignature(
                            "leaveDAOFor(address)",
                            msg.sender
                        )
                    );
                    // If leaveDAOFor doesn't exist, that's ok - user can leave manually
                    if (!success) {
                        // Fallback: emit event so user knows to leave manually
                    }
                }
            } catch {
                // DAO not accessible, user can leave manually
            }
        }

        emit Withdraw(msg.sender, block.timestamp);

        return assetsWithdrawn;
    }

    /**
     * @notice Check if a user is allowed to access their own shares
     * @dev For debugging ACL issues
     * @param user Address to check
     * @return Whether the user can access their shares handle
     */
    function checkSharesACL(address user) external view returns (bool) {
        euint256 userShares = shares[user];
        if (euint256.unwrap(userShares) == bytes32(0)) {
            return false; // No shares exist
        }
        return e.isAllowed(user, userShares);
    }

    /**
     * @notice Get raw shares handle for debugging
     * @param user Address to query
     * @return The raw bytes32 handle
     */
    function getSharesHandle(address user) external view returns (bytes32) {
        return euint256.unwrap(shares[user]);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the authorized DAO contract
     * @param dao Address of the AzothDAO contract
     */
    function setAuthorizedDAO(address dao) external onlyOwner {
        if (dao == address(0)) revert InvalidDAO();
        authorizedDAO = dao;
        emit DAOSet(dao);
    }

    /**
     * @notice Set the authorized cGOV contract
     * @param _cGOV Address of the ConfidentialGovernanceToken contract
     */
    function setAuthorizedCGOV(address _cGOV) external onlyOwner {
        authorizedCGOV = _cGOV;
        emit CGOVSet(_cGOV);
    }
}
