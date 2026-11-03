'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointment, user } from '@/lib/db/schema'
import { isBarber } from '@/lib/config'
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm'
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

function getWeekRange(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + mondayOffset)
  const start = date.toISOString().slice(0, 10)
  date.setUTCDate(date.getUTCDate() + 6)
  return { start, end: date.toISOString().slice(0, 10) }
}

async function getVipStatus(userId: string) {
  const rows = await db.select({ isSubscriber: user.isSubscriber }).from(user).where(eq(user.id, userId)).limit(1)
  return !!rows[0]?.isSubscriber
}

function refreshBookingPaths() {
  revalidatePath('/barbeiro')
  revalidatePath('/agendar')
}

// ---------------------------------------------------------------------------
// BARBEIRO
// ---------------------------------------------------------------------------

export async function openSlots(dateKey: string, times: string[], price: number) {
  await requireBarber()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Data inválida')
  if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error('Valor inválido')
  if (!times.length) return { count: 0 }
  const safePrice = Math.round(price)
  const existing = await db.select({ slotTime: appointment.slotTime }).from(appointment).where(eq(appointment.slotDate, dateKey))
  const existingTimes = new Set(existing.map((row) => row.slotTime))
  const validTimes = [...new Set(times)].filter((time) => /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(time))
  const rows = validTimes.filter((time) => !existingTimes.has(time)).map((time) => ({
    slotDate: dateKey, slotTime: time, status: 'open' as const, price: safePrice,
  }))
  const inserted = rows.length ? await db.insert(appointment).values(rows).returning({ id: appointment.id }) : []
  refreshBookingPaths()
  return { count: inserted.length }
}

export async function removeSlot(id: number) {
  await requireBarber()
  await db.delete(appointment).where(and(eq(appointment.id, id), eq(appointment.status, 'open')))
  refreshBookingPaths()
  return { ok: true }
}

export async function getBarberDay(dateKey: string) {
  await requireBarber()
  return db.select().from(appointment).where(eq(appointment.slotDate, dateKey)).orderBy(asc(appointment.slotTime))
}

