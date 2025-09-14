// DEPRECATED: Mock authentication system - replaced with real Supabase Auth
// This file is kept for reference but should not be used in new code
export interface MockUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  isAdmin: boolean;
}

// Mock current user (you can change this for testing different states)
export const mockCurrentUser: MockUser | null = {
  id: "1",
  email: "admin@loople.com",
  name: "Loople Admin",
  avatar: "🏊‍♂️",
  role: "Admin",
  isAdmin: true,
};

// Mock authentication functions
export function isAuthenticated(): boolean {
  return mockCurrentUser !== null;
}

export function getCurrentUser(): MockUser | null {
  return mockCurrentUser;
}

export function login(): Promise<{ success: boolean; error?: string }> {
  // Mock login - always succeeds for demo purposes
  return Promise.resolve({ success: true });
}

export function logout(): Promise<void> {
  // Mock logout - always succeeds
  return Promise.resolve();
}
