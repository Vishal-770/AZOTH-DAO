# Azoth Protocol - Next.js Template

This is the main DAO interface for Azoth Protocol, built with [Next.js](https://nextjs.org) and integrated with [Privy](https://privy.io) for wallet authentication.

## Features

- 🔐 **Privy Wallet Integration** - Support for external wallets, email login, and embedded wallets
- ⛓️ **Base Sepolia Network** - Pre-configured for Base Sepolia testnet
- 🎨 **Cyber-Obsidian Theme** - Dark theme with cyan accents
- 📱 **Responsive Design** - Works on desktop and mobile

## Getting Started

### 1. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Add your Privy App ID (get it from [Privy Dashboard](https://dashboard.privy.io)):

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Wallet Integration

This template uses Privy for wallet authentication. The integration supports:

- **External Wallets**: MetaMask, WalletConnect, Coinbase Wallet, etc.
- **Email Login**: Users can sign in with email and get an embedded wallet
- **Google Login**: OAuth authentication with embedded wallet creation

### Using the Wallet Hook

```tsx
import { useWallet } from '@/hooks/use-wallet';

function MyComponent() {
  const { address, isConnected, login, logout } = useWallet();
  
  if (!isConnected) {
    return <button onClick={login}>Connect</button>;
  }
  
  return (
    <div>
      <p>Connected: {address}</p>
      <button onClick={logout}>Disconnect</button>
    </div>
  );
}
```

## Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── wallet-connect.tsx  # Privy wallet connect button
│   ├── header.tsx          # App header with wallet
│   └── Navbar.tsx          # Navigation bar
├── hooks/                  # Custom React hooks
│   └── use-wallet.ts       # Wallet state hook
├── lib/                    # Utility libraries
│   ├── chains.ts           # Chain configuration
│   └── wagmi-config.ts     # Wagmi configuration
├── providers/              # React context providers
│   └── privy-provider.tsx  # Privy + Wagmi provider
└── wallet/                 # Wallet provider wrapper
    └── provider.tsx        # Main wallet provider
```

## Learn More

- [Privy Documentation](https://docs.privy.io) - Learn about Privy features
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js
- [Wagmi Documentation](https://wagmi.sh) - Learn about Wagmi hooks
- [Viem Documentation](https://viem.sh) - Learn about Viem

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
