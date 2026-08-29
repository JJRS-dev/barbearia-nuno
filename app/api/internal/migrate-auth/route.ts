import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get('key') !== 'nunex-auth-migrate-2026') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('ALTER TABLE account ADD COLUMN IF NOT EXISTS issuer text')
    await client.query(`
      UPDATE account
      SET issuer = CASE
        WHEN "providerId" = 'credential' THEN 'local:credential'
        ELSE 'local:oauth:' || "providerId"
      END
      WHERE issuer IS NULL
    `)
    await client.query('ALTER TABLE account ALTER COLUMN issuer SET NOT NULL')
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx" ON account (issuer, "accountId")')
    await client.query('COMMIT')

    return NextResponse.json({ ok: true, migrated: true })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Auth migration failed', error)
    return NextResponse.json({ ok: false, error: 'migration_failed' }, { status: 500 })
  } finally {
    client.release()
  }
}
