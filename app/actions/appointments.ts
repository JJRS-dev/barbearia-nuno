'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointment, user } from '@/lib/db/schema'
import { isBarber } from '@/lib/config'
import { and, asc, eq, gte, or, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function ensureVipSchema() {
  await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isSubscriber" boolean NOT NULL DEFAULT false`)
  await db.execute(sql`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "priorityOnly" boolean NOT NULL DEFAULT false`)
  await db.execute(sql`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "clientSubscriber" boolean NOT NULL DEFAULT false`)
}

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

async function getVipStatus(userId: string) {
  await ensureVipSchema()
  const rows = await db.select({ isSubscriber: user.isSubscriber }).from(user).where(eq(user.id, userId)).limit(1)
  return !!rows[0]?.isSubscriber
}

// ---------------------------------------------------------------------------
// BARBEIRO
// ---------------------------------------------------------------------------

export async function openSlots(dateKey: string, times: string[], price: number) {
  await requireBarber()
  await ensureVipSchema()
  if (!times.length) return { count: 0 }
  const safePrice = Math.max(0, Math.round(Number(price) || 0))
  const existing = await db.select({ slotTime: appointment.slotTime }).from(appointment).where(eq(appointment.slotDate, dateKey))
  const existingTimes = new Set(existing.map((row) => row.slotTime))
  const rows = times.filter((t) => !existingTimes.has(t)).map((t) => ({ slotDate: dateKey, slotTime: t, status: 'open' as const, price: safePrice }))
  const inserted = rows.length ? await db.insert(appointment).values(rows).returning({ id: appointment.id }) : []
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { count: inserted.length }
}

export async function removeSlot(id: number) {
  await requireBarber(); await ensureVipSchema()
  await db.delete(appointment).where(eq(appointment.id, id))
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { ok: true }
}

export async function getBarberDay(dateKey: string) {
  await requireBarber(); await ensureVipSchema()
  return db.select().from(appointment).where(eq(appointment.slotDate, dateKey)).orderBy(asc(appointment.slotTime))
}

export async function getMonthlyStats() {
  await requireBarber(); await ensureVipSchema()
  const rows = await db.select({ month: sql<string>`to_char(${appointment.slotDate}, 'YYYY-MM')`, revenue: sql<number>`coalesce(sum(${appointment.price}), 0)`, cuts: sql<number>`count(*)` }).from(appointment).where(eq(appointment.status, 'booked')).groupBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`).orderBy(sql`to_char(${appointment.slotDate}, 'YYYY-MM')`)
  return rows.map((r) => ({ month: r.month, revenue: Number(r.revenue), cuts: Number(r.cuts) }))
}

export async function getBarberOverview() {
  await requireBarber(); await ensureVipSchema()
  const rows = await db.select({ slotDate: appointment.slotDate, total: sql<number>`count(*)`, booked: sql<number>`count(*) filter (where ${appointment.status} = 'booked')` }).from(appointment).groupBy(appointment.slotDate)
  return rows.map((r) => ({ dateKey: r.slotDate as string, total: Number(r.total), booked: Number(r.booked) }))
}

export async function setPrioritySlot(id: number, priorityOnly: boolean) {
  await requireBarber(); await ensureVipSchema()
  const updated = await db.update(appointment).set({ priorityOnly }).where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).returning({ id: appointment.id })
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { ok: updated.length > 0 }
}

export async function getClients() {
  await requireBarber(); await ensureVipSchema()
  return db.select({ id: user.id, name: user.name, email: user.email, isSubscriber: user.isSubscriber }).from(user).orderBy(asc(user.name))
}

export async function setClientVip(userId: string, active: boolean) {
  await requireBarber(); await ensureVipSchema()
  await db.update(user).set({ isSubscriber: active, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------------

export async function getMyVipStatus() {
  const session = await getSession()
  const active = await getVipStatus(session.user.id)
  return { active, planName: 'Plano VIP', monthlyPrice: 119.99 }
}

export async function getOpenSlots(dateKey: string) {
  const session = await getSession(); await ensureVipSchema()
  const vip = await getVipStatus(session.user.id)
  return db.select().from(appointment).where(and(eq(appointment.slotDate, dateKey), eq(appointment.status, 'open'), vip ? undefined : eq(appointment.priorityOnly, false))).orderBy(asc(appointment.slotTime))
}

export async function getAvailableDays() {
  const session = await getSession(); await ensureVipSchema()
  const vip = await getVipStatus(session.user.id)
  const today = new Date()
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const availability = vip ? undefined : eq(appointment.priorityOnly, false)
  const rows = await db.select({ slotDate: appointment.slotDate, openCount: sql<number>`count(*)` }).from(appointment).where(and(eq(appointment.status, 'open'), gte(appointment.slotDate, key), availability)).groupBy(appointment.slotDate)
  return rows.map((r) => ({ dateKey: r.slotDate as string, openCount: Number(r.openCount) }))
}

export async function bookSlot(id: number, phone: string) {
  const session = await getSession(); await ensureVipSchema()
  if (isBarber(session.user.email)) throw new Error('O barbeiro não agenda como cliente')
  const vip = await getVipStatus(session.user.id)
  const slot = await db.select({ priorityOnly: appointment.priorityOnly }).from(appointment).where(eq(appointment.id, id)).limit(1)
  if (slot[0]?.priorityOnly && !vip) return { ok: false, message: 'Este horário é exclusivo para clientes do Plano VIP.' }
  const updated = await db.update(appointment).set({ status: 'booked', clientId: session.user.id, clientName: session.user.name, clientPhone: phone?.trim() || null, clientSubscriber: vip, bookedAt: new Date() }).where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).returning({ id: appointment.id })
  revalidatePath('/agendar'); revalidatePath('/barbeiro')
  if (!updated.length) return { ok: false, message: 'Esse horário já foi reservado.' }
  return { ok: true }
}

export async function getMyBookings() {
  const session = await getSession(); await ensureVipSchema()
  return db.select().from(appointment).where(and(eq(appointment.status, 'booked'), eq(appointment.clientId, session.user.id))).orderBy(asc(appointment.slotDate), asc(appointment.slotTime))
}

export async function cancelMyBooking(id: number) {
  const session = await getSession(); await ensureVipSchema()
  const updated = await db.update(appointment).set({ status: 'open', clientId: null, clientName: null, clientPhone: null, clientSubscriber: false, bookedAt: null }).where(and(eq(appointment.id, id), eq(appointment.clientId, session.user.id))).returning({ id: appointment.id })
  revalidatePath('/agendar'); revalidatePath('/barbeiro')
  return { ok: updated.length > 0 }
}

export async function blockSlot(id: number) {
  await requireBarber(); await ensureVipSchema()
  const updated = await db.update(appointment).set({ status: 'blocked' }).where(and(eq(appointment.id, id), eq(appointment.status, 'open'))).returning({ id: appointment.id })
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { ok: updated.length > 0 }
}

export async function unblockSlot(id: number) {
  await requireBarber(); await ensureVipSchema()
  const updated = await db.update(appointment).set({ status: 'open' }).where(and(eq(appointment.id, id), eq(appointment.status, 'blocked'))).returning({ id: appointment.id })
  revalidatePath('/barbeiro'); revalidatePath('/agendar')
  return { ok: updated.length > 0 }
}
