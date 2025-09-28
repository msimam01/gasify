import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@inertiajs/react"

interface ConfirmPasswordFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  errors?: {
    password?: string
  }
  processing?: boolean
  className?: string
  onPasswordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  value?: string
}

export function ConfirmPasswordForm({
  className,
  onSubmit,
  errors = {},
  processing = false,
  ...props
}: ConfirmPasswordFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Confirm Password</h1>
                <p className="text-muted-foreground text-balance">
                  This is a secure area of the application. Please confirm your password before continuing.
                </p>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoFocus
                  value={props.value}
                  onChange={props.onPasswordChange}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? 'Confirming...' : 'Confirm Password'}
              </Button>

              <div className="text-center text-sm">
                <Link href="/forgot-password" className="underline underline-offset-4">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Confirm password"
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
