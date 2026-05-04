import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Loader2, User, ChevronRight, Package, Instagram, Facebook, Globe, MessageCircle, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AvailabilityCalendar from '../../components/booking/AvailabilityCalendar';
import BookingConfirmation from '../../components/booking/BookingConfirmation';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { useTheme, THEMES, THEME_COLORS } from '../../hooks/useTheme';

type BookingStep = 'service' | 'professional' | 'datetime' | 'confirmation' | 'success';

export default function BookingPage() {
  const { t } = useTranslation();
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View state
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  // Booking state
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Cart state
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    async function fetchBusinessData() {
      if (!businessSlug) return;
      
      try {
        setLoading(true);
        // 1. Fetch business
        const { data: bData, error: bError } = await (supabase
          .from('businesses')
          .select('*')
          .eq('slug', businessSlug)
          .single() as any);
          
        if (bError || !bData) throw new Error('Negocio no encontrado');
        setBusiness(bData);

        // 2. Fetch services
        const { data: sData } = await (supabase
          .from('services')
          .select('*')
          .eq('business_id', bData.id)
          .eq('is_active', true) as any);
          
        setServices(sData || []);

        // 3. Fetch professionals
        const { data: pData } = await (supabase
          .from('professionals')
          .select('*')
          .eq('business_id', bData.id)
          .eq('is_active', true) as any);
          
        setProfessionals(pData || []);

        // 4. Fetch products
        if (bData.settings?.enable_products) {
          const { data: prodData } = await (supabase
            .from('products')
            .select('*')
            .eq('business_id', bData.id)
            .eq('is_active', true) as any);
            
          setProducts(prodData || []);
        }

        // Set initial tab if services are disabled but products are enabled
        if (bData.settings?.show_services === false && bData.settings?.show_products !== false) {
          setActiveTab('products');
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessData();
  }, [businessSlug]);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    if (professionals.length > 0) {
      setStep('professional');
    } else {
      setStep('datetime');
    }
  };

  const handleProfessionalSelect = (professional: any | null) => {
    setSelectedProfessional(professional);
    setStep('datetime');
  };

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    
    if (!user) {
      localStorage.setItem('pendingBooking', JSON.stringify({
        businessSlug,
        serviceId: selectedService.id,
        professionalId: selectedProfessional?.id || null,
        date: date.toISOString(),
        time
      }));
      navigate('/login?redirect=/reservar/' + businessSlug);
      return;
    }
    setStep('confirmation');
  };

  const { createBooking: saveBooking, error: bookingError } = useBookings({ businessId: business?.id });

  const confirmBooking = async () => {
    if (!user || !business || !selectedService || !selectedDate || !selectedTime) return;

    setConfirming(true);
    try {
      const endTime = new Date(new Date(`1970-01-01T${selectedTime}`).getTime() + selectedService.duration_minutes * 60000).toTimeString().substring(0, 5) + ':00';
      
      const success = await saveBooking({
        business_id: business.id,
        service_id: selectedService.id,
        professional_id: selectedProfessional?.id || null,
        client_id: user.id,
        booking_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        start_time: selectedTime + ':00',
        end_time: endTime,
        status: 'pending'
      });

      if (!success) return;
      setStep('success');
    } catch (err: any) {
      alert('Error al confirmar la reserva: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Check for pending booking after login
  useEffect(() => {
    if (user && business && step === 'service') {
      const pendingStr = localStorage.getItem('pendingBooking');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.businessSlug === businessSlug) {
            const svc = services.find(s => s.id === pending.serviceId);
            const prof = professionals.find(p => p.id === pending.professionalId);
            
            if (svc) {
              setSelectedService(svc);
              setSelectedProfessional(prof || null);
              setSelectedDate(new Date(pending.date));
              setSelectedTime(pending.time);
              setStep('confirmation');
            }
          }
          localStorage.removeItem('pendingBooking');
        } catch (e) {}
      }
    }
  }, [user, business, step, businessSlug, services, professionals]);

  // Cart Functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.product.stock) return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=/reservar/' + businessSlug);
      return;
    }

    if (cart.length === 0) return;

    setCheckoutLoading(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price
      }));

      const { data, error } = await supabase.rpc('checkout', {
        p_business_id: business.id,
        p_client_id: user.id,
        p_payment_method: paymentMethod,
        p_items: items
      });

      if (error) throw error;
      
      setCart([]);
      setIsCartOpen(false);
      setOrderSuccess(true);
    } catch (err: any) {
      alert('Error al procesar la compra: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };


  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (error || !business) return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-red-400">{error || 'Negocio no encontrado'}</div>;

  const settings = business.settings || {};
  const themeClass = THEMES[settings.theme] || THEMES.default;
  const tColor = THEME_COLORS[settings.theme] || THEME_COLORS.default;
  const isMinimal = settings.theme === 'minimal';
  const textClass = isMinimal ? 'text-gray-900' : 'text-white';
  const textMutedClass = isMinimal ? 'text-gray-600' : 'text-gray-400';
  const cardClass = isMinimal ? 'bg-white shadow-xl border border-gray-100' : 'bg-dark-card border border-white/5';

  if (orderSuccess) {
    return (
      <div className={`min-h-screen ${themeClass} flex items-center justify-center px-4`}>
        <div className={`${cardClass} rounded-3xl p-12 text-center max-w-md w-full animate-in zoom-in duration-300`}>
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${textClass} mb-4`}>¡Compra Exitosa!</h2>
          <p className={`${textMutedClass} mb-8`}>
            Tu pedido ha sido registrado. Recuerda que el pago es contra entrega (en local) o por transferencia.
          </p>
          <button 
            onClick={() => { setOrderSuccess(false); navigate('/mis-reservas'); }}
            className={`w-full py-4 ${tColor.bg} ${tColor.bgHover} text-white rounded-xl font-bold transition-colors`}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} pb-32 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="text-center mb-10">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} className={`w-24 h-24 rounded-3xl mx-auto mb-5 object-cover shadow-2xl ${tColor.shadow}`} />
          ) : (
            <div className={`w-24 h-24 ${tColor.bg} rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl font-bold text-white shadow-2xl ${tColor.shadow}`}>
              {business.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className={`text-4xl font-bold ${textClass} mb-3`}>{business.name}</h1>
          <p className={`${textMutedClass} flex items-center justify-center gap-2 mb-4`}>
            <MapPin size={16} /> {business.city || 'Ecuador'}
          </p>
          {business.description && (
            <p className={`${textMutedClass} max-w-lg mx-auto leading-relaxed`}>{business.description}</p>
          )}

          {/* SOCIAL LINKS (Linktree Style) */}
          {settings.show_socials !== false && settings.social_links && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {settings.social_links.whatsapp && (
                <a href={`https://wa.me/${settings.social_links.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-full font-medium transition-all">
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
              {settings.social_links.instagram && (
                <a href={settings.social_links.instagram.includes('http') ? settings.social_links.instagram : `https://instagram.com/${settings.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white rounded-full font-medium transition-all">
                  <Instagram size={18} /> Instagram
                </a>
              )}
              {settings.social_links.facebook && (
                <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-full font-medium transition-all">
                  <Facebook size={18} /> Facebook
                </a>
              )}
              {settings.social_links.website && (
                <a href={settings.social_links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-full font-medium transition-all">
                  <Globe size={18} /> Web
                </a>
              )}
            </div>
          )}
        </div>

        {/* TABS */}
        {settings.enable_products && settings.show_products !== false && settings.show_services !== false && (
          <div className="flex justify-center mb-8">
            <div className={`p-1 rounded-2xl flex gap-1 ${isMinimal ? 'bg-gray-200' : 'bg-black/20'}`}>
              <button 
                onClick={() => { setActiveTab('services'); setStep('service'); }}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'services' ? `${tColor.bg} text-white shadow-lg ${tColor.shadow}` : `${textMutedClass} hover:${textClass}`}`}
              >
                Servicios
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? `${tColor.bg} text-white shadow-lg ${tColor.shadow}` : `${textMutedClass} hover:${textClass}`}`}
              >
                Tienda
              </button>
            </div>
          </div>
        )}

        {/* SERVICES FLOW */}
        {activeTab === 'services' && settings.show_services !== false && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === 'service' && (
              <div className={`${cardClass} rounded-3xl p-8`}>
                <h2 className={`text-xl font-bold ${textClass} mb-6`}>{t('booking.selectService')}</h2>
                {services.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Este negocio aún no tiene servicios disponibles.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((svc) => (
                      <button 
                        key={svc.id} 
                        onClick={() => handleServiceSelect(svc)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left group`}
                      >
                        <div>
                          <p className={`font-semibold ${textClass}`}>{svc.name}</p>
                          <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Clock size={12} /> {svc.duration_minutes} {t('booking.minutes')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`${tColor.text} font-bold`}>${svc.price}</span>
                          <ChevronRight size={20} className={`text-gray-400 group-hover:${tColor.text} transition-colors`} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'professional' && (
              <div className={`${cardClass} rounded-3xl p-8`}>
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep('service')} className={`${textMutedClass} hover:${textClass} transition-colors`}>
                    Volver
                  </button>
                  <h2 className={`text-xl font-bold ${textClass}`}>Selecciona un profesional</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleProfessionalSelect(null)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left group`}
                  >
                    <div className={`w-12 h-12 rounded-full ${isMinimal ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center text-gray-400 group-hover:${tColor.text} transition-colors`}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className={`font-medium ${textClass}`}>Cualquiera disponible</p>
                      <p className="text-gray-500 text-xs">Máxima disponibilidad</p>
                    </div>
                  </button>
                  
                  {professionals.map((prof) => (
                    <button 
                      key={prof.id}
                      onClick={() => handleProfessionalSelect(prof)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border ${isMinimal ? `border-gray-200 hover:${tColor.border}` : `border-white/5 hover:${tColor.borderSubtle} ${tColor.bgSubtleHover}`} transition-all text-left`}
                    >
                      {prof.avatar_url ? (
                        <img src={prof.avatar_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} font-bold`}>
                          {prof.name.substring(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${textClass}`}>{prof.name}</p>
                        {prof.specialty && <p className="text-gray-500 text-xs">{prof.specialty}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'datetime' && (
              <AvailabilityCalendar
                businessId={business.id}
                serviceId={selectedService.id}
                professionalId={selectedProfessional?.id || null}
                onSelectTime={handleTimeSelect}
                onBack={() => setStep(professionals.length > 0 ? 'professional' : 'service')}
                tColor={tColor}
              />
            )}

            {step === 'confirmation' && selectedDate && selectedTime && (
              <BookingConfirmation
                business={business}
                service={selectedService}
                professional={selectedProfessional}
                date={selectedDate}
                time={selectedTime}
                onConfirm={confirmBooking}
                onBack={() => setStep('datetime')}
                loading={confirming}
                tColor={tColor}
              />
            )}

            {bookingError && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm text-center">
                {bookingError}
              </div>
            )}

            {step === 'success' && (
              <div className={`${cardClass} rounded-3xl p-12 text-center`}>
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${textClass} mb-4`}>¡Reserva Confirmada!</h2>
                <p className={`${textMutedClass} mb-8 max-w-md mx-auto`}>
                  Tu cita para {selectedService.name} el {selectedDate?.toLocaleDateString('es-EC')} a las {selectedTime} ha sido registrada.
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/mis-reservas')}
                    className={`px-6 py-3 ${isMinimal ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'} ${textClass} rounded-xl font-medium transition-colors`}
                  >
                    Ver mis reservas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS FLOW */}
        {activeTab === 'products' && settings.enable_products && settings.show_products !== false && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => {
                const cartItem = cart.find(i => i.product.id === prod.id);
                return (
                  <div key={prod.id} className={`${cardClass} rounded-2xl overflow-hidden group flex flex-col`}>
                    <div className={`aspect-square relative w-full border-b ${isMinimal ? 'border-gray-100 bg-gray-50' : 'border-white/5 bg-black/20'}`}>
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={40} className="text-gray-500 opacity-50" />
                        </div>
                      )}
                      {!prod.stock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-full uppercase text-sm tracking-wider">Agotado</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className={`font-bold ${textClass} mb-1 truncate text-lg`}>{prod.name}</h3>
                      <p className={`${textMutedClass} text-sm line-clamp-2 mb-4 flex-1`}>{prod.description || 'Sin descripción'}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`${tColor.text} font-bold text-xl`}>${prod.price.toFixed(2)}</span>
                        
                        {prod.stock > 0 ? (
                          cartItem ? (
                            <div className={`flex items-center gap-3 ${tColor.bgSubtle} border ${tColor.borderSubtle} rounded-lg p-1`}>
                              <button onClick={() => updateQuantity(prod.id, -1)} className={`p-1 ${tColor.text} ${tColor.bgSubtleHover} rounded-md transition-colors`}><Minus size={16} /></button>
                              <span className={`font-bold ${tColor.text} w-4 text-center`}>{cartItem.quantity}</span>
                              <button onClick={() => updateQuantity(prod.id, 1)} className={`p-1 ${tColor.text} ${tColor.bgSubtleHover} rounded-md transition-colors`} disabled={cartItem.quantity >= prod.stock}><Plus size={16} /></button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(prod)}
                              className={`px-4 py-2 ${tColor.bg} ${tColor.bgHover} text-white rounded-lg font-bold text-sm transition-all shadow-lg ${tColor.shadow}`}
                            >
                              Agregar
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">No hay productos disponibles por el momento.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING CART BUTTON */}
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
          <span className="font-bold hidden sm:inline-block pr-2">Ver Carrito • ${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* CART SLIDE-OVER */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-dark-card">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className={tColor.text} /> Tu Carrito
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
                      <button onClick={() => removeFromCart(item.product.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className={`${tColor.textLight} font-bold mt-1`}>${item.product.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 text-gray-400 hover:text-white rounded transition-colors"><Minus size={14} /></button>
                        <span className="font-bold text-white w-4 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 text-gray-400 hover:text-white rounded transition-colors" disabled={item.quantity >= item.product.stock}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-white font-bold mb-4">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cash' ? `${tColor.bgSubtle} ${tColor.border} ${tColor.textLight}` : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'}`}>
                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
                    <span className="font-bold">Efectivo en local</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'transfer' ? `${tColor.bgSubtle} ${tColor.border} ${tColor.textLight}` : 'bg-dark-card border-white/5 text-gray-400 hover:bg-white/5'}`}>
                    <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="hidden" />
                    <span className="font-bold">Transferencia</span>
                  </label>
                </div>
                {paymentMethod === 'transfer' && (
                  <div className={`mt-3 ${tColor.bgSubtle} border ${tColor.borderSubtle} p-3 rounded-lg text-sm ${tColor.textLight} text-center`}>
                    Podrás adjuntar el comprobante al retirar tu producto.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-dark-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium">Total a Pagar</span>
                <span className="text-3xl font-bold text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || cart.length === 0}
                className={`w-full flex items-center justify-center gap-2 ${tColor.bg} text-white py-4 rounded-xl font-bold ${tColor.bgHover} transition-colors disabled:opacity-50`}
              >
                {checkoutLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
