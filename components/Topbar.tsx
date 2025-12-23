'use client'

import { Search, Bell, Menu, LogOut } from 'lucide-react'
import { useState, Dispatch, SetStateAction, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  setOpen: Dispatch<SetStateAction<boolean>>
}

interface UserInfo {
  email: string
  role: string
}

export default function Header({ setOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)

  const router = useRouter()

  // 🔐 Read user from JWT
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        email: payload.email ?? 'admin',
        role: payload.role,
      })
    } catch {
      setUser(null)
    }
  }, [])

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem('token')
    router.replace('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="relative max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, vendors, requirements..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-green-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 relative">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* AVATAR */}
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
          >
            <span className="text-white font-semibold">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </button>

          {/* DROPDOWN */}
          {openMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  Role: {user?.role}
                </p>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
