'use client'
import * as React from 'react'
import { CalendarDays, Clock3, Lock, LockOpen, UserRound, WandSparkles } from 'lucide-react'
import { toast } from 'sonner'
import { MonthCalendar } from './month-calendar'
import { Button } from '@/components/ui/button'
import { FULL_DAY_SLOTS, formatLongDate, formatMoney, toDateKey } from '@/lib/slots'
import { blockSlot, getBarberDay, getBarberOverview, openSlots, unblockSlot } from '@/app/actions/appointments'

type Slot={id:number;slotDate:string;slotTime:string;status:string;price:number;clientName:string|null;clientPhone:string|null}

export function BarberDashboard(){
  const [date,setDate]=React.useState(toDateKey(new Date()))
  const [slots,setSlots]=React.useState<Slot[]>([])
  const [overview,setOverview]=React.useState<Array<{dateKey:string;total:number;booked:number}>>([])
  const [busy,setBusy]=React.useState(false)
  const [price,setPrice]=React.useState(50)
  const refresh=React.useCallback(async()=>{setSlots(await getBarberDay(date) as Slot[]);setOverview(await getBarberOverview())},[date])
  React.useEffect(()=>{refresh()},[refresh])
  const markers = Object.fromEntries(overview.map(x => [x.dateKey, (x.booked === x.total ? 'busy' : x.booked ? 'mixed' : 'available') as 'busy' | 'mixed' | 'available']))
  async function createDay(){setBusy(true);try{const r=await openSlots(date,FULL_DAY_SLOTS,price);toast.success(r.count?`${r.count} horários criados`:'O dia já está configurado');await refresh()}finally{setBusy(false)}}
  async function toggle(s:Slot){setBusy(true);try{if(s.status==='open')await blockSlot(s.id);else if(s.status==='blocked')await unblockSlot(s.id);await refresh()}finally{setBusy(false)}}
  const count=(status:string)=>slots.filter(s=>s.status===status).length
  return <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(192,145,72,.12),transparent_30%),linear-gradient(180deg,#151516,#101011)]">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div><p className="text-xs uppercase tracking-[.24em] text-primary">Painel do barbeiro</p><h1 className="font-sans text-xl font-bold uppercase">Agenda do Nuno</h1></div><div className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs text-primary md:block">45 min por horário</div></div></header>
    <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4"><MonthCalendar selected={date} onSelect={setDate} markers={markers}/>
        <div className="rounded-3xl border border-white/10 bg-card/60 p-5"><div className="mb-4 flex items-center gap-2"><WandSparkles className="size-4 text-primary"/><h2 className="font-sans font-bold uppercase">Configurar dia</h2></div><label className="text-xs text-muted-foreground">Valor do corte</label><div className="mt-2 flex gap-2"><input className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/50" type="number" value={price} onChange={e=>setPrice(Number(e.target.value))}/><Button onClick={createDay} disabled={busy}>Abrir dia</Button></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Cria todos os horários do dia em intervalos de 45 minutos. Depois, bloqueie apenas os períodos em que você não estará disponível.</p></div>
      </aside>
      <section className="space-y-4"><div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-card/50 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-primary"><CalendarDays className="size-4"/><span className="text-xs font-semibold uppercase tracking-widest">Dia selecionado</span></div><h2 className="mt-1 font-sans text-2xl font-bold uppercase">{formatLongDate(date)}</h2></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-emerald-300">{count('open')} livres</span><span className="rounded-full bg-amber-400/10 px-3 py-1.5 text-amber-300">{count('booked')} reservados</span><span className="rounded-full bg-rose-400/10 px-3 py-1.5 text-rose-300">{count('blocked')} bloqueados</span></div></div>
        {slots.length===0?<div className="rounded-3xl border border-dashed border-white/15 p-12 text-center"><Clock3 className="mx-auto mb-3 size-8 text-primary"/><h3 className="font-sans text-xl font-bold uppercase">Dia ainda fechado</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Clique em “Abrir dia” para gerar a agenda completa de 45 em 45 minutos.</p></div>:
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{slots.map(s=><div key={s.id} className={`rounded-2xl border p-4 transition ${s.status==='booked'?'border-amber-400/20 bg-amber-400/[.06]':s.status==='blocked'?'border-rose-400/20 bg-rose-400/[.06]':'border-emerald-400/15 bg-emerald-400/[.04]'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-sans text-xl font-bold">{s.slotTime}</p><p className="text-xs text-muted-foreground">{formatMoney(s.price||0)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.status==='booked'?'bg-amber-400/15 text-amber-300':s.status==='blocked'?'bg-rose-400/15 text-rose-300':'bg-emerald-400/15 text-emerald-300'}`}>{s.status==='booked'?'Reservado':s.status==='blocked'?'Bloqueado':'Livre'}</span></div>{s.status==='booked'?<div className="mt-4 rounded-xl bg-black/15 p-3 text-sm"><p className="flex items-center gap-2 font-semibold"><UserRound className="size-4 text-primary"/>{s.clientName||'Cliente'}</p>{s.clientPhone&&<p className="mt-1 text-xs text-muted-foreground">{s.clientPhone}</p>}</div>:<Button variant="outline" className="mt-4 w-full" disabled={busy} onClick={()=>toggle(s)}>{s.status==='blocked'?<><LockOpen className="size-4"/>Reabrir horário</>:<><Lock className="size-4"/>Bloquear horário</>}</Button>}</div>)}</div>}
      </section>
    </main>
  </div>
}
