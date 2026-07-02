<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { orderApi } from '../api';
import {
  ORDER_CHANNEL_LABELS,
  type OrderChannel,
  type DeliveryType,
  type CreateOrderItemPayload,
  formatCents,
} from '../types';
import { extractApiError } from '@/shared/types/api.types';
import { storeApi } from '@/modules/stores/api';
import { productApi } from '@/modules/products/api';
import { productBundleApi } from '@/modules/product-bundles/api';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import DeliveryAddressPicker from '../components/DeliveryAddressPicker.vue';

const router = useRouter();
const isSubmitting = ref(false);

// ─── Catalog (for stock-aware items) ────────────────────────────────────────────
const storeOptions = ref<{ label: string; value: string }[]>([]);
const storeId = ref('');
const catalogOptions = ref<{ label: string; value: string }[]>([]);
const catalogById = new Map<string, { name: string; sku: string; price: number; kind: 'product' | 'bundle' }>();

onMounted(async () => {
  const [stores, products, bundles] = await Promise.all([
    storeApi.getAll({ limit: 100 }),
    productApi.getAll({ limit: 100 }),
    productBundleApi.getAll({ limit: 100 }),
  ]);
  storeOptions.value = stores.items.map((s) => ({ label: s.name, value: s.id }));

  products.items.forEach((p) => catalogById.set(`product:${p.id}`, { name: p.name, sku: p.sku, price: Number(p.price), kind: 'product' }));
  bundles.items.forEach((b) => catalogById.set(`bundle:${b.id}`, { name: b.name, sku: `${b.items.length} productos`, price: Number(b.price), kind: 'bundle' }));

  catalogOptions.value = [
    { label: '— Artículo personalizado (no descuenta stock) —', value: '' },
    ...products.items.map((p) => ({ label: `${p.name} (${p.sku})`, value: `product:${p.id}` })),
    ...bundles.items.map((b) => ({ label: `📦 ${b.name}`, value: `bundle:${b.id}` })),
  ];
});

// ─── Form state ────────────────────────────────────────────────────────────────
const channel = ref<OrderChannel>('ADMIN');
const deliveryType = ref<DeliveryType>('DELIVERY');
const currencyCode = ref('USD');

const customerName = ref('');
const customerEmail = ref('');
const customerPhone = ref('');
const customerNotes = ref('');

const deliveryAddress = ref('');
const deliveryCity = ref('');
const deliveryState = ref('');
const deliveryZip = ref('');
const deliveryReference = ref('');

const discountCents = ref(0);
const taxCents = ref(0);
const shippingCents = ref(0);
const notes = ref('');

interface ItemRow {
  catalogRef: string; // 'product:<id>' | 'bundle:<id>' | '' for a free-text custom item
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number; // in major units (e.g. 49.99 USD)
}

function emptyItem(): ItemRow {
  return { catalogRef: '', productName: '', productSku: '', quantity: 1, unitPrice: 0 };
}

const items = ref<ItemRow[]>([emptyItem()]);

function addItem() {
  items.value.push(emptyItem());
}

function removeItem(index: number) {
  if (items.value.length > 1) items.value.splice(index, 1);
}

/** Selecting a catalog product/bundle auto-fills name, SKU and price — stock only decrements for catalog items. */
function onCatalogPicked(item: ItemRow, ref: string) {
  item.catalogRef = ref;
  const entry = catalogById.get(ref);
  if (!entry) return;
  item.productName = entry.name;
  item.productSku = entry.sku;
  item.unitPrice = entry.price;
}

// ─── Derived totals ─────────────────────────────────────────────────────────
const subtotalCents = computed(() =>
  items.value.reduce((sum, i) => sum + Math.round(i.quantity * i.unitPrice * 100), 0),
);

const totalCents = computed(() =>
  subtotalCents.value - discountCents.value + taxCents.value + shippingCents.value,
);


// ─── Validation ──────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({});

function validate(): boolean {
  errors.value = {};
  if (!customerName.value.trim()) errors.value.customerName = 'Nombre del cliente requerido';
  if (!storeId.value) errors.value.store = 'Selecciona la tienda que atenderá el pedido';
  if (deliveryType.value === 'DELIVERY' && !deliveryAddress.value.trim()) {
    errors.value.deliveryAddress = 'Dirección de entrega requerida';
  }
  if (items.value.some((i) => !i.productName.trim())) {
    errors.value.items = 'Todos los productos deben tener nombre';
  }
  if (items.value.some((i) => i.unitPrice <= 0)) {
    errors.value.itemsPrice = 'El precio debe ser mayor a 0';
  }
  if (items.value.some((i) => i.quantity < 1)) {
    errors.value.itemsQty = 'La cantidad debe ser al menos 1';
  }
  return Object.keys(errors.value).length === 0;
}

// ─── Submit ──────────────────────────────────────────────────────────────────
async function submit() {
  if (!validate()) return;
  isSubmitting.value = true;

  const payload: CreateOrderItemPayload[] = items.value.map((i) => ({
    productId: i.catalogRef.startsWith('product:') ? i.catalogRef.slice('product:'.length) : undefined,
    bundleId: i.catalogRef.startsWith('bundle:') ? i.catalogRef.slice('bundle:'.length) : undefined,
    productName: i.productName.trim(),
    productSku: i.productSku.trim() || undefined,
    quantity: i.quantity,
    unitPriceCents: Math.round(i.unitPrice * 100),
  }));

  try {
    const order = await orderApi.create({
      channel: channel.value,
      deliveryType: deliveryType.value,
      storeId: storeId.value || undefined,
      customerName: customerName.value.trim(),
      customerEmail: customerEmail.value.trim() || undefined,
      customerPhone: customerPhone.value.trim() || undefined,
      customerNotes: customerNotes.value.trim() || undefined,
      deliveryAddress: deliveryAddress.value.trim() || undefined,
      deliveryCity: deliveryCity.value.trim() || undefined,
      deliveryState: deliveryState.value.trim() || undefined,
      deliveryZip: deliveryZip.value.trim() || undefined,
      deliveryReference: deliveryReference.value.trim() || undefined,
      discountCents: discountCents.value,
      taxCents: taxCents.value,
      shippingCents: shippingCents.value,
      currencyCode: currencyCode.value,
      notes: notes.value.trim() || undefined,
      items: payload,
    });
    toast.success(`Pedido ${order.orderNumber} creado`);
    router.push(`/orders/${order.id}`);
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isSubmitting.value = false;
  }
}

