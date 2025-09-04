'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tenant } from '@/lib/tenant';

interface TenantContextType {
  tenant: Tenant;
}

const TenantContext = createContext<TenantContextType | null>(null);

interface TenantProviderProps {
  tenant: Tenant;
  children: ReactNode;
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): Tenant {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context.tenant;
}

export function useTenantSafe(): Tenant | null {
  const context = useContext(TenantContext);
  return context?.tenant || null;
}
