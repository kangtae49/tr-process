import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export function get_mem(mem: number | undefined | null) {
  if (mem == undefined) {
    return ''
  }
  return mem.toLocaleString('en-US')
}

export function get_sec(uptime: number | undefined | null) {
  if (uptime == undefined) {
    return ''
  }
  const date = new Date(0)
  date.setUTCSeconds(uptime)
  return formatInTimeZone(date, 'UTC', 'HH:mm:ss')
  // date.setSeconds(uptime)
  // return format(date, 'HH:mm:ss')
}