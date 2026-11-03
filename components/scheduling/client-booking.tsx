'use client'

import * as React from 'react'
import { CalendarCheck2, Clock3, Crown, Phone, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { MonthCalendar } from './month-calendar'
import { Button } from '@/components/ui/button'
import { bookSlot, getAvailableDays, getMyBookings, getOpenSlots, cancelMyBooking, getMyVipStatus } from '@/app/actions/appointments'
import { formatLongDate, formatMoney, toDateKey } from '@/lib/slots'

type Slot = { id: number; slotDate: string; slotTime: string; status: string; price: number; priorityOnly?: boolean }

export function ClientBooking() {
  const [date, setDate] = React.useState(toDateKey(new Date()))
  const [slots, setSlots] = React.useState<Slot[]>([])
  const [days, setDays] = React.useState<Array<{ dateKey: string; openCount: number }>>([])
  const [mine, setMine] = React.useState<Slot[]>([])
  const [phone, setPhone] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [vip, setVip] = React.useState(false)
  const [weeklyUsed, setWeeklyUsed] = React.useState(0)

  const refresh = React.useCallback(async () => {
    const [available, availableDays, bookings, vipStatus] = await Promise.all([
      getOpenSlots(date), getAvailableDays(), getMyBookings(), getMyVipStatus(),
    ])
    setSlots(available as Slot[])
    setDays(availableDays)
    setMine(bookings as Slot[])
    setVip(vipStatus.active)
    setWeeklyUsed(vipStatus.weeklyUsed)
  }, [date])

  React.useEffect(() => { refresh() }, [refresh])
  const markers = Object.fromEntries(days.map((day) => [day.dateKey, 'available' as const]))

  async function book(id: number) {
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Informe seu WhatsApp com DDD antes de reservar.')
      return
    }
    setBusy(true)
    try {
      const result = await bookSlot(id, phone)
      if (result.ok) toast.success('Horário reservado!')
      else toast.error(result.message)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id: number) {
    setBusy(true)
    try {
      const result = await cancelMyBooking(id)
      if (result.ok) toast.success('Agendamento cancelado.')
      else toast.error('Não foi possível cancelar esse agendamento.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_right,rgba(192,145,72,.13),transparent_28%),linear-gradient(180deg,#151516,#0f0f10)]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5">
          <div><p className="text-xs uppercase tracking-[.24em] text-primary">Nunex Cortes</p><h1 className="font-sans text-2xl font-bold uppercase">Agende com o Nuno</h1></div>
          {vip && <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary"><Crown className="size-4" />Plano VIP</span>}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <MonthCalendar selected={date} onSelect={setDate} markers={markers} />
          <div className={`rounded-3xl border p-5 ${vip ? 'border-primary/30 bg-primary/[.06]' : 'border-white/10 bg-card/60'}`}>
            <div className="flex items-center gap-2"><Crown className="size-4 text-primary" /><p className="text-xs font-semibold uppercase tracking-widest text-primary">Plano VIP • R$ 119,99/mês</p></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {vip
                ? `Seu Plano VIP está ativo. Você tem prioridade de 24 horas e já utilizou ${weeklyUsed} de 2 cortes nesta semana.`
                : 'Clientes VIP podem reservar antes da liberação geral. Os demais clientes veem os horários quando faltam até 24 horas para o atendimento.'}
            </p>
            {vip && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(weeklyUsed / 2, 1) * 100}%` }} /></div>}
          </div>
          <div className="rounded-3xl border border-white/10 bg-card/60 p-5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Phone className="size-4 text-primary" />WhatsApp</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(27) 99999-9999" inputMode="tel" autoComplete="tel" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
            <p className="mt-2 text-xs text-muted-foreground">Informe seu número com DDD para o Nuno identificar seu agendamento.</p>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-card/50 p-5">
            <div className="flex items-center gap-2 text-primary"><CalendarCheck2 className="size-4" /><span className="text-xs font-semibold uppercase tracking-widest">Escolha o horário</span></div>
            <h2 className="mt-1 font-sans text-2xl font-bold uppercase">{formatLongDate(date)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cada atendimento ocupa 45 minutos. {vip ? 'Você visualiza os horários com prioridade VIP.' : 'Os horários são liberados para clientes regulares nas 24 horas anteriores ao corte.'}</p>
          </div>

          {slots.length ? (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {slots.map((slot) => (
                <button disabled={busy || (vip && weeklyUsed >= 2)} onClick={() => book(slot.id)} key={slot.id} className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-50 ${slot.priorityOnly ? 'border-primary/35 bg-primary/[.09]' : 'border-white/10 bg-card/60'}`}>
                  {slot.priorityOnly ? <Crown className="mb-3 size-4 text-primary" /> : <Clock3 className="mb-3 size-4 text-primary" />}
                  <p className="font-sans text-xl font-bold">{slot.slotTime}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatMoney(slot.price || 0)}</p>
                  {slot.priorityOnly && <span className="mt-2 inline-block rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">Prioridade VIP</span>}
                  <span className="mt-3 block text-xs font-semibold text-primary opacity-70 group-hover:opacity-100">Reservar →</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
              <Scissors className="mx-auto mb-3 size-7 text-primary" /><p className="font-semibold">Nenhum horário liberado neste dia.</p>
              <p className="mt-1 text-sm text-muted-foreground">Clientes regulares veem os horários quando faltam até 24 horas. Escolha outro dia ou consulte novamente mais perto do atendimento.</p>
            </div>
          )}

          {vip && weeklyUsed >= 2 && <p className="rounded-2xl border border-primary/25 bg-primary/[.06] p-4 text-sm text-primary">Você já utilizou os 2 cortes permitidos pelo Plano VIP nesta semana.</p>}

          {mine.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-card/40 p-5">
              <h3 className="font-sans text-lg font-bold uppercase">Meus agendamentos</h3>
              <div className="mt-3 space-y-2">
                {mine.map((slot) => <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-3"><div><p className="font-semibold">{slot.slotDate} • {slot.slotTime}</p></div><Button variant="ghost" size="sm" disabled={busy} onClick={() => cancel(slot.id)}>Cancelar</Button></div>)}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
