import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useState } from 'react'

interface TwoFactorChallengeFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onRecoverySubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onToggleMode: () => void
  errors?: {
    code?: string
    recovery_code?: string
  }
  processing?: boolean
  showRecovery: boolean
  className?: string
  code: string
  onCodeChange?: (code: string) => void
  recoveryCode: string
  onRecoveryCodeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TwoFactorChallengeForm({
  className,
  onSubmit,
  onRecoverySubmit,
  onToggleMode,
  errors = {},
  processing = false,
  showRecovery = false,
  code,
  onCodeChange,
  recoveryCode,
  onRecoveryCodeChange,
  ...props
}: TwoFactorChallengeFormProps) {
  const authConfigContent = {
    recovery: {
      title: 'Recovery Code',
      description: 'Please confirm access to your account by entering one of your emergency recovery codes.',
      toggleText: 'login using an authentication code',
    },
    authenticator: {
      title: 'Two-Factor Authentication',
      description: 'Enter the authentication code provided by your authenticator application.',
      toggleText: 'login using a recovery code',
    }
  };

  const currentMode = showRecovery ? 'recovery' : 'authenticator';
  const config = authConfigContent[currentMode];

  const handleCodeChange = (value: string) => {
    if (onCodeChange) {
      onCodeChange(value);
    }
  };

  const handleRecoveryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onRecoveryCodeChange) {
      onRecoveryCodeChange(e);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{config.title}</h1>
                <p className="text-muted-foreground text-balance">
                  {config.description}
                </p>
              </div>
              
              {showRecovery ? (
                <form onSubmit={onRecoverySubmit} className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="recovery_code">Recovery Code</Label>
                    <Input
                      id="recovery_code"
                      name="recovery_code"
                      type="text"
                      value={recoveryCode}
                      onChange={handleRecoveryInputChange}
                      placeholder="Enter recovery code"
                      required
                      autoFocus
                    />
                    {errors.recovery_code && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.recovery_code}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex w-full items-center justify-center">
                      <InputOTP
                        name="code"
                        maxLength={6}
                        value={code}
                        onChange={handleCodeChange}
                        disabled={processing}
                        pattern={REGEXP_ONLY_DIGITS}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }, (_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {errors.code && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.code}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>
              )}

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  {config.toggleText}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Two-Factor Authentication"
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
