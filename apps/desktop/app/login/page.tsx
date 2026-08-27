import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { TestLoginButton } from "@/components/auth/test-login-button"
import { SITE_CONFIG } from "@/lib/constants"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{SITE_CONFIG.name}</CardTitle>
          <CardDescription>{SITE_CONFIG.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <GoogleLoginButton />
          <TestLoginButton />
        </CardContent>
      </Card>
    </div>
  )
}
