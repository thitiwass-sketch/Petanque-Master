import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserAccount,
  AuthProvider,
  SavedBouleSpec,
  SavedDrillResult,
  AuthError,
  GuestMigrationStats,
} from '../types/auth';
import {
  authenticateWithGoogle,
  authenticateWithFacebook,
  authenticateWithLine,
  migrateGuestDataToUser,
  syncUserToCloudDatabase,
  getStoredUser,
  logoutAndRevertToGuest,
} from '../services/authService';

interface AuthContextType {
  currentUser: UserAccount;
  isLoggedIn: boolean;
  isGuest: boolean;
  isLoading: boolean;
  loadingProvider: AuthProvider | null;
  authError: AuthError | null;
  migrationStats: GuestMigrationStats | null;
  loginWithGoogle: () => Promise<UserAccount>;
  loginWithFacebook: () => Promise<UserAccount>;
  loginWithLine: () => Promise<UserAccount>;
  continueAsGuest: (customName?: string) => void;
  logout: () => void;
  saveSpec: (spec: SavedBouleSpec) => void;
  deleteSpec: (specId: string) => void;
  saveDrill: (drill: SavedDrillResult) => void;
  deleteDrill: (drillId: string) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const existing = getStoredUser();
    if (existing) return existing;
    return {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      isGuest: true,
      provider: 'guest',
      displayName: 'ผู้เล่นทั่วไป (Guest Player)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date().toISOString(),
      savedSpecs: [],
      savedDrills: [],
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [migrationStats, setMigrationStats] = useState<GuestMigrationStats | null>(null);

  // Sync state to storage
  useEffect(() => {
    syncUserToCloudDatabase(currentUser);
  }, [currentUser]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Google Login Flow
  const loginWithGoogle = async (): Promise<UserAccount> => {
    setIsLoading(true);
    setLoadingProvider('google');
    setAuthError(null);

    try {
      const googleProfile = await authenticateWithGoogle();
      const { user: migratedUser, migrationStats: stats } = migrateGuestDataToUser(currentUser, {
        ...googleProfile,
        provider: 'google',
      });

      setCurrentUser(migratedUser);
      setMigrationStats(stats);
      return migratedUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'การเชื่อมต่อ Google OAuth ขัดข้อง';
      const errorObj: AuthError = { code: 'GOOGLE_AUTH_FAILED', message: msg, provider: 'google' };
      setAuthError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Facebook Login Flow
  const loginWithFacebook = async (): Promise<UserAccount> => {
    setIsLoading(true);
    setLoadingProvider('facebook');
    setAuthError(null);

    try {
      const fbProfile = await authenticateWithFacebook();
      const { user: migratedUser, migrationStats: stats } = migrateGuestDataToUser(currentUser, {
        ...fbProfile,
        provider: 'facebook',
      });

      setCurrentUser(migratedUser);
      setMigrationStats(stats);
      return migratedUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'การเชื่อมต่อ Facebook Login ขัดข้อง';
      const errorObj: AuthError = { code: 'FACEBOOK_AUTH_FAILED', message: msg, provider: 'facebook' };
      setAuthError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // LINE Login Flow
  const loginWithLine = async (): Promise<UserAccount> => {
    setIsLoading(true);
    setLoadingProvider('line');
    setAuthError(null);

    try {
      const lineProfile = await authenticateWithLine();
      const { user: migratedUser, migrationStats: stats } = migrateGuestDataToUser(currentUser, {
        ...lineProfile,
        provider: 'line',
      });

      setCurrentUser(migratedUser);
      setMigrationStats(stats);
      return migratedUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'การเชื่อมต่อ LINE Channel API ขัดข้อง';
      const errorObj: AuthError = { code: 'LINE_AUTH_FAILED', message: msg, provider: 'line' };
      setAuthError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Continue in Guest Mode
  const continueAsGuest = (customName?: string) => {
    setCurrentUser((prev) => {
      const updated: UserAccount = {
        ...prev,
        isGuest: true,
        displayName: customName || prev.displayName,
      };
      return updated;
    });
  };

  // Logout Flow
  const logout = () => {
    const cleanGuest = logoutAndRevertToGuest();
    setCurrentUser(cleanGuest);
    setMigrationStats(null);
    setAuthError(null);
  };

  // Save Spec to Profile
  const saveSpec = (spec: SavedBouleSpec) => {
    setCurrentUser((prev) => {
      const updatedSpecs = [spec, ...prev.savedSpecs.filter((s) => s.id !== spec.id)];
      const updatedUser = { ...prev, savedSpecs: updatedSpecs };
      syncUserToCloudDatabase(updatedUser);
      return updatedUser;
    });
  };

  // Delete Spec from Profile
  const deleteSpec = (specId: string) => {
    setCurrentUser((prev) => {
      const updatedSpecs = prev.savedSpecs.filter((s) => s.id !== specId);
      const updatedUser = { ...prev, savedSpecs: updatedSpecs };
      syncUserToCloudDatabase(updatedUser);
      return updatedUser;
    });
  };

  // Save Drill Result to Profile
  const saveDrill = (drill: SavedDrillResult) => {
    setCurrentUser((prev) => {
      const updatedDrills = [drill, ...prev.savedDrills.filter((d) => d.id !== drill.id)];
      const updatedUser = { ...prev, savedDrills: updatedDrills };
      syncUserToCloudDatabase(updatedUser);
      return updatedUser;
    });
  };

  // Delete Drill Result from Profile
  const deleteDrill = (drillId: string) => {
    setCurrentUser((prev) => {
      const updatedDrills = prev.savedDrills.filter((d) => d.id !== drillId);
      const updatedUser = { ...prev, savedDrills: updatedDrills };
      syncUserToCloudDatabase(updatedUser);
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !currentUser.isGuest,
        isGuest: currentUser.isGuest,
        isLoading,
        loadingProvider,
        authError,
        migrationStats,
        loginWithGoogle,
        loginWithFacebook,
        loginWithLine,
        continueAsGuest,
        logout,
        saveSpec,
        deleteSpec,
        saveDrill,
        deleteDrill,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProviderComponent');
  }
  return context;
};
