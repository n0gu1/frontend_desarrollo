<template>
  <v-app>
    <!-- Barra superior -->
    <v-app-bar flat color="transparent" class="px-3 px-md-6">
      <RouterLink to="/" class="d-flex align-center text-decoration-none">
        <v-icon icon="mdi-key-variant" class="mr-2" />
        <span class="text-h6 font-weight-bold">Mi Tienda</span>
      </RouterLink>

      <v-spacer />

      <!-- SIN sesión: Registro / Login -->
      <template v-if="!loggedIn">
        <v-btn :to="{ path: '/registro' }" class="mr-2" color="primary" variant="tonal">
          Registrarse
        </v-btn>
        <v-btn :to="{ path: '/login' }" color="primary" variant="flat">
          Iniciar sesión
        </v-btn>
      </template>

      <!-- CON sesión: sólo Carrito + Salir (SIN mostrar usuario) -->
      <template v-else>
        <RouterLink to="/cart">
          <v-btn color="primary" class="mr-2" variant="flat">
            <v-icon icon="mdi-cart-outline" class="mr-2" />
            Carrito
          </v-btn>
        </RouterLink>

        <v-btn color="grey" variant="text" @click="logout">
          <v-icon icon="mdi-logout" class="mr-1" /> Salir
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="py-4">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userId = ref<number>(0)
const loggedIn = computed(() => Number.isFinite(userId.value) && userId.value > 0)

function readAuthFromStorage() {
  userId.value = Number(localStorage.getItem('userId') || '0')
}

function logout() {
  localStorage.removeItem('userId')
  localStorage.removeItem('nickname') // por si acaso lo guardaste
  readAuthFromStorage()
  // avisar a otras pestañas (opcional)
  window.dispatchEvent(new Event('auth-sync'))
  router.push('/login')
}

function onStorage(e: StorageEvent) {
  if (e.key === 'userId' || e.key === 'nickname') readAuthFromStorage()
}

// >>> añadido: handler para nuestro evento local de login
function onAuthSync() {
  readAuthFromStorage()
}

onMounted(() => {
  readAuthFromStorage()
  window.addEventListener('storage', onStorage)
  // >>> añadido: escuchar evento que dispara LoginView al iniciar sesión
  window.addEventListener('auth-sync', onAuthSync)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  // >>> añadido: limpiar listener
  window.removeEventListener('auth-sync', onAuthSync)
})
</script>

<style scoped>
.text-decoration-none { text-decoration: none; color: inherit; }
</style>
