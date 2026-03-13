<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import AdSlotPlaceholder from '@/components/AdSlotPlaceholder.vue';
import { resolveAdsProviderConfig } from '@/features/ads/adsConfig';
import { getAdSlotById, shouldShowAdPlaceholders } from '@/features/ads/adsSlots';

const props = defineProps({
  slotId: {
    type: String,
    required: true,
  },
});

const slot = computed(() => getAdSlotById(props.slotId));
const providerConfig = computed(() => resolveAdsProviderConfig());
const adsElement = ref(null);
const pushDone = ref(false);

const styleMap = Object.freeze({
  'vertical-rail': 'display:inline-block;width:160px;height:600px',
  'top-banner': 'display:block;width:728px;height:90px',
  'mobile-banner': 'display:block;width:320px;height:50px',
});

const slotClass = computed(() => {
  switch (slot.value?.format) {
    case 'vertical-rail':
      return 'ad-slot-live--vertical';
    case 'top-banner':
      return 'ad-slot-live--top';
    case 'mobile-banner':
      return 'ad-slot-live--mobile';
    default:
      return '';
  }
});

const isRenderable = computed(
  () =>
    Boolean(
      slot.value?.enabled &&
        slot.value?.adsenseSlotId &&
        providerConfig.value.enabled &&
        providerConfig.value.id === 'adsense' &&
        providerConfig.value.adsenseClient
    )
);
const showPlaceholder = computed(() => !isRenderable.value && shouldShowAdPlaceholders());

function pushAdsSlot() {
  if (!isRenderable.value || pushDone.value || !adsElement.value || typeof window === 'undefined') {
    return;
  }

  const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
  adsbygoogle.push({});
  pushDone.value = true;
}

onMounted(() => {
  nextTick(() => {
    pushAdsSlot();
  });
});

watch(isRenderable, async (renderable) => {
  if (!renderable) {
    pushDone.value = false;
    return;
  }

  await nextTick();
  pushAdsSlot();
});
</script>

<template>
  <div v-if="isRenderable && slot" class="ad-slot-live" :class="slotClass" :aria-label="`Annonce : ${slot.label}`">
    <ins
      ref="adsElement"
      class="adsbygoogle"
      :style="styleMap[slot.format]"
      data-ad-format="auto"
      data-full-width-responsive="false"
      :data-ad-client="providerConfig.adsenseClient"
      :data-ad-slot="slot.adsenseSlotId"
    ></ins>
  </div>
  <AdSlotPlaceholder
    v-else-if="showPlaceholder"
    :slot-id="slotId"
    hint="Emplacement publicitaire prêt, sans diffusion active tant que l'unité AdSense n'est pas branchée."
  />
</template>

<style scoped>
.ad-slot-live {
  width: 100%;
  margin: 16px auto 0;
  display: flex;
  justify-content: center;
}

.ad-slot-live--vertical {
  max-width: 160px;
}

.ad-slot-live--top {
  max-width: 728px;
}

.ad-slot-live--mobile {
  max-width: 320px;
}

.ad-slot-live :deep(ins) {
  background: rgba(255, 255, 255, 0.98);
}
</style>
