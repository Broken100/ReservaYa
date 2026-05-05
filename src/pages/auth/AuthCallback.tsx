import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { UserRole } from '../../types/database';

/**
 * Handles the OAuth callback from Supabase.
 * Supabase redirects here after Google OAuth completes.
 * We extract the session from the URL hash and redirect to the appropriate page.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (mounted) navigate('/login', { replace: true });
          return;
        }

        // Fetch profile with retries to account for trigger delays
        let role = 'client';
        for (let i = 0; i < 3; i++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && data) {
            role = data.role;
            break;
          }
          // wait 500ms before retrying
          await new Promise(r => setTimeout(r, 500));
        }

        if (mounted) {
          const pendingRole = localStorage.getItem('pendingRole') as UserRole | null;
          let finalRole = role;

          if (pendingRole && pendingRole !== role) {
            console.log(`[AuthCallback] Updating role from ${role} to ${pendingRole}`);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: pendingRole })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error("[AuthCallback] Error updating role:", updateError.message);
            } else {
              finalRole = pendingRole;
            }
          }
          
          localStorage.removeItem('pendingRole');

          if (finalRole === 'admin') {
            window.location.replace('/dashboard');
          } else {
            window.location.replace('/cliente');
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (mounted) navigate('/', { replace: true });
      }
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Autenticando...</p>
      </div>
    </div>
  );
}
