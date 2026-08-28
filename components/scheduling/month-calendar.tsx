'use client'
import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEK = ['D','S','T','Q','Q','S','S']

function keyOf(y:number,m:number,d:number){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}

export function MonthCalendar({ selected, onSelect, markers = {} }:{
  selected:string
  onSelect:(key:string)=>void
  markers?:Record<string,'available'|'busy'|'mixed'|'blocked'>
}){
  const initial = selected ? new Date(`${selected}T12:00:00`) : new Date()
  const [view,setView] = React.useState(new Date(initial.getFullYear(),initial.getMonth(),1))
  const y=view.getFullYear(), m=view.getMonth()
  const first=new Date(y,m,1).getDay()
  const days=new Date(y,m+1,0).getDate()
  const cells=Array.from({length:first+days},(_,i)=>i<first?null:i-first+1)
  return <div className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-2xl shadow-black/10 backdrop-blur md:p-5">
    <div className="mb-4 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={()=>setView(new Date(y,m-1,1))}><ChevronLeft className="size-4"/></Button>
      <div className="text-center"><p className="font-sans text-lg font-bold uppercase tracking-wide">{MONTHS[m]}</p><p className="text-xs text-muted-foreground">{y}</p></div>
      <Button variant="ghost" size="icon" onClick={()=>setView(new Date(y,m+1,1))}><ChevronRight className="size-4"/></Button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">{WEEK.map((w,i)=><div key={i} className="py-1">{w}</div>)}</div>
    <div className="mt-1 grid grid-cols-7 gap-1">
      {cells.map((d,i)=>d===null?<div key={`e${i}`}/>:(()=>{const k=keyOf(y,m,d); const mark=markers[k]; const active=k===selected; return <button key={k} onClick={()=>onSelect(k)} className={cn('relative aspect-square rounded-xl text-sm font-semibold transition hover:bg-white/10',active?'bg-primary text-primary-foreground shadow-lg shadow-primary/20':'bg-white/[0.03] text-foreground', mark==='available'&&!active&&'ring-1 ring-emerald-400/50',mark==='busy'&&!active&&'ring-1 ring-amber-400/50',mark==='mixed'&&!active&&'ring-1 ring-primary/50')}>
        {d}{mark&&<span className={cn('absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full',mark==='available'?'bg-emerald-400':mark==='busy'?'bg-amber-400':'bg-primary')}/>} 
      </button>})())}
    </div>
  </div>
}
