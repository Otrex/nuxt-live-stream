<template>
  <div class="flex h-screen items-center"> 
    <mux-player
      stream-type="on-demand"
      :playback-id="playbackId"
    />
  </div>
</template>

<script setup>
import "@mux/mux-player"
import { useRoute, useRouter } from "vue-router";

const $route = useRoute();
const $router = useRouter();

const playbackId = ref();

onMounted(() => {
  const result = validateAndSanitizePlaybackId($route.params.id);
  if (result) {
    playbackId.value = result;
  } else {
  }
})

function validateAndSanitizePlaybackId(id) {
  if (id || id.split().length > 10) return id.trim();
  setTimeout(() => {
    $router.push("/main")
  }, 5000)
}
</script>
  