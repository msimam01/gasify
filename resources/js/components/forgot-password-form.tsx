import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@inertiajs/react"
import { route } from "ziggy-js"

interface ForgotPasswordFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  errors?: {
    email?: string
  }
  processing?: boolean
  status?: string
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ForgotPasswordForm({
  className,
  onSubmit,
  errors = {},
  processing = false,
  status,
  ...props
}: ForgotPasswordFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your email and we'll send you a password reset link
                </p>
              </div>
              
              {status && (
                <div className="text-center text-sm font-medium text-green-600">
                  {status}
                </div>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoFocus
                  value={props.value}
                  onChange={props.onChange}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? 'Sending link...' : 'Send reset link'}
              </Button>

              <div className="text-center text-sm">
                Remember your password?{' '}
                <Link href={route('login')} className="text-primary underline underline-offset-4 hover:no-underline">
                  Sign in
                </Link>
              </div>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Forgot password"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
