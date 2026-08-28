import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isBarber } from '@/lib/config'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SiteLogo } from '@/components/site-logo'
import { MotionReveal } from '@/components/motion-reveal'
import { Scissors, CalendarDays, Clock3, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const loggedIn = !!session?.user
  const barber = isBarber(session?.user?.email)
  const primaryHref = loggedIn ? (barber ? '/barbeiro' : '/agendar') : '/sign-up'
  const primaryLabel = loggedIn ? (barber ? 'Abrir agenda' : 'Escolher horário') : 'Agendar agora'

  return (
    <div className="min-h-svh overflow-hidden bg-[#0c0d0f] text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0c0d0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <SiteLogo />
          <nav className="flex items-center gap-2">
            {!loggedIn && <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} href="/sign-in">Entrar</Link>}
            <Link className={buttonVariants({ size: 'sm' })} href={primaryHref}>{barber ? 'Painel Nuno' : 'Agendar'}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative min-h-[88svh] pt-20">
          <div className="absolute inset-0 bg-[url('/barbershop-hero.webp')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0c0d0f_8%,rgba(12,13,15,.9)_42%,rgba(12,13,15,.34)_72%,#0c0d0f_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(192,145,72,.18),transparent_28%)]" />
          <div className="relative mx-auto flex min-h-[80svh] max-w-7xl items-center px-5 py-16 md:px-8">
            <MotionReveal className="max-w-3xl" y={32}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[.22em] text-primary">
                <Sparkles className="size-3.5" /> Atendimento com hora marcada
              </div>
              <h1 className="max-w-3xl text-balance font-sans text-5xl font-bold uppercase leading-[.95] tracking-[-.03em] md:text-7xl lg:text-8xl">
                Seu estilo.<br/><span className="text-primary">Seu horário.</span><br/>Sem espera.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/65 md:text-lg">
                Agende seu corte com o Nuno em poucos segundos. Escolha o dia, veja somente os horários realmente disponíveis e confirme sua reserva.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6')} href={primaryHref}>{primaryLabel}<ArrowRight className="size-4"/></Link>
                {!loggedIn && <Link className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 border-white/15 bg-white/5 px-6')} href="/sign-in">Já sou cliente</Link>}
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs uppercase tracking-[.15em] text-white/45">
                <span className="flex items-center gap-2"><Clock3 className="size-4 text-primary"/>Intervalos de 45 min</span>
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/>Horário confirmado</span>
              </div>
            </MotionReveal>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-5 py-20 md:px-8">
          <MotionReveal className="mb-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Agendamento simples</p><h2 className="mt-2 font-sans text-3xl font-bold uppercase md:text-5xl">Do calendário à cadeira<br/>em três passos.</h2></div>
            <p className="max-w-sm text-sm leading-relaxed text-white/50">A experiência foi desenhada para você não perder tempo procurando disponibilidade ou esperando resposta.</p>
          </MotionReveal>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {n:'01',icon:CalendarDays,title:'Escolha o dia',desc:'Navegue pelo calendário e veja rapidamente quais datas ainda têm vagas.'},
              {n:'02',icon:Clock3,title:'Escolha a hora',desc:'Os horários são organizados de 45 em 45 minutos e mostram apenas vagas livres.'},
              {n:'03',icon:Scissors,title:'Chegue e corte',desc:'Com o horário reservado, é só chegar no momento certo para ser atendido pelo Nuno.'},
            ].map((item,index)=><MotionReveal key={item.n} delay={index * 0.1} y={18}><article className="group h-full rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[.04]">
              <div className="flex items-start justify-between"><span className="font-sans text-4xl font-bold text-white/10 transition group-hover:text-primary/25">{item.n}</span><item.icon className="size-5 text-primary"/></div>
              <h3 className="mt-10 font-sans text-xl font-bold uppercase">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/50">{item.desc}</p>
            </article></MotionReveal>)}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between md:px-8"><SiteLogo size="sm"/><p>Nunex Cortes — agenda profissional do Nuno</p></div></footer>
    </div>
  )
}
