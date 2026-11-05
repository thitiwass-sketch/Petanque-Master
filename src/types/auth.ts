export type AuthProvider = 'guest' | 'google' | 'facebook' | 'line';

export interface SavedBouleSpec {
  id: string;
  savedAt: string;
  title?: string;
  handLength: number;
  palmWidth: 'narrow' | 'standard' | 'wide';
  playerRole: 'pointer' | 'milieu' | 'shooter';
  striation: 'smooth' | 'single' | 'heavy';
  diameter: number;
  weight: number;
  hardness: string;
  hardnessVal: string;
  material: string;
  fitPercent: number;
  fitNote: string;
  advice: string;
  isCustomized: boolean;
}

export interface SavedDrillResult {
  id: string;
  drillId: string;
  drillTitle: string;
  drillCategory?: string;
  reps: number;
  targetReps: number;
  progressPct: number;
  savedAt: string;
  videoUrl?: string;
  notes?: string;
}

export interface GuestMigrationStats {
  migratedSpecsCount: number;
  migratedDrillsCount: number;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  uid?: string;
  isGuest: boolean;
  provider: AuthProvider;
  displayName: string;
  email?: string;
  avatarUrl: string;
  createdAt: string;
  lastLoginAt?: string;
  token?: string;
  cloudSyncedAt?: string;
  migratedFromGuest?: boolean;
  migrationStats?: GuestMigrationStats;
  savedSpecs: SavedBouleSpec[];
  savedDrills: SavedDrillResult[];
}

export interface AuthError {
  code: string;
  message: string;
  provider?: AuthProvider;
}
