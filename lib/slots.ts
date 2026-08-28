import { SLOT_DURATION_MIN } from './config'

// Gera uma lista de horários "HH:MM" em intervalos fixos de 45 minutos.
export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  let minutes = startHour * 60
  const end = endHour * 60
  while (minutes < end) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    minutes += SLOT_DURATION_MIN
  }
  return slots
}

// Agenda de 24 horas: 00:00, 00:45, 01:30 ... 23:15.
export const FULL_DAY_SLOTS = generateTimeSlots(0, 24)
export const DAY_SLOTS = FULL_DAY_SLOTS

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

export function formatLongDate(key: string): string {
  const d = fromDateKey(key)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} de ${y}`
}
