<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { TrophyIcon } from '@heroicons/vue/24/solid';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import type { EligibleCustomer } from '../types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    candidates: EligibleCustomer[];
    /** Real winner from the API — null while still spinning; the reveal waits for both this AND the minimum spin duration. */
    winner: { name: string; phone: string } | null;
    /** Minimum time the animation spins before it's allowed to reveal — the actual reveal also waits for `winner`, so a slow API just extends the spin, it never cuts it short. */
    durationMs?: number;
  }>(),
  { durationMs: 6000 },
);

const emit = defineEmits<{ (e: 'close'): void }>();

const CONFETTI_COUNT = 90;
const COLORS = ['#f43f5e', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#facc15'];

const displayName = ref('');
const revealed = ref(false);
const progress = ref(0);
const tick = ref(0);
const confettiPieces = ref<
  { left: number; color: string; delay: number; duration: number; rotate: number; sway: number; size: number; round: boolean }[]
>([]);

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/** Cubic ease-out — starts near-instant and stretches out smoothly toward the end, feels less mechanical than a linear ramp. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function spin(elapsed: number) {
  if (props.candidates.length === 0) return;
  displayName.value = props.candidates[Math.floor(Math.random() * props.candidates.length)].name;
  tick.value += 1;
  progress.value = Math.min(elapsed / props.durationMs, 1);

  if (props.winner && elapsed >= props.durationMs) {
    displayName.value = props.winner.name;
    tick.value += 1;
    revealed.value = true;
    spawnConfetti();
    return;
  }

  const t = Math.min(elapsed / props.durationMs, 1);
  const delay = 45 + easeOutCubic(t) * 280;
  timer = setTimeout(() => spin(elapsed + delay), delay);
}

function spawnConfetti() {
  confettiPieces.value = Array.from({ length: CONFETTI_COUNT }, () => ({
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.6,
    rotate: 360 + Math.random() * 360,
    sway: (Math.random() - 0.5) * 160,
    size: 6 + Math.random() * 7,
    round: Math.random() > 0.5,
  }));
}

watch(
  () => props.open,
  (isOpen) => {
    clearTimer();
    revealed.value = false;
    confettiPieces.value = [];
    displayName.value = '';
    progress.value = 0;
    tick.value = 0;
    if (isOpen) spin(0);
  },
);

onBeforeUnmount(clearTimer);
</script>

<template>
  <Teleport to="body">
    <Transition name="draw-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/85 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Sorteando ganador"
      >
        <div
          class="pointer-events-none absolute inset-0"
          style="background: radial-gradient(circle at 50% 40%, rgba(99,102,241,0.35), transparent 65%)"
        />

        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <span
            v-for="(p, i) in confettiPieces"
            :key="i"
            class="confetti-piece"
            :style="{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.6}px`,
              backgroundColor: p.color,
              borderRadius: p.round ? '50%' : '2px',
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--confetti-rotate': `${p.rotate}deg`,
              '--confetti-sway': `${p.sway}px`,
            }"
          />
        </div>

        <div class="relative mx-4 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
          <div class="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div
              v-if="!revealed"
              class="absolute inset-0 animate-spin-ring rounded-full border-4 border-primary-100 border-t-primary-500 dark:border-primary-900/60 dark:border-t-primary-400"
            />
            <div v-else class="absolute inset-0 animate-glow-pulse rounded-full bg-amber-400/25" />
            <TrophyIcon
              class="relative h-11 w-11 transition-all duration-500"
              :class="revealed ? 'scale-110 text-amber-400 animate-trophy-bounce' : 'scale-90 text-gray-300 dark:text-gray-600'"
            />
          </div>

          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {{ revealed ? '¡Tenemos ganador!' : 'Sorteando…' }}
          </p>

          <div class="relative h-10 overflow-hidden">
            <Transition name="reel">
              <p
                :key="tick"
                class="absolute inset-0 flex items-center justify-center truncate px-2 text-2xl font-bold"
                :class="revealed ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'"
                role="status"
                aria-live="polite"
              >
                {{ displayName }}
              </p>
            </Transition>
          </div>

          <p v-if="revealed && winner" class="mt-1 text-sm text-gray-500">{{ winner.phone }}</p>

          <div v-if="!revealed" class="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              class="h-full rounded-full bg-linear-to-r from-primary-400 to-primary-600 transition-all duration-150 ease-linear"
              :style="{ width: `${Math.round(progress * 100)}%` }"
            />
          </div>

          <Transition name="draw-fade">
            <BaseButton v-if="revealed" class="mt-6" @click="emit('close')">Cerrar</BaseButton>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.draw-fade-enter-active,
.draw-fade-leave-active {
  transition: opacity 0.25s ease;
}
.draw-fade-enter-from,
.draw-fade-leave-to {
  opacity: 0;
}

.reel-enter-active,
.reel-leave-active {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease;
}
.reel-enter-from {
  transform: translateY(-55%);
  opacity: 0;
}
.reel-leave-to {
  transform: translateY(55%);
  opacity: 0;
}

.confetti-piece {
  position: absolute;
  top: -16px;
  opacity: 0.9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  animation-name: confetti-fall;
  animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
  animation-fill-mode: forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--confetti-sway), 110vh) rotate(var(--confetti-rotate));
    opacity: 0;
  }
}

@keyframes spin-ring {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-ring {
  animation: spin-ring 0.9s linear infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.9;
  }
}
.animate-glow-pulse {
  animation: glow-pulse 1.4s ease-in-out infinite;
}

@keyframes trophy-bounce {
  0%,
  100% {
    transform: scale(1.1) translateY(0);
  }
  50% {
    transform: scale(1.1) translateY(-6px);
  }
}
.animate-trophy-bounce {
  animation: trophy-bounce 1s ease-in-out infinite;
}
</style>
