export function get_mem(mem: number | undefined | null) {
  if (mem == undefined) {
    return ''
  }
  return mem.toLocaleString('en-US')
}