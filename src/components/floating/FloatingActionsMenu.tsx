import { motion } from 'motion/react';
import { MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FloatingActionsMenuProps {
  onChatOpen: () => void;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function FloatingActionsMenu({
  onChatOpen,
  whatsappNumber,
  whatsappMessage,
}: FloatingActionsMenuProps) {
  const { t } = useTranslation();

  const handleWhatsApp = () => {
    if (whatsappNumber) {
      const text = encodeURIComponent(whatsappMessage || t('chat.whatsappDefault'));
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* WhatsApp Button */}
      {whatsappNumber && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className="w-12 h-12 rounded-xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 flex items-center justify-center transition-colors"
          aria-label={t('chat.whatsappContact')}
        >
          <Phone size={20} className="text-white" />
        </motion.button>
      )}

      {/* Chat Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onChatOpen}
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-600/30 flex items-center justify-center transition-colors"
        aria-label={t('chat.openAI')}
      >
        <MessageCircle size={20} className="text-white" />
      </motion.button>
    </div>
  );
}
