'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Confirmation Email Sent
          </h1>
        </div>

        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a confirmation link to your email address. Please check your inbox
          and click the link to verify your account.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          Once confirmed, you can sign in to start monitoring your children&apos;s devices.
        </p>

        <Link href="/auth/login">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2">
            Back to Sign In
          </Button>
        </Link>
      </Card>
    </div>
  )
}
