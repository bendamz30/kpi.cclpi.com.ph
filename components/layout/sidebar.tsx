"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, ChevronLeft, ChevronRight, Home, UserCheck, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
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
      label: "Sales Reps", 
      icon: Users, 
      permission: "sales-reps:view",
      roles: ["Admin", "SystemAdmin", "RegionalUser"] 
    },
    { 
      id: "users", 
      label: "Users", 
      icon: UserCheck, 
      permission: "users:view",
      roles: ["Admin", "SystemAdmin"] 
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => 
    item.roles.includes(user.role) && hasPermission(item.permission)
  )

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && <h2 className="text-lg font-semibold">Menu</h2>}
        <Button
          variant="ghost"
          size="sm"
          className={cn("ml-auto", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn("w-full justify-start", collapsed && "px-2")}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && item.label}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
