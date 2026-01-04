
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { AITool, CATEGORIES } from '../types';
import { generateToolDescription } from '../services/geminiService';
import { collection, addDoc, updateDoc, doc, deleteDoc } from '@firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTool: AITool | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, editingTool }) => {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 初始化狀態，確保 openMode 始終有值
  const [formData, setFormData] = useState<Partial<AITool>>({
    name: '',
    description: '',
    url: '',
    imageUrl: '',
    category: CATEGORIES[1],
    creatorName: userProfile?.displayName || '',
    creatorAvatar: userProfile?.photoURL || '',
    isPinned: false,
    order: 0,
    views: 0,
    openMode: 'embedded'
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 當 editingTool 變更時，同步表單內容
  useEffect(() => {
    if (editingTool) {
      setFormData({
        ...editingTool,
        openMode: editingTool.openMode || 'embedded' // 確保舊資料預設為內嵌
      });
    }
  }, [editingTool]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `tools/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      alert(`圖片上傳失敗: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGeminiAssist = async () => {
    if (!formData.name) return alert("請先輸入名稱");
    setIsGenerating(true);
    try {
      const desc = await generateToolDescription(formData.name, formData.category || 'AI');
      setFormData(prev => ({ ...prev, description: desc }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTool) return;
    const confirmed = window.confirm("您確定要刪除此 AI 工具嗎？此操作將無法還原且立即生效。");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'tools', editingTool.id));
      onClose();
    } catch (err: any) {
      alert("刪除失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert("請先上傳圖片");
    setLoading(true);
    try {
      const toolData = {
        ...formData,
        creatorName: userProfile?.displayName || 'Admin',
        creatorAvatar: userProfile?.photoURL || '',
        openMode: formData.openMode || 'embedded'
      };

      if (editingTool) {
        await updateDoc(doc(db, 'tools', editingTool.id), { ...toolData, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, 'tools'), { 
          ...toolData, 
          createdAt: Date.now(),
          views: 0 
        });
      }
      onClose();
    } catch (err: any) {
      alert("儲存失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <GlassCard className="w-full max-w-xl max-h-[90vh] overflow-y-auto border-white/5 scroll-smooth">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black tracking-tight">{editingTool ? '編輯內容' : '新增工具'}</h2>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 左側：圖片上傳 */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-44 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
              ) : (
                <div className="text-center">
                   <div className="text-3xl mb-2 opacity-20">🖼️</div>
                   <span className="text-xs font-bold opacity-40 uppercase">{uploading ? '上傳中...' : '圖片上傳'}</span>
                </div>
              )}
            </div>

            {/* 右側：置頂與瀏覽次數 */}
            <div className="flex flex-col gap-4">
              <div className="glass-dark p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">置頂顯示</span>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded bg-green-500 accent-green-500 cursor-pointer"
                  checked={formData.isPinned}
                  onChange={e => setFormData({...formData, isPinned: e.target.checked})}
                />
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex-1">
                 <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mb-1">總瀏覽次數</p>
                 <p className="text-3xl font-black text-green-400">{formData.views || 0}</p>
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {/* 新增：橫向排列的開啟方式設定，確保在介面中非常顯眼 */}
          <div className="glass-dark p-1.5 rounded-2xl border border-white/5">
            <div className="px-4 py-2 mb-1 flex justify-between items-center">
               <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">工具開啟模式</span>
               <span className="text-[9px] text-green-500 font-bold uppercase">{formData.openMode === 'embedded' ? '內嵌於系統內' : '開啟外部標籤頁'}</span>
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, openMode: 'embedded'})}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${formData.openMode === 'embedded' ? 'bg-green-500 border-green-400 text-black shadow-lg shadow-green-900/20' : 'bg-black/20 border-white/5 text-white/30 hover:bg-white/5'}`}
              >
                內嵌視窗
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, openMode: 'external'})}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${formData.openMode === 'external' ? 'bg-green-500 border-green-400 text-black shadow-lg shadow-green-900/20' : 'bg-black/20 border-white/5 text-white/30 hover:bg-white/5'}`}
              >
                新分頁
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">工具名稱</label>
            <GlassInput 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
              placeholder="輸入名稱..."
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest">功能描述</label>
              <button type="button" onClick={handleGeminiAssist} className="text-[10px] font-black text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                {isGenerating ? '⌛ 生成中...' : '✨ AI 生成描述'}
              </button>
            </div>
            <textarea
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white h-28 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all text-sm leading-relaxed"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="說明此工具的用途..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">分類</label>
              <select 
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-green-500/30" 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.slice(1).map(c => <option key={c} value={c} className="bg-[#062d24]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">連結 URL</label>
              <GlassInput 
                value={formData.url} 
                onChange={e => setFormData({ ...formData, url: e.target.value })} 
                required 
                placeholder="https://..." 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {editingTool && (
              <GlassButton type="button" variant="danger" onClick={handleDelete} className="flex-1" disabled={loading}>
                刪除工具
              </GlassButton>
            )}
            <GlassButton type="button" variant="secondary" onClick={onClose} className="flex-1">取消</GlassButton>
            <GlassButton type="submit" variant="success" className="flex-1" disabled={loading || uploading}>
              {loading ? '處理中' : '儲存變更'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
