
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PENDING = 'pending'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  category: string;
  creatorAvatar: string;
  creatorName: string;
  createdAt: number;
  isPinned?: boolean;
  order?: number;
  views?: number;
  openMode?: 'embedded' | 'external';
}

export interface AppSettings {
  loginBackgroundUrl: string;
  dashboardBackgroundUrl: string;
  logoUrl: string;
  siteName: string;
}

export const CATEGORIES = [
  '全部',
  '業務發展部',
  '營運部',
  '人力資源部',
  '行政管理部'
];
