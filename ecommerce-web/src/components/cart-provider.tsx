"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  variantId?: string | null;
  sizeLabel?: string | null;
  colorLabel?: string | null;
  price: number;
  quantity: number;
}

type State = {
  items: CartItem[];
  hydrated: boolean;
};

type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "SET_QTY"; id: string; variantId?: string | null; quantity: number }
  | { type: "REMOVE"; id: string; variantId?: string | null }
  | { type: "CLEAR" };

const STORAGE_KEY = "atelier:cart:v2";
const LEGACY_KEY = "atelier:cart:v1";

const matches = (a: CartItem, id: string, variantId?: string | null) =>
  a.id === id && (a.variantId ?? "") === (variantId ?? "");

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };
    case "ADD": {
      const idx = state.items.findIndex((i) =>
        matches(i, action.item.id, action.item.variantId),
      );
      const items =
        idx >= 0
          ? state.items.map((i, k) =>
              k === idx
                ? { ...i, quantity: i.quantity + action.item.quantity }
                : i,
            )
          : [...state.items, action.item];
      return { ...state, items };
    }
    case "SET_QTY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !matches(i, action.id, action.variantId),
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          matches(i, action.id, action.variantId)
            ? { ...i, quantity: action.quantity }
            : i,
        ),
      };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (i) => !matches(i, action.id, action.variantId),
        ),
      };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQuantity: (
    id: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
  removeItem: (id: string, variantId?: string | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      dispatch({ type: "HYDRATE", items: Array.isArray(parsed) ? parsed : [] });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore
    }
  }, [state.items, state.hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((item) => {
    dispatch({
      type: "ADD",
      item: { ...item, quantity: item.quantity ?? 1 },
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (id, quantity, variantId) => {
      dispatch({ type: "SET_QTY", id, variantId, quantity });
    },
    [],
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>(
    (id, variantId) => {
      dispatch({ type: "REMOVE", id, variantId });
    },
    [],
  );

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = state.items.reduce(
      (s, i) => s + i.price * i.quantity,
      0,
    );
    return {
      items: state.items,
      hydrated: state.hydrated,
      count,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [state, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
