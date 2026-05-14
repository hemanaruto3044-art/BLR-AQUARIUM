import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductCard from '../components/ProductCard';
import { Search as SearchIcon, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const queryText = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQuery, setLocalQuery] = useState(queryText);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filtered = allProducts.filter((product: any) => {
          const name = (product.name || '').toLowerCase();
          const category = (product.category || '').toLowerCase();
          const search = queryText.toLowerCase();
          return name.includes(search) || category.includes(search);
        });
        
        setProducts(filtered);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [queryText]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sky-400 hover:text-cyan-400 transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </button>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              SEARCH <span className="text-sky-800 stroke-cyan-500 stroke-1">RESULTS</span>
            </h1>
            {queryText && (
              <p className="text-sky-400 mt-2 font-medium">
                Showing results for "{queryText}"
              </p>
            )}
          </div>

          <form onSubmit={handleSearch} className="w-full md:max-w-md">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-sky-900/30 border border-sky-800 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-sky-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all backdrop-blur-sm"
              />
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="text-sky-400 font-medium animate-pulse">Searching the aquarium...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-sky-900/20 border border-sky-800/50 rounded-[2rem] p-12 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-sky-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-10 h-10 text-sky-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No products found</h3>
            <p className="text-sky-400 max-w-sm mx-auto mb-8">
              We couldn't find any products matching your search. Try checking your spelling or using more general terms.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20"
            >
              Back to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
