import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Store,
  ArrowRight
} from 'lucide-react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MerchantDashboard } from './components/merchant/MerchantDashboard';
import { Toaster } from 'react-hot-toast';

type UserRole = 'guest' | 'admin' | 'merchant';

function App() {
  const [role, setRole] = useState<UserRole>('guest');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  const handleMerchantLogin = (id: string) => {
    setSelectedMerchantId(id);
    setRole('merchant');
  };

  if (role === 'guest') {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

        {/* Ambient background glow */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl w-full text-center space-y-16"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-48 h-48 mx-auto"
              >
                <img src="/logo-white.png" alt="VB.OTIWAA Logo" className="w-full h-full object-contain" />
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  VB.OTIWAA
                </h1>
                <p className="text-2xl lg:text-3xl text-white/90 font-medium tracking-wide font-mono">
                  create.build.inspire.
                </p>
              </div>

              <p className="text-base lg:text-lg text-muted-foreground/60 max-w-xl mx-auto leading-relaxed">
                The enterprise-grade AI commerce platform for WhatsApp. <br />
                Intelligent automation for modern merchants.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-12 max-w-4xl mx-auto">
              {/* Admin Portal Card */}
              <RoleCard
                title="Admin Portal"
                description="System administration and AI persona architecture."
                icon={ShieldCheck}
                onClick={() => setRole('admin')}
                color="#3b82f6"
              />
              {/* Merchant Portal Card */}
              <RoleCard
                title="Merchant Hub"
                description="Order management, analytics, and customer insights."
                icon={Store}
                onClick={() => setRole('merchant')}
                color="#a855f7"
              />
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-xs font-medium text-muted-foreground/40 relative z-10 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} VB.OTIWAA Inc. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Toaster position="top-right" />
      {/* Header / Global Nav */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <img src="/logo-black.png" alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-black text-xl tracking-tight text-foreground">VB.OTIWAA</span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
            {role.toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => setRole('guest')}
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Switch Role <ArrowRight className="w-3 h-3" />
        </button>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {role === 'admin' ? (
              <AdminDashboard onMerchantSelect={handleMerchantLogin} />
            ) : (
              <MerchantDashboard merchantId={selectedMerchantId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const RoleCard = ({ title, description, icon: Icon, onClick, color }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative group overflow-hidden p-8 rounded-[2rem] bg-white/5 border border-white/10 text-left hover:border-white/20 transition-all"
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
      style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
    />

    <div className="relative z-10 space-y-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-muted-foreground font-medium leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold pt-4 group-hover:translate-x-2 transition-transform" style={{ color: color }}>
        Enter Portal <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  </motion.button>
);

export default App;
