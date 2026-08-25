import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../firebase/seedData';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  canManageUsers: boolean;
  canEditMasterData: boolean;
  canPerformSales: boolean;
  canViewReports: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'amanah_smart_mart_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    // Default to initial admin for instant seamless access
    return initialUsers[0];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Handle Firebase Auth state if configured
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // Check matching user from database or fallback to email match
          const matched = initialUsers.find((u) => u.email === firebaseUser.email) || {
            id: firebaseUser.uid,
            email: firebaseUser.email || 'user@amanah.sch.id',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Pengguna AMANAH',
            role: 'admin' as UserRole,
            status: 'active' as const,
            createdAt: new Date().toISOString()
          };
          setUser(matched);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const role: UserRole = user?.role || 'admin';

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth && password) {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Find user from existing users list or seed users
      const foundUser = initialUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (foundUser) {
        const updatedUser: User = {
          ...foundUser,
          lastLogin: new Date().toISOString()
        };
        setUser(updatedUser);
        setIsLoading(false);
        return { success: true };
      } else {
        // Allow login with newly created credential
        const dynamicUser: User = {
          id: 'usr_' + Date.now(),
          email: email.trim(),
          displayName: email.split('@')[0],
          role: 'kasir',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setUser(dynamicUser);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err?.message || 'Gagal masuk akun. Periksa email atau password Anda.' };
    }
  };

  const loginAsRole = (selectedRole: UserRole) => {
    const targetUser = initialUsers.find((u) => u.role === selectedRole) || {
      id: `usr-${selectedRole}-01`,
      email: `${selectedRole}@amanah.sch.id`,
      displayName: `Akun Demo ${selectedRole.toUpperCase()}`,
      role: selectedRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    setUser({
      ...targetUser,
      lastLogin: new Date().toISOString()
    });
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    setUser({
      ...user,
      role: newRole,
      displayName: user.displayName.includes('(')
        ? `${user.displayName.split('(')[0].trim()} (${newRole.charAt(0).toUpperCase() + newRole.slice(1)})`
        : user.displayName
    });
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error('Firebase sign out error:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Role permissions
  const canManageUsers = useMemo(() => role === 'admin', [role]);
  const canEditMasterData = useMemo(() => role === 'admin' || role === 'supervisor', [role]);
  const canPerformSales = useMemo(() => role === 'admin' || role === 'kasir', [role]);
  const canViewReports = useMemo(() => role === 'admin' || role === 'supervisor', [role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsRole,
        logout,
        switchRole,
        canManageUsers,
        canEditMasterData,
        canPerformSales,
        canViewReports
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
