import { FC } from 'react';
import { useListings } from '@/hooks/useListings';
import ListingCard from './ListingCard';

const ListingsGrid: FC = () => {
  const { listings, loading, error } = useListings();

  if (loading) {
    return <div>Loading listings...</div>;
  }

  if (error) {
    return <div>Error loading listings: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onPurchase={() => {}}
        />
      ))}
    </div>
  );
};

export default ListingsGrid;