
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './features/Dashboard';
import { GlassCard, GlassButton, LoadingOverlay } from './components/GlassUI';
import { signInWithGoogle } from './firebase/config';

const AuthGate: React.FC = () => {
  const { user, userProfile, settings, loading, isPending, error: syncError } = useAuth();
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      let msg = "登入失敗。";
      if (e.code === 'auth/unauthorized-domain') {
        msg = "此網域尚未在 Firebase Whitelist 中。請在 Firebase 控制台新增此網域。";
      }
      setError({
        code: e.code || 'unknown',
        message: msg
      });
    }
  };

  if (loading) return <LoadingOverlay message="Synchronizing with Nexus..." />;

  if (syncError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <GlassCard className="max-w-md text-center p-8 border-red-500/30">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4 text-red-200">系統連線異常</h2>
          <p className="text-white/80 text-sm font-mono leading-relaxed mb-8">{syncError}</p>
          <GlassButton onClick={() => window.location.reload()} variant="primary" className="w-full">
            重新整理
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#040d0b] overflow-hidden relative">
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-depth opacity-60"
          style={{ backgroundImage: `url("${settings.loginBackgroundUrl}")` }}
        />
        <div className="fixed inset-0 z-10 bg-gradient-to-tr from-[#040d0b] via-transparent to-transparent opacity-80" />
        
        <GlassCard className="w-full max-w-lg text-center py-20 px-12 relative z-20 border-white/10">
          <div className="mb-12 relative inline-block">
             <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-green-400 to-emerald-700 rotate-12 mx-auto animate-pulse flex items-center justify-center shadow-[0_20px_60px_rgba(34,197,94,0.3)] overflow-hidden border border-white/20">
               {settings.logoUrl ? (
                 <img src={settings.logoUrl} className="w-16 h-16 object-contain -rotate-12" alt="Logo" />
               ) : (
                 <span className="text-6xl -rotate-12">💎</span>
               )}
             </div>
          </div>
          <h1 className="text-5xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            {settings.siteName}
          </h1>
          <p className="text-white/30 mb-12 font-black tracking-[0.6em] uppercase text-[10px]">
            Intelligence Optimization Nexus
          </p>

          <GlassButton onClick={handleLogin} variant="success" className="w-full py-5 text-xl font-black shadow-2xl tracking-widest">
            Sign in with Google
          </GlassButton>
          
          {error && <p className="mt-8 text-red-400 text-xs font-mono bg-red-950/40 p-4 rounded-2xl border border-red-500/20">{error.message}</p>}
          
          <div className="mt-12 pt-10 border-t border-white/5">
             <p className="text-[10px] font-black text-white/10 tracking-[0.2em] uppercase">Auth Securely via Google Cloud</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#040d0b]">
        <GlassCard className="max-w-md text-center p-16 border-orange-500/20">
          <div className="text-7xl mb-10 animate-bounce">⏳</div>
          <h2 className="text-3xl font-black mb-6 tracking-tighter">Access Pending</h2>
          <p className="text-white/40 mb-10 leading-relaxed text-sm font-medium tracking-tight">
            Greetings, {user.displayName}. 您的存取權限正在審核中，請靜候系統管理員核准。
          </p>
          <GlassButton onClick={() => window.location.reload()} variant="secondary" className="w-full">重新整理狀態</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return <Dashboard />;
};

const App: React.FC = () => (
  <AuthProvider>
    <AuthGate />
  </AuthProvider>
);

export default App;
