import { Banknote, CreditCard } from 'lucide-react';
import type { Business, Service, Professional, PaymentMethod } from '../../../types/database';

interface ThemeColor {
  [key: string]: string;
}

interface ConfirmationStepProps {
  business: Business;
  service: Service;
  professional: Professional | null;
  date: Date;
  time: string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  tColor: ThemeColor;
}

export default function ConfirmationStep({
  business,
  service,
  professional,
  date,
  time,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onBack,
  loading,
  tColor
}: ConfirmationStepProps) {
  const formattedDate = date.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-dark-card rounded-3xl p-8 border border-white/5">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} disabled={loading} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 disabled:opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-bold text-white">Confirma tu reserva</h2>
      </div>

      <div className="bg-dark-bg/50 rounded-2xl p-6 border border-white/5 mb-6">
        <h3 className="text-lg font-bold text-white mb-6">{business.name}</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} shrink-0`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha y Hora</p>
              <p className="text-white font-medium capitalize">{formattedDate}</p>
              <p className={`${tColor.text} font-bold`}>{time}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Servicio</p>
              <p className="text-white font-medium">{service.name}</p>
              <p className="text-gray-500 text-sm">
                {service.duration_display || `${service.duration_minutes} min`} • ${service.price.toFixed(2)}
              </p>
            </div>
          </div>

          {professional && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Profesional</p>
                <p className="text-white font-medium">{professional.full_name || professional.name}</p>
                {(professional.position || professional.specialty) && (
                  <p className="text-gray-500 text-sm">{professional.position || professional.specialty}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Método de pago</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentMethodChange('cash')}
            disabled={loading}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === 'cash'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/5 bg-dark-bg hover:border-white/10'
            }`}
          >
            <Banknote size={24} className={paymentMethod === 'cash' ? 'text-blue-400' : 'text-gray-500'} />
            <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-400'}`}>
              Efectivo
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange('transfer')}
            disabled={loading}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === 'transfer'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/5 bg-dark-bg hover:border-white/10'
            }`}
          >
            <CreditCard size={24} className={paymentMethod === 'transfer' ? 'text-purple-400' : 'text-gray-500'} />
            <span className={`text-sm font-medium ${paymentMethod === 'transfer' ? 'text-white' : 'text-gray-400'}`}>
              Transferencia
            </span>
          </button>
        </div>
      </div>

      {/* QR code for transfer */}
      {paymentMethod === 'transfer' && (business.qr_code_url || business.whatsapp_direct) && (
        <div className={`${tColor.bgSubtle} border ${tColor.borderSubtle || 'border-blue-500/20'} p-6 rounded-2xl flex flex-col items-center text-center gap-4 mb-6`}>
          <h4 className="text-white font-bold">Pago por Transferencia</h4>
          {business.qr_code_url && (
            <div className="w-40 h-40 bg-white rounded-xl overflow-hidden p-2 shadow-sm">
              <img src={business.qr_code_url} alt="Código QR para pago" className="w-full h-full object-contain" />
            </div>
          )}
          <p className={`text-sm ${tColor.text} font-medium max-w-sm`}>
            {business.whatsapp_direct 
              ? 'Al confirmar, serás redirigido a WhatsApp para enviar el comprobante de tu pago.' 
              : 'Si realizaste tu pago por transferencia, recuerda enviar el comprobante por nuestros canales de contacto.'}
          </p>
        </div>
      )}

      {/* Cash payment note */}
      {paymentMethod === 'cash' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6">
          <p className="text-emerald-400 text-sm font-medium text-center">
            Pagarás en efectivo al momento del servicio.
          </p>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={loading}
        className={`w-full ${tColor.bg} ${tColor.bgHover} text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {loading ? 'Confirmando...' : 'Confirmar Reserva'}
      </button>
    </div>
  );
}