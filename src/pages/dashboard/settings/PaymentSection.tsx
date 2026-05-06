import { useTranslation } from 'react-i18next';
import { Loader2, Store } from 'lucide-react';

interface PaymentSectionProps {
  whatsapp_direct: boolean;
  qr_code_url: string;
  setForm: (updater: (prev: { whatsapp_direct: boolean; qr_code_url: string }) => { whatsapp_direct: boolean; qr_code_url: string }) => void;
  uploadingQr: boolean;
  onQrUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tColor: Record<string, string>;
}

export default function PaymentSection({ whatsapp_direct, qr_code_url, setForm, uploadingQr, onQrUpload, tColor }: PaymentSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-dark-card rounded-3xl p-8 border border-white/5 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">{t('settings.paymentTitle')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('settings.paymentDesc')}</p>
          
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
            <input 
              type="checkbox" 
              checked={whatsapp_direct} 
              onChange={e => setForm(p => ({ ...p, whatsapp_direct: e.target.checked }))} 
              className="w-5 h-5 accent-blue-600 rounded" 
            />
            <div>
              <span className="text-white text-sm font-bold block">{t('settings.whatsappRedirect')}</span>
              <span className="text-gray-400 text-xs block mt-1">{t('settings.whatsappRedirectDesc')}</span>
            </div>
          </label>
        </div>
        
        <div className="flex flex-col items-center gap-4 bg-dark-bg p-6 rounded-2xl border border-white/5 shrink-0 w-full md:w-64">
          <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-2 relative">
            {qr_code_url ? (
              <img src={qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <Store size={32} className="text-gray-300 mx-auto mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('settings.noQr')}</span>
              </div>
            )}
            {uploadingQr && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <label className={`w-full py-2 px-4 ${tColor.bgSubtle} ${tColor.text} rounded-lg text-sm font-bold cursor-pointer text-center hover:bg-white/10 transition-colors border ${tColor.borderSubtle}`}>
            {uploadingQr ? t('settings.uploading') : t('settings.uploadQr')}
            <input type="file" accept="image/*" className="hidden" onChange={onQrUpload} disabled={uploadingQr} />
          </label>
        </div>
      </div>
    </section>
  );
}
