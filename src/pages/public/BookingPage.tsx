import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { useTheme, THEMES, THEME_COLORS } from '../../hooks/useTheme';
import BusinessHeader from './booking/BusinessHeader';
import ServiceStep from './booking/ServiceStep';
import ProfessionalStep from './booking/ProfessionalStep';
import DateTimeStep from './booking/DateTimeStep';
import ConfirmationStep from './booking/ConfirmationStep';
import SuccessStep from './booking/SuccessStep';
import ProductCart from './booking/ProductCart';
import PublicReviewList from './booking/PublicReviewList';
import type { Service, Product, Professional, Business } from '../../types/database';

type BookingStep = 'service' | 'professional' | 'datetime' | 'confirmation' | 'success';

export default function BookingPage() {
  const { t } = useTranslation();
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isBusinessPro, setIsBusinessPro] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View state
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  // Booking state
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    async function fetchBusinessData() {
      if (!businessSlug) return;
      
      try {
        setLoading(true);
        // 1. Fetch business
        const { data: bData, error: bError } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', businessSlug)
          .single();
           
        if (bError || !bData) throw new Error('Negocio no encontrado');
        setBusiness(bData as Business);

        // Check owner's plan for Pro-gating
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('user_id', bData.owner_id)
          .eq('status', 'active')
          .single();
        setIsBusinessPro(subData?.plan_id === 'premium');

        // 2. Fetch services
        const { data: sData } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', bData.id)
          .eq('is_active', true);
           
        setServices((sData || []) as Service[]);

        // 3. Fetch professionals
        const { data: pData } = await supabase
          .from('professionals')
          .select('*')
          .eq('business_id', bData.id)
          .eq('is_active', true);
           
        setProfessionals((pData || []) as Professional[]);

        // 4. Fetch products
        if (bData.settings?.enable_products) {
          const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', bData.id)
            .eq('is_active', true);
            
          setProducts((prodData || []) as Product[]);
        }

        // Set initial tab if services are disabled but products are enabled
        if (bData.settings?.show_services === false && bData.settings?.show_products !== false) {
          setActiveTab('products');
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessData();
  }, [businessSlug]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    if (professionals.length > 0) {
      setStep('professional');
    } else {
      setStep('datetime');
    }
  };

  const handleProfessionalSelect = (professional: Professional | null) => {
    setSelectedProfessional(professional);
    setStep('datetime');
  };

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    
    if (!user) {
      localStorage.setItem('pendingBooking', JSON.stringify({
        businessSlug,
        serviceId: selectedService?.id,
        professionalId: selectedProfessional?.id || null,
        date: date.toISOString(),
        time
      }));
      navigate('/login?redirect=/reservar/' + businessSlug);
      return;
    }
    setStep('confirmation');
  };

  const { createBooking: saveBooking, error: bookingError } = useBookings({ businessId: business?.id ?? null });

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
        status: 'pending',
        payment_method: paymentMethod
      });

      if (!success) return;
      setStep('success');

      if (business.whatsapp_direct && business.whatsapp_number) {
        const text = encodeURIComponent(`Hola, agendé una reserva para ${selectedService.name} el ${selectedDate.toLocaleDateString('es-EC')} a las ${selectedTime}. Adjunto el comprobante de pago.`);
        window.open(`https://wa.me/${business.whatsapp_number}?text=${text}`, '_blank');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (msg === 'PLAN_BOOKING_LIMIT') {
        toast.error(t('planGating.bookingLimitDesc', { max: '?' }));
      } else {
        toast.error(t('booking.errorConfirmReserva') + ': ' + msg);
      }
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
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
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

    if (cart.length === 0 || !business) return;

    setCheckoutLoading(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price
      }));

      const { error } = await supabase.rpc('checkout', {
        p_business_id: business.id,
        p_client_id: user.id,
        p_payment_method: paymentMethod,
        p_items: items
      });

      if (error) throw error;
      
      setCart([]);
      setOrderSuccess(true);

      if (paymentMethod === 'transfer' && business.whatsapp_direct && business.whatsapp_number) {
        const text = encodeURIComponent(`Hola, acabo de realizar un pedido. Envío el comprobante de transferencia.`);
        window.open(`https://wa.me/${business.whatsapp_number}?text=${text}`, '_blank');
      }
    } catch (err: unknown) {
      toast.error(t('booking.errorProcessOrder') + ': ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setCheckoutLoading(false);
    }
  };


  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (error || !business) return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-red-400">{error || 'Negocio no encontrado'}</div>;

  const settings = business.settings || {};
  const themeClass = THEMES[settings.theme as string] || THEMES.default;
  const tColor = THEME_COLORS[settings.theme as string] || THEME_COLORS.default;
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
          <h2 className={`text-2xl font-bold ${textClass} mb-4`}>{t('booking.orderSuccess.title')}</h2>
          <p className={`${textMutedClass} mb-8`}>
            {t('booking.orderSuccess.detail')}
          </p>
          <button 
            onClick={() => { setOrderSuccess(false); navigate('/mis-reservas'); }}
            className={`w-full py-4 ${tColor.bg} ${tColor.bgHover} text-white rounded-xl font-bold transition-colors`}
          >
            {t('booking.orderSuccess.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} pb-32 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <BusinessHeader
          business={business}
          settings={settings}
          textClass={textClass}
          textMutedClass={textMutedClass}
          tColor={tColor}
        />

        <PublicReviewList
          businessId={business.id}
          textClass={textClass}
          textMutedClass={textMutedClass}
          cardClass={cardClass}
          isMinimal={isMinimal}
          tColor={tColor}
        />

        {/* TABS */}
        {settings.enable_products && settings.show_products !== false && settings.show_services !== false && (
          <div className="flex justify-center mb-8">
            <div className={`p-1 rounded-2xl flex gap-1 ${isMinimal ? 'bg-gray-200' : 'bg-black/20'}`}>
              <button 
                onClick={() => { setActiveTab('services'); setStep('service'); }}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'services' ? `${tColor.bg} text-white shadow-lg ${tColor.shadow}` : `${textMutedClass} hover:${textClass}`}`}
              >
                {t('booking.services')}
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? `${tColor.bg} text-white shadow-lg ${tColor.shadow}` : `${textMutedClass} hover:${textClass}`}`}
              >
                {t('booking.store')}
              </button>
            </div>
          </div>
        )}

        {/* SERVICES FLOW */}
        {activeTab === 'services' && settings.show_services !== false && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === 'service' && (
              <ServiceStep
                services={services}
                textClass={textClass}
                textMutedClass={textMutedClass}
                cardClass={cardClass}
                isMinimal={isMinimal}
                tColor={tColor}
                isBusinessPro={isBusinessPro}
                onSelect={handleServiceSelect}
              />
            )}

            {step === 'professional' && (
              <ProfessionalStep
                professionals={professionals}
                textClass={textClass}
                textMutedClass={textMutedClass}
                cardClass={cardClass}
                isMinimal={isMinimal}
                tColor={tColor}
                onSelect={handleProfessionalSelect}
                onBack={() => setStep('service')}
              />
            )}

            {step === 'datetime' && selectedService && (
              <DateTimeStep
                businessId={business.id}
                serviceId={selectedService.id}
                professionalId={selectedProfessional?.id || null}
                professionalsCount={professionals.length}
                onSelectTime={handleTimeSelect}
                onBack={() => setStep(professionals.length > 0 ? 'professional' : 'service')}
                tColor={tColor}
              />
            )}

            {step === 'confirmation' && selectedDate && selectedTime && selectedService && (
              <ConfirmationStep
                business={business}
                service={selectedService}
                professional={selectedProfessional}
                date={selectedDate}
                time={selectedTime}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
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

            {step === 'success' && selectedService && selectedDate && selectedTime && (
              <SuccessStep
                serviceName={selectedService.name}
                dateStr={selectedDate.toLocaleDateString('es-EC')}
                time={selectedTime}
                textClass={textClass}
                textMutedClass={textMutedClass}
                cardClass={cardClass}
                onViewReservations={() => navigate('/mis-reservas')}
              />
            )}
          </div>
        )}

        {/* PRODUCTS FLOW */}
        {activeTab === 'products' && settings.enable_products && settings.show_products !== false && (
          <ProductCart
            products={products}
            cart={cart}
            textClass={textClass}
            textMutedClass={textMutedClass}
            cardClass={cardClass}
            isMinimal={isMinimal}
            tColor={tColor}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            cartTotal={cartTotal}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            business={business}
          />
        )}
      </div>
    </div>
  );
}
