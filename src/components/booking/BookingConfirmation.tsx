import { Calendar, Clock, MapPin, User, ChevronLeft } from 'lucide-react';

interface BookingConfirmationProps {
  business: any;
  service: any;
  professional: any | null;
  date: Date;
  time: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  tColor?: any;
}

export default function BookingConfirmation({
  business,
  service,
  professional,
  date,
  time,
  onConfirm,
  onBack,
  loading,
  tColor = { bg: 'bg-blue-600', text: 'text-blue-500', bgSubtle: 'bg-blue-600/20', bgHover: 'hover:bg-blue-500' }
}: BookingConfirmationProps) {
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
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Confirma tu reserva</h2>
      </div>

      <div className="bg-dark-bg/50 rounded-2xl p-6 border border-white/5 mb-8">
        <h3 className="text-lg font-bold text-white mb-6">{business.name}</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${tColor.bgSubtle} flex items-center justify-center ${tColor.text} shrink-0`}>
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha y Hora</p>
              <p className="text-white font-medium capitalize">{formattedDate}</p>
              <p className={`${tColor.text} font-bold`}>{time}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Servicio</p>
              <p className="text-white font-medium">{service.name}</p>
              <p className="text-gray-500 text-sm">{service.duration_minutes} minutos • ${service.price}</p>
            </div>
          </div>

          {professional && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Profesional</p>
                <p className="text-white font-medium">{professional.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Ubicación</p>
              <p className="text-white font-medium">{business.address || 'No especificada'}</p>
              <p className="text-gray-500 text-sm">{business.city || 'Ecuador'}</p>
            </div>
          </div>
        </div>
      </div>

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
