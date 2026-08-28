'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { isBarber } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteLogo } from '@/components/site-logo'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(
        isSignUp
          ? 'Não foi possível criar a conta. Verifique os dados e tente outro e-mail.'
          : 'E-mail ou palavra-passe incorretos.',
      )
      return
    }

    router.push(isBarber(email) ? '/barbeiro' : '/agendar')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/barbershop-hero.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-background/80" aria-hidden />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/">
            <SiteLogo size="lg" />
          </Link>
          <p className="text-pretty text-sm text-muted-foreground">
            {isSignUp
              ? 'Crie a sua conta para agendar o seu corte com o Nuno.'
              : 'Entre na sua conta para agendar o seu corte.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
          <h1 className="mb-5 font-sans text-xl font-bold uppercase tracking-wide">
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="O seu nome"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@email.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading
                ? 'Aguarde...'
                : isSignUp
                  ? 'Criar conta'
                  : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
