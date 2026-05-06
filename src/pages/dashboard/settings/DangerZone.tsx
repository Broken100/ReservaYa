import { useTranslation } from 'react-i18next';

interface DangerZoneProps {
  onDelete: () => void;
}

export default function DangerZone({ onDelete }: DangerZoneProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-red-500/5 rounded-3xl p-8 border border-red-500/20 mb-10 shadow-sm mt-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-red-500">{t('settings.dangerZone')}</h2>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        {t('settings.dangerZoneDesc')}
      </p>
      <button 
        onClick={onDelete}
        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl font-bold transition-all"
      >
        {t('settings.deleteBusiness')}
      </button>
    </section>
  );
}
