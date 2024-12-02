import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMarketplace } from '@/hooks/useMarketplace';

const CreateListingForm: FC = () => {
  const { publicKey } = useWallet();
  const { createListing } = useMarketplace();
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !amount || !price) return;

    try {
      await createListing({
        amount: parseFloat(amount),
        price: parseFloat(price),
      });
      setAmount('');
      setPrice('');
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Listing</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount (g)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.1"
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price (SOL)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.1"
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Create Listing
        </button>
      </div>
    </form>
  );
};

export default CreateListingForm;