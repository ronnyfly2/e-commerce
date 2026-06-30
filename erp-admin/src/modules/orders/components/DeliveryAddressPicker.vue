<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { MagnifyingGlassIcon, XMarkIcon, MapPinIcon } from '@heroicons/vue/24/outline';
import BaseInput from '@/shared/components/ui/BaseInput.vue';

// Fix Leaflet marker icons broken by Vite asset hashing
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

interface NominatimAddress {
  road?: string;
  house_number?: string;
  suburb?: string;
  city_district?: string;
  town?: string;
  city?: string;
  state?: string;
  region?: string;
  postcode?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

const props = defineProps<{
  address: string;
  city: string;
  state: string;
  zip: string;
  reference: string;
  error?: string;
}>();

const emit = defineEmits<{
  'update:address': [v: string];
  'update:city': [v: string];
  'update:state': [v: string];
  'update:zip': [v: string];
  'update:reference': [v: string];
}>();

const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer');
const searchQuery = ref('');
const results = ref<NominatimResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);

let leafletMap: L.Map | null = null;
let marker: L.Marker | null = null;

const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428]; // Lima, Perú
const DETAIL_ZOOM = 16;
const OVERVIEW_ZOOM = 12;

onMounted(() => {
  leafletMap = L.map(mapContainer.value!).setView(DEFAULT_CENTER, OVERVIEW_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(leafletMap);

  leafletMap.on('click', (e: L.LeafletMouseEvent) => {
    latitude.value = e.latlng.lat;
    longitude.value = e.latlng.lng;
    placeOrMoveMarker([e.latlng.lat, e.latlng.lng]);
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });
});

onUnmounted(() => {
  leafletMap?.remove();
  leafletMap = null;
  marker = null;
});

function placeOrMoveMarker(latlng: [number, number]) {
  if (marker) {
    marker.setLatLng(latlng);
  } else {
    marker = L.marker(latlng, { draggable: true }).addTo(leafletMap!);
    marker.on('dragend', () => {
      const pos = marker!.getLatLng();
      latitude.value = pos.lat;
      longitude.value = pos.lng;
      reverseGeocode(pos.lat, pos.lng);
    });
  }
}

// ─── Reverse geocode: fill address fields from coords ──────────────────────
async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return;
    const data = (await res.json()) as NominatimResult;
    fillFromNominatim(data);
  } catch {
    // silently ignore — user can fill manually
  }
}

// ─── Forward search ─────────────────────────────────────────────────────────
const runSearch = useDebounceFn(async () => {
  const q = searchQuery.value.trim();
  if (q.length < 3) {
    results.value = [];
    showDropdown.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`;
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
  latitude.value = lat;
  longitude.value = lng;
  leafletMap?.setView([lat, lng], DETAIL_ZOOM);
  placeOrMoveMarker([lat, lng]);
  fillFromNominatim(result);
  searchQuery.value = result.display_name;
  showDropdown.value = false;
  results.value = [];
}

// ─── Auto-fill form fields from Nominatim data ──────────────────────────────
function fillFromNominatim(data: NominatimResult) {
  const a = data.address ?? {};

  // Build street address from road + house number
  const parts = [a.road, a.house_number].filter(Boolean);
  if (parts.length) emit('update:address', parts.join(' '));

  // City: prefer suburb/district over city
  const city = a.suburb ?? a.city_district ?? a.town ?? a.city ?? '';
  if (city) emit('update:city', city);

  const state = a.state ?? a.region ?? '';
  if (state) emit('update:state', state);

  if (a.postcode) emit('update:zip', a.postcode);
}

function clearSearch() {
  searchQuery.value = '';
  results.value = [];
  showDropdown.value = false;
}

function hideDropdown() {
  setTimeout(() => { showDropdown.value = false; }, 150);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Map search -->
    <div>
      <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        Buscar en el mapa
      </p>
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
          placeholder="Buscar dirección de entrega…"
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
    </div>

    <!-- Leaflet map -->
    <div
      ref="mapContainer"
      class="h-72 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
    />

    <!-- Coordinate hint -->
    <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <MapPinIcon class="h-3.5 w-3.5 shrink-0" />
      <span v-if="latitude !== null && longitude !== null">
        {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </span>
      <span v-else>
        Busca una dirección o haz clic en el mapa — los campos se llenarán automáticamente.
      </span>
    </div>

    <!-- Address fields (auto-filled from map, editable manually) -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <BaseInput
          :model-value="props.address"
          label="Dirección *"
          placeholder="Av. Larco 1234"
          :error="error"
          @update:model-value="emit('update:address', $event)"
        />
      </div>
      <BaseInput
        :model-value="props.city"
        label="Distrito / Ciudad"
        placeholder="Miraflores"
        @update:model-value="emit('update:city', $event)"
      />
      <BaseInput
        :model-value="props.state"
        label="Provincia / Región"
        placeholder="Lima"
        @update:model-value="emit('update:state', $event)"
      />
      <BaseInput
        :model-value="props.zip"
        label="Código postal"
        placeholder="15074"
        @update:model-value="emit('update:zip', $event)"
      />
      <BaseInput
        :model-value="props.reference"
        label="Referencia"
        placeholder="Frente al parque, edificio azul…"
        @update:model-value="emit('update:reference', $event)"
      />
    </div>
  </div>
</template>
