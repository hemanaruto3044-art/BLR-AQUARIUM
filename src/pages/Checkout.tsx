import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { toast } from 'react-hot-toast';
import ThreeBackground from '../components/ThreeBackground';
import { motion } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, ArrowRight, ChevronLeft, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

const Checkout = () => {
  const { cart, totalAmount, clearCart, deliveryTotal, itemsTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    paymentMethod: 'qr',
  });

  useEffect(() => {
    if (user && !formData.name) {
      setFormData(prev => ({ 
        ...prev, 
        name: user.displayName || '',
        email: user.email || '' 
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'settings', 'global'));
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings(data);
          // Set default payment method based on priority: QR > COD
          if (data.qrPaymentEnabled === false && data.codPaymentEnabled !== false) {
            setFormData(prev => ({ ...prev, paymentMethod: 'cod' }));
          } else if (data.qrPaymentEnabled !== false) {
            setFormData(prev => ({ ...prev, paymentMethod: 'qr' }));
          }
        }
      } catch (err) {
        console.error('Settings error:', err);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (cart.length === 0 && !loading && !isSuccess) {
    return <Navigate to="/cart" />;
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!user) {
      toast.error('Please login to complete your order.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        userName: formData.name,
        userEmail: formData.email,
        phone: formData.phone,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
        },
        items: cart,
        total: totalAmount,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'qr' ? 'unpaid' : 'unpaid', // Both start unpaid
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      setIsSuccess(true);
      clearCart();

      if (formData.paymentMethod === 'qr') {
        toast.success('Order created! Please complete the QR payment.', { duration: 5000 });
        navigate(`/payment/${docRef.id}`);
      } else {
        toast.success('Order placed successfully! Redirecting to tracking...', {
          duration: 5000,
          icon: '📦',
        });
        navigate(`/tracking?id=${docRef.id}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please check your connection and try again.');
      // Optional: more detailed error if desired
      // handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-6xl mx-auto">
        <header className="mb-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sky-400 font-bold hover:text-cyan-400 transition-colors mb-6">
            <ChevronLeft className="w-5 h-5" />
            Review Cart
          </button>
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1 block">Finalize</span>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Secure <span className="text-sky-800 stroke-cyan-500 stroke-1">Checkout</span></h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-sky-900/10 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-md">
              <h3 className="text-xl font-black text-white mb-8 tracking-tighter italic uppercase flex items-center gap-3">
                <Truck className="w-6 h-6 text-cyan-400" />
                Shipping Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 ml-4">Full Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 ml-4">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 00000 00000"
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 ml-4">Pin Code</label>
                  <input 
                    required
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                    placeholder="600001"
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 ml-4">Shipping Address</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter full address including landmarks"
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 ml-4">City / Region</label>
                  <input 
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Chennai, Tamil Nadu"
                    className="w-full bg-sky-950/50 border border-sky-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex gap-4 items-start">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-emerald-400 font-black text-sm uppercase tracking-tight">Secured Protection</h4>
                <p className="text-[11px] text-emerald-200/60 leading-normal">
                  Your transaction is protected by standard secure encryption. We never store your full payment card details. Healthy arrival is guaranteed or a full refund will be processed immediately.
                </p>
              </div>
            </div>
          </form>

          {/* Payment Summary */}
          <div className="space-y-6">
            <div className="bg-sky-900/20 border border-sky-800 rounded-[3rem] p-8 backdrop-blur-md sticky top-24">
              <h3 className="text-xl font-black text-white mb-8 tracking-tighter italic uppercase flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-cyan-400" />
                Payment Method
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {settingsLoading ? (
                  <div className="col-span-2 py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-sky-800 border-t-cyan-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {settings?.qrPaymentEnabled !== false && (
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'qr'})}
                        className={cn(
                          "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                          formData.paymentMethod === 'qr' 
                            ? "border-cyan-500 bg-cyan-500/10" 
                            : "border-sky-800 bg-sky-950/30 opacity-60 hover:opacity-100"
                        )}
                      >
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Scan & Pay</span>
                        <span className="text-white font-bold">QR Payment</span>
                      </button>
                    )}
                    {settings?.codPaymentEnabled !== false && (
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                        className={cn(
                          "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                          formData.paymentMethod === 'cod' 
                            ? "border-amber-500 bg-amber-500/10" 
                            : "border-sky-800 bg-sky-950/30 opacity-60 hover:opacity-100"
                        )}
                      >
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Pay on Delivery</span>
                        <span className="text-white font-bold">COD</span>
                      </button>
                    )}
                    {settings?.qrPaymentEnabled === false && settings?.codPaymentEnabled === false && (
                      <div className="col-span-2 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <Lock className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-red-400 font-bold text-xs uppercase tracking-tight">Payments temporary disabled</p>
                        <p className="text-[10px] text-red-400/60 mt-1 uppercase italic">Please check back later or contact support.</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sky-300">
                  <span className="text-sm font-bold uppercase">Bag Value</span>
                  <span className="font-black text-white">₹{itemsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sky-300">
                  <span className="text-sm font-bold uppercase">Delivery Charge</span>
                  <span className={cn("font-black uppercase italic", deliveryTotal === 0 ? "text-emerald-400" : "text-amber-500")}>
                    {deliveryTotal === 0 ? 'Free' : `₹${deliveryTotal.toLocaleString()}`}
                  </span>
                </div>
                <div className="pt-6 border-t border-sky-800 flex justify-between items-end">
                  <span className="font-black text-lg text-white uppercase italic tracking-tighter">Amount to Pay</span>
                  <span className="text-3xl font-black text-cyan-400 tracking-tighter italic leading-none">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading || (settings?.qrPaymentEnabled === false && settings?.codPaymentEnabled === false)}
                className="w-full py-5 bg-white text-sky-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-50 rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-tighter group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-sky-950/30 border-t-sky-950 rounded-full animate-spin" />
                ) : (
                  <>
                    {formData.paymentMethod === 'qr' ? 'Proceed to QR Pay' : 'Confirm COD Order'}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
