"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, ChevronLeft, ChevronRight, Home, UserCheck } from "lucide-react"
import type { User } from "@/lib/mock-data"

interface SidebarProps {
  user: User
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ user, activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, roles: ["Admin", "Viewer", "RegionalUser"] },
    { id: "sales-reps", label: "Sales Reps", icon: Users, roles: ["Admin", "RegionalUser"] },
    { id: "users", label: "Users", icon: UserCheck, roles: ["Admin"] },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role))

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
