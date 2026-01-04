
import React from 'react';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`glass-green rounded-[2.5rem] p-8 transition-all duration-700 hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${className}`}>
    {children}
  </div>
);

export const GlassButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, onClick, className = "", variant = 'primary', disabled, type = "button" }) => {
  const variants = {
    primary: 'bg-white/5 hover:bg-white/10 text-white border-white/10',
    secondary: 'bg-black/30 hover:bg-black/50 text-white/70 border-white/5',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-500/20',
    success: 'bg-[#1a5f4e]/80 hover:bg-[#238069] text-white border-white/10 shadow-[0_4px_20px_rgba(26,95,78,0.3)]'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl transition-all duration-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border backdrop-blur-xl font-bold tracking-tight ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#1a5f4e] focus:border-[#1a5f4e]/50 transition-all font-medium ${props.className}`}
  />
);

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = "處理中..." }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-3xl">
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        <div className="w-24 h-24 border-t-2 border-l-2 border-[#238069] rounded-full animate-spin shadow-[0_0_50px_rgba(35,128,105,0.4)]" />
        <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs font-black animate-pulse">NEXUS</div>
      </div>
      <p className="text-white/40 font-black text-sm tracking-[0.5em] uppercase animate-pulse">{message}</p>
    </div>
  </div>
);
