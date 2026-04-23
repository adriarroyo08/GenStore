import { LoginForm } from '@/components/LoginForm'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return <LoginForm onSuccess={onLoginSuccess} />
}
