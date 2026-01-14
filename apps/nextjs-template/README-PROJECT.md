# Azoth DAO - Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![Inco SDK](https://img.shields.io/badge/Inco%20SDK-0.7.10-green)](https://docs.inco.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

> Privacy-first DAO interface with Inco SDK integration for encrypted governance

---

## 🎯 What We Built

Complete Next.js frontend enabling:
- **Encrypted balance viewing** with selective decryption
- **Session key UX** (sign once, decrypt unlimited)
- **Confidential proposal creation** with encrypted amounts
- **Private voting** with encrypted weights
- **Batch decryption** for multiple values

---

## ✨ Key Features

### 1. Session Key Pattern (93% Less Signatures)
```typescript
// Sign ONCE
const voucher = await grantSessionKeyVoucher({ expiresAt: oneHourLater });

// Decrypt UNLIMITED (no more signatures)
const results = await decryptWithVoucher({ handles, voucher });
```

### 2. Encrypted Balance Components
- cUSDC Marketplace: Purchase + decrypt balance
- Confidential Vault: Deposit/withdraw with encrypted shares
- cGOV Token: Mint governance tokens, view encrypted balance

### 3. Private Voting Interface
- Create proposals with encrypted amounts
- Cast votes with encrypted weights
- Finalize with batch decryption (3 tallies, 1 signature)

### 4. Multi-Wallet Support
- External wallets (MetaMask, WalletConnect)
- Email login + embedded wallet
- Google OAuth + embedded wallet
---

## 🏗️ Architecture

```
apps/nextjs-template/
├── components/dao/              # 5 DAO components (600+ lines)
│   ├── CUSDCMarketplace.tsx
│   ├── ConfidentialVault.tsx
│   ├── CGOVToken.tsx
│   ├── DAOMembership.tsx
│   └── Proposals.tsx            # Voting + session keys
│
├── utils/inco.ts                # Inco SDK wrapper (600 lines)
├── hooks/use-wallet.ts          # Wallet state management
└── app/dao/page.tsx             # Main DAO UI
```

---

## 📦 Core Components

#### 1. **Proposals.tsx** (150 lines)
- Create/vote/finalize proposals
- Session key integration (3 decryptions, 1 signature)
- Encrypted vote weights
- State: Pending → Succeeded/Defeated → Queued → Executed

#### 2. **CUSDCMarketplace.tsx** (120 lines)
- ETH → cUSDC conversion (2000:1)
- Encrypted balance display
- Single-click decryption

#### 3. **ConfidentialVault.tsx** (130 lines)
- ERC-4626 inspired deposit/withdraw
- Encrypted share balance
- Ragequit (auto-leave DAO)

#### 4. **CGOVToken.tsx** (100 lines)
- Mint governance tokens (0.001 ETH per cGOV)
- Non-transferable (soulbound)
- Encrypted balance viewing

#### 5. **DAOMembership.tsx** (90 lines)
- Join/leave DAO
- Economic stake check (requires vault shares)

---

## 🔗 Tech Stack

- **Framework**: Next.js 16.1, TypeScript 5.9, React 19
- **Blockchain**: Wagmi v2, Viem, Base Sepolia
- **Auth**: Privy (multi-wallet + email/social)
- **Inco SDK**: `@inco/js@0.7.10` (encryption/decryption)
- **Styling**: Tailwind CSS, Lucide icons

---

**See [README-INCO.md](./README-INCO.md) for detailed Inco SDK integration code examples**
