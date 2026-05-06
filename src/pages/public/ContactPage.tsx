import { useTranslation } from 'react-i18next';
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Navbar, Footer } from "../../components/Landing";

export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-dark-bg text-white selection:bg-blue-600/30">
      <Navbar />
      
      <main className="pt-40 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {t('contact.title')}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-dark-card p-8 rounded-3xl border border-white/5 space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('contact.email')}</h3>
                    <p className="text-gray-400">soporte@reservaya.ec</p>
                    <p className="text-gray-500 text-sm mt-1">{t('contact.emailResponse')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('contact.phone')}</h3>
                    <p className="text-gray-400">+593 99 999 9999</p>
                    <p className="text-gray-500 text-sm mt-1">{t('contact.phoneHours')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('contact.office')}</h3>
                    <p className="text-gray-400">{t('contact.officeLocation')}</p>
                    <p className="text-gray-500 text-sm mt-1">{t('contact.officeSector')}</p>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="p-8 rounded-3xl bg-blue-600/5 border border-blue-500/10">
                <div className="flex items-center gap-3 mb-4 text-blue-400">
                  <MessageSquare size={20} />
                  <span className="font-bold text-sm uppercase tracking-widest">{t('contact.supportLabel')}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  {t('contact.testimonial')}
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-dark-card-highlight p-10 rounded-[2.5rem] border border-white/10 shadow-2xl"
            >
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('contact.form.name')}</label>
                    <input 
                      type="text" 
                      placeholder={t('contact.form.namePlaceholder')} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('contact.form.email')}</label>
                    <input 
                      type="email" 
                      placeholder={t('contact.form.emailPlaceholder')} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('contact.form.subject')}</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all appearance-none">
                    <option className="bg-dark-bg">{t('contact.form.subjects.plans')}</option>
                    <option className="bg-dark-bg">{t('contact.form.subjects.support')}</option>
                    <option className="bg-dark-bg">{t('contact.form.subjects.sales')}</option>
                    <option className="bg-dark-bg">{t('contact.form.subjects.other')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('contact.form.message')}</label>
                  <textarea 
                    rows={4}
                    placeholder={t('contact.form.messagePlaceholder')} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all resize-none"
                  ></textarea>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]">
                  {t('contact.form.submit')} <Send size={20} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
