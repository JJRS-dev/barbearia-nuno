import { Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SiteLogo({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const text =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'
  const icon = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5'
  return (
    <span className={cn('flex items-center gap-2 font-sans', className)}>
      <Scissors className={cn('text-primary', icon)} aria-hidden />
      <span className={cn('font-bold uppercase tracking-widest', text)}>
        Nunex <span className="text-primary">Cortes</span>
      </span>
    </span>
  )
}
