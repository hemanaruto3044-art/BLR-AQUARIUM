import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  deliveryCharge: number;
  isFreeDelivery: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemsCount: number;
  deliveryTotal: number;
  itemsTotal: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any) => {
    const isUpdate = cart.some(item => item.id === product.id);
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.images?.[0] || '',
        quantity: 1,
        deliveryCharge: Number(product.deliveryCharge) || 0,
        isFreeDelivery: !!product.isFreeDelivery
      }];
    });
    
    if (isUpdate) {
      toast.success(`Updated ${product.name} quantity`);
    } else {
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    toast.error('Removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const itemsCount = React.useMemo(() => cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0), [cart]);
  const itemsTotal = React.useMemo(() => cart.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0), [cart]);
  const deliveryTotal = React.useMemo(() => cart.reduce((total, item) => total + (item.isFreeDelivery ? 0 : (Number(item.deliveryCharge) || 0)), 0), [cart]);
  const totalAmount = React.useMemo(() => itemsTotal + deliveryTotal, [itemsTotal, deliveryTotal]);

  const value = React.useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemsCount,
    deliveryTotal,
    itemsTotal,
    totalAmount
  }), [cart, itemsCount, deliveryTotal, itemsTotal, totalAmount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
