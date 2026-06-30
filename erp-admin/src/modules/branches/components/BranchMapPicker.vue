<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { ref, watch, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { MagnifyingGlassIcon, XMarkIcon, MapPinIcon } from '@heroicons/vue/24/outline';

// Fix Leaflet marker icons broken by Vite asset hashing
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const { latitude, longitude } = defineProps<{
  latitude?: number | null;
  longitude?: number | null;
}>();

const emit = defineEmits<{
  'update:latitude': [v: number];
  'update:longitude': [v: number];
}>();

const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer');
const searchQuery = ref('');
const results = ref<NominatimResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);

let leafletMap: L.Map | null = null;
let marker: L.Marker | null = null;

const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428]; // Lima, Peru
const DETAIL_ZOOM = 16;
const OVERVIEW_ZOOM = 12;

onMounted(() => {
  const hasCoords = latitude != null && longitude != null;
  const center: [number, number] = hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER;

  leafletMap = L.map(mapContainer.value!).setView(center, hasCoords ? DETAIL_ZOOM : OVERVIEW_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(leafletMap);

  if (hasCoords) {
    placeOrMoveMarker([latitude!, longitude!]);
  }

  leafletMap.on('click', (e: L.LeafletMouseEvent) => {
    placeOrMoveMarker([e.latlng.lat, e.latlng.lng]);
    emit('update:latitude', e.latlng.lat);
    emit('update:longitude', e.latlng.lng);
  });
});

onUnmounted(() => {
  leafletMap?.remove();
  leafletMap = null;
  marker = null;
});

// Handles the async edit-load case: props arrive after mount when the parent fetches branch data
watch(
  () => [latitude, longitude] as const,
  ([lat, lng]) => {
    if (lat != null && lng != null && leafletMap && !marker) {
      leafletMap.setView([lat, lng], DETAIL_ZOOM);
      placeOrMoveMarker([lat, lng]);
    }
  },
);

function placeOrMoveMarker(latlng: [number, number]) {
  if (marker) {
    marker.setLatLng(latlng);
  } else {
    marker = L.marker(latlng, { draggable: true }).addTo(leafletMap!);
    marker.on('dragend', () => {
      const pos = marker!.getLatLng();
      emit('update:latitude', pos.lat);
      emit('update:longitude', pos.lng);
    });
  }
}

const runSearch = useDebounceFn(async () => {
  const q = searchQuery.value.trim();
  if (q.length < 3) {
    results.value = [];
    showDropdown.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) throw new Error('Search failed');
    results.value = (await res.json()) as NominatimResult[];
    showDropdown.value = results.value.length > 0;
  } catch {
    results.value = [];
    showDropdown.value = false;
  } finally {
    isSearching.value = false;
  }
}, 500);

function selectResult(result: NominatimResult) {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  leafletMap?.setView([lat, lng], DETAIL_ZOOM);
  placeOrMoveMarker([lat, lng]);
  emit('update:latitude', lat);
  emit('update:longitude', lng);
  searchQuery.value = result.display_name;
  showDropdown.value = false;
  results.value = [];
}

function clearSearch() {
  searchQuery.value = '';
  results.value = [];
  showDropdown.value = false;
}

function hideDropdown() {
  // Delay so mousedown on a result fires before blur hides the dropdown
  setTimeout(() => { showDropdown.value = false; }, 150);
}
</script>

<template>
  <div class="space-y-2">
    <!-- Search bar -->
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <svg
          v-if="isSearching"
          class="h-4 w-4 animate-spin text-primary-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <MagnifyingGlassIcon v-else class="h-4 w-4 text-gray-400" />
      </div>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar dirección en el mapa…"
        class="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400"
        autocomplete="off"
        @input="runSearch()"
        @blur="hideDropdown()"
      />

      <button
        v-if="searchQuery"
        type="button"
        class="absolute inset-y-0 right-2 flex items-center rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="clearSearch()"
      >
        <XMarkIcon class="h-4 w-4" />
      </button>

      <!-- Results dropdown -->
      <ul
        v-if="showDropdown"
        class="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <li
          v-for="r in results"
          :key="r.place_id"
          class="cursor-pointer truncate px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          @mousedown.prevent="selectResult(r)"
        >
          {{ r.display_name }}
        </li>
      </ul>
    </div>

    <!-- Map -->
    <div
      ref="mapContainer"
      class="h-80 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
    />

    <!-- Coordinate readout / hint -->
    <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <MapPinIcon class="h-3.5 w-3.5 shrink-0" />
      <span v-if="latitude != null && longitude != null">
        {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </span>
      <span v-else>Haz clic en el mapa o busca una dirección para fijar la ubicación.</span>
    </div>
  </div>
</template>
