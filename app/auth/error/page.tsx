import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">Authentication Error</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong during authentication. Please try again.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block">
            <Button>Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
