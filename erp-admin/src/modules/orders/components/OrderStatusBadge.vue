<script setup lang="ts">
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import { ORDER_STATUS_LABELS, type OrderStatus } from '../types';

const { status } = defineProps<{ status: OrderStatus }>();

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';
const variantMap: Record<OrderStatus, Variant> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'info',
  READY_FOR_PICKUP: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'default',
};
</script>

<template>
  <BaseBadge :variant="variantMap[status]">
    {{ ORDER_STATUS_LABELS[status] }}
  </BaseBadge>
</template>
