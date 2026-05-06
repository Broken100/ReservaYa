import { useTranslation } from 'react-i18next';
import { Navbar, Hero, Features, Pricing, Footer } from '../components/Landing';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark-bg selection:bg-blue-600/30 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        
        {/* Call to Action Section */}
        <section className="py-20 lg:py-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-dark-card rounded-[3rem] p-12 lg:p-24 relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12 border border-white/5">
              <div className="relative z-10 max-w-xl">
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-[1.2]">
                  {t('cta.title')}
                </h2>
                <p className="text-gray-400 text-lg italic max-w-sm">
                  {t('cta.subtitle')}
                </p>
              </div>
              <div className="relative z-10">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-block bg-white text-black px-12 py-5 rounded-2xl text-xl font-bold hover:bg-gray-200 transition-all shadow-2xl shadow-blue-500/10 active:scale-95 cursor-pointer"
                >
                  {t('cta.button')}
                </button>
              </div>
              
              {/* Abstract Background Ornaments */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[100px]" />
            </div>
          </div>
        </section>

        <Features />
        <Pricing />
        
        {/* Simple Business Trust Logo Section */}
        <section className="py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-16">{t('trust.label')}</p>
            <div className="flex flex-wrap justify-center items-center gap-16 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-2 font-bold text-lg text-white">🏥 {t('trust.clinics')}</div>
              <div className="flex items-center gap-2 font-bold text-lg text-white">💇 {t('trust.salons')}</div>
              <div className="flex items-center gap-2 font-bold text-lg text-white">🍽️ {t('trust.restaurants')}</div>
              <div className="flex items-center gap-2 font-bold text-lg text-white">🏋️ {t('trust.gyms')}</div>
              <div className="flex items-center gap-2 font-bold text-lg text-white">🦷 {t('trust.dentists')}</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
