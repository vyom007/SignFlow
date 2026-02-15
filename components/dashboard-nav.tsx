"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileSignature, LayoutDashboard, FileText, LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const navItems = [
]

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">SignFlow</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {/* {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-2", isActive && "bg-accent text-accent-foreground")}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })} */}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
