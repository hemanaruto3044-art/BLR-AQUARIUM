import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Video, Package, Users, Settings, Plus, Trash2, Check, X, PlusCircle, LayoutGrid, Bug, Sliders, Eye, EyeOff, QrCode, Zap, ShoppingBag, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn, formatDate } from '../lib/utils';
import LiveCall from '../components/LiveCall';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const { playAlert, requestPermission, permission } = useNotifications();
  const [activeTab, setActiveTab] = useState<'live' | 'products' | 'categories' | 'orders' | 'giveaways' | 'system' | 'payments'>('live');

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);
  const [liveCalls, setLiveCalls] = useState<any[]>([]);
  const [activeAdminCallId, setActiveAdminCallId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [editingTrackingId, setEditingTrackingId] = useState<{ [key: string]: string }>({});
  const [testRequests, setTestRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ testButtonEnabled: false });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    stock: 0,
    description: '',
    images: [''],
    youtubeVideo: '',
    isLiveEnabled: true,
    isActive: true,
    isFreeDelivery: true,
    deliveryCharge: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: categories[0]?.name || '',
      stock: 0,
      description: '',
      images: [''],
      youtubeVideo: '',
      isLiveEnabled: true,
      isActive: true,
      isFreeDelivery: true,
      deliveryCharge: 0
    });
    setEditingProduct(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'products';
    try {
      if (editingProduct) {
        await updateDoc(doc(db, path, editingProduct.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, path), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('Product added');
      }
      setShowAddProduct(false);
      resetForm();
    } catch (e) {
      handleFirestoreError(e, editingProduct ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const path = 'categories';
    try {
      if (editingCategory) {
        await updateDoc(doc(db, path, editingCategory.id), {
          name: newCategoryName.trim(),
          image: newCategoryImage.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success('Category updated');
      } else {
        await addDoc(collection(db, path), {
          name: newCategoryName.trim(),
          image: newCategoryImage.trim(),
          createdAt: serverTimestamp()
        });
        toast.success('Category created');
      }
      setNewCategoryName('');
      setNewCategoryImage('');
      setEditingCategory(null);
      setShowAddCategory(false);
    } catch (e) {
      handleFirestoreError(e, editingCategory ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryImage(cat.image || '');
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category?')) return;
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      description: p.description || '',
      images: p.images || [''],
      youtubeVideo: p.youtubeVideo || '',
      isLiveEnabled: p.isLiveEnabled ?? true,
      isActive: p.isActive ?? true,
      isFreeDelivery: p.isFreeDelivery ?? true,
      deliveryCharge: p.deliveryCharge ?? 0
    });
    setShowAddProduct(true);
  };

  // Listeners
  useEffect(() => {
    const lPath = 'live_calls';
    const lQ = query(collection(db, lPath), orderBy('createdAt', 'desc'));
    const unsubscribeLive = onSnapshot(lQ, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLiveCalls(calls);
      const newCalls = calls.filter(c => c.status === 'pending' && !c.adminAlerted);
      if (newCalls.length > 0) {
        newCalls.forEach(async (c) => {
          await updateDoc(doc(db, 'live_calls', c.id), { adminAlerted: true });
        });
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, lPath);
    });

    const pPath = 'products';
    const pQ = query(collection(db, pPath), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(pQ, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, pPath);
    });

    const cPath = 'categories';
    const cQ = query(collection(db, cPath), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(cQ, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCategories(cats);
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, cPath);
    });

    const oPath = 'orders';
    const oQ = query(collection(db, oPath), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(oQ, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(allOrders);
      
      const newOrders = allOrders.filter(o => o.status === 'pending' && !o.adminAlerted);
      if (newOrders.length > 0) {
        newOrders.forEach(async (o) => {
          await updateDoc(doc(db, 'orders', o.id), { adminAlerted: true });
        });
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, oPath);
    });

    const tPath = 'test_requests';
    const tQ = query(collection(db, tPath), orderBy('createdAt', 'desc'));
    const unsubscribeTests = onSnapshot(tQ, (snapshot) => {
      setTestRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, tPath);
    });

    const payPath = 'payments';
    const payQ = query(collection(db, payPath), orderBy('createdAt', 'desc'));
    const unsubscribePayments = onSnapshot(payQ, (snapshot) => {
      const allPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPayments(allPayments);

      const newPayments = allPayments.filter(p => p.status === 'pending' && !p.adminAlerted);
      if (newPayments.length > 0) {
        newPayments.forEach(async (p) => {
          await updateDoc(doc(db, 'payments', p.id), { adminAlerted: true });
        });
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, payPath);
    });

    const sPath = 'settings';
    const unsubscribeSettings = onSnapshot(doc(db, sPath, 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });

    return () => {
      unsubscribeLive();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeOrders();
      unsubscribeTests();
      unsubscribePayments();
      unsubscribeSettings();
    };
  }, [user]);

  const handleUpdateCallStatus = async (id: string, status: string) => {
    const path = `live_calls/${id}`;
    try {
      await updateDoc(doc(db, 'live_calls', id), { status });
      toast.success(`Request ${status}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleJoinCall = async (id: string) => {
    try {
      await updateDoc(doc(db, 'live_calls', id), { 
        status: 'ongoing',
        updatedAt: serverTimestamp()
      });
      setActiveAdminCallId(id);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `live_calls/${id}`);
    }
  };

  const handleEndAdminCall = async () => {
    if (activeAdminCallId) {
      try {
        await updateDoc(doc(db, 'live_calls', activeAdminCallId), { status: 'ended' });
      } catch (e) {
        console.error('Failed to end call:', e);
      }
    }
    setActiveAdminCallId(null);
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success(`Order ${status}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleSaveTrackingId = async (id: string) => {
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), { 
        trackingId: editingTrackingId[id] || '',
        updatedAt: serverTimestamp() 
      });
      toast.success('Tracking ID saved');
      setEditingTrackingId(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const handleUpdatePaymentStatus = async (payment: any, status: 'approved' | 'rejected', reason?: string) => {
    const payPath = `payments/${payment.id}`;
    const ordPath = `orders/${payment.orderId}`;
    setProcessingPaymentId(payment.id);
    try {
      // 1. Update payment record
      await updateDoc(doc(db, 'payments', payment.id), { 
        status, 
        rejectionReason: reason || null,
        updatedAt: serverTimestamp() 
      });

      // 2. Update associated order
      try {
        await updateDoc(doc(db, 'orders', payment.orderId), {
          paymentStatus: status === 'approved' ? 'paid' : 'unpaid',
          updatedAt: serverTimestamp()
        });
      } catch (ordError) {
        console.error('Order status update failed:', ordError);
        handleFirestoreError(ordError, OperationType.UPDATE, ordPath);
        // We still finished the payment update though
      }

      toast.success(`Payment ${status}`);
    } catch (e: any) {
      console.error('Payment approval error:', e);
      handleFirestoreError(e, OperationType.UPDATE, payPath);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const toggleSetting = async (key: string) => {
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        [key]: !settings[key]
      }, { merge: true });
      toast.success('Setting updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const clearTests = async () => {
    if (!confirm('Clear all test logs?')) return;
    try {
      for (const t of testRequests) {
        await deleteDoc(doc(db, 'test_requests', t.id));
      }
      toast.success('Logs cleared');
    } catch (e) {
      toast.error('Failed to clear logs');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('live')}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
              activeTab === 'live' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5" /> Live Requests
            </div>
            {liveCalls.filter(c => c.status === 'pending').length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center rounded-full text-white animate-bounce">
                {liveCalls.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              activeTab === 'categories' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <LayoutGrid className="w-5 h-5" /> Categories
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              activeTab === 'products' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <Package className="w-5 h-5" /> Products
          </button>
          
          <button 
            onClick={() => setActiveTab('giveaways')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              activeTab === 'giveaways' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <Zap className="w-5 h-5" /> Giveaways
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
              activeTab === 'orders' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" /> Orders
            </div>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="w-5 h-5 bg-amber-500 text-[10px] flex items-center justify-center rounded-full text-white">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('payments')}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
              activeTab === 'payments' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" /> Payments
            </div>
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <span className="w-5 h-5 bg-cyan-500 text-[10px] flex items-center justify-center rounded-full text-white animate-pulse">
                {payments.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('system')}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              activeTab === 'system' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
            )}
          >
            <Sliders className="w-5 h-5" /> System Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Live Viewing Requests</h2>
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Real-time monitoring active
                  </div>
                </div>

                {liveCalls.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-dashed border-sky-800 bg-sky-900/10">
                    <Video className="w-12 h-12 text-sky-800 mx-auto mb-4" />
                    <p className="text-sky-400 font-bold uppercase tracking-widest text-xs">No active requests</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {liveCalls.map(call => (
                      <div 
                        key={call.id} 
                        className={cn(
                          "p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                          call.status === 'pending' ? "bg-sky-900/40 border-cyan-500/50 shadow-lg shadow-cyan-500/5" : "bg-sky-900/10 border-sky-800 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            call.status === 'pending' ? "bg-cyan-500 text-white" : "bg-sky-800 text-sky-400"
                          )}>
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white tracking-tight">{call.userName}</h3>
                              <span className="text-[10px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full uppercase font-black">
                                {formatDate(call.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-sky-300/70">
                              Wants to see: <span className="text-cyan-400 font-bold">{call.productName}</span>
                            </p>
                          </div>
                        </div>

                        {call.status === 'pending' && (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleUpdateCallStatus(call.id, 'rejected')}
                              className="px-4 py-2 text-sky-400 hover:text-white transition-colors text-xs font-bold uppercase"
                            >
                              Decline
                            </button>
                            <button 
                              onClick={() => handleJoinCall(call.id)}
                              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm tracking-tight transition-all"
                            >
                              Accept & Join
                            </button>
                          </div>
                        )}
                        
                        {call.status === 'ongoing' && (
                          <button 
                            onClick={() => setActiveAdminCallId(call.id)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm tracking-tight transition-all"
                          >
                            Re-join Call
                          </button>
                        )}
                        
                        {call.status !== 'pending' && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-sky-500 px-3 py-1 bg-sky-950 rounded-full">
                            {call.status === 'accepted' ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                            {call.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Categories</h2>
                  <button 
                    onClick={() => setShowAddCategory(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-cyan-600/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-sky-900/20 border border-sky-800 rounded-2xl p-6 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-950 rounded-xl flex items-center justify-center text-cyan-400 overflow-hidden">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <LayoutGrid className="w-6 h-6" />
                          )}
                        </div>
                        <h3 className="font-bold text-white text-lg tracking-tight">{cat.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 text-sky-400 hover:text-cyan-400 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-sky-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showAddCategory && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-950/90 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-sky-900 border border-sky-800 w-full max-w-sm rounded-[2rem] p-8"
                    >
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-6">
                        {editingCategory ? 'Update Category' : 'New Category'}
                      </h3>
                      <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Category Name</label>
                          <input 
                            autoFocus
                            required
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Rare Fish, Accessories"
                            className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Icon/Image URL</label>
                          <input 
                            value={newCategoryImage}
                            onChange={e => setNewCategoryImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setShowAddCategory(false);
                              setEditingCategory(null);
                              setNewCategoryName('');
                              setNewCategoryImage('');
                            }}
                            className="flex-1 py-3 bg-sky-800 text-sky-400 rounded-xl font-bold text-sm"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-[2] py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm"
                          >
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Inventory Management</h2>
                  <button 
                    onClick={() => { resetForm(); setShowAddProduct(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-cyan-600/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Product
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-sky-900/20 border border-sky-800 rounded-2xl p-4 group relative overflow-hidden">
                      <div className={cn("aspect-video rounded-xl overflow-hidden mb-4 bg-sky-900/50 relative", !p.isActive && "opacity-40 grayscale")}>
                        <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                        {!p.isActive && (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                             <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">DISABLED</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-white leading-tight">{p.name}</h3>
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{p.category}</span>
                        </div>
                        <span className="font-black text-lg text-white">₹{p.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="p-2 text-sky-400 hover:text-cyan-400 transition-colors bg-sky-900/40 rounded-lg"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            const newStatus = p.isActive === false;
                            try {
                              await updateDoc(doc(db, 'products', p.id), { isActive: newStatus });
                              toast.success(newStatus ? 'Product Published' : 'Product Hidden');
                            } catch (e) {
                              handleFirestoreError(e, OperationType.UPDATE, `products/${p.id}`);
                            }
                          }}
                          className={cn(
                            "p-2 transition-colors bg-sky-900/40 rounded-lg",
                            p.isActive !== false ? "text-green-400 hover:text-red-400" : "text-red-400 hover:text-green-400"
                          )}
                          title={p.isActive !== false ? "Disable (Hide)" : "Enable (Show)"}
                        >
                          {p.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={async (e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             if(confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                               const path = `products/${p.id}`;
                               try { 
                                 await deleteDoc(doc(db, 'products', p.id)); 
                                 toast.success('Product deleted successfully'); 
                               } catch(err) { 
                                 console.error("Delete error:", err);
                                 toast.error('Failed to delete product. Check permissions.');
                                 handleFirestoreError(err, OperationType.DELETE, path); 
                               }
                             }
                          }}
                          className="p-2 text-sky-600 hover:text-red-500 transition-colors bg-sky-900/40 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="ml-auto text-xs font-bold text-sky-400 uppercase flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            {!p.isActive && <span className="text-[10px] text-red-500 border border-red-500/50 px-1 rounded">HIDDEN</span>}
                            {p.isLiveEnabled && <Video className="w-3 h-3 text-red-500" />}
                            Stock: <span className={cn(p.stock > 0 ? "text-green-500" : "text-red-500")}>{p.stock}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Modal */}
                {showAddProduct && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-950/90 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-sky-900 border border-sky-800 w-full max-w-2xl rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                          {editingProduct ? 'Edit Product' : 'New Specimen'}
                        </h3>
                        <button onClick={() => setShowAddProduct(false)} className="text-sky-500 hover:text-white">
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Species Name</label>
                            <input 
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Price (₹)</label>
                              <input 
                                required
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Stock</label>
                              <input 
                                required
                                type="number"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>

                          <div className="bg-sky-950/50 p-4 rounded-xl border border-sky-800/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Delivery Type</label>
                              <div className="flex bg-sky-900 rounded-lg p-1">
                                <button 
                                  type="button"
                                  onClick={() => setFormData({ ...formData, isFreeDelivery: true, deliveryCharge: 0 })}
                                  className={cn(
                                    "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                                    formData.isFreeDelivery ? "bg-cyan-500 text-white" : "text-sky-600 hover:text-sky-400"
                                  )}
                                >
                                  Free
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setFormData({ ...formData, isFreeDelivery: false })}
                                  className={cn(
                                    "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                                    !formData.isFreeDelivery ? "bg-amber-500 text-white" : "text-sky-600 hover:text-sky-400"
                                  )}
                                >
                                  Paid
                                </button>
                              </div>
                            </div>
                            
                            {!formData.isFreeDelivery && (
                              <div className="flex items-center gap-3">
                                <span className="text-white font-bold text-sm italic">₹</span>
                                <input 
                                  placeholder="Amount"
                                  type="number"
                                  value={formData.deliveryCharge}
                                  onChange={e => setFormData({ ...formData, deliveryCharge: Number(e.target.value) })}
                                  className="flex-1 bg-sky-950 border border-sky-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                            <select 
                              required
                              value={formData.category}
                              onChange={e => setFormData({ ...formData, category: e.target.value })}
                              className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none"
                            >
                              <option value="" disabled>Select Category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5 ml-1">
                              <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest">Image URLs</label>
                              <button 
                                type="button"
                                onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-bold uppercase"
                              >
                                <PlusCircle className="w-3 h-3" /> Add Image
                              </button>
                            </div>
                            <div className="space-y-2">
                              {formData.images.map((img, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input 
                                    value={img}
                                    onChange={e => {
                                      const newImgs = [...formData.images];
                                      newImgs[idx] = e.target.value;
                                      setFormData({ ...formData, images: newImgs });
                                    }}
                                    placeholder="https://..."
                                    className="flex-1 bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                                  />
                                  {formData.images.length > 1 && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const newImgs = formData.images.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, images: newImgs });
                                      }}
                                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">YouTube Video URL</label>
                            <input 
                              value={formData.youtubeVideo}
                              onChange={e => setFormData({ ...formData, youtubeVideo: e.target.value })}
                              placeholder="https://youtube.com/watch?v=... or ID"
                              className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                            />
                            <p className="text-[9px] text-sky-600 mt-1 ml-1">Paste the full URL or just the video ID.</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                            <textarea 
                              rows={4}
                              value={formData.description}
                              onChange={e => setFormData({ ...formData, description: e.target.value })}
                              className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-sky-950 rounded-xl border border-sky-800">
                            <input 
                              type="checkbox"
                              id="liveToggle"
                              checked={formData.isLiveEnabled}
                              onChange={e => setFormData({ ...formData, isLiveEnabled: e.target.checked })}
                              className="w-5 h-5 rounded border-sky-800 bg-sky-900 checked:bg-cyan-500 text-cyan-500"
                            />
                            <label htmlFor="liveToggle" className="text-sm font-bold text-sky-300">Enable Live Video</label>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-sky-950 rounded-xl border border-sky-800">
                            <input 
                              type="checkbox"
                              id="activeToggle"
                              checked={formData.isActive}
                              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                              className="w-5 h-5 rounded border-sky-800 bg-sky-900 checked:bg-cyan-500 text-cyan-500"
                            />
                            <label htmlFor="activeToggle" className="text-sm font-bold text-sky-300">Product Visible in Shop</label>
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-4">
                          <button 
                            type="submit"
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-cyan-600/20 active:scale-[0.98]"
                          >
                            {editingProduct ? 'UPDATE SPECIMEN' : 'DEPLOY TO SHOP'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Customer Orders</h2>
                  <div className="px-4 py-1 bg-sky-900/40 rounded-full border border-sky-800 text-[10px] font-black text-sky-500 uppercase tracking-widest">
                    {orders.length} Total Orders
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-sky-800 bg-sky-900/10">
                    <ShoppingBag className="w-12 h-12 text-sky-800 mx-auto mb-4" />
                    <p className="text-sky-400 font-bold uppercase tracking-widest text-xs">No orders placed yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div 
                        key={order.id} 
                        className="bg-sky-900/20 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-sm overflow-hidden relative group"
                      >
                        {/* Status Ribbon */}
                        <div className={cn(
                          "absolute top-0 right-10 px-6 py-2 rounded-b-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg",
                          order.status === 'pending' ? "bg-amber-500 text-white" :
                          order.status === 'shipped' ? "bg-cyan-500 text-white" :
                          order.status === 'delivered' ? "bg-emerald-500 text-white" :
                          "bg-red-500 text-white"
                        )}>
                          {order.status}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                          {/* Order Basic Info */}
                          <div className="lg:col-span-1 space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Order Date</p>
                              <p className="text-sm font-bold text-white tracking-tight">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Customer / Contact</p>
                              <p className="text-white font-bold tracking-tight">{order.userName}</p>
                              <p className="text-xs text-sky-400 break-all">{order.userEmail}</p>
                              <p className="text-xs text-sky-400 mt-1 font-mono">{order.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-2xl font-black text-cyan-400 italic">₹{order.total?.toLocaleString()}</p>
                            </div>
                            {order.paymentMethod === 'qr' && (
                              <div className="pt-2">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                  order.paymentStatus === 'paid' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                                  order.paymentStatus === 'pending_verification' ? "bg-amber-500/10 border-amber-500/50 text-amber-500" :
                                  "bg-red-500/10 border-red-500/50 text-red-400"
                                )}>
                                  QR: {order.paymentStatus?.replace('_', ' ') || 'unpaid'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Shipping Address */}
                          <div className="lg:col-span-1 border-l border-sky-800/50 pl-8">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3">Shipping Address</p>
                            <div className="bg-sky-950/50 rounded-2xl p-4 border border-sky-800/30 text-xs text-sky-200 leading-relaxed">
                              {order.shippingAddress ? (
                                <>
                                  <p className="font-bold text-white mb-1">{order.userName}</p>
                                  <p>{order.shippingAddress.address}</p>
                                  <p>{order.shippingAddress.city} - {order.shippingAddress.zip}</p>
                                </>
                              ) : (
                                <p className="italic text-sky-600">Address not provided</p>
                              )}
                            </div>
                          </div>

                          {/* Items Purchased */}
                          <div className="lg:col-span-1 border-l border-sky-800/50 pl-8">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 italic">Inventory Items</p>
                            <div className="space-y-3">
                              {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex gap-3 items-center">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-sky-950 shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.quantity}x {item.name}</p>
                                    <p className="text-[10px] text-sky-500">₹{item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Actions */}
                          <div className="lg:col-span-1 border-l border-sky-800/50 pl-8 flex flex-col justify-center gap-2">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 italic">Update Status</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                                className={cn(
                                  "py-2 text-[10px] font-black uppercase rounded-lg border transition-all",
                                  order.status === 'pending' ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-sky-950 border-sky-800 text-sky-600 hover:border-amber-500/50"
                                )}
                              >
                                Pending
                              </button>
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                className={cn(
                                  "py-2 text-[10px] font-black uppercase rounded-lg border transition-all",
                                  order.status === 'shipped' ? "bg-cyan-500/10 border-cyan-500 text-cyan-500" : "bg-sky-950 border-sky-800 text-sky-600 hover:border-cyan-500/50"
                                )}
                              >
                                Shipped
                              </button>
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                className={cn(
                                  "py-2 text-[10px] font-black uppercase rounded-lg border transition-all",
                                  order.status === 'delivered' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-sky-950 border-sky-800 text-sky-600 hover:border-emerald-500/50"
                                )}
                              >
                                Delivered
                              </button>
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className={cn(
                                  "py-2 text-[10px] font-black uppercase rounded-lg border transition-all",
                                  order.status === 'cancelled' ? "bg-red-500/10 border-red-500 text-red-500" : "bg-sky-950 border-sky-800 text-sky-600 hover:border-red-500/50"
                                )}
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-sky-800/30">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">TrackCourier.io Tracking ID</p>
                                {order.trackingId && (
                                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <div className="relative flex-1 group/input">
                                  <input 
                                    value={editingTrackingId[order.id] ?? order.trackingId ?? ''}
                                    onChange={e => setEditingTrackingId({ ...editingTrackingId, [order.id]: e.target.value })}
                                    placeholder="Enter Trans ID..."
                                    className="w-full bg-sky-950 border border-sky-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 shadow-inner group-hover/input:border-sky-700 transition-all italic font-mono tracking-widest"
                                  />
                                  {order.trackingId && (
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.trackingId);
                                        toast.success('ID Copied');
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-600 hover:text-cyan-400 opacity-0 group-hover/input:opacity-100 transition-all p-1"
                                      title="Copy"
                                    >
                                      <Zap className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleSaveTrackingId(order.id)}
                                  className="px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-cyan-600/20"
                                >
                                  Save
                                </button>
                              </div>
                              {order.trackingId && (
                                <button 
                                  onClick={() => window.open(`/tracking?id=${order.id}`, '_blank')}
                                  className="mt-2 w-full py-2 bg-sky-800/30 hover:bg-sky-800/50 text-sky-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-sky-800/30 flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-3 h-3" /> Preview Live View
                                </button>
                              )}
                              <p className="mt-2 text-[9px] text-sky-600 font-bold uppercase tracking-tight ml-1 italic">Visible to user instantly</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Payment Verification</h2>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-sky-900/40 rounded-full border border-sky-800 text-[10px] font-black text-sky-500 uppercase tracking-widest">
                    {payments.filter(p => p.status === 'pending').length} Pending Requests
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-sky-800 bg-sky-900/10">
                    <CreditCard className="w-12 h-12 text-sky-800 mx-auto mb-4" />
                    <p className="text-sky-400 font-bold uppercase tracking-widest text-xs">No payment history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map(payment => (
                      <div 
                        key={payment.id} 
                        className={cn(
                          "bg-sky-900/20 border border-sky-800 rounded-3xl p-6 transition-all",
                          payment.status === 'pending' ? "ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/5" : "opacity-60"
                        )}
                      >
                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-950 rounded-2xl flex items-center justify-center text-cyan-400">
                              <QrCode className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-0.5">Order ID</p>
                              <p className="text-white font-bold tracking-tight">#{payment.orderId.slice(-6).toUpperCase()}</p>
                              <p className="text-[10px] text-sky-400 font-bold">{payment.userEmail}</p>
                            </div>
                          </div>

                          <div className="flex-1 lg:border-l lg:border-sky-800 lg:pl-8">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-0.5">Transaction / UTR ID</p>
                            <p className="text-xl font-black text-white tracking-widest font-mono italic">{payment.transactionId}</p>
                          </div>

                          <div className="lg:border-l lg:border-sky-800 lg:pl-8">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-0.5">Amount</p>
                            <p className="text-2xl font-black text-cyan-400 italic">₹{payment.amount.toLocaleString()}</p>
                          </div>

                          <div className="w-full lg:w-auto lg:border-l lg:border-sky-800 lg:pl-8 flex flex-wrap gap-2 md:gap-3">
                            <button 
                              onClick={() => {
                                const ord = orders.find(o => o.id === payment.orderId);
                                if (ord) {
                                  toast((t) => (
                                    <div className="text-white text-xs">
                                      <p className="font-black uppercase mb-2">Order Items:</p>
                                      {ord.items.map((it: any, i: number) => (
                                        <p key={i}>• {it.quantity}x {it.name}</p>
                                      ))}
                                      <p className="mt-2 text-sky-400">Total: ₹{ord.total}</p>
                                      <button onClick={() => toast.dismiss(t.id)} className="mt-4 text-cyan-400 font-bold uppercase">Close</button>
                                    </div>
                                  ), { duration: 5000, style: { background: '#082f49', border: '1px solid #0c4a6e' } });
                                }
                              }}
                              className="px-4 py-3 bg-sky-950 text-sky-400 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest border border-sky-800 transition-all flex-1 lg:flex-none text-center"
                            >
                              Check Items
                            </button>
                            {payment.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => {
                                    const reason = prompt('Rejection Reason (optional):');
                                    handleUpdatePaymentStatus(payment, 'rejected', reason || undefined);
                                  }}
                                  disabled={processingPaymentId === payment.id}
                                  className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex-1 lg:flex-none text-center disabled:opacity-50"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => {
                                    handleUpdatePaymentStatus(payment, 'approved');
                                  }}
                                  disabled={processingPaymentId === payment.id}
                                  className={cn(
                                    "px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20 flex-1 lg:flex-none text-center disabled:opacity-50",
                                    processingPaymentId === payment.id && "animate-pulse"
                                  )}
                                >
                                  {processingPaymentId === payment.id ? 'Processing...' : 'Approve'}
                                </button>
                              </>
                            ) : (
                              <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                                payment.status === 'approved' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              )}>
                                {payment.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {payment.status}
                              </div>
                            )}
                          </div>
                        </div>
                        {payment.rejectionReason && (
                          <div className="mt-4 p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-[10px] text-red-400 font-bold">
                            Reason: {payment.rejectionReason}
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-sky-800/50 flex justify-between items-center text-[9px] font-black text-sky-600 uppercase tracking-widest">
                          <span>Request Received: {formatDate(payment.createdAt)}</span>
                          {payment.updatedAt && <span>Verified: {formatDate(payment.updatedAt)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">System Control</h2>
                  <button 
                    onClick={() => {
                      playAlert();
                      toast.success('Alert sequence started (5 cycles)');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95"
                  >
                    <Bell className="w-4 h-4" /> Test Alert Sound
                  </button>
                </div>

                {/* Payment Method Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-sky-900/40 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-5 h-5 text-cyan-400" />
                          <h3 className="text-xl font-bold text-white italic">QR Payment</h3>
                        </div>
                        <p className="text-sky-400 text-xs">
                          Enable manual QR payment verification for customer orders.
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSetting('qrPaymentEnabled')}
                        className={cn(
                          "relative w-16 h-8 rounded-full transition-all duration-300",
                          settings.qrPaymentEnabled ? "bg-cyan-500" : "bg-sky-950 border border-sky-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md",
                          settings.qrPaymentEnabled ? "left-9" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-sky-900/40 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="w-5 h-5 text-amber-500" />
                          <h3 className="text-xl font-bold text-white italic">Cash on Delivery</h3>
                        </div>
                        <p className="text-sky-400 text-xs">
                          Allow customers to choose COD during checkout.
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSetting('codPaymentEnabled')}
                        className={cn(
                          "relative w-16 h-8 rounded-full transition-all duration-300",
                          settings.codPaymentEnabled ? "bg-amber-500" : "bg-sky-950 border border-sky-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md",
                          settings.codPaymentEnabled ? "left-9" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="bg-sky-900/40 border border-sky-800 rounded-[2.5rem] p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 italic">Test Order Notifications</h3>
                      <p className="text-sky-400 text-sm max-w-md">
                        Enable a "Test Notice" button on product pages for users to verify that order alerts reach the admin panel successfully.
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('testButtonEnabled')}
                      className={cn(
                        "relative w-16 h-8 rounded-full transition-all duration-300",
                        settings.testButtonEnabled ? "bg-cyan-500" : "bg-sky-950 border border-sky-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md",
                        settings.testButtonEnabled ? "left-9" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Test Logs */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-3">
                      <Bug className="w-5 h-5 text-cyan-400" /> Test Logs
                    </h3>
                    {testRequests.length > 0 && (
                      <button 
                        onClick={clearTests}
                        className="text-[10px] font-black text-sky-600 hover:text-red-500 uppercase tracking-widest transition-colors"
                      >
                        Clear All Logs
                      </button>
                    )}
                  </div>

                  {testRequests.length === 0 ? (
                    <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-sky-800 bg-sky-900/10">
                      <p className="text-sky-400 font-bold uppercase tracking-widest text-[10px]">No test notifications received</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {testRequests.map(test => (
                        <div key={test.id} className="bg-sky-900/20 border border-sky-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                              <Bug className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-bold tracking-tight">
                                {test.userName} <span className="text-sky-500 font-normal">tested notification for</span> {test.productName}
                              </p>
                              <p className="text-[10px] text-sky-600 uppercase tracking-widest mt-1">
                                {formatDate(test.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Success Verified
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeAdminCallId && (
        <LiveCall 
          callId={activeAdminCallId}
          isHost={true}
          onEnd={handleEndAdminCall}
        />
      )}
    </div>
  );
};

export default Admin;