const channelOptions = Object.entries(ORDER_CHANNEL_LABELS).map(([value, label]) => ({ value, label }));
const deliveryTypeOptions = [
  { value: 'DELIVERY', label: 'Envío a domicilio' },
  { value: 'PICKUP', label: 'Recojo en tienda' },
];
const currencyOptions = [
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'PEN', label: 'PEN — Sol' },
  { value: 'EUR', label: 'EUR — Euro' },
];
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Nuevo pedido</h1>
      <p class="text-sm text-gray-500">Crea un pedido manual desde cualquier canal</p>
    </div>

    <form class="space-y-6" @submit.prevent="submit">
      <!-- Channel & delivery type -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Canal y entrega</h2>
        <div class="grid gap-4 sm:grid-cols-4">
          <BaseSelect v-model="channel" :options="channelOptions" label="Canal de venta" />
          <BaseSelect v-model="deliveryType" :options="deliveryTypeOptions" label="Tipo de entrega" />
          <BaseSelect v-model="currencyCode" :options="currencyOptions" label="Moneda" />
          <div>
            <BaseSelect
              v-model="storeId"
              :options="storeOptions"
              label="Tienda *"
              placeholder="Selecciona una tienda"
              :error="errors.store"
            />
            <p class="mt-1 text-xs text-gray-400">El stock se descuenta de aquí al confirmar el pedido</p>
          </div>
        </div>
      </div>

      <!-- Customer info -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Datos del cliente</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput
            v-model="customerName"
            label="Nombre completo *"
            placeholder="Juan Pérez"
            :error="errors.customerName"
          />
          <BaseInput
            v-model="customerPhone"
            label="Teléfono / WhatsApp"
            placeholder="+51 999 000 111"
            type="tel"
          />
          <BaseInput
            v-model="customerEmail"
            label="Correo electrónico"
            placeholder="juan@ejemplo.com"
            type="email"
          />
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nota del cliente
            </label>
            <textarea
              v-model="customerNotes"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              placeholder="Instrucciones especiales del cliente..."
            />
          </div>
        </div>
      </div>

      <!-- Delivery address -->
      <div
        v-if="deliveryType === 'DELIVERY'"
        class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Dirección de entrega</h2>
        <DeliveryAddressPicker
          :address="deliveryAddress"
          :city="deliveryCity"
          :state="deliveryState"
          :zip="deliveryZip"
          :reference="deliveryReference"
          :error="errors.deliveryAddress"
          @update:address="deliveryAddress = $event"
          @update:city="deliveryCity = $event"
          @update:state="deliveryState = $event"
          @update:zip="deliveryZip = $event"
          @update:reference="deliveryReference = $event"
        />
      </div>

      <!-- Products -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">Productos</h2>
          <BaseButton type="button" variant="secondary" @click="addItem">
            <PlusIcon class="h-4 w-4" /> Agregar producto
          </BaseButton>
        </div>

        <p v-if="errors.items || errors.itemsPrice || errors.itemsQty" class="mb-3 text-sm text-red-600">
          {{ errors.items || errors.itemsPrice || errors.itemsQty }}
        </p>

        <div class="space-y-3">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="mb-3">
              <BaseSelect
                :model-value="item.catalogRef"
                :options="catalogOptions"
                label="Producto o paquete del catálogo (opcional)"
                @update:model-value="onCatalogPicked(item, String($event))"
              />
            </div>
            <div class="grid gap-3 sm:grid-cols-12">
            <div class="sm:col-span-5">
              <BaseInput v-model="item.productName" label="Producto *" placeholder="Nombre del producto" />
            </div>
            <div class="sm:col-span-2">
              <BaseInput v-model="item.productSku" label="SKU" placeholder="WAL-001" />
            </div>
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="item.quantity"
                label="Cantidad *"
                type="number"
                :min="1"
                placeholder="1"
              />
            </div>
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="item.unitPrice"
                label="Precio unit. *"
                type="number"
                :min="0"
                :step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="flex items-end sm:col-span-1">
              <button
                type="button"
                class="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                :disabled="items.length === 1"
                @click="removeItem(index)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing adjustments -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Ajustes de precio</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <BaseInput
            v-model.number="discountCents"
            label="Descuento (centavos)"
            type="number"
            :min="0"
            placeholder="0"
          />
          <BaseInput
            v-model.number="taxCents"
            label="Impuestos (centavos)"
            type="number"
            :min="0"
            placeholder="0"
          />
          <BaseInput
            v-model.number="shippingCents"
            label="Costo de envío (centavos)"
            type="number"
            :min="0"
            placeholder="0"
          />
        </div>

        <!-- Summary -->
        <dl class="mt-4 space-y-1 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <dt>Subtotal</dt>
            <dd>{{ formatCents(subtotalCents, currencyCode) }}</dd>
          </div>
          <div v-if="discountCents" class="flex justify-between text-green-600">
            <dt>Descuento</dt>
            <dd>− {{ formatCents(discountCents, currencyCode) }}</dd>
          </div>
          <div v-if="taxCents" class="flex justify-between text-gray-600 dark:text-gray-400">
            <dt>Impuestos</dt>
            <dd>{{ formatCents(taxCents, currencyCode) }}</dd>
          </div>
          <div v-if="shippingCents" class="flex justify-between text-gray-600 dark:text-gray-400">
            <dt>Envío</dt>
            <dd>{{ formatCents(shippingCents, currencyCode) }}</dd>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
            <dt>Total</dt>
            <dd>{{ formatCents(totalCents, currencyCode) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Internal notes -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Notas internas</h2>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Notas solo visibles para el equipo (no se muestran al cliente)..."
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <BaseButton type="button" variant="secondary" @click="router.back()">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="isSubmitting">Crear pedido</BaseButton>
      </div>
    </form>
  </div>
</template>
