import Image from 'next/image'
import { naviiAvatarUrl } from '@/lib/avatar'

type Props = {
  seed: string
  size?: number
  className?: string
}

/** Deterministic avatar from navii.dev (seed with merchant id or email). */
export function UserAvatar({ seed, size = 36, className = '' }: Props) {
  return (
    <Image
      src={naviiAvatarUrl(seed, size * 2)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      unoptimized
    />
  )
}
