"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, ChevronLeft, ChevronRight, Home, UserCheck, Shield, Menu, X, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isMobileOpen?: boolean
  onMobileToggle?: () => void
}

export function Sidebar({ activeTab, onTabChange, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, hasPermission } = useAuth()

  if (!user) return null

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home, 
      permission: "dashboard:view",
      roles: ["Admin", "SystemAdmin", "Viewer", "RegionalUser"] 
    },
    { 
      id: "sales-reps", 
      label: "Sales Report", 
      icon: Users, 
      permission: "sales-reps:view",
      roles: ["Admin", "SystemAdmin"] 
    },
    { 
      id: "users", 
      label: "Users", 
      icon: UserCheck, 
      permission: "users:view",
      roles: ["Admin", "SystemAdmin"] 
    },
    { 
      id: "trash-bin", 
      label: "Trash Bin", 
      icon: Trash2, 
      permission: "trash-bin:view",
      roles: ["SystemAdmin"] 
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => 
    item.roles.includes(user.role) && hasPermission(item.permission)
  )

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    // Close mobile menu when tab is selected
    if (onMobileToggle) {
      onMobileToggle()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex relative flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          {!collapsed && <h2 className="text-lg font-semibold">Menu</h2>}
          <div className="ml-auto flex items-center space-x-2">
            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn("w-full justify-start", collapsed && "px-2")}
                style={{
                  backgroundColor: activeTab === item.id ? "#023f99" : "transparent",
                  color: activeTab === item.id ? "white" : "inherit",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = "#f3cf47";
                    e.currentTarget.style.color = "#013f99";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out flex flex-col border-r bg-background",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Menu</h2>
          <div className="ml-auto flex items-center space-x-2">
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileToggle}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start"
                style={{
                  backgroundColor: activeTab === item.id ? "#023f99" : "transparent",
                  color: activeTab === item.id ? "white" : "inherit",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = "#f3cf47";
                    e.currentTarget.style.color = "#013f99";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                  }
                }}
                onClick={() => handleTabChange(item.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
