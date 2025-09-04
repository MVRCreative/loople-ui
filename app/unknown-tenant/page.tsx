export default function UnknownTenantPage() {
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Tenant Not Found</h1>
      <p className="text-gray-600 mb-4">
        The subdomain you&apos;re trying to access doesn&apos;t exist or isn&apos;t configured.
      </p>
      <p className="text-sm text-gray-500">
        Please check the URL or contact support if you believe this is an error.
      </p>
    </div>
  );
}
