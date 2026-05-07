import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Package, ShoppingCart, Plus, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Business, Product } from '../../../types/database';

interface ThemeColor {
  bg: string;
  bgHover: string;
  text: string;
  textLight: string;
  border: string;
  borderSubtle: string;
  bgSubtle: string;
  bgSubtleHover: string;
  shadow: string;
  shadowLg: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductCartProps {
  products: Product[];
  cart: CartItem[];
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  cartTotal: number;
  onCheckout: () => void;
  checkoutLoading: boolean;
  paymentMethod: 'cash' | 'transfer';
  onPaymentMethodChange: (method: 'cash' | 'transfer') => void;
  business: Pick<Business, 'qr_code_url' | 'whatsapp_direct' | 'whatsapp_number'>;
}

function ProductCard({ prod, cartItem, textClass, textMutedClass, isMinimal, tColor, onAddToCart, onUpdateQuantity }: {
  prod: Product;
  cartItem: CartItem | undefined;
  textClass: string;
  textMutedClass: string;
  isMinimal: boolean;
  tColor: ThemeColor;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
}) {
  const { t } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const features = prod.key_features?.filter(Boolean) ?? [];

  return (
    <div className={`rounded-2xl overflow-hidden group flex flex-col border transition-all ${isMinimal ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg' : 'border-white/5 bg-dark-card hover:border-white/10'}`}>
      <div className={`aspect-[4/3] relative w-full border-b ${isMinimal ? 'border-gray-100 bg-gray-50' : 'border-white/5 bg-black/20'}`}>
        {prod.image_url ? (
          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-500 opacity-50" />
          </div>
        )}
        {!prod.stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-full uppercase text-sm tracking-wider">{t('booking.stockOut')}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className={`font-bold ${textClass} mb-1 line-clamp-2 text-lg leading-snug`}>{prod.name}</h3>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {prod.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isMinimal ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
              {prod.category}
            </span>
          )}
          {prod.stock > 0 ? (
            <span className={`text-xs ${isMinimal ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('booking.stockAvailable', { count: prod.stock })}
            </span>
          ) : (
            <span className="text-xs text-red-400 font-medium">{t('booking.stockOut')}</span>
          )}
        </div>

        {prod.description && (
          <p className={`${textMutedClass} text-sm line-clamp-2 mb-3`}>{prod.description}</p>
        )}

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {features.slice(0, 2).map((feat, i) => (
              <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isMinimal ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                {feat}
              </span>
            ))}
            {features.length > 2 && (
              <span className="text-[10px] text-gray-500">{t('booking.moreFeatures', { count: features.length - 2 })}</span>
            )}
          </div>
        )}

        {prod.instructions && (
          <div className="mb-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`flex items-center gap-1 text-xs font-medium ${isMinimal ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'} transition-colors`}
            >
              {showInstructions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showInstructions ? t('booking.hideInstructions') : t('booking.viewInstructions')}
            </button>
            {showInstructions && (
              <p className={`${textMutedClass} text-xs mt-1.5 leading-relaxed`}>{prod.instructions}</p>
            )}
          </div>
        )}

        <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isMinimal ? 'border-gray-100' : 'border-white/5'}`}>
          <span className={`${tColor.text} font-bold text-xl`}>${prod.price.toFixed(2)}</span>

          {prod.stock > 0 ? (
            cartItem ? (
              <div className={`flex items-center gap-3 ${tColor.bgSubtle} border ${tColor.borderSubtle} rounded-lg p-1`}>
                <button onClick={() => onUpdateQuantity(prod.id, -1)} className={`p-1 ${tColor.text} ${tColor.bgSubtleHover} rounded-md transition-colors`}><Minus size={16} /></button>
                <span className={`font-bold ${tColor.text} w-4 text-center`}>{cartItem.quantity}</span>
                <button onClick={() => onUpdateQuantity(prod.id, 1)} className={`p-1 ${tColor.text} ${tColor.bgSubtleHover} rounded-md transition-colors`} disabled={cartItem.quantity >= prod.stock}><Plus size={16} /></button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(prod)}
                className={`px-4 py-2 ${tColor.bg} ${tColor.bgHover} text-white rounded-lg font-bold text-sm transition-all shadow-lg ${tColor.shadow}`}
              >
                {t('booking.add')}
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProductCart({
  products, cart, textClass, textMutedClass, cardClass, isMinimal, tColor,
  onAddToCart, onUpdateQuantity, onRemoveFromCart, cartTotal, onCheckout,
  checkoutLoading, paymentMethod, onPaymentMethodChange, business
}: ProductCartProps) {
  const { t } = useTranslation();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => {
            const cartItem = cart.find(i => i.product.id === prod.id);
            return (
              <ProductCard
                key={prod.id}
                prod={prod}
                cartItem={cartItem}
                textClass={textClass}
                textMutedClass={textMutedClass}
                isMinimal={isMinimal}
                tColor={tColor}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
              />
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">{t('booking.cart.noProducts')}</div>
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className={`fixed bottom-8 right-8 ${tColor.bg} ${tColor.bgHover} text-white p-4 rounded-full shadow-2xl ${tColor.shadowLg} flex items-center gap-3 transition-transform hover:scale-105 z-40 group`}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 ${isMinimal ? 'border-gray-900' : 'border-dark-bg'}`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <span className="font-bold hidden sm:inline-block pr-2">{t('booking.cart.viewCart')} • ${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-dark-card">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className={tColor.text} /> {t('booking.cart.title')}
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-4 bg-dark-card p-4 rounded-2xl border border-white/5">
                  <div className="w-20 h-20 rounded-xl bg-dark-bg border border-white/5 overflow-hidden shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-600" /></div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white leading-tight pr-2">{item.product.name}</h4>
                      <button onClick={() => onRemoveFromCart(item.product.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className={`${tColor.textLight} font-bold mt-1`}>${item.product.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1">
                        <button onClick={() => onUpdateQuantity(item.product.id, -1)} className="p-1 text-gray-400 hover:text-white rounded transition-colors"><Minus size={14} /></button>
                        <span className="font-bold text-white w-4 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.product.id, 1)} className="p-1 text-gray-400 hover:text-white rounded transition-colors" disabled={item.quantity >= item.product.stock}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-white font-bold mb-4">{t('booking.cart.paymentMethod')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cash' ? `${tColor.bgSubtle} ${tColor.border} ${tColor.textLight}` : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'}`}>
                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => onPaymentMethodChange('cash')} className="hidden" />
                    <span className="font-bold">{t('booking.cart.cash')}</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'transfer' ? `${tColor.bgSubtle} ${tColor.border} ${tColor.textLight}` : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'}`}>
                    <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => onPaymentMethodChange('transfer')} className="hidden" />
                    <span className="font-bold">{t('booking.cart.transfer')}</span>
                  </label>
                </div>
                {paymentMethod === 'transfer' && (
                  <div className={`mt-4 ${tColor.bgSubtle} border ${tColor.borderSubtle} p-4 rounded-xl flex flex-col items-center text-center gap-3`}>
                    {business.qr_code_url && (
                      <div className="w-40 h-40 bg-white rounded-xl overflow-hidden p-2 shadow-sm">
                        <img src={business.qr_code_url} alt="Código QR para pago" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <p className={`text-sm ${tColor.textLight} font-medium`}>
                      {business.whatsapp_direct 
                        ? t('booking.cart.transferWhatsApp') 
                        : t('booking.cart.transferNote')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-dark-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium">{t('booking.cart.totalToPay')}</span>
                <span className="text-3xl font-bold text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={onCheckout}
                disabled={checkoutLoading || cart.length === 0}
                className={`w-full flex items-center justify-center gap-2 ${tColor.bg} text-white py-4 rounded-xl font-bold ${tColor.bgHover} transition-colors disabled:opacity-50`}
              >
                {checkoutLoading ? <Loader2 className="animate-spin" /> : t('booking.cart.confirmOrder')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}