<script setup lang="ts">
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { useToastState, type ToastType } from '@/shared/composables/useToast';

const { list, dismiss } = useToastState();

const config: Record<
  ToastType,
  { icon: typeof CheckCircleIcon; accent: string; iconClass: string }
> = {
  success: {
    icon: CheckCircleIcon,
    accent: 'bg-emerald-500',
    iconClass: 'text-emerald-500',
  },
  error: {
    icon: XCircleIcon,
    accent: 'bg-red-500',
    iconClass: 'text-red-500',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    accent: 'bg-amber-500',
    iconClass: 'text-amber-500',
  },
  info: {
    icon: InformationCircleIcon,
    accent: 'bg-primary-500',
    iconClass: 'text-primary-500',
  },
};
</script>

<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      aria-atomic="false"
      class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[340px] flex-col gap-2"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in list"
          :key="t.id"
          role="alert"
          class="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <!-- accent bar izquierda -->
          <span
            class="absolute inset-y-0 left-0 w-1 rounded-l-xl"
            :class="config[t.type].accent"
          />

          <!-- icono -->
          <component
            :is="config[t.type].icon"
            class="mt-0.5 h-5 w-5 shrink-0"
            :class="config[t.type].iconClass"
          />

          <!-- contenido -->
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
              {{ t.message }}
            </p>
            <ul v-if="t.details?.length" class="mt-2 space-y-1">
              <li
                v-for="d in t.details"
                :key="d"
                class="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400"
              >
                <span class="mt-px shrink-0 font-bold">·</span>
                <span>{{ d }}</span>
              </li>
            </ul>
          </div>

          <!-- botón cerrar -->
          <button
            type="button"
            aria-label="Cerrar notificación"
            class="-mr-1 -mt-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            @click="dismiss(t.id)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
  width: 100%;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(110%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(110%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
