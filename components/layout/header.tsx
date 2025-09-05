"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, User, Shield, Crown, Eye, Menu } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { SessionStatusIndicator } from "@/components/auth/session-status-indicator"
import Image from "next/image"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'SystemAdmin':
        return <Crown className="h-3 w-3" />
      case 'Viewer':
        return <Eye className="h-3 w-3" />
      case 'RegionalUser':
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'SystemAdmin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Viewer':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RegionalUser':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm sticky top-0 z-30">
      <div className="flex h-11 sm:h-12 lg:h-16 items-center justify-between px-2 sm:px-3 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden mr-1 h-7 w-7 p-0"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-3.5 w-3.5" />
        </Button>

        {/* Logo and Brand Section */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-1 min-w-0">
          <div className="flex items-center justify-center flex-shrink-0">
            <Image
              src="/cclpi-plans-logo.png"
              alt="CCLPI Plans Logo"
              width={20}
              height={20}
              className="object-contain h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-sm lg:text-lg font-bold tracking-tight text-gray-900 truncate leading-tight">CCLPI PLANS</h1>
            <p className="text-xs font-medium text-gray-500 truncate hidden sm:block leading-tight">Sales Dashboard</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
          {/* User Info - Desktop */}
          <div className="hidden lg:flex items-center space-x-3 rounded-lg bg-gray-50 px-3 py-2 border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(user.role)}
                  <span className="text-xs font-medium text-gray-500 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Status Indicator */}
          <SessionStatusIndicator />

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <Avatar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                <User className="mr-3 h-4 w-4 text-gray-500" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              {(user.role === 'Admin' || user.role === 'SystemAdmin') && (
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  <Settings className="mr-3 h-4 w-4 text-gray-500" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
