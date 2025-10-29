<template>
  <v-row justify="center">
    <v-col cols="12" md="5">
      <v-card class="pa-6" rounded="xl" elevation="8">
        <div class="text-h6 mb-1">Recuperar contraseña</div>
        <div class="text-body-2 mb-4">Ingresa tu correo, teléfono o nickname</div>

        <v-text-field v-model="credential" label="Credencial" variant="outlined" class="mb-3" />

        <v-btn :loading="loading" color="primary" class="mt-2" @click="submit">Enviar enlace</v-btn>

        <v-alert v-if="msg" :type="ok ? 'success':'info'" class="mt-4">{{ msg }}</v-alert>

        <div class="mt-4">
          <v-btn to="/login" variant="text">Volver a iniciar sesión</v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../lib/api' // coincide con tu api.ts
const credential = ref('')
const loading = ref(false)
const ok = ref(false)
const msg = ref('')

async function submit() {
  if (!credential.value?.trim()) { msg.value = 'Ingresa tu credencial'; ok.value = false; return }
  loading.value = true; msg.value = ''; ok.value = false
  try {
    // timeout cliente < 25s para cumplir SLA de 30s end-to-end
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 25000)
    const r = await post('/api/password/forgot', { credential: credential.value.trim() }, { signal: ac.signal } as any)
    clearTimeout(t)
    ok.value = !!r?.ok
    msg.value = r?.message || 'Si existe, recibirá un correo.'
  } catch (e:any) {
    msg.value = e?.message || 'No se pudo iniciar el proceso'
  } finally { loading.value = false }
}
</script>
