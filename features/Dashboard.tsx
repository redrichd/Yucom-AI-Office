
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, increment, writeBatch } from '@firebase/firestore';
import { db, logout } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AITool, CATEGORIES } from '../types';
import { GlassCard, GlassButton, LoadingOverlay } from '../components/GlassUI';
import { AdminModal } from './AdminModal';
import { SettingsModal } from './SettingsModal';

export const Dashboard: React.FC = () => {
  const { userProfile, isAdmin, settings } = useAuth();
  const [tools, setTools] = useState<AITool[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  
  const [activeViewTool, setActiveViewTool] = useState<AITool | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    
    const q = query(collection(db, 'tools'), orderBy('createdAt', 'desc'));
    const unsubTools = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AITool));
      setTools(data);
      setLoading(false);
    }, (err) => {
      console.error("Tools fail:", err);
      setLoading(false);
    });

    return () => {
      unsubTools();
    };
  }, []);

  const sortedAndFilteredTools = useMemo(() => {
    return tools
      .filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                              t.description.toLowerCase().includes(search.toLowerCase());
        const matchesCat = category === '全部' || t.category === category;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        const aPinned = a.isPinned ? 1 : 0;
        const bPinned = b.isPinned ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;

        const aOrder = a.order ?? 0;
        const bOrder = b.order ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;

        return b.createdAt - a.createdAt;
      });
  }, [tools, search, category]);

  const togglePin = async (tool: AITool) => {
    try {
      await updateDoc(doc(db, 'tools', tool.id), { isPinned: !tool.isPinned });
    } catch (e) {
      alert("權限不足");
    }
  };

  const swapOrder = async (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedAndFilteredTools.length) return;

    const current = sortedAndFilteredTools[index];
    const neighbor = sortedAndFilteredTools[targetIndex];

    if (current.isPinned !== neighbor.isPinned) return;

    try {
      const batch = writeBatch(db);
      
      // 複製目前的列表並進行位置交換
      const newList = [...sortedAndFilteredTools];
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      
      // 重新分配所有受影響項目的 order 值以確保排序正確
      // 這會自動修復之前所有 order 為 0 的情況
      let writeCount = 0;
      newList.forEach((tool, newIndex) => {
        if (tool.order !== newIndex) {
          const ref = doc(db, 'tools', tool.id);
          batch.update(ref, { order: newIndex });
          writeCount++;
        }
      });

      if (writeCount > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.error("Sort error", e);
      alert("排序更新失敗");
    }
  };

  const handleOpenTool = (tool: AITool) => {
    // 1. 背景更新瀏覽次數（不使用 await，確保 window.open 不會被瀏覽器判定為延遲操作而攔截）
    updateDoc(doc(db, 'tools', tool.id), { 
      views: increment(1) 
    }).catch(e => console.error("Views update failed", e));

    // 2. 根據開啟模式執行動作
    if (tool.openMode === 'external') {
      // 外部連結模式：僅開啟新分頁，主頁面完全不跳轉或更換
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    } else {
      // 內嵌視窗模式：開啟主頁面上的全螢幕 Iframe 覆蓋層（即頁面更換）
      setActiveViewTool(tool);
    }
  };

  if (loading) return <LoadingOverlay message="正在連結雲端..." />;

  return (
    <div className="min-h-screen relative text-white selection:bg-green-500/30">
      <div className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none">
        <div 
          className="w-full h-full bg-cover bg-center bg-depth"
          style={{ 
            backgroundImage: `url("${settings.dashboardBackgroundUrl}")`,
            backgroundColor: '#040d0b'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040d0b]/40 via-[#040d0b]/80 to-[#040d0b] backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="container mx-auto px-4 py-12">
          <div className="glass-green rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center gap-8 border-white/10 shadow-2xl">
            <div className="flex items-center gap-6 px-6 border-r border-white/5 pr-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-[#040d0b] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <div className="text-2xl font-black bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">AI</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter whitespace-nowrap">{settings.siteName}</h1>
                <p className="text-[10px] uppercase font-black text-green-500/50 tracking-[0.4em] mt-0.5">{category}</p>
              </div>
            </div>

            <div className="flex-1 relative group w-full">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-green-400 transition-all">🔍</span>
              <input 
                placeholder="探索智能工具..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded-3xl py-5 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-white/10 transition-all text-base font-medium placeholder-white/10"
              />
            </div>

            <div className="flex items-center gap-6 pl-6 border-l border-white/5">
              <div className="flex items-center gap-4 glass-dark p-2.5 rounded-2xl border-white/10 pr-6 group cursor-pointer hover:bg-white/5 transition-colors">
                <img src={userProfile?.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-green-500/50 transition-colors shadow-lg" alt="User" />
                <span className="text-sm font-bold text-white/80 max-w-[120px] truncate tracking-tight">{userProfile?.displayName}</span>
              </div>
              
              {isAdmin && (
                <div className="flex gap-3">
                  <GlassButton onClick={() => { setEditingTool(null); setIsModalOpen(true); }} variant="success" className="h-14 px-8 shadow-green-900/20">
                    新增工具
                  </GlassButton>
                  <button onClick={() => setIsSettingsOpen(true)} className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-xl shadow-lg">
                    ⚙️
                  </button>
                </div>
              )}
              
              <button onClick={logout} className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all group shadow-lg">
                <span className="group-hover:translate-x-1 transition-transform text-xl">↪</span>
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 flex-1">
          <div className="flex gap-4 overflow-x-auto pb-10 no-scrollbar scroll-smooth px-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-10 py-4 rounded-[1.25rem] whitespace-nowrap transition-all duration-700 border font-black tracking-wider text-xs uppercase ${
                  category === cat 
                    ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.15)]' 
                    : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-24">
            {sortedAndFilteredTools.map((tool, idx) => (
              <GlassCard 
                key={tool.id} 
                className={`flex flex-col group relative ${tool.isPinned ? 'ring-1 ring-green-500/30' : ''}`}
              >
                {tool.isPinned && (
                  <div className="absolute top-6 left-6 z-10 bg-green-500 text-[9px] font-black px-4 py-1.5 rounded-full text-black uppercase tracking-[0.2em] shadow-[0_4px_20_rgba(34,197,94,0.4)]">
                    Featured
                  </div>
                )}

                <div className="relative h-60 rounded-[2rem] overflow-hidden mb-8 flex-shrink-0 shadow-2xl border border-white/5">
                  <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040d0b]/90 via-[#040d0b]/20 to-transparent" />
                  
                  {isAdmin && (
                    <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <button onClick={() => togglePin(tool)} className={`w-10 h-10 glass-dark rounded-xl border-white/10 flex items-center justify-center ${tool.isPinned ? 'text-green-400 bg-green-500/20' : 'text-white'}`}>📌</button>
                      <button onClick={() => swapOrder(idx, 'prev')} className="w-10 h-10 glass-dark rounded-xl border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">←</button>
                      <button onClick={() => swapOrder(idx, 'next')} className="w-10 h-10 glass-dark rounded-xl border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">→</button>
                      <button onClick={() => { setEditingTool(tool); setIsModalOpen(true); }} className="w-10 h-10 glass-dark rounded-xl border-white/10 text-white flex items-center justify-center">✏️</button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 px-2">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black group-hover:text-green-400 transition-colors tracking-tight line-clamp-1">{tool.name}</h3>
                    <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-black text-white/30 uppercase tracking-tighter">
                      {tool.views || 0} VISITS
                    </div>
                  </div>
                  <p className="text-sm text-white/40 mb-10 line-clamp-3 leading-relaxed font-medium tracking-tight">
                    {tool.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 glass-dark px-4 py-2 rounded-2xl border-white/5">
                      <img src={tool.creatorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${tool.creatorName}`} className="w-7 h-7 rounded-full border border-white/20" alt="Creator" />
                      <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">{tool.creatorName}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenTool(tool)}
                      className="px-8 py-3.5 bg-green-500/10 hover:bg-green-500/20 rounded-2xl border border-green-500/30 transition-all font-black text-xs tracking-widest text-green-400 flex items-center gap-2"
                    >
                      開啟連結 ↗
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </main>
      </div>

      {activeViewTool && (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-500">
          <div className="h-20 glass-dark border-b border-white/10 flex items-center justify-between px-10 shrink-0 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-white/20 shadow-2xl">
                <img src={activeViewTool.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <h2 className="font-black text-white text-xl tracking-tighter">{activeViewTool.name}</h2>
                <p className="text-[10px] text-green-500/60 font-black uppercase tracking-[0.3em]">{activeViewTool.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <button 
                onClick={() => setActiveViewTool(null)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 border border-white/10 transition-all group"
              >
                <span className="group-hover:rotate-90 transition-transform font-medium">✕</span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white relative">
            <div className="absolute inset-0 flex items-center justify-center bg-[#040d0b] -z-10">
               <div className="w-16 h-16 border-t-2 border-green-500 rounded-full animate-spin"></div>
            </div>
            <iframe 
              src={activeViewTool.url} 
              className="w-full h-full border-none relative z-10"
              title={activeViewTool.name}
              allow="file-system-access *; clipboard-read *; clipboard-write *; camera *; microphone *; geolocation *; window-management *; display-capture *; accelerometer *; autoplay *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {isModalOpen && <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingTool={editingTool} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentSettings={settings} />}
    </div>
  );
};
