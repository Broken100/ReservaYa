interface SuccessStepProps {
  serviceName: string;
  dateStr: string;
  time: string;
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  onViewReservations: () => void;
}

export default function SuccessStep({ serviceName, dateStr, time, textClass, textMutedClass, cardClass, onViewReservations }: SuccessStepProps) {
  return (
    <div className={`${cardClass} rounded-3xl p-12 text-center`}>
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className={`text-2xl font-bold ${textClass} mb-4`}>¡Reserva Confirmada!</h2>
      <p className={`${textMutedClass} mb-8 max-w-md mx-auto`}>
        Tu cita para {serviceName} el {dateStr} a las {time} ha sido registrada.
      </p>
      <div className="flex gap-4 justify-center">
        <button 
          onClick={onViewReservations}
          className={`px-6 py-3 bg-white/5 hover:bg-white/10 ${textClass} rounded-xl font-medium transition-colors`}
        >
          Ver mis reservas
        </button>
      </div>
    </div>
  );
}
