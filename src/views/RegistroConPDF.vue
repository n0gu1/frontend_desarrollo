<template>
  <v-row justify="center">
    <v-col cols="12" md="6">
      <v-card class="pa-6" rounded="xl" elevation="8">
        <div class="text-h6 mb-4">Registro con comprobante por correo</div>

        <v-text-field v-model="email"    label="Email"    type="email" variant="outlined" class="mb-2" />
        <v-text-field v-model="nickname" label="Nickname" variant="outlined" class="mb-2" />
        <v-text-field v-model="phone"    label="Teléfono" variant="outlined" class="mb-2" />
        <v-text-field v-model="password" label="Contraseña" :type="showPass?'text':'password'"
                      variant="outlined" :append-inner-icon="showPass?'mdi-eye-off':'mdi-eye'"
                      @click:append-inner="showPass=!showPass" />

        <v-btn :loading="loading" color="primary" block class="mt-3" @click="registrar">
          Crear cuenta y enviar PDF
        </v-btn>

        <v-alert v-if="msg" :type="ok?'success':'error'" class="mt-4" density="comfortable">
          {{ msg }}
        </v-alert>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../lib/api' // usa tu helper existente :contentReference[oaicite:3]{index=3}

const email = ref('')
const nickname = ref('')
const phone = ref('')
const password = ref('')
const showPass = ref(false)

const loading = ref(false)
const ok = ref(false)
const msg = ref('')

async function registrar() {
  msg.value=''; ok.value=false; loading.value=true
  try {
    // 1) Registrar usuario en tu endpoint actual
    const payload = {
      email: email.value.trim(),
      nickname: nickname.value.trim(),
      password: password.value,
      birthdateText: '2000-01-01' // o toma de un campo si quieres
    }
    const r1 = await post('/api/auth/register', payload) // endpoint ya existente :contentReference[oaicite:4]{index=4}
    if (!r1?.success) {
      msg.value = r1?.message || 'No se pudo registrar'
      return
    }

    // 2) Solicitar envío del PDF por correo
    const r2 = await post('/api/notifications/registration-receipt', {
      email: email.value.trim(),
      nickname: nickname.value.trim(),
      phone: phone.value.trim()
    })

    ok.value = !!r2?.success
    msg.value = r2?.message || (ok.value ? 'PDF enviado' : 'No se pudo enviar el PDF')
  } catch (e:any) {
    msg.value = e?.message || 'Error inesperado'
  } finally {
    loading.value=false
  }
}
</script>
