import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  details?: string[];
}

let _nextId = 0;
const _list = ref<ToastItem[]>([]);
const _timers = new Map<number, ReturnType<typeof setTimeout>>();

function dismiss(id: number): void {
  clearTimeout(_timers.get(id));
  _timers.delete(id);
  const idx = _list.value.findIndex((t) => t.id === id);
  if (idx !== -1) _list.value.splice(idx, 1);
}

function push(type: ToastType, message: string, details?: string[]): void {
  const id = _nextId++;
  _list.value.push({ id, type, message, details });
  const ttl = type === 'error' || type === 'warning' ? 6000 : 4000;
  _timers.set(id, setTimeout(() => dismiss(id), ttl));
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string, details?: string[]) => push('error', message, details),
  errors(msgs: string[]): void {
    if (msgs.length === 1) push('error', msgs[0]);
    else push('error', 'Errores de validación', msgs);
  },
  warning: (message: string) => push('warning', message),
  info: (message: string) => push('info', message),
};

export function useToastState() {
  return { list: _list, dismiss };
}
