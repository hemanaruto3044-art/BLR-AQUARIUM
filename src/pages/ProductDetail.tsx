import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, limit, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  ShoppingCart, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  Info, 
  AlertCircle,
  Bug,
  Heart,
  Loader2,
  X,
  Star,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { cn } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import LiveCall from '../components/LiveCall';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestingLive, setRequestingLive] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = id ? isInWishlist(id) : false;
  const navigate = useNavigate();

  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [showCallUI, setShowCallUI] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const path = `products/${id}`;
      try {
        const docRef = doc(db, 'products', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as any;
          
          if (data.isActive === false && !isAdmin) {
            toast.error('This product is currently unavailable');
            navigate('/');
            return;
          }

          setProduct(data);
          if (data.images?.length > 0) {
            setActiveMediaIndex(0);
          }
          
          // Fetch related products
          const relatedQuery = query(
            collection(db, 'products'),
            where('category', '==', data.category),
            where('isActive', '==', true),
            limit(10)
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const related = relatedSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((p: any) => p.id !== id)
            .slice(0, 4);
          setRelatedProducts(related);

          // Fetch reviews
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', id),
            limit(20)
          );
          
          const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(revs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, 'reviews');
          });

          return () => unsubscribeReviews();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setTestModeEnabled(snapshot.data().testButtonEnabled);
      }
    });

    return () => unsubscribeSettings();
  }, [id, isAdmin, navigate]); // and other deps

  // Listen to active live call for this user and product
  useEffect(() => {
    if (!user || !id || !requestingLive) return;

    const q = query(
      collection(db, 'live_calls'),
      where('productId', '==', id),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'ongoing', 'accepted'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callData = snapshot.docs[0].data();
        const callId = snapshot.docs[0].id;
        setActiveCallId(callId);
        setCallStatus(callData.status);
        
        if (callData.status === 'ongoing' || callData.status === 'accepted') {
          setShowCallUI(true);
        } else {
          setShowCallUI(false);
        }
      } else {
        setActiveCallId(null);
        setCallStatus(null);
        setShowCallUI(false);
        setRequestingLive(false);
      }
    });

    return () => unsubscribe();
  }, [user, id, requestingLive]);

  const handleLiveRequest = async () => {
    if (!user) {
      toast.error('Please login to request a live view');
      navigate('/login');
      return;
    }

    if (!product.isLiveEnabled) {
      toast.error('Live view is currently unavailable for this item');
      return;
    }

    // Check if there's already a pending/ongoing call
    const q = query(
      collection(db, 'live_calls'),
      where('productId', '==', id),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'ongoing'])
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      toast.error('You already have an active request');
      setRequestingLive(true);
      return;
    }

    setRequestingLive(true);
    const path = 'live_calls';
    try {
      await addDoc(collection(db, path), {
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: user.displayName || user.email,
        status: 'pending',
        adminAlerted: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      setRequestingLive(false);
    }
  };

  const handleCancelRequest = async () => {
    if (activeCallId) {
      try {
        const callRef = doc(db, 'live_calls', activeCallId);
        await updateDoc(callRef, { status: 'ended' });
      } catch (err) {
        console.error('Failed to cancel call:', err);
      }
    }
    setRequestingLive(false);
    setActiveCallId(null);
    setCallStatus(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleTestNotification = async () => {
    if (!user) {
      toast.error('Please login to test notification');
      return;
    }

    setSendingTest(true);
    const path = 'test_requests';
    try {
      await addDoc(collection(db, path), {
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });
      toast.success('Test message sent to admin panel!', {
        icon: '🚀'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSendingTest(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      navigate('/login');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingReview(true);
    const path = 'reviews';
    try {
      await addDoc(collection(db, path), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp(),
      });

      // 2. Update product stats
      const productRef = doc(db, 'products', id!);
      const currentReviewCount = product.reviewCount || 0;
      const currentAvgRating = product.averageRating || 0;
      const newReviewCount = currentReviewCount + 1;
      const newAverageRating = (currentAvgRating * currentReviewCount + newReview.rating) / newReviewCount;

      await updateDoc(productRef, {
        reviewCount: newReviewCount,
        averageRating: parseFloat(newAverageRating.toFixed(1))
      });

      // Update local state to reflect changes immediately
      setProduct((prev: any) => ({
        ...prev,
        reviewCount: newReviewCount,
        averageRating: newAverageRating
      }));

      toast.success('Review submitted successfully!');
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getYouTubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-sky-800 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/')} className="text-cyan-400 hover:underline">Return to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sky-400 hover:text-cyan-400 font-medium mb-8 group transition-colors"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Gallery
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div 
            className="aspect-square rounded-[2rem] overflow-hidden bg-sky-900/30 border border-sky-800/50 relative group"
            onMouseEnter={() => !Boolean(product.youtubeVideo && activeMediaIndex === product.images.length) && setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {product.youtubeVideo && activeMediaIndex === product.images.length ? (
              <div className="w-full h-full bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(product.youtubeVideo)}?autoplay=1&mute=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div 
                className={cn(
                  "w-full h-full transition-transform duration-200 ease-out",
                  !isZoomed && "scale-100"
                )}
                style={isZoomed ? {
                  transform: 'scale(1.5)',
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                } : {}}
              >
                <img 
                  src={product.images?.[activeMediaIndex] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800'} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {product.isLiveEnabled && (
              <motion.div 
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ 
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.03, 1]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute top-6 left-6 px-4 py-2 bg-red-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-xl shadow-red-500/30 pointer-events-none z-10"
              >
                <Video className="w-4 h-4" />
                Live Ready
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {product.images?.map((img: string, i: number) => (
              <button 
                key={i} 
                onClick={() => { setActiveMediaIndex(i); setIsZoomed(false); }}
                className={cn(
                  "aspect-square rounded-2xl overflow-hidden bg-sky-900/30 border-2 transition-all p-1",
                  activeMediaIndex === i ? "border-cyan-500 shadow-lg shadow-cyan-500/10" : "border-sky-800/50 hover:border-sky-700"
                )}
              >
                <img 
                  src={img} 
                  alt={`${product.name} view ${i + 1}`} 
                  className={cn(
                    "w-full h-full object-cover rounded-xl transition-all",
                    activeMediaIndex === i ? "opacity-100 scale-100" : "opacity-40 hover:opacity-80 scale-95 hover:scale-100"
                  )} 
                />
              </button>
            ))}
            {product.youtubeVideo && (
              <button 
                onClick={() => { setActiveMediaIndex(product.images.length); setIsZoomed(false); }}
                className={cn(
                  "aspect-square rounded-2xl overflow-hidden bg-sky-900/30 border-2 transition-all p-1 group relative",
                  activeMediaIndex === product.images.length ? "border-red-500 shadow-lg shadow-red-500/10" : "border-sky-800/50 hover:border-red-800"
                )}
              >
                <div className="w-full h-full bg-sky-950 flex flex-col items-center justify-center rounded-xl overflow-hidden">
                  <img 
                    src={`https://img.youtube.com/vi/${getYouTubeId(product.youtubeVideo)}/0.jpg`} 
                    alt="Video preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Video className={cn("w-6 h-6", activeMediaIndex === product.images.length ? "text-red-500" : "text-sky-500 group-hover:text-red-400")} />
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">Video</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-cyan-500/20">
                {product.category}
              </span>
              {product.isLiveEnabled && (
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-600/40"
                >
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                   </span>
                   Live Ready
                </motion.div>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
              {product.name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => {
                  const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                  return (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-4 h-4",
                        i < Math.round(avg) ? "fill-cyan-500 text-cyan-500" : "text-sky-800"
                      )} 
                    />
                  );
                })}
              </div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-500">
              ₹{product.price.toLocaleString()}
            </div>
          </div>

          <p className="text-sky-200/60 leading-relaxed text-lg mb-8">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-sky-900/20 border border-sky-800/50 flex flex-col gap-1">
              <ShieldCheck className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-xs font-bold text-white uppercase">Health Guarantee</span>
              <p className="text-[10px] text-sky-400/60 leading-tight">Arrives healthy or 100% refund guaranteed.</p>
            </div>
            <div className="p-4 rounded-2xl bg-sky-900/20 border border-sky-800/50 flex flex-col gap-1">
              <Truck className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-xs font-bold text-white uppercase">
                {product.isFreeDelivery ? 'Free Delivery' : `₹${product.deliveryCharge || 0} Delivery`}
              </span>
              <p className="text-[10px] text-sky-400/60 leading-tight">
                {product.isFreeDelivery ? 'Professional safe transit on the house.' : 'Priority climate-controlled shipping.'}
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex gap-4">
              <button 
                onClick={() => addToCart(product)}
                className={cn(
                  "flex-[3] py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98]",
                  product.stock <= 0 
                    ? "bg-sky-900/50 text-sky-500 cursor-not-allowed border border-sky-800" 
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
                )}
                disabled={product.stock <= 0}
              >
                <ShoppingCart className="w-6 h-6" />
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Collection'}
              </button>
              <button
                onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id)}
                className={cn(
                  "flex-1 p-5 rounded-2xl border transition-all flex items-center justify-center group active:scale-90",
                  isWishlisted 
                    ? "bg-red-500/20 border-red-500/50 text-red-500" 
                    : "bg-sky-950/50 border-sky-800 text-sky-400 hover:border-cyan-500/50 hover:text-cyan-400"
                )}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("w-6 h-6 transition-transform group-hover:scale-110", isWishlisted && "fill-current")} />
              </button>
              {product.isLiveEnabled && product.stock > 0 && (
                <button 
                  onClick={handleLiveRequest}
                  disabled={requestingLive}
                  className="flex-1 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <Video className="w-6 h-6 text-red-500" />
                  {requestingLive ? 'Sending...' : 'Request Live'}
                </button>
              )}
            </div>

            {testModeEnabled && (
              <button 
                onClick={handleTestNotification}
                disabled={sendingTest}
                className="w-full py-4 bg-sky-900/40 hover:bg-sky-900/60 border border-dashed border-sky-700 text-sky-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                <Bug className={cn("w-5 h-5", sendingTest && "animate-spin")} />
                {sendingTest ? 'Sending Test...' : 'Test Admin Notification System'}
              </button>
            )}
            
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3">
              <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-orange-200/70 leading-normal">
                <span className="font-bold text-orange-400 uppercase">Pro Tip: </span>
                Acclimation instructions are included with every order. Ensure your tank parameters match the spec sheet provided in the box.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="mt-32">
        <div className="mb-12">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4 block">Customer Feedback</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">PRODUCT <span className="text-sky-800 stroke-cyan-500 stroke-1">REVIEWS</span></h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Review Stats & Form */}
          <div className="space-y-8">
            <div className="bg-sky-900/20 border border-sky-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider mb-4">Share your experience</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className={cn(
                          "p-1 transition-all",
                          newReview.rating >= star ? "text-cyan-500 hover:scale-110" : "text-sky-800 hover:text-sky-600"
                        )}
                      >
                        <Star className={cn("w-6 h-6", newReview.rating >= star && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-1">Comment</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Tell us what you think about this product..."
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-xl p-3 text-sm text-white placeholder:text-sky-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 min-h-[120px] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-sky-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Submit Review
                </button>
              </form>
            </div>
          </div>

          {/* Review List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-sky-900/10 border border-sky-800/30 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} 
                        alt={review.userName}
                        className="w-10 h-10 rounded-full border border-sky-800"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">{review.userName}</h4>
                        <p className="text-[10px] text-sky-500 uppercase tracking-widest">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "w-3 h-3",
                            i < review.rating ? "fill-cyan-500 text-cyan-500" : "text-sky-900"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sky-200/70 text-sm leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-sky-900/10 border border-dashed border-sky-800/50 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-sky-800 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-sky-700 uppercase italic">No reviews yet</h4>
                <p className="text-sm text-sky-800/60 max-w-xs mx-auto mt-2">
                  Be the first to share your experience with this {product.category.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4 block">Recommended for you</span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">RELATED <span className="text-sky-800 stroke-cyan-500 stroke-1">COLLECTIONS</span></h2>
            </div>
            <button 
              onClick={() => navigate(`/?category=${encodeURIComponent(product.category)}#categories`)}
              className="text-[10px] font-black text-sky-500 hover:text-cyan-400 uppercase tracking-widest transition-colors mb-2"
            >
              View All {product.category}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
             ))}
          </div>
        </div>
      )}

      {/* Live Request Overlay */}
      <AnimatePresence>
        {requestingLive && !showCallUI && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-sky-900 border border-cyan-500/30 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
              </div>
              
              <h2 className="text-2xl font-black text-white uppercase italic tracking-widest mb-4">Awaiting Connection</h2>
              <p className="text-sky-200/70 mb-8 leading-relaxed">
                We've alerted our aquatic expert. Hang tight while we prepare the live broadcast of your <span className="text-cyan-400 font-bold">{product.name}</span>.
              </p>

              <button 
                onClick={handleCancelRequest}
                className="w-full py-4 bg-sky-800 hover:bg-red-900/50 text-white rounded-2xl font-bold transition-all border border-sky-700 hover:border-red-500/50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Cancel Request
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Video Call UI */}
      {showCallUI && activeCallId && (
        <LiveCall 
          callId={activeCallId} 
          isHost={false} 
          onEnd={handleCancelRequest} 
        />
      )}
    </div>
  );
};

export default ProductDetail;
