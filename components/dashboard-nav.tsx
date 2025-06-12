"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Settings, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      title: "Simulations",
      href: "/simulations",
      icon: TrendingUp,
    },
    {
      title: "Results",
      href: "/results",
      icon: BarChart3,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-64 border-r bg-background hidden md:block">
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <span className="font-semibold">Monte Carlo</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t">
        <Button variant="outline" className="w-full">
          Export Results
        </Button>
      </div>
    </aside>
  )
}
