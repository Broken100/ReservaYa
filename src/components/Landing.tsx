import { motion } from "motion/react";
import { Calendar, CheckCircle, Clock, Zap, Phone, Bell, Shield, Rocket } from "lucide-react";

export const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">ReservaYa</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Características</a>
          <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Precios</a>
          <a href="#contact" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Contacto</a>
          <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all">
            Prueba Gratis
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export const Hero = () => (
  <section className="pt-40 pb-24 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center bg-blue-900/30 px-4 py-1.5 rounded-full mb-8 border border-blue-500/30">
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]">Disponible en Ecuador</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-8">
            Agiliza tus citas <br/> <span className="text-blue-500">en segundos.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-lg leading-relaxed">
            La plataforma de reservas más intuitiva para negocios locales. Gestiona tu tiempo sin esfuerzo.
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <button className="bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              Comenzar ahora <Rocket size={20} />
            </button>
            <button className="bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              Ver Demo <Zap size={20} className="text-blue-500" />
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 lg:mt-0 relative"
        >
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-dark-card p-2">
            <img 
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1074" 
              alt="ReservaYa Interface" 
              className="rounded-[2rem] w-full h-auto opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <motion.div 
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-12 bg-dark-card-highlight p-5 rounded-2xl shadow-2xl border border-white/10 z-20 hidden sm:block"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-900/50 p-2.5 rounded-xl text-blue-400">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reserva Confirmada</p>
                <p className="text-sm font-semibold text-white">Corte Zen - 15:30</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);

export const Features = () => {
  const features = [
    {
      title: "Tiempo Real",
      desc: "Confirmaciones al instante para ti y tus clientes.",
      icon: <Clock className="w-6 h-6 text-blue-500" />,
    },
    {
      title: "Sincronización",
      desc: "Actualización inmediata en todos tus dispositivos.",
      icon: <Zap className="w-6 h-6 text-blue-500" />,
    },
    {
      title: "Seguro",
      desc: "Tus datos y los de tus clientes están siempre protegidos.",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
    },
    {
      title: "Escalable",
      desc: "Crece sin límites, nuestro sistema se adapta a tu volumen.",
      icon: <CheckCircle className="w-6 h-6 text-blue-500" />,
    },
  ];

  return (
    <section id="features" className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Diseñado para la eficiencia</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Elimina el caos administrativo y permite que la tecnología trabaje por ti.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div 
              key={i}
              className="bg-dark-card p-10 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="mb-8 p-3 bg-white/5 w-fit rounded-xl group-hover:bg-blue-600/10 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Pricing = () => (
  <section id="pricing" className="py-32 bg-dark-bg/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-24">
        <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Planes Simples</h2>
        <p className="text-gray-400 text-lg">Impulsa tu negocio con las herramientas correctas.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <div className="bg-dark-card p-12 rounded-[2.5rem] border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Versión Básica</h3>
          <p className="text-gray-500 mb-10 text-sm">Ideal para emprendedores locales.</p>
          <div className="flex items-baseline mb-10">
            <span className="text-5xl font-extrabold text-white">$25</span>
            <span className="text-gray-500 ml-2">/ mensual</span>
          </div>
          <ul className="space-y-5 mb-12 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-300 italic">
              <CheckCircle size={18} className="text-blue-500" /> Reservas ilimitadas
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={18} className="text-blue-500" /> Panel de gestión
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={18} className="text-blue-500" /> Confirmación Email
            </li>
          </ul>
          <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
            Comenzar
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-dark-card-highlight p-12 rounded-[2.5rem] border border-blue-500/50 relative text-white shadow-2xl shadow-blue-500/5 flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Rocket size={120} className="text-blue-600" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 px-5 py-1.5 rounded-b-xl text-[10px] font-bold uppercase tracking-[0.2em] z-10">
            Recomendado
          </div>
          <h3 className="text-xl font-bold mb-2">Versión Pro</h3>
          <p className="text-gray-400 mb-10 text-sm">Gestiona tu crecimiento como experto.</p>
          <div className="flex items-baseline mb-10">
            <span className="text-5xl font-extrabold">$45</span>
            <span className="text-gray-500 ml-2">/ mensual</span>
          </div>
          <ul className="space-y-5 mb-12 flex-1">
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-blue-500" /> Notificaciones Real-time
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-blue-500" /> Recordatorios WhatsApp/SMS
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-blue-500" /> Soporte Prioritario
            </li>
            <li className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-blue-500" /> Personalización de marca
            </li>
          </ul>
          <button className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30">
            Activar Pro
          </button>
        </div>
      </div>
    </div>
  </section>
);

export const Footer = () => (
  <footer className="border-t border-white/5 py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
        <div className="max-w-xs">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">R</div>
            <span className="text-xl font-bold tracking-tighter">ReservaYa</span>
          </div>
          <p className="text-sm">
            Digitalizando el futuro de los negocios locales en Ecuador.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Términos</a>
          <a href="#" className="hover:text-white transition-colors">Soporte</a>
          <span className="text-blue-500">Escalabilidad Garantizada</span>
        </div>
      </div>
      <div className="mt-20 pt-8 border-t border-white/5 text-[10px] text-gray-600 text-center uppercase tracking-widest font-medium">
        © 2024 ReservaYa Ecuador. Todos los derechos reservados.
      </div>
    </div>
  </footer>
);

