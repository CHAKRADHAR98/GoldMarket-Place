import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

const Navbar: FC = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Gold Marketplace
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900">
              Market
            </Link>
            <Link href="/portfolio" className="text-gray-600 hover:text-gray-900">
              Portfolio
            </Link>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;