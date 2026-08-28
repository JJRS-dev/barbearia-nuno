import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isBarber } from '@/lib/config'
import { AuthForm } from '@/components/auth-form'

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    redirect(isBarber(session.user.email) ? '/barbeiro' : '/agendar')
  }
  return <AuthForm mode="sign-up" />
}
