import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  useEffect(() => {
    if(cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    }
  }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const stock: Stock = (await api.get(`/stock/${productId}`)).data

      let product: undefined | Product;

      for(let i = 0; i < cart.length; i++) {
        if(cart[i].id === productId) {
          product = cart[i];
          break;
        }
      }

      if(product) {
        if(stock.amount > product.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          setCart((prevCart) => prevCart.map(product => (product.id === productId ? {...product, amount: 1}: product)));
        }
      } else {
        if(stock.amount > 0) {
          const res = await api.get(`/products/${productId}`)
          const newProduct = res.data;
          setCart((prevCart) => [...prevCart, {...newProduct, amount: 1} as Product])
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart((prevCart) => {
        const t = prevCart.filter((product) => {return product.id !== productId});
        console.log(productId);
        console.log(t);
        return t
      })
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0)
        return
      
        const stock: Stock = (await api.get(`/stock/${productId}`)).data
        if(stock.amount >= amount) {
          setCart((prevCart) => prevCart.map(product => (product.id === productId ? {...product, amount: amount}: product)));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
