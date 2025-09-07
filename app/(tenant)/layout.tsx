export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout for tenant pages - no backend dependencies
  return <>{children}</>;
}