export async function getMonthlyStats() {
  await requireBarber()
  const rows = await db.select({
    month: sql<string>`to_char(${appointment.slotDate}, 'YYYY-MM')`,
    revenue: sql<number>`coalesce(sum(${appointment.price}), 0)`,
    cuts: sql<number>`count(*)`,
  }).from(appointment).where(eq(appointment.status, 'booked'))
    .groupBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`)
  return rows.map((row) => ({ month: row.month, revenue: Number(row.revenue), cuts: Number(row.cuts) }))
}

export async function getBarberOverview() {
  await requireBarber()
  const rows = await db.select({
    slotDate: appointment.slotDate,
    total: sql<number>`count(*)`,
    booked: sql<number>`count(*) filter (where ${appointment.status} = 'booked')`,
  }).from(appointment).groupBy(appointment.slotDate)
  return rows.map((row) => ({ dateKey: row.slotDate as string, total: Number(row.total), booked: Number(row.booked) }))
}

export async function setPrioritySlot(id: number, priorityOnly: boolean) {
  await requireBarber()
  const updated = await db.update(appointment).set({ priorityOnly })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'open')))
    .returning({ id: appointment.id })
  refreshBookingPaths()
  return { ok: updated.length > 0 }
}

export async function getClients() {
  await requireBarber()
  return db.select({ id: user.id, name: user.name, email: user.email, isSubscriber: user.isSubscriber })
    .from(user).orderBy(asc(user.name))
}

export async function setClientVip(userId: string, active: boolean) {
  await requireBarber()
  if (!userId || userId.length > 128) throw new Error('Cliente inválido')
  await db.update(user).set({ isSubscriber: active, updatedAt: new Date() }).where(eq(user.id, userId))
  refreshBookingPaths()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------------

export async function getMyVipStatus() {
  const session = await getSession()
  const active = await getVipStatus(session.user.id)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const { start, end } = getWeekRange(today)
  const rows = active ? await db.select({ count: sql<number>`count(*)` }).from(appointment)
    .where(and(eq(appointment.status, 'booked'), eq(appointment.clientId, session.user.id),
      gte(appointment.slotDate, start), lte(appointment.slotDate, end))) : []
  return { active, planName: 'Plano VIP', monthlyPrice: 119.99, weeklyLimit: 2, weeklyUsed: Number(rows[0]?.count ?? 0) }
}

export async function getOpenSlots(dateKey: string) {
  const session = await getSession()
  const vip = await getVipStatus(session.user.id)
  const futureSlot = sql`(${appointment.slotDate} + ${appointment.slotTime}::time) > (now() AT TIME ZONE 'America/Sao_Paulo')`
  const conditions = [eq(appointment.slotDate, dateKey), eq(appointment.status, 'open'), futureSlot]
  if (!vip) {
    conditions.push(eq(appointment.priorityOnly, false))
    conditions.push(sql`(${appointment.slotDate} + ${appointment.slotTime}::time) <= (now() AT TIME ZONE 'America/Sao_Paulo') + interval '24 hours'`)
  }
  return db.select().from(appointment).where(and(...conditions)).orderBy(asc(appointment.slotTime))
}

export async function getAvailableDays() {
  const session = await getSession()
  const vip = await getVipStatus(session.user.id)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const conditions = [
    eq(appointment.status, 'open'),
    gte(appointment.slotDate, today),
    sql`(${appointment.slotDate} + ${appointment.slotTime}::time) > (now() AT TIME ZONE 'America/Sao_Paulo')`,
  ]
  if (!vip) {
    conditions.push(eq(appointment.priorityOnly, false))
    conditions.push(sql`(${appointment.slotDate} + ${appointment.slotTime}::time) <= (now() AT TIME ZONE 'America/Sao_Paulo') + interval '24 hours'`)
  }
  const rows = await db.select({ slotDate: appointment.slotDate, openCount: sql<number>`count(*)` })
    .from(appointment).where(and(...conditions)).groupBy(appointment.slotDate)
  return rows.map((row) => ({ dateKey: row.slotDate as string, openCount: Number(row.openCount) }))
}

export async function bookSlot(id: number, phone: string) {
  const session = await getSession()
  if (isBarber(session.user.email)) throw new Error('O barbeiro não agenda como cliente')
  const normalizedPhone = String(phone ?? '').trim()
  const digits = normalizedPhone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) {
    return { ok: false, message: 'Informe um WhatsApp válido com DDD.' }
  }
  const vip = await getVipStatus(session.user.id)

  const result = await db.transaction(async (tx) => {
    // Serializa reservas do mesmo assinante para impedir que duas solicitações
    // simultâneas ultrapassem o limite semanal.
    await tx.execute(sql`SELECT id FROM "user" WHERE id = ${session.user.id} FOR UPDATE`)

    const slots = await tx.select({
      slotDate: appointment.slotDate,
      slotTime: appointment.slotTime,
      priorityOnly: appointment.priorityOnly,
    }).from(appointment).where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).limit(1)
    const slot = slots[0]
    if (!slot) return { ok: false as const, message: 'Esse horário já foi reservado ou não está mais disponível.' }

    const slotDateTime = new Date(`${slot.slotDate}T${slot.slotTime}:00-03:00`)
    const now = new Date()
    if (slotDateTime <= now) return { ok: false as const, message: 'Esse horário já passou.' }
    if (!vip && (slot.priorityOnly || slotDateTime.getTime() > now.getTime() + 24 * 60 * 60 * 1000)) {
      return { ok: false as const, message: 'Esse horário é liberado para clientes regulares somente nas últimas 24 horas. O Plano VIP tem prioridade.' }
    }

    if (vip) {
      const { start, end } = getWeekRange(slot.slotDate)
      const booked = await tx.select({ count: sql<number>`count(*)` }).from(appointment)
        .where(and(eq(appointment.status, 'booked'), eq(appointment.clientId, session.user.id),
          gte(appointment.slotDate, start), lte(appointment.slotDate, end)))
      if (Number(booked[0]?.count ?? 0) >= 2) {
        return { ok: false as const, message: 'Seu Plano VIP permite até 2 cortes por semana. Você já atingiu esse limite para a semana escolhida.' }
      }
    }

    const updated = await tx.update(appointment).set({
      status: 'booked',
      clientId: session.user.id,
      clientName: session.user.name,
      clientPhone: normalizedPhone,
      clientSubscriber: vip,
      bookedAt: new Date(),
    }).where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).returning({ id: appointment.id })
    return updated.length ? { ok: true as const } : { ok: false as const, message: 'Esse horário acabou de ser reservado por outra pessoa.' }
  })

  refreshBookingPaths()
  return result
}

export async function getMyBookings() {
  const session = await getSession()
  return db.select().from(appointment)
    .where(and(eq(appointment.status, 'booked'), eq(appointment.clientId, session.user.id)))
    .orderBy(asc(appointment.slotDate), asc(appointment.slotTime))
}

export async function cancelMyBooking(id: number) {
  const session = await getSession()
  const updated = await db.update(appointment).set({
    status: 'open', clientId: null, clientName: null, clientPhone: null,
    clientSubscriber: false, bookedAt: null,
  }).where(and(eq(appointment.id, id), eq(appointment.clientId, session.user.id), eq(appointment.status, 'booked')))
    .returning({ id: appointment.id })
  refreshBookingPaths()
  return { ok: updated.length > 0 }
}

export async function blockSlot(id: number) {
  await requireBarber()
  const updated = await db.update(appointment).set({ status: 'blocked' })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).returning({ id: appointment.id })
  refreshBookingPaths()
  return { ok: updated.length > 0 }
}

export async function unblockSlot(id: number) {
  await requireBarber()
  const updated = await db.update(appointment).set({ status: 'open' })
    .where(and(eq(appointment.id, id), eq(appointment.status, 'blocked'))).returning({ id: appointment.id })
  refreshBookingPaths()
  return { ok: updated.length > 0 }
}
