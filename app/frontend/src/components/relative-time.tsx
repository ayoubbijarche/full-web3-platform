'use client'

import { formatDistanceToNow } from 'date-fns'

export function RelativeTime({ date }: { date: string }) {
  return <span>Ends {formatDistanceToNow(new Date(date))}</span>
} 