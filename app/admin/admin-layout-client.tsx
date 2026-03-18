'use client'

import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper'

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
