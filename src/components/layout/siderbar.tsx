import { FC } from 'react';

const Sidebar: FC = () => {
  return (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price Range
            </label>
            <div className="mt-1 space-y-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Max"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (g)
            </label>
            <div className="mt-1 space-y-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Max"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 rounded-md">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;