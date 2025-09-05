import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus } from "lucide-react";

const CartSidebar = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Your Cart</h3>
              <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 bg-gray-50/60">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-2">🛍️</div>
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 shadow-sm"
                >
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                        {item.variant && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Object.entries(item.variant)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                        {item.price && (
                          <p className="text-xs text-gray-500">₹{item.price} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onClearCart}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Clear Cart
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold"
              >
                Checkout
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;


