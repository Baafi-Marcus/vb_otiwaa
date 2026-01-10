import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Store,
  ArrowRight,
  Lock,
  User,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MerchantDashboard } from './components/merchant/MerchantDashboard';
import LandingPage from './components/LandingPage';
import { Toaster, toast } from 'react-hot-toast';

type UserRole = 'guest' | 'admin' | 'merchant';

const API_BASE = import.meta.env.VITE_API_BASE || '';

/* ----------------------------------------------------------------------------------
   MAIN APP COMPONENT (Router Wrapper)
   ---------------------------------------------------------------------------------- */
function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/trymeFF" element={<AuthPage desiredRole="admin" />} />
        <Route path="/:merchantId" element={<MerchantRouteWrapper />} />
      </Routes>
    </div>
  );
}

/* ----------------------------------------------------------------------------------
   MERCHANT ROUTE WRAPPER (Extracts ID from URL)
   ---------------------------------------------------------------------------------- */
function MerchantRouteWrapper() {
  const { merchantId } = useParams();
  // Validate UUID format roughly to avoid capturing system routes if added later
  // For now, any non-root path is treated as a potential merchant portal attempt
  return <AuthPage desiredRole="merchant" forcedUsername={merchantId} />;
}


/* ----------------------------------------------------------------------------------
   AUTH PAGE (Handles Login for both roles based on route)
   ---------------------------------------------------------------------------------- */
function AuthPage({ desiredRole, forcedUsername }: { desiredRole: UserRole, forcedUsername?: string }) {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('guest');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  // Login State
  const [username, setUsername] = useState(forcedUsername || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupUser, setSetupUser] = useState<any>(null);

  // Check for existing session
  useEffect(() => {
    const savedRole = localStorage.getItem('vb_role') as UserRole;
    const savedId = localStorage.getItem('vb_merchantId');
    const token = localStorage.getItem('vb_token');

    // Auto-restore session if token exists AND matches the desired path/role
    if (token && savedRole) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (desiredRole === 'admin' && savedRole === 'admin') {
        setRole('admin');
      } else if (desiredRole === 'merchant' && savedRole === 'merchant') {
        // Verify if the logged-in merchant matches the URL parameters
        if (forcedUsername && savedId === forcedUsername) {
          setRole('merchant');
          setSelectedMerchantId(savedId);
        } else if (forcedUsername && savedId !== forcedUsername) {
          // Trying to access a different merchant while logged in -> Logout technically
          // Or we could redirect to the correct one, but for security let's require re-login
        }
      }
    }
  }, [desiredRole, forcedUsername]);

  // Update username if forced by URL (e.g. merchant ID) changes
  useEffect(() => {
    if (forcedUsername) setUsername(forcedUsername);
  }, [forcedUsername]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/auth/login`, {
        username,
        password,
        type: desiredRole
      });

      const { access_token, user } = resp.data;

      if (user.setupRequired) {
        setSetupUser({ ...user, type: desiredRole });
        setIsLoading(false);
        return;
      }

      // Successful Login
      localStorage.setItem('vb_token', access_token);
      localStorage.setItem('vb_role', desiredRole);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      if (desiredRole === 'merchant') {
        localStorage.setItem('vb_merchantId', user.id);
        setSelectedMerchantId(user.id);
      }

      setRole(desiredRole);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/api/auth/setup`, {
        id: setupUser.id,
        password,
        type: setupUser.type
      });
      toast.success('Password set! Logging you in...');
      setSetupUser(null);
      // Auto-login after setup could be nicer, but relogin is safe
      handleLogin(e);
    } catch (err: any) {
      toast.error('Setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setRole('guest');
    localStorage.removeItem('vb_role');
    localStorage.removeItem('vb_merchantId');
    localStorage.removeItem('vb_token');
    delete axios.defaults.headers.common['Authorization'];
    console.log("Logged out");
    // Optionally navigate to Landing or reload
    // navigate('/'); 
  };


  /* --------------------------------------------------------------------------------
     RENDER LOGIC
     -------------------------------------------------------------------------------- */

  // 1. If Logged In, Show Dashboard
  if (role === 'admin') {
    return (
      <div className="h-full flex flex-col">
        <Header role="admin" onLogout={handleLogout} />
        <div className="flex-1 overflow-hidden">
          <AdminDashboard onMerchantSelect={(id) => navigate(`/${id}`)} />
        </div>
      </div>
    );
  }

  if (role === 'merchant') {
    return (
      <div className="h-full flex flex-col">
        <Header role="merchant" onLogout={handleLogout} />
        <div className="flex-1 overflow-hidden">
          <MerchantDashboard merchantId={selectedMerchantId} />
        </div>
      </div>
    );
  }

  // 2. If Setup Required (First time password)
  if (setupUser) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative">
        <BackgroundEffects />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl z-10"
        >
          <div className="text-center mb-10 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-green-500/20 text-green-500 mx-auto flex items-center justify-center">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Set Password</h2>
            <p className="text-muted-foreground text-sm font-medium">Hello {setupUser.name}! Please set a secure password for your account.</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-white transition-colors" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-green-600 hover:bg-green-500 shadow-green-500/20 shadow-lg">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 3. Login Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a0a] to-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BackgroundEffects />

      {/* Animated Logo/Brand */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-8 left-8 flex items-center gap-3 z-20"
      >
        <img src="/logo-white.png" alt="Logo" className="w-12 h-12 object-contain" />
        <span className="font-black text-xl tracking-tight hidden sm:block">VB.OTIWAA</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glowing Card Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[3rem] blur-3xl opacity-50" />

        <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 p-12 rounded-[3rem] shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10 space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 relative overflow-hidden ${desiredRole === 'admin'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              {desiredRole === 'admin' ? <ShieldCheck className="w-10 h-10 relative z-10" /> : <Store className="w-10 h-10 relative z-10" />}
            </motion.div>

            <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              {desiredRole === 'merchant' ? 'MERCHANT PORTAL' : 'ADMIN PORTAL'}
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Welcome back! Please sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username/ID Field */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest px-2">
                {desiredRole === 'admin' ? 'Username' : 'Merchant ID'}
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-white transition-colors z-10" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!forcedUsername}
                  placeholder={desiredRole === 'admin' ? "Enter username" : "Your merchant ID"}
                  className="relative w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest px-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-white transition-colors z-10" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="relative w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all overflow-hidden ${desiredRole === 'admin'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${desiredRole === 'admin' ? 'shadow-blue-500/30' : 'shadow-purple-500/30'
                }`}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Return Home Link */}
          <div className="mt-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest group"
            >
              <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Return Home
            </a>
          </div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
    </div>
  );
}

// ----------------------------------------------------------------------------------
// UTILS & COMPONENTS
// ----------------------------------------------------------------------------------

function Header({ role, onLogout }: { role: string, onLogout: () => void }) {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-4">
        <img src="/logo-black.png" alt="Logo" className="w-10 h-10 object-contain" />
        <span className="font-black text-xl tracking-tight text-foreground">VB.OTIWAA</span>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
          {role.toUpperCase()}
        </span>
      </div>

      <button
        onClick={onLogout}
        className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        Logout <ArrowRight className="w-3 h-3" />
      </button>
    </header>
  );
}

function BackgroundEffects() {
  return (
    <>
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
      </div>
    </>
  )
}

export default App;
