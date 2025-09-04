import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { TenantProvider } from '@/components/tenant-provider';

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');

  if (!tenantSlug) {
    notFound();
  }

  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    notFound();
  }

  return (
    <TenantProvider tenant={tenant}>
      {children}
    </TenantProvider>
  );
}
