'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointment } from '@/lib/db/schema'
import { isBarber } from '@/lib/config'
import { and, asc, eq, gte, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autenticado')
  return session
}

async function requireBarber() {
  const session = await getSession()
  if (!isBarber(session.user.email)) throw new Error('Acesso negado')
  return session
}

// ---------------------------------------------------------------------------
// BARBEIRO
// ---------------------------------------------------------------------------

// Abre novos horários (livres) para um dia. Ignora horários já existentes.
export async function openSlots(
  dateKey: string,
  times: string[],
  price: number,
) {
  await requireBarber()
  if (!times.length) return { count: 0 }

  const safePrice = Math.max(0, Math.round(Number(price) || 0))
  const existing = await db
    .select({ slotTime: appointment.slotTime })
    .from(appointment)
    .where(eq(appointment.slotDate, dateKey))
  const existingTimes = new Set(existing.map((row) => row.slotTime))
  const rows = times
    .filter((t) => !existingTimes.has(t))
    .map((t) => ({
      slotDate: dateKey,
      slotTime: t,
      status: 'open' as const,
      price: safePrice,
    }))

  const inserted = rows.length
    ? await db.insert(appointment).values(rows).returning({ id: appointment.id })
    : []

  revalidatePath('/barbeiro')
  revalidatePath('/agendar')
  return { count: inserted.length }
}

// Cancela / remove um horário. Se estava reservado, o agendamento do cliente
// é cancelado junto.
export async function removeSlot(id: number) {
  await requireBarber()
  await db.delete(appointment).where(eq(appointment.id, id))
  revalidatePath('/barbeiro')
  revalidatePath('/agendar')
  return { ok: true }
}

// Todos os horários de um dia (livres + reservados) para o painel do barbeiro.
export async function getBarberDay(dateKey: string) {
  await requireBarber()
  return db
    .select()
    .from(appointment)
    .where(eq(appointment.slotDate, dateKey))
    .orderBy(asc(appointment.slotTime))
}

// Estatística de renda: soma dos cortes reservados por mês.
export async function getMonthlyStats() {
  await requireBarber()
  const rows = await db
    .select({
      month: sql<string>`to_char(${appointment.slotDate}, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(${appointment.price}), 0)`,
      cuts: sql<number>`count(*)`,
    })
    .from(appointment)
    .where(eq(appointment.status, 'booked'))
    .groupBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`)

  return rows.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
    cuts: Number(r.cuts),
  }))
}

// Resumo por dia (quantos horários existem em cada data) para o calendário
// do barbeiro.
export async function getBarberOverview() {
  await requireBarber()
  const rows = await db
    .select({
      slotDate: appointment.slotDate,
      total: sql<number>`count(*)`,
      booked: sql<number>`count(*) filter (where ${appointment.status} = 'booked')`,
    })
    .from(appointment)
    .groupBy(appointment.slotDate)

  return rows.map((r) => ({
    dateKey: r.slotDate as string,
    total: Number(r.total),
    booked: Number(r.booked),
  }))
}

// ---------------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------------

// Horários livres de um dia (para o cliente escolher).
export async function getOpenSlots(dateKey: string) {
  await getSession()
  return db
    .select()
    .from(appointment)
    .where(
      and(eq(appointment.slotDate, dateKey), eq(appointment.status, 'open')),
    )
    .orderBy(asc(appointment.slotTime))
}

// Dias que têm pelo menos um horário livre (a partir de hoje) — para marcar
// no calendário do cliente.
export async function getAvailableDays() {
  await getSession()
  const today = new Date()
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const rows = await db
    .select({
      slotDate: appointment.slotDate,
      openCount: sql<number>`count(*)`,
    })
    .from(appointment)
    .where(
      and(eq(appointment.status, 'open'), gte(appointment.slotDate, key)),
    )
    .groupBy(appointment.slotDate)

  return rows.map((r) => ({
    dateKey: r.slotDate as string,
    openCount: Number(r.openCount),
  }))
}

// Cliente agenda um horário livre.
export async function bookSlot(id: number, phone: string) {
  const session = await getSession()
  if (isBarber(session.user.email)) {
    throw new Error('O barbeiro não agenda como cliente')
  }

  const updated = await db
    .update(appointment)
    .set({
      status: 'booked',
      clientId: session.user.id,
      clientName: session.user.name,
      clientPhone: phone?.trim() || null,
      bookedAt: new Date(),
    })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'open')))
    .returning({ id: appointment.id })

  revalidatePath('/agendar')
  revalidatePath('/barbeiro')

  if (!updated.length) {
    return { ok: false, message: 'Esse horário já foi reservado.' }
  }
  return { ok: true }
}

// Agendamentos do próprio cliente (futuros e passados).
export async function getMyBookings() {
  const session = await getSession()
  return db
    .select()
    .from(appointment)
    .where(
      and(
        eq(appointment.status, 'booked'),
        eq(appointment.clientId, session.user.id),
      ),
    )
    .orderBy(asc(appointment.slotDate), asc(appointment.slotTime))
}

// Cliente cancela o próprio agendamento — o horário volta a ficar livre.
export async function cancelMyBooking(id: number) {
  const session = await getSession()
  const updated = await db
    .update(appointment)
    .set({
      status: 'open',
      clientId: null,
      clientName: null,
      clientPhone: null,
      bookedAt: null,
    })
    .where(
      and(eq(appointment.id, id), eq(appointment.clientId, session.user.id)),
    )
    .returning({ id: appointment.id })

  revalidatePath('/agendar')
  revalidatePath('/barbeiro')
  return { ok: updated.length > 0 }
}

// Bloqueia um horário livre para que clientes não consigam reservar.
export async function blockSlot(id: number) {
  await requireBarber()
  const updated = await db
    .update(appointment)
    .set({ status: 'blocked' })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'open')))
    .returning({ id: appointment.id })
  revalidatePath('/barbeiro')
  revalidatePath('/agendar')
  return { ok: updated.length > 0 }
}

// Reabre um horário previamente bloqueado pelo barbeiro.
export async function unblockSlot(id: number) {
  await requireBarber()
  const updated = await db
    .update(appointment)
    .set({ status: 'open' })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'blocked')))
    .returning({ id: appointment.id })
  revalidatePath('/barbeiro')
  revalidatePath('/agendar')
  return { ok: updated.length > 0 }
}
