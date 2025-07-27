export function get_mem(mem: number | undefined) {
  if (mem == undefined) {
    return ''
  }
  return mem.toLocaleString('en-US')
}