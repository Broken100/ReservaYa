import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile, UserRole } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from DB
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    console.log('[Auth] Fetching profile for:', userId);
    try {
      const { data, error } = await (supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single() as any);

      if (error) {
        console.warn('[Auth] Profile fetch error (expected if new user):', error.message);
        return null;
      }
      console.log('[Auth] Profile fetched successfully');
      return {
        ...data,
        payment_status: data.payment_status || 'pending'
      } as Profile;
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session AND profile before setting loading=false
    async function initAuth() {
      console.log('[Auth] Initializing auth state...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] getSession error:', error);
          return;
        }

        if (!isMounted) return;
        
        console.log('[Auth] Initial session found:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (isMounted) setProfile(p);
        }
      } catch (err) {
        console.error('[Auth] initAuth exception:', err);
      } finally {
        if (isMounted) {
          console.log('[Auth] Initial loading resolved');
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Auth state change event:', event);
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id).then(p => {
            if (isMounted) setProfile(p);
          });
        } else {
          setProfile(null);
        }

        // Always resolve loading at the end of state change processing
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (role?: UserRole) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        ...(role && {
          data: { role },
        }),
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
