import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Listing } from '@/types/listing';
import { useMarketplace } from '@/hooks/useMarketplace';

interface ListingCardProps {
  listing: Listing;
  onPurchase: (listing: Listing) => void;
}

const ListingCard: FC<ListingCardProps> = ({ listing, onPurchase }) => {
  const { publicKey } = useWallet();
  const { handlePurchase } = useMarketplace();

  const isOwner = publicKey?.toBase58() === listing.seller.toBase58();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Gold Tokens</h3>
          <p className="text-gray-600">{listing.amount}g</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{listing.price} SOL</p>
          <p className="text-sm text-gray-500">
            ≈ ${(listing.price * 30).toFixed(2)} USD
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Seller: {listing.seller.toBase58().slice(0, 4)}...
        </p>
        {!isOwner && (
          <button
            onClick={() => handlePurchase(listing)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Purchase
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;