"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, User, Shield, Crown, Eye, Menu, Key } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { BasicChangePasswordModal } from "@/components/modals/basic-change-password-modal"
import { ProfilePicture } from "@/components/ui/profile-picture"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SystemAdmin':
        return <Crown className="h-3 w-3" />
      case 'RegionalUser':
        return <Shield className="h-3 w-3" />
      case 'Viewer':
        return <Eye className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SystemAdmin':
        return 'bg-purple-100 text-purple-800'
      case 'RegionalUser':
        return 'bg-blue-100 text-blue-800'
      case 'Viewer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SystemAdmin':
        return 'System Admin'
      case 'RegionalUser':
        return 'Regional User'
      case 'Viewer':
        return 'Viewer'
      default:
        return role
    }
  }

  return (
    <header className="px-4 py-3" style={{ backgroundColor: '#013f99', borderBottom: '1px solid #e5e7eb' }}>
      <div className="flex items-center justify-between">
        {/* Mobile layout */}
        <div className="flex items-center space-x-3 md:hidden">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-800"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo - Mobile */}
          <div className="flex items-center space-x-2">
            <div className="relative h-8 w-8 flex items-center justify-center bg-white rounded">
              <Image
                src="/cclpi-plans-logo.png"
                alt="CCLPI PLANS Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">CCLPI PLANS</h1>
              <p className="text-xs text-blue-100">Sales Dashboard</p>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Logo - Desktop */}
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 flex items-center justify-center bg-white rounded">
              <Image
                src="/cclpi-plans-logo.png"
                alt="CCLPI PLANS Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CCLPI PLANS</h1>
              <div className="relative">
                <p className="text-sm font-medium text-blue-100">Sales Dashboard</p>
                <div className="w-1/2 h-1 mt-1" style={{ backgroundColor: '#f3cf47' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* User info and actions */}
        <div className="flex items-center space-x-4">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-16 w-16 rounded-full p-0 hover:bg-yellow-50 transition-colors duration-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
                <ProfilePicture 
                  src={user?.profile_picture_url} 
                  alt={user?.name || 'User'}
                  size="2xl"
                  showBorder={true}
                  borderColor="border-yellow-300"
                  className="ring-2 ring-yellow-100 shadow-xl"
                  key={`header-${user?.userId}-${user?.updatedAt}`}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center space-x-3 p-2">
                  <ProfilePicture 
                    src={user?.profile_picture_url} 
                    alt={user?.name || 'User'}
                    size="lg"
                    showBorder={true}
                    borderColor="border-yellow-300"
                    className="flex-shrink-0"
                    key={`dropdown-${user?.userId}-${user?.updatedAt}`}
                  />
                  <div className="flex flex-col space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      {getRoleIcon(user?.role || '')}
                      <Badge variant="secondary" className={`text-xs ${getRoleColor(user?.role || '')}`}>
                        {getRoleLabel(user?.role || '')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (user) {
                  setIsChangePasswordOpen(true)
                } else {
                  // User not authenticated, show login prompt
                  console.log('User not authenticated, cannot change password')
                }
              }}>
                <Key className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Change Password Modal */}
      <BasicChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </header>
  )
}