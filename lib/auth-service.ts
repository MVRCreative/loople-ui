import { supabase, getFunctionsUrl, getAuthUrl } from './supabase';
import { 
  SignUpFormData, 
  SignInFormData, 
  ResendVerificationFormData,
  SignUpResponse,
  SignInResponse,
  AuthUser,
  AuthSession,
  AuthError,
  ApiResponse,
  Club,
  UserRecord,
  Member
} from './auth-types';

class AuthService {
  private functionsUrl: string;
  private authUrl: string;

  constructor() {
    this.functionsUrl = getFunctionsUrl();
    this.authUrl = getAuthUrl();
  }

  // Sign up user using Edge Function
  async signUp(data: SignUpFormData): Promise<ApiResponse<SignUpResponse>> {
    try {
      const response = await fetch(`${this.functionsUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          data: data.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases by Postgres error code
        if (errorData.error?.code === '23505' && errorData.error?.details?.includes('email')) {
          throw new Error('An account with this email address already exists. Please try signing in instead.');
        }

        if (errorData.error?.code === '23505') {
          throw new Error('This information is already in use. Please check your details and try again.');
        }

        if (errorData.error?.code === '23514') {
          throw new Error('Please check that all required fields are filled correctly.');
        }

        // Handle string-based error messages from Edge Functions
        const rawError = (errorData && (errorData.error ?? errorData.message)) as unknown;
        if (typeof rawError === 'string') {
          const lower = rawError.toLowerCase();
          if (lower.includes('subdomain') && (lower.includes('taken') || lower.includes('exists'))) {
            throw new Error('This club subdomain is already taken. Please choose another subdomain.');
          }
          if (lower.includes('email') && (lower.includes('taken') || lower.includes('exists'))) {
            throw new Error('An account with this email address already exists. Please try signing in instead.');
          }
          // Fallback to backend-provided message
          throw new Error(rawError);
        }

        throw new Error(errorData.error?.message || errorData.message || `Sign up failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result,
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign up failed',
        },
        success: false,
      };
    }
  }

  // Resend verification email
  async resendVerification(data: ResendVerificationFormData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.functionsUrl}/signup-resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Resend verification failed: ${response.status}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Resend verification failed',
        },
        success: false,
      };
    }
  }

  // Sign in user using Supabase Auth
  async signIn(data: SignInFormData): Promise<ApiResponse<SignInResponse>> {
    try {
      const response = await fetch(`${this.authUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        // Try to preserve detailed server error messages
        const candidates = [
          errorData?.error_description,
          errorData?.msg,
          errorData?.message,
          errorData?.error,
          errorData?.details,
          errorData?.hint,
        ].filter((v) => typeof v === "string" && v.length) as string[];
        let detailed = candidates[0] || `Sign in failed: ${response.status}`;
        // Optionally annotate with error_code when available
        if (errorData?.error_code && typeof errorData.error_code === "string") {
          detailed = `${detailed}`;
        }
        throw new Error(detailed);
      }

      const result = await response.json();
      
      // Set session in Supabase client
      if (result.access_token) {
        await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
      }

      return {
        data: result,
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign in failed',
        },
        success: false,
      };
    }
  }

  // Sign out user
  async signOut(): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign out failed',
        },
        success: false,
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }

      return user as AuthUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get current session
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting current session:', error);
        return null;
      }

      return session as AuthSession;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  // Refresh session
  async refreshSession(): Promise<ApiResponse<AuthSession>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      return {
        data: data.session as AuthSession,
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Session refresh failed',
        },
        success: false,
      };
    }
  }

  // Club management methods
  async getClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.functionsUrl}/clubs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get clubs: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result,
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to get clubs',
        },
        success: false,
      };
    }
  }

  async createClub(clubData: Partial<Club>): Promise<ApiResponse<Club[]>> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.functionsUrl}/clubs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(clubData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create club: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result,
        success: true,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to create club',
        },
        success: false,
      };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
