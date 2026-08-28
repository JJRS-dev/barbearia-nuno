import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isBarber } from '@/lib/config'
import { BarberDashboard } from '@/components/scheduling/barber-dashboard'
export default async function BarberPage(){const session=await auth.api.getSession({headers:await headers()});if(!session?.user)redirect('/sign-in');if(!isBarber(session.user.email))redirect('/agendar');return <BarberDashboard/>}
