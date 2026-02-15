import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { DataDisclaimerDialog } from "@/components/data-disclaimer-dialog"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DataDisclaimerDialog />
      <DashboardNav user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-border bg-background py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>⚖️ <strong>SignFlow</strong> is a demo application. Documents signed here carry no legal validity.</p>
          <p className="mt-1">All data is automatically deleted daily. Do not upload sensitive documents.</p>
        </div>
      </footer>
    </div>
  )
}
