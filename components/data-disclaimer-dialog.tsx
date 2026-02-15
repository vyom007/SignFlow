"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"

export function DataDisclaimerDialog() {
    const [open, setOpen] = useState(true)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        ⚠️ Important Notice
                    </DialogTitle>
                </DialogHeader>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                        🗑️ Daily Data Reset
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-amber-700 dark:text-amber-400">
                        Please be aware that <strong>all uploaded documents and user data are automatically deleted every day at 9:23 PM CST</strong> as part of the free-tier maintenance schedule.
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-amber-700 dark:text-amber-400">
                        This is a demo application — please do not upload any sensitive or important documents. 📄
                    </p>
                    <p className="mt-4 text-base font-medium text-amber-800 dark:text-amber-300">
                        Thank you for understanding and enjoy exploring SignFlow! 🚀
                    </p>
                </div>
                <DialogFooter>
                    <Button size="lg" onClick={() => setOpen(false)} className="w-full gap-2 text-base">
                        ✅ I Understand, Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
