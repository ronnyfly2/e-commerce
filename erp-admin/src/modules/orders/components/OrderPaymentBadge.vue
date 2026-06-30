<script setup lang="ts">
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '../types';

const { status } = defineProps<{ status: PaymentStatus }>();

type Variant = 'default' | 'success' | 'warning' | 'danger';
const variantMap: Record<PaymentStatus, Variant> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
  REFUNDED: 'default',
};
</script>

<template>
  <BaseBadge :variant="variantMap[status]">
    {{ PAYMENT_STATUS_LABELS[status] }}
  </BaseBadge>
</template>
