<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

interface Swatch { name: string; hex: string }

const SWATCHES: Swatch[] = [
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Lima', hex: '#84CC16' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Turquesa', hex: '#14B8A6' },
  { name: 'Celeste', hex: '#06B6D4' },
  { name: 'Azul cielo', hex: '#0EA5E9' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Violeta', hex: '#8B5CF6' },
  { name: 'Morado', hex: '#A855F7' },
  { name: 'Fucsia', hex: '#D946EF' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Marrón', hex: '#92400E' },
  { name: 'Beige', hex: '#D6C7A1' },
  { name: 'Gris', hex: '#6B7280' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Dorado', hex: '#D4AF37' },
  { name: 'Plateado', hex: '#C0C0C0' },
];

const { modelValue = '' } = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const colorInput = useTemplateRef<HTMLInputElement>('colorInput');
const pickedHex = ref('#000000');

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function nearestSwatch(hex: string): Swatch {
  const rgb = hexToRgb(hex);
  return SWATCHES.reduce((best, s) => {
    const srgb = hexToRgb(s.hex);
    const dist = (rgb.r - srgb.r) ** 2 + (rgb.g - srgb.g) ** 2 + (rgb.b - srgb.b) ** 2;
    const bestRgb = hexToRgb(best.hex);
    const bestDist = (rgb.r - bestRgb.r) ** 2 + (rgb.g - bestRgb.g) ** 2 + (rgb.b - bestRgb.b) ** 2;
    return dist < bestDist ? s : best;
  }, SWATCHES[0]);
}

function selectSwatch(swatch: Swatch) {
  emit('update:modelValue', swatch.name);
  pickedHex.value = swatch.hex;
}

function onCustomColorChange(e: Event) {
  const hex = (e.target as HTMLInputElement).value;
  pickedHex.value = hex;
  emit('update:modelValue', nearestSwatch(hex).name);
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="swatch in SWATCHES"
        :key="swatch.name"
        type="button"
        :title="swatch.name"
        class="h-7 w-7 rounded-full border transition-transform hover:scale-110"
        :class="modelValue === swatch.name ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-1' : 'border-gray-300 dark:border-gray-600'"
        :style="{ backgroundColor: swatch.hex }"
        @click="selectSwatch(swatch)"
      />
      <button
        type="button"
        title="Elegir color exacto"
        class="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-400 text-[10px] text-gray-500 hover:scale-110 dark:border-gray-500 dark:text-gray-400"
        @click="colorInput?.click()"
      >
        +
      </button>
      <input
        ref="colorInput"
        type="color"
        :value="pickedHex"
        class="hidden"
        @input="onCustomColorChange"
      />
    </div>

    <input
      :value="modelValue"
      type="text"
      placeholder="Nombre del color (ej. Rojo, Azul marino…)"
      class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p class="text-xs text-gray-400">
      Elige una muestra, o el botón "+" para un color exacto (se sugiere el nombre más cercano), o escribe el nombre a mano.
    </p>
  </div>
</template>
