'use client';

import { useTenant } from '@/components/tenant-provider';

export default function TenantDebugPage() {
  const tenant = useTenant();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Tenant Debug</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Resolved Tenant:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(tenant, null, 2)}
        </pre>
      </div>
    </div>
  );
}
