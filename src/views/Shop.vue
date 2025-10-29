<!-- proyecto-final/src/views/Shop.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../lib/api'

type Product = { id: number; nombre: string | null; precio_base: number }
type CartItem = { id: number; producto_id: number; cantidad: number; precio_unitario: number; subtotal: number }
type CartResp = { carritoId?: number; items: CartItem[]; total: number }

/* ---------------- catálogo ---------------- */
const router = useRouter()
const productos = ref<Product[]>([])
const loading = ref(false)
const msg = ref('')
const busyId = ref<number | null>(null)

/* ---------------- usuario / avatar + nickname ---------------- */
const userId = ref<number>(Number(localStorage.getItem('userId') || '0'))
const nickname = ref<string | null>(localStorage.getItem('nickname') || null)
const photoUrl = ref<string | null>(null)

const hasUser = computed(() => Number.isFinite(userId.value) && userId.value > 0)
const initials = computed(() => {
  const n = (nickname.value || '').trim()
  if (!n) return 'U'
  const p = n.split(/\s+/)
  return (p[0]?.[0] || 'U').toUpperCase()
})

/* ---------------- helpers ---------------- */
function requireUserId(): number {
  const id = Number(localStorage.getItem('userId') || '0')
  if (!id) { router.push('/login'); throw new Error('No autenticado') }
  return id
}

async function cargarCatalogo() {
  loading.value = true
  msg.value = ''
  try {
    productos.value = await get<Product[]>('/api/products/local')
    if (!productos.value?.length) msg.value = 'No hay productos disponibles.'
  } catch (e: any) {
    msg.value = e?.message || 'Error cargando catálogo'
  } finally {
    loading.value = false
  }
}

/** Pide /api/users/{id}/profile y pinta foto + nickname con fallbacks */
async function cargarPerfil() {
  if (!hasUser.value) return
  try {
    const r = await get<{ userId: number; nickname: string | null; dataUrl: string | null }>(`/api/users/${userId.value}/profile`)
    if (r?.nickname && r.nickname.trim().length) {
      nickname.value = r.nickname
      localStorage.setItem('nickname', r.nickname)
    }
    if (r?.dataUrl) photoUrl.value = r.dataUrl
  } catch {
    try {
      const r2 = await get<{ dataUrl: string }>(`/api/users/${userId.value}/photo-dataurl`)
      photoUrl.value = r2?.dataUrl || null
    } catch { photoUrl.value = null }
  }
}

/* ---------------- acciones ---------------- */
async function addToCart(p: Product) {
  const uid = requireUserId()
  busyId.value = p.id
  msg.value = ''
  try {
    await post('/api/local/cart/items', { usuarioId: uid, productoId: p.id, cantidad: 1 })
    msg.value = `Agregado: ${p.nombre ?? ('#' + p.id)}`
  } catch (e: any) {
    msg.value = e?.message || 'No se pudo agregar al carrito'
  } finally {
    busyId.value = null
  }
}

async function addAndCustomize(p: Product) {
  const uid = requireUserId()
  busyId.value = p.id
  msg.value = ''
  try {
    await post('/api/local/cart/items', { usuarioId: uid, productoId: p.id, cantidad: 1 })
    const cart = await get<CartResp>(`/api/local/cart?usuarioId=${uid}`)
    const it = (cart.items || []).find(x => x.producto_id === p.id)
    if (!it) throw new Error('No se encontró el ítem en el carrito')
    router.push(`/customize?itemId=${it.id}`)
  } catch (e: any) {
    msg.value = e?.message || 'No se pudo abrir la personalización'
  } finally {
    busyId.value = null
  }
}

/* ---------------- lifecycle ---------------- */
onMounted(async () => {
  await cargarCatalogo()
  await cargarPerfil()
})
</script>

