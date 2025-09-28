import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@inertiajs/react"

interface VerifyEmailFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  processing?: boolean
  status?: string
  className?: string
  onLogout?: () => void
}

export function VerifyEmailForm({
  className,
  onSubmit,
  processing = false,
  status,
  onLogout,
  ...props
}: VerifyEmailFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-muted-foreground text-balance">
                  Please verify your email address by clicking on the link we just emailed to you.
                </p>
              </div>
              
              {status === 'verification-link-sent' && (
                <div className="text-center text-sm font-medium text-green-600">
                  A new verification link has been sent to your email address.
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={processing}
                  variant="outline"
                >
                  {processing ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </form>

              <div className="text-center text-sm">
                <button 
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Verify email"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By continuing, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
