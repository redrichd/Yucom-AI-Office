
import React, { useState, useRef } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { AppSettings } from '../types';
import { doc, setDoc } from '@firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings }) => {
  const { isAdmin, userProfile } = useAuth();
  const [formData, setFormData] = useState<AppSettings>(currentSettings);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const logoRef = useRef<HTMLInputElement>(null);
  const loginBgRef = useRef<HTMLInputElement>(null);
  const dashBgRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async (file: File, target: keyof AppSettings) => {
    if (!isAdmin) return;
    setUploading(target);
    try {
      const storageRef = ref(storage, `settings/${target}_${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setFormData(prev => ({ ...prev, [target]: url }));
    } catch (e: any) {
      alert(`上傳失敗: ${e.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), formData);
      onClose();
    } catch (err: any) {
      alert("更新失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <GlassCard className="w-full max-w-lg border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">系統全域配置</h2>
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">Admin: {userProfile?.displayName}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-white/40 mb-3 uppercase tracking-widest">網站名稱</label>
            <GlassInput value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} required />
          </div>

          <div className="grid grid-cols-3 gap-4">
             {/* Logo */}
             <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase text-center">站點 Logo</label>
                <div onClick={() => logoRef.current?.click()} className="w-full h-24 rounded-2xl bg-black/20 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden">
                   {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain p-2" /> : <span className="text-[10px] opacity-40">{uploading === 'logoUrl' ? '...' : '點擊上傳'}</span>}
                </div>
                <input type="file" ref={logoRef} hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logoUrl')} />
             </div>

             {/* Login Background */}
             <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase text-center">登入頁背景</label>
                <div onClick={() => loginBgRef.current?.click()} className="w-full h-24 rounded-2xl bg-black/20 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden">
                   {formData.loginBackgroundUrl ? <img src={formData.loginBackgroundUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] opacity-40">{uploading === 'loginBackgroundUrl' ? '...' : '點擊上傳'}</span>}
                </div>
                <input type="file" ref={loginBgRef} hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'loginBackgroundUrl')} />
             </div>

             {/* Dashboard Background */}
             <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase text-center">操作介面背景</label>
                <div onClick={() => dashBgRef.current?.click()} className="w-full h-24 rounded-2xl bg-black/20 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden">
                   {formData.dashboardBackgroundUrl ? <img src={formData.dashboardBackgroundUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] opacity-40">{uploading === 'dashboardBackgroundUrl' ? '...' : '點擊上傳'}</span>}
                </div>
                <input type="file" ref={dashBgRef} hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'dashboardBackgroundUrl')} />
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <GlassButton type="button" variant="secondary" onClick={onClose} className="flex-1">取消</GlassButton>
            <GlassButton type="submit" variant="success" className="flex-1" disabled={loading || !!uploading}>
              {loading ? '儲存中' : '更新系統配置'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
