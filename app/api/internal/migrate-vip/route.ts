import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

const MIGRATION_KEY = 'ibGwpiGFMIvE0go5o5qsJn2gNozjDwkX'

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('key') !== MIGRATION_KEY) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isSubscriber" boolean NOT NULL DEFAULT false`)
  await db.execute(sql`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "priorityOnly" boolean NOT NULL DEFAULT false`)
  await db.execute(sql`ALTER TABLE "appointment" ADD COLUMN IF NOT EXISTS "clientSubscriber" boolean NOT NULL DEFAULT false`)

  return NextResponse.json({ ok: true, migrated: true })
}
