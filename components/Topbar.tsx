'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { useState, Dispatch, SetStateAction } from 'react'

interface HeaderProps {
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function Header({ setOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* SEARCH */}
          <div className="relative max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, vendors, requirements..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
            <span className="text-white font-semibold">A</span>
          </div>
        </div>
      </div>
    </header>
  )
}
