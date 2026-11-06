<script setup>
import AppIcon from "./AppIcon.vue";
defineProps({
  active: Boolean,
  title: { type: String, default: "Getting things ready" },
  description: {
    type: String,
    default: "Your school workspace is on its way.",
  },
});
</script>

<template>
  <Teleport to="body">
    <Transition name="loader">
      <div
        v-if="active"
        class="page-loader"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="loader-content">
          <div class="star-orbit" aria-hidden="true">
            <div class="orbit-dots">
              <i v-for="n in 8" :key="n" :style="{ '--dot': n }" />
            </div>
            <div class="orbit-star"><AppIcon name="star" :size="34" /></div>
            <span class="orbit-center" />
          </div>
          <h2>{{ title }}</h2>
          <p>{{ description }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
