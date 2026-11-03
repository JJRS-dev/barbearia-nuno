'use client'

import * as React from 'react'
import { CalendarDays, Clock3, Crown, Lock, LockOpen, UserRound, WandSparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { MonthCalendar } from './month-calendar'
import { Button } from '@/components/ui/button'
import { FULL_DAY_SLOTS, formatLongDate, formatMoney, toDateKey } from '@/lib/slots'
import { blockSlot, getBarberDay, getBarberOverview, getClients, getMonthlyStats, openSlots, setClientVip, setPrioritySlot, unblockSlot } from '@/app/actions/appointments'

type Slot = { id: number; slotDate: string; slotTime: string; status: string; price: number; clientName: string | null; clientPhone: string | null; priorityOnly: boolean; clientSubscriber: boolean }
type Client = { id: string; name: string; email: string; isSubscriber: boolean }
type MonthlyStat = { month: string; revenue: number; cuts: number }

export function BarberDashboard() {
  const [date, setDate] = React.useState(toDateKey(new Date()))
  const [slots, setSlots] = React.useState<Slot[]>([])
  const [overview, setOverview] = React.useState<Array<{ dateKey: string; total: number; booked: number }>>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [monthlyStats, setMonthlyStats] = React.useState<MonthlyStat[]>([])
  const [busy, setBusy] = React.useState(false)
  const [price, setPrice] = React.useState(50)

  const refresh = React.useCallback(async () => {
    const [daySlots, calendarOverview, clientList, stats] = await Promise.all([
      getBarberDay(date), getBarberOverview(), getClients(), getMonthlyStats(),
    ])
    setSlots(daySlots as Slot[])
    setOverview(calendarOverview)
    setClients(clientList)
    setMonthlyStats(stats)
  }, [date])

  React.useEffect(() => { refresh() }, [refresh])
  const markers = Object.fromEntries(overview.map((item) => [item.dateKey, (item.booked === item.total ? 'busy' : item.booked ? 'mixed' : 'available') as 'busy' | 'mixed' | 'available']))
  const currentMonth = toDateKey(new Date()).slice(0, 7)
  const currentStats = monthlyStats.find((item) => item.month === currentMonth) ?? { month: currentMonth, revenue: 0, cuts: 0 }

  async function createDay() {
    setBusy(true)
    try {
      const result = await openSlots(date, FULL_DAY_SLOTS, price)
      toast.success(result.count ? `${result.count} horários criados` : 'O dia já está configurado')
      await refresh()
    } finally { setBusy(false) }
  }

  async function toggle(slot: Slot) {
    setBusy(true)
    try {
      if (slot.status === 'open') await blockSlot(slot.id)
      else if (slot.status === 'blocked') await unblockSlot(slot.id)
      await refresh()
    } finally { setBusy(false) }
  }

  async function togglePriority(slot: Slot) {
    setBusy(true)
    try {
      await setPrioritySlot(slot.id, !slot.priorityOnly)
      toast.success(!slot.priorityOnly ? 'Horário reservado para clientes VIP' : 'Horário liberado para todos')
      await refresh()
    } finally { setBusy(false) }
  }

  async function toggleVip(client: Client) {
    setBusy(true)
    try {
      await setClientVip(client.id, !client.isSubscriber)
      toast.success(!client.isSubscriber ? `${client.name} agora é cliente VIP` : `Plano VIP desativado para ${client.name}`)
      await refresh()
    } finally { setBusy(false) }
  }

  const count = (status: string) => slots.filter((slot) => slot.status === status).length

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(192,145,72,.12),transparent_30%),linear-gradient(180deg,#151516,#101011)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div><p className="text-xs uppercase tracking-[.24em] text-primary">Painel do barbeiro</p><h1 className="font-sans text-xl font-bold uppercase">Agenda do Nuno</h1></div>
          <div className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs text-primary md:block">Plano VIP • R$ 119,99/mês • 2 cortes/semana</div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <MonthCalendar selected={date} onSelect={setDate} markers={markers} />

          <div className="rounded-3xl border border-white/10 bg-card/60 p-5">
            <div className="mb-4 flex items-center gap-2"><WandSparkles className="size-4 text-primary" /><h2 className="font-sans font-bold uppercase">Configurar dia</h2></div>
            <label className="text-xs text-muted-foreground">Valor do corte (R$)</label>
            <div className="mt-2 flex gap-2"><input className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" type="number" min="0" step="1" value={price} onChange={(event) => setPrice(Number(event.target.value))} /><Button onClick={createDay} disabled={busy}>Abrir dia</Button></div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">A agenda é criada em intervalos de 45 minutos. Você pode bloquear horários ou marcar vagas VIP.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card/60 p-5">
            <div className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" /><h2 className="font-sans font-bold uppercase">Resumo do mês</h2></div>
            <p className="mt-1 text-xs text-muted-foreground">Agendamentos confirmados em {currentMonth}.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/15 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cortes</p><p className="mt-1 font-sans text-2xl font-bold">{currentStats.cuts}</p></div>
              <div className="rounded-2xl bg-black/15 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Faturamento</p><p className="mt-1 font-sans text-xl font-bold">{formatMoney(currentStats.revenue)}</p></div>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/25 bg-primary/[.05] p-5">
            <div className="flex items-center gap-2"><Crown className="size-4 text-primary" /><h2 className="font-sans font-bold uppercase">Clientes Plano VIP</h2></div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Ative o plano após confirmar a assinatura de R$ 119,99/mês. O assinante recebe prioridade de 24 horas e pode reservar até 2 cortes por semana.</p>
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {clients.length ? clients.map((client) => (
                <div key={client.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{client.name}</p><p className="truncate text-[11px] text-muted-foreground">{client.email}</p></div>
                  <Button className="mt-2 w-full" size="sm" variant={client.isSubscriber ? 'default' : 'outline'} disabled={busy} onClick={() => toggleVip(client)}>
                    {client.isSubscriber ? <><Crown className="size-3.5" />VIP ativo</> : 'Ativar VIP'}
                  </Button>
                </div>
              )) : <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado ainda.</p>}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-card/50 p-5 md:flex-row md:items-center md:justify-between">
            <div><div className="flex items-center gap-2 text-primary"><CalendarDays className="size-4" /><span className="text-xs font-semibold uppercase tracking-widest">Dia selecionado</span></div><h2 className="mt-1 font-sans text-2xl font-bold uppercase">{formatLongDate(date)}</h2></div>
            <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-emerald-300">{count('open')} livres</span><span className="rounded-full bg-amber-400/10 px-3 py-1.5 text-amber-300">{count('booked')} reservados</span><span className="rounded-full bg-rose-400/10 px-3 py-1.5 text-rose-300">{count('blocked')} bloqueados</span></div>
          </div>

          {slots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center"><Clock3 className="mx-auto mb-3 size-8 text-primary" /><h3 className="font-sans text-xl font-bold uppercase">Dia ainda fechado</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Clique em “Abrir dia” para gerar a agenda completa de 45 em 45 minutos.</p></div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => (
                <div key={slot.id} className={`rounded-2xl border p-4 transition ${slot.status === 'booked' ? 'border-amber-400/20 bg-amber-400/[.06]' : slot.status === 'blocked' ? 'border-rose-400/20 bg-rose-400/[.06]' : slot.priorityOnly ? 'border-primary/35 bg-primary/[.08]' : 'border-emerald-400/15 bg-emerald-400/[.04]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-sans text-xl font-bold">{slot.slotTime}</p><p className="text-xs text-muted-foreground">{formatMoney(slot.price || 0)}</p></div>
                    <div className="flex flex-col items-end gap-1">
                      {slot.priorityOnly && <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"><Crown className="size-3" />VIP</span>}
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${slot.status === 'booked' ? 'bg-amber-400/15 text-amber-300' : slot.status === 'blocked' ? 'bg-rose-400/15 text-rose-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{slot.status === 'booked' ? 'Reservado' : slot.status === 'blocked' ? 'Bloqueado' : 'Livre'}</span>
                    </div>
                  </div>
                  {slot.status === 'booked' ? (
                    <div className="mt-4 rounded-xl bg-black/15 p-3 text-sm"><p className="flex items-center gap-2 font-semibold"><UserRound className="size-4 text-primary" />{slot.clientName || 'Cliente'}{slot.clientSubscriber && <Crown className="size-3.5 text-primary" />}</p>{slot.clientPhone && <p className="mt-1 text-xs text-muted-foreground">{slot.clientPhone}</p>}</div>
                  ) : (
                    <div className="mt-4 grid gap-2">
                      <Button variant={slot.priorityOnly ? 'default' : 'outline'} className="w-full" disabled={busy || slot.status === 'blocked'} onClick={() => togglePriority(slot)}><Crown className="size-4" />{slot.priorityOnly ? 'Remover prioridade VIP' : 'Tornar horário VIP'}</Button>
                      <Button variant="outline" className="w-full" disabled={busy} onClick={() => toggle(slot)}>{slot.status === 'blocked' ? <><LockOpen className="size-4" />Reabrir horário</> : <><Lock className="size-4" />Bloquear horário</>}</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
