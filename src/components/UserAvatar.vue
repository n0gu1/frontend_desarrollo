<template>
  <div class="d-flex align-center ga-3">
    <v-avatar size="44" color="grey-lighten-3">
      <v-img v-if="photoUrl" :src="photoUrl" alt="Foto" cover />
      <span v-else class="text-subtitle-2">{{ initials }}</span>
    </v-avatar>
    <div class="text-body-2">
      <div class="font-medium">Hola{{ nickname ? `, ${nickname}` : '' }}</div>
      <div class="text-caption text-grey" v-if="userId">ID: {{ userId }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../lib/api'

const userId = Number(localStorage.getItem('userId') || '0')
const photoUrl = ref<string | null>(null)
const nickname = ref<string | null>(localStorage.getItem('nickname') || null) // por si guardas el nick en login
const initials = computed(() => {
  const n = nickname.value || 'U'
  const parts = n.trim().split(/\s+/)
  return (parts[0]?.[0] || 'U').toUpperCase()
})

onMounted(async () => {
  if (!userId) return
  try {
    // Opción A: dataURL (un JSON pequeño)
    const d = await get<{ dataUrl: string }>(`/api/users/${userId}/photo-dataurl`)
    photoUrl.value = d?.dataUrl || null
  } catch {
    // Opción B (fallback): servir binario directo
    // photoUrl.value = `/api/users/${userId}/photo`  // si prefieres no usar dataURL
  }
})
</script>
