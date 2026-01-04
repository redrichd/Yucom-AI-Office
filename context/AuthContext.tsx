
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from '@firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole, AppSettings } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  settings: AppSettings;
  loading: boolean;
  isAdmin: boolean;
  isPending: boolean;
  error: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  loginBackgroundUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564',
  dashboardBackgroundUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672',
  logoUrl: '',
  siteName: 'AI智能優化辦公室'
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  settings: DEFAULT_SETTINGS,
  loading: true,
  isAdmin: false,
  isPending: false,
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 動態同步網站標題與 Favicon
  useEffect(() => {
    if (settings.siteName) {
      document.title = settings.siteName;
    }
    
    if (settings.logoUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = settings.logoUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = settings.logoUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [settings.siteName, settings.logoUrl]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data
        } as AppSettings);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'New User',
              photoURL: currentUser.photoURL || '',
              role: UserRole.PENDING
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err: any) {
          console.error("Auth Error:", err);
          if (err.code === 'permission-denied') {
            setError("權限被拒。");
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubscribeAuth();
    };
  }, []);

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isPending = userProfile?.role === UserRole.PENDING;

  return (
    <AuthContext.Provider value={{ user, userProfile, settings, loading, isAdmin, isPending, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
