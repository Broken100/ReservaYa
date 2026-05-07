import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2, Link, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

interface SuccessStepProps {
  serviceName: string;
  dateStr: string;
  time: string;
  textClass: string;
  textMutedClass: string;
  cardClass: string;
  paymentMethod: 'cash' | 'transfer';
  onViewReservations: () => void;
  bookingId: string | null;
  businessSlug: string;
}

export default function SuccessStep({ serviceName, dateStr, time, textClass, textMutedClass, cardClass, paymentMethod, onViewReservations, bookingId, businessSlug }: SuccessStepProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${businessSlug}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      setProofUrl(publicUrl);

      if (bookingId) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ payment_proof_url: publicUrl })
          .eq('id', bookingId);

        if (updateError) throw updateError;
      }

      toast.success(t('booking.proofAttached') || 'Comprobante adjuntado');
    } catch (err: any) {
      console.error('Error uploading proof:', err);
      setUploadError(t('booking.uploadError') || 'Error al subir');
      toast.error(t('booking.uploadError') || 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

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

      {proofUrl && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Check size={16} className="text-green-400" />
          <span className={`${textMutedClass} text-sm`}>{t('booking.proofAttached') || 'Comprobante adjuntado'}</span>
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm ml-2">
            Ver
          </a>
        </div>
      )}

      {paymentMethod === 'transfer' && !proofUrl && (
        <div className="mb-6">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleProofUpload}
              className="hidden"
            />
            <div className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {t('booking.attachProof') || 'Adjuntar comprobante'}
            </div>
          </label>
          {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
        </div>
      )}

      <div className="flex gap-4 justify-center mt-4">
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