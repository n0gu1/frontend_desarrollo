<template>
  <v-row justify="center">
    <v-col cols="12" md="5">
      <v-card class="pa-6" rounded="xl" elevation="8">
        <div class="text-h6 mb-1">Restablecer contraseña</div>

        <v-text-field v-model="password" label="Nueva contraseña" :type="show?'text':'password'" variant="outlined" class="mb-3"
                      :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="show=!show" />
        <v-text-field v-model="confirm" label="Confirmar" :type="show?'text':'password'" variant="outlined" class="mb-3" />

        <v-btn :loading="loading" color="primary" class="mt-2" @click="reset">Cambiar</v-btn>
        <v-alert v-if="msg" :type="ok ? 'success':'error'" class="mt-4">{{ msg }}</v-alert>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { post } from '../lib/api'

const route = useRoute()
const token = ref<string>(''); const password = ref(''); const confirm = ref('')
const loading = ref(false); const ok = ref(false); const msg = ref(''); const show = ref(false)

onMounted(() => { token.value = (route.query.token as string) || '' })

async function reset() {
  if (!token.value) { msg.value = 'Falta token'; ok.value = false; return }
  if (!password.value || password.value !== confirm.value) { msg.value = 'Las contraseñas no coinciden'; ok.value = false; return }
  loading.value = true; msg.value = ''; ok.value = false
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 25000) // < 30s SLA
    const r = await post('/api/password/reset', { token: token.value, newPassword: password.value }, { signal: ac.signal } as any)
    clearTimeout(t)
    ok.value = !!r?.ok
    msg.value = r?.message || (ok.value ? 'Contraseña actualizada' : 'No se pudo actualizar')
  } catch (e:any) {
    msg.value = e?.message || 'Error al restablecer'
  } finally { loading.value = false }
}
</script>
