/**
 * Runtime validation for required environment variables.
 * Import this module early (e.g. in the root layout) so missing vars
 * surface as clear errors instead of cryptic "undefined" failures.
 */

const requiredServerVars = [
    'RESEND_API_KEY',
] as const

const requiredPublicVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

function validateEnv() {
    const missing: string[] = []

    // Public vars are available on both client and server
    for (const key of requiredPublicVars) {
        if (!process.env[key]) {
            missing.push(key)
        }
    }

    // Server-only vars — skip validation on the client
    if (typeof window === 'undefined') {
        for (const key of requiredServerVars) {
            if (!process.env[key]) {
                missing.push(key)
            }
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `❌ Missing required environment variables:\n${missing.map((v) => `   • ${v}`).join('\n')}\n\nCopy .env.example to .env.local and fill in the values.`
        )
    }
}

validateEnv()

export { }