<template>
  <div class="py-4 px-3 px-md-6 shop-wrap">
    <!-- Hero de perfil: boutique look -->
    <section class="profile-hero mb-7">
      <div class="hero-sheen"></div>
      <div class="hero-waves">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C240,120 480,0 720,50 C960,100 1200,40 1440,90 L1440,120 L0,120 Z"></path>
        </svg>
      </div>

      <div class="hero-inner">
        <div class="hero-left" v-if="hasUser">
          <div class="avatar-wrap">
            <v-avatar size="92" class="avatar">
              <v-img v-if="photoUrl" :src="photoUrl" alt="Foto" cover />
              <span v-else class="avatar-fallback">{{ initials }}</span>
            </v-avatar>
            <span class="dot"></span>
          </div>
          <div class="name-chip">
            {{ nickname || 'Usuario' }}
          </div>
          <v-btn to="/orders/history" size="small" color="primary" variant="tonal" prepend-icon="mdi-receipt-text"
            class="mt-2">
            Mis compras
          </v-btn>

        </div>

        <div class="hero-right">
          <h1 class="brand">LLaveros</h1>
          <div class="tagline">Diseños limpios, colores vibrantes y personalización al instante.</div>
        </div>
      </div>
    </section>

    <v-alert v-if="msg" type="info" density="comfortable" class="mb-4 elevation-2 glass">
      {{ msg }}
    </v-alert>

    <!-- Grid con skeleton mientras carga -->
    <div v-if="loading" class="grid">
      <v-skeleton-loader v-for="n in 6" :key="n" class="skeleton-card elevation-2" type="image, article, actions" />
    </div>

    <!-- Grid de productos -->
    <div v-else class="grid">
      <v-hover v-for="p in productos" :key="p.id" v-slot="{ isHovering, props }">
        <v-card v-bind="props" class="product-card elevation-3" rounded="xl">
          <div class="hero">
            <v-img :src="`/images/llavero.png`" :aspect-ratio="1" class="hero-img" cover>
              <template #placeholder>
                <div class="fill-skeleton"></div>
              </template>
              <div class="overlay"></div>
              <div class="price-badge">Q {{ (p.precio_base || 0).toFixed(2) }}</div>
              <transition name="fade-up">
                <div v-if="isHovering" class="floating-actions">
                  <v-btn size="small" class="elevated" :loading="busyId === p.id" :disabled="busyId === p.id"
                    @click.stop="addToCart(p)" color="primary" prepend-icon="mdi-cart-plus">
                    Añadir
                  </v-btn>
                  <v-btn size="small" class="elevated" :loading="busyId === p.id" :disabled="busyId === p.id"
                    @click.stop="addAndCustomize(p)" color="secondary" variant="tonal" prepend-icon="mdi-brush-variant">
                    Personalizar
                  </v-btn>
                </div>
              </transition>
            </v-img>
          </div>

          <v-card-text class="py-3">
            <div class="d-flex align-center justify-space-between">
              <div class="name two-lines">
                {{ p.nombre ?? ('Producto #' + p.id) }}
              </div>
              <v-chip size="small" color="primary" variant="flat" class="chip-soft">
                Nuevo
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions class="d-flex ga-2 px-4 pb-4 d-md-none">
            <v-btn block :loading="busyId === p.id" :disabled="busyId === p.id" @click="addToCart(p)" color="primary"
              prepend-icon="mdi-cart-plus">
              Añadir
            </v-btn>
            <v-btn block :loading="busyId === p.id" :disabled="busyId === p.id" @click="addAndCustomize(p)"
              color="secondary" variant="tonal" prepend-icon="mdi-brush-variant">
              Personalizar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-hover>
    </div>
  </div>
</template>

<style scoped>
/* ---------- Fondo general ---------- */
.shop-wrap {
  background:
    radial-gradient(1200px 60% at 100% -10%, #eef2ff 0%, transparent 60%),
    radial-gradient(900px 50% at -10% 0%, #fdf2f8 0%, transparent 60%),
    linear-gradient(180deg, #ffffff 0%, #fbfbfd 40%, #ffffff 100%);
}

/* ---------- HERO de perfil ---------- */
.profile-hero {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(17, 24, 39, 0.06);
  background: linear-gradient(180deg, #fff 0%, #f7f7fb 100%);
  box-shadow: 0 30px 50px -40px rgba(0, 0, 0, 0.35);
  isolation: isolate;
}

.hero-sheen {
  position: absolute;
  inset: -40% -10% auto -10%;
  height: 140%;
  background: radial-gradient(60% 40% at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
    radial-gradient(50% 40% at 90% 0%, rgba(236, 72, 153, 0.10) 0%, transparent 60%);
  z-index: 0;
}

.hero-waves {
  position: absolute;
  inset: auto 0 0 0;
  height: 80px;
  z-index: 0;
}

.hero-waves svg {
  width: 100%;
  height: 100%;
  display: block;
}

.hero-waves path {
  fill: rgba(99, 102, 241, 0.08);
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18px;
  grid-template-columns: auto 1fr;
  align-items: center;
  padding: 20px 22px;
}

@media (min-width: 768px) {
  .hero-inner {
    padding: 26px 28px;
  }
}

.hero-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-wrap {
  position: relative;
}

.avatar {
  box-shadow:
    0 0 0 4px #fff,
    0 0 0 8px rgba(99, 102, 241, 0.18);
  background: #f3f4f6;
}

.avatar-fallback {
  font-weight: 800;
  color: #374151;
}

.dot {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 2px #fff, 0 0 12px rgba(16, 185, 129, 0.6);
}

.name-chip {
  font-size: .92rem;
  color: #111827;
  line-height: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

.hero-right {
  min-width: 0;
}

.brand {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  line-height: 1.15;
  margin: 0 0 4px;
  font-weight: 900;
  letter-spacing: .2px;
  color: #0f172a;
}

.tagline {
  color: #475569;
  font-size: clamp(.92rem, 1.5vw, 1rem);
}

/* ---------- Grid ---------- */
.grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* ---------- Skeleton ---------- */
.skeleton-card {
  border-radius: 18px;
  overflow: hidden;
}

/* ---------- Product card ---------- */
.product-card {
  transition: transform .25s ease, box-shadow .25s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 30px -18px rgba(0, 0, 0, 0.25);
}

/* ---------- Imagen + overlay ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}

.hero-img :deep(img) {
  transform: scale(1.04);
  transition: transform .5s ease;
}

.product-card:hover .hero-img :deep(img) {
  transform: scale(1.08);
}

.fill-skeleton {
  width: 100%;
  height: 220px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

.overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 0.35) 100%);
}

/* ---------- Badge de precio ---------- */
.price-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: .9rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(6px);
}

/* ---------- Acciones flotantes ---------- */
.floating-actions {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.elevated {
  box-shadow: 0 10px 20px -12px rgba(0, 0, 0, 0.35);
}

/* ---------- Transiciones ---------- */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all .18s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ---------- Texto ---------- */
.name {
  font-weight: 600;
  font-size: 1rem;
}

.two-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.chip-soft {
  border-radius: 999px;
}

/* ---------- Glass alert ---------- */
.glass {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
