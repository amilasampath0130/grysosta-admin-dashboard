'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Topbar'
import AdminGuard from '@/components/ProtectedAdminLayout'
import useAutoLogout from '@/hooks/useAutoLogout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // 🔐 MUST be here (top-level)
  useAutoLogout()

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={open} setOpen={setOpen} />

        <div className="flex flex-col flex-1">
          <Header setOpen={setOpen} />
          <main className="p-4 md:p-6 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
