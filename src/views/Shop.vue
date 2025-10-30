<!-- proyecto-final/src/views/Shop.vue -->
<template>
  <div class="shop-page">
    <!-- ===== Drawer / Sidebar ===== -->
    <v-navigation-drawer
      v-model="drawer"
      location="left"
      width="260"
      temporary
      :scrim="true"
      :close-on-content-click="true"
      class="drawer"
      @keydown.esc="drawer = false"
    >
      <div class="drawer-header">
        <v-avatar size="52" class="avatar">
          <v-img v-if="photoUrl" :src="photoUrl" cover />
          <span v-else class="avatar-fallback">{{ initials }}</span>
        </v-avatar>
        <div class="drawer-user">
          <div class="drawer-name">{{ nickname || 'Usuario' }}</div>
          <div class="drawer-hi">Bienvenido</div>
        </div>
      </div>

      <v-divider class="mb-2" />

      <v-list density="comfortable" nav>
        <v-list-item
          prepend-icon="mdi-key-chain-variant"
          title="Llavero (Personalización)"
          @click="goPersonalization"
        />
        <v-list-item
          prepend-icon="mdi-receipt-text"
          title="Mis compras"
          @click="goOrders"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- ===== Topbar (FIXED) ===== -->
    <header class="page-topbar" role="banner">
      <v-container class="py-2 d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-3">
          <v-btn
            class="menu-btn"
            variant="tonal"
            density="comfortable"
            icon="mdi-menu"
            @click.stop="toggleDrawer"
            aria-label="Abrir menú"
          />
        </div>

        <div class="d-flex ga-2">
          <RouterLink to="/cart">
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-cart-outline">
              Carrito
            </v-btn>
          </RouterLink>
          <v-btn color="default" variant="text" prepend-icon="mdi-logout" @click="logout">
            Salir
          </v-btn>
        </div>
      </v-container>
    </header>

    <!-- Spacer para compensar el header fijo -->
    <div class="topbar-spacer" />

    <!-- ===== Hero / Encabezado ===== -->
    <v-container class="py-5">
      <section class="profile-hero mb-7">
        <div class="hero-sheen"></div>
        <div class="hero-waves">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
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
            <div class="name-chip">{{ nickname || 'Usuario' }}</div>
          </div>

          <div class="hero-right">
            <h1 class="brand">LLaveros</h1>
            <div class="tagline">Diseños limpios, colores vibrantes y personalización al instante.</div>
          </div>
        </div>
      </section>

      <!-- ===== Sección: Personalización ===== -->
      <section ref="customizerSec">
        <v-row class="g-6">
          <!-- Lienzo / Preview -->
          <v-col cols="12" md="7" lg="8">
            <v-card class="elevated-card" rounded="xl" variant="elevated">
              <v-toolbar density="comfortable" flat>
                <v-toolbar-title class="text-subtitle-1 font-weight-medium">Vista previa</v-toolbar-title>
                <v-spacer />
                <v-chip size="small" variant="tonal" color="primary" class="mr-2">Lado {{ lado }}</v-chip>
                <v-btn
                  variant="text"
                  size="small"
                  icon="mdi-refresh"
                  :loading="isBusy"
                  :disabled="isBusy"
                  @click="ensurePersonalization"
                  :title="'Refrescar'"
                />
              </v-toolbar>

              <v-divider />

              <div
                class="preview-wrap"
                :class="{ 'is-dropping': isDropping }"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop"
              >
                <canvas ref="canvasRef" class="preview-canvas" />
                <div class="drop-hint" v-if="isDropping">
                  <v-icon size="36" class="mb-2">mdi-cloud-upload</v-icon>
                  Suelta tu imagen aquí
                </div>
              </div>

              <v-sheet class="px-5 py-3 text-caption" color="transparent">
                La vista previa es una simulación 2D. Para cada lado (A/B) sube una foto y se ajustará automáticamente al área circular del llavero.
              </v-sheet>
            </v-card>
          </v-col>

          <!-- Panel derecho -->
          <v-col cols="12" md="5" lg="4">
            <v-card class="elevated-card" rounded="xl" variant="elevated">
              <v-toolbar density="comfortable" flat>
                <v-toolbar-title class="text-subtitle-1 font-weight-medium">Personalizar llavero</v-toolbar-title>
              </v-toolbar>

              <v-divider class="my-4" />

              <v-card-text class="pt-0">
                <!-- Lado -->
                <div class="section-title">Lado</div>
                <v-select
                  v-model="lado"
                  :items="['A', 'B']"
                  density="comfortable"
                  hide-details
                  variant="solo-filled"
                  class="mb-4"
                />

                <v-divider class="my-4" />

                <!-- Subir foto -->
                <div class="section-title">Imagen (archivo)</div>
                <v-btn
                  block
                  color="primary"
                  class="mb-2"
                  prepend-icon="mdi-cloud-upload"
                  :loading="uploading"
                  :disabled="!personalizationId || uploading"
                  @click="subirFoto"
                >
                  Subir foto (lado {{ lado }})
                </v-btn>
                <div class="text-caption mb-4">
                  También puedes <b>arrastrar y soltar</b> una imagen sobre la vista previa.
                </div>

                <!-- Campo URL (no asociado a A/B) -->
                <v-divider class="my-4" />
                <div class="section-title">URL (solo campo, sin acción)</div>
                <v-text-field
                  v-model="imageUrlInput"
                  placeholder="https://ejemplo.com/imagen.jpg o /uploads/archivo.png"
                  clearable
                  density="comfortable"
                  variant="solo-filled"
                  hide-details
                />

                <v-divider class="my-4" />

                <!-- Info + estado (sin botón de carrito) -->
                <v-alert type="info" variant="tonal" class="mb-3">
                  Debes subir una foto para el <b>lado A</b> y otra para el <b>lado B</b>.
                </v-alert>
                <div class="text-caption">
                  Estado: Lado A {{ hasPhotoA ? '✓' : '✗' }} · Lado B {{ hasPhotoB ? '✓' : '✗' }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </v-container>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnack" :color="snackColor" variant="flat" timeout="4000">
      {{ err }}
      <template #actions>
        <v-btn size="small" color="white" variant="text" @click="showSnack = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- Overlay subida -->
    <v-overlay :model-value="uploading" class="align-center justify-center">
      <v-card class="px-6 py-4" rounded="lg" elevation="8">
        <div class="d-flex align-center ga-3">
          <v-progress-circular indeterminate color="primary" />
          <span class="text-body-2">Subiendo imagen…</span>
        </div>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../lib/api'

/* ===== Drawer / Topbar ===== */
const drawer = ref(false)
function toggleDrawer() { drawer.value = !drawer.value }
function closeDrawerSoon() { setTimeout(() => (drawer.value = false), 0) }

/* ===== Usuario / Perfil + Logout ===== */
const router = useRouter()
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
function readAuthFromStorage() { userId.value = Number(localStorage.getItem('userId') || '0') }
function logout() {
  // limpia estado por-usuario para evitar reuso accidental
  const uid = userId.value
  if (uid) {
    localStorage.removeItem(`draftItem:${uid}`)
    localStorage.removeItem(`lastItemId:${uid}`)
  }
  imageCache.clear()
  allLayers.value = []
  personalizationId.value = null
  imageUrlInput.value = ''
  lado.value = 'A'

  localStorage.removeItem('userId')
  localStorage.removeItem('nickname')
  readAuthFromStorage()
  window.dispatchEvent(new Event('auth-sync'))
  router.push('/login')
}
async function cargarPerfil() {
  if (!hasUser.value) return
  try {
    const r = await get<{ nickname: string | null; dataUrl: string | null }>(`/api/users/${userId.value}/profile`)
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
function requireUserId(): number {
  const id = Number(localStorage.getItem('userId') || '0')
  if (!id) { router.push('/login'); throw new Error('No autenticado') }
  return id
}

/* ===== Navegación desde Drawer ===== */
const customizerSec = ref<HTMLElement | null>(null)
function goPersonalization() {
  closeDrawerSoon()
  nextTick(() => customizerSec.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function goOrders() { closeDrawerSoon(); router.push('/orders/history') }

/* ===== API base ===== */
const API_BASE = String((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '')

/* ===== Personalización mínima ===== */
const BASE_KEYCHAIN_URL = '/images/llavero-base.png'
const CANVAS = { W: 680, H: 680 }
const CIRCLE = { cx: 0.5, cy: 0.58, r: 0.30 }
const NORMAL_SIDE_FACTOR = 0.85

// carritoItemId por-usuario (o desde ?itemId=)
const params = new URLSearchParams(globalThis.location?.search || '')
const paramItemId = params.get('itemId')
const carritoItemId = ref<number>(0)
function ensureCartItemId() {
  const uid = requireUserId()
  if (paramItemId && Number(paramItemId)) {
    carritoItemId.value = Number(paramItemId)
    localStorage.setItem(`lastItemId:${uid}`, String(carritoItemId.value))
    return
  }
  const key = `draftItem:${uid}`
  let v = Number(localStorage.getItem(key) || '0')
  if (!v) { v = Date.now(); localStorage.setItem(key, String(v)) }
  carritoItemId.value = v
}

const lado = ref<'A' | 'B'>('A')
const personalizationId = ref<number | null>(null)

// Capas (solo usamos tipo 'foto')
const allLayers = ref<any[]>([])

/* Campo URL (solo visual) */
const imageUrlInput = ref('')

const err = ref(''); const showSnack = ref(false); const snackColor = ref<'error'|'success'|'info'>('error')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageCache = new Map<string, HTMLImageElement>()
const isBusy = ref(false); const uploading = ref(false); const isDropping = ref(false)

let rafId: number | null = null
function scheduleRender() {
  if (rafId != null) return
  rafId = requestAnimationFrame(() => { rafId = null; renderPreview() })
}

/* Helpers */
function toast(message: string, color: 'error'|'success'|'info'='error') {
  err.value = message; snackColor.value = color; showSnack.value = true
}
function getMsg(e: any) {
  try {
    const m = e?.message || ''
    if (m.startsWith('{')) { const o = JSON.parse(m); return o?.detail || o?.message || 'Error' }
    return m || 'Error'
  } catch { return 'Error' }
}
function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url)!)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imageCache.set(url, img); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}
function isDataUrl(u?: string | null) { return !!u && /^data:image\/[a-z0-9+.-]+;base64,/i.test(u) }
function resolveLayerUrl(raw?: string | null) {
  if (!raw) return null
  if (isDataUrl(raw)) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/uploads/')) return `${API_BASE}${raw}`
  if (raw.startsWith('uploads/'))  return `${API_BASE}/${raw}`
  return raw.startsWith('/') ? raw : `/${raw}`
}
function circlePx(W: number, H: number) { const r = Math.min(W, H) * CIRCLE.r; return { cx: W * CIRCLE.cx, cy: H * CIRCLE.cy, r } }
function sameId(a: unknown, b: unknown) { if (a == null || b == null) return false; return String(a) === String(b) }

/* ===== Persistencia mínima ===== */
async function ensurePersonalization() {
  if (isBusy.value) return
  isBusy.value = true
  try {
    const uid = requireUserId()
    const r = await post(`/api/local/personalizations`, { carritoItemId: carritoItemId.value, lado: lado.value, usuarioId: uid })
    personalizationId.value = r.id
    await loadLayers(true)
  } catch (e: any) { toast(getMsg(e)) }
  finally { isBusy.value = false }
}
async function loadLayers(preferFull = true) {
  if (!personalizationId.value) return
  try {
    let arr: any[] = []
    if (preferFull) {
      try { arr = await get(`/api/local/personalizations/${personalizationId.value}/layers`) }
      catch { arr = await get(`/api/local/personalizations/${personalizationId.value}/layers?simple=1`) }
    } else {
      try { arr = await get(`/api/local/personalizations/${personalizationId.value}/layers?simple=1`) }
      catch { arr = await get(`/api/local/personalizations/${personalizationId.value}/layers`) }
    }

    // Solo fotos + normaliza
    arr = arr
      .filter(l => l?.tipo_capa === 'foto')
      .map(l => {
        const normalizedPid = l.personalization_id ?? l.personalizationId ?? l.pid ?? null
        const normalizedSide = String(l.lado ?? '').toUpperCase() === 'B' ? 'B' : 'A'
        return { ...l, personalization_id: normalizedPid, lado: normalizedSide, escala: 1, rotacion: 0, pos_x: 0.5, pos_y: 0.58 }
      })

    // Dedup: 1 por lado
    const keep: Record<'A'|'B', any|null> = { A: null, B: null }
    for (const l of arr) {
      const s = (l.lado || 'A') as 'A'|'B'
      const cur = keep[s]
      if (!cur || (typeof l.id === 'number' && l.id > (cur.id ?? -1)) || ((l.z_index ?? 0) > (cur.z_index ?? 0))) keep[s] = l
    }
    const finalArr = Object.values(keep).filter(Boolean) as any[]
    allLayers.value = finalArr

    const urls = finalArr.map(l => resolveLayerUrl(l.archivo_url || l.url || null)).filter((u): u is string => !!u)
    await Promise.all(urls.map(u => loadImage(u)))

    scheduleRender()
  } catch (e: any) { toast(getMsg(e) || 'No se pudieron cargar las capas') }
}

/* ===== Borrado remoto ===== */
async function deletePhotoLayerRemote(layerId: number) {
  if (!personalizationId.value) return
  try { await post(`/api/local/personalizations/${personalizationId.value}/layers/${layerId}/delete`, {}) }
  catch {
    try { await post(`/api/personalizations/${personalizationId.value}/layers/${layerId}/delete`, {}) }
    catch { /* ignora */ }
  }
}
async function removeExistingPhotosForSide(side: 'A'|'B') {
  const toDelete = allLayers.value.filter(l => l.tipo_capa === 'foto' && l.lado === side && typeof l.id === 'number')
  await Promise.all(toDelete.map(l => deletePhotoLayerRemote(l.id)))
  allLayers.value = allLayers.value.filter(l => !(l.tipo_capa === 'foto' && l.lado === side))
}

/* ===== Drag&Drop / Archivo ===== */
function onDragOver() { isDropping.value = true }
function onDragLeave() { isDropping.value = false }
async function onDrop(e: DragEvent) {
  isDropping.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadFile(file)
}
async function subirFoto() {
  if (!personalizationId.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const f = input.files?.[0]
    if (f) await uploadFile(f)
  }
  input.click()
}
async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}
async function uploadFile(f: File) {
  if (!personalizationId.value) return
  const side = lado.value
  const tempId = `tmp_${Date.now()}`
  try {
    uploading.value = true

    await removeExistingPhotosForSide(side)

    const dataUrl = await readFileAsDataUrl(f)
    const tempLayer = {
      id: tempId,
      personalization_id: personalizationId.value,
      lado: side,
      tipo_capa: 'foto',
      url: dataUrl,
      z_index: 5,
      pos_x: 0.5,
      pos_y: 0.58,
      escala: 1,
      rotacion: 0,
    }
    allLayers.value = [...allLayers.value, tempLayer]
    await loadImage(dataUrl)
    scheduleRender()

    const fd = new FormData()
    fd.append('personalizationId', String(personalizationId.value))
    fd.append('lado', String(side))
    fd.append('file', f)

    let resp = await fetch(`${API_BASE}/api/local/uploads`, { method: 'POST', body: fd })
    if (!resp.ok && resp.status === 404) resp = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const up = await resp.json()

    await post(`/api/local/personalizations/${personalizationId.value}/layers`, {
      tipo_capa: 'foto',
      lado: side,
      archivo_id: up.archivoId ?? null,
      url: up.url ?? null,
      z_index: 5,
      pos_x: 0.5,
      pos_y: 0.58,
      escala: 1,
      rotacion: 0,
    })

    allLayers.value = allLayers.value.filter(l => l.id !== tempId)
    await loadLayers(true)
    toast('Imagen cargada', 'success')
  } catch (e: any) {
    allLayers.value = allLayers.value.filter(l => l.id !== tempId)
    scheduleRender()
    toast(getMsg(e), 'error')
  } finally {
    uploading.value = false
  }
}

/* ===== Estado de fotos por lado ===== */
const hasPhotoA = computed(() =>
  allLayers.value.some(l =>
    l?.tipo_capa === 'foto' &&
    String(l?.lado).toUpperCase() === 'A' &&
    sameId(l?.personalization_id, personalizationId.value)
  )
)
const hasPhotoB = computed(() =>
  allLayers.value.some(l =>
    l?.tipo_capa === 'foto' &&
    String(l?.lado).toUpperCase() === 'B' &&
    sameId(l?.personalization_id, personalizationId.value)
  )
)

/* ===== Render minimal ===== */
function renderPreview() {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const W = (canvas.width = CANVAS.W)
  const H = (canvas.height = CANVAS.H)

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0B0F19'
  ctx.fillRect(0, 0, W, H)

  const base = imageCache.get(BASE_KEYCHAIN_URL)
  if (base) {
    const r = Math.min(W / base.naturalWidth, H / base.naturalHeight)
    const bw = base.naturalWidth * r, bh = base.naturalHeight * r
    const bx = (W - bw) / 2, by = (H - bh) / 2
    ctx.drawImage(base, bx, by, bw, bh)
  } else {
    loadImage(BASE_KEYCHAIN_URL).finally(() => scheduleRender())
  }

  const { cx, cy, r } = circlePx(W, H)

  // Sombra de máscara
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true)
  ctx.fill('evenodd')
  ctx.restore()

  // Clip circular
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // Dibuja foto(s)
  const sorted = [...allLayers.value].sort((a, b) => {
    const zi = (a.z_index ?? 0) - (b.z_index ?? 0)
    return zi !== 0 ? zi : (a.id ?? 0) - (b.id ?? 0)
  })

  for (const l of sorted) {
    if (l.tipo_capa !== 'foto') continue
    const url = resolveLayerUrl(l.archivo_url || l.url || null)
    const img = url ? imageCache.get(url) : null
    if (!img) { if (url) loadImage(url).then(() => scheduleRender()); continue }

    const k0 = Math.min((r * 2 * NORMAL_SIDE_FACTOR) / img.naturalWidth, (r * 2 * NORMAL_SIDE_FACTOR) / img.naturalHeight)
    const w = img.naturalWidth * k0
    const h = img.naturalHeight * k0
    const x = cx - w / 2
    const y = cy - h / 2
    ctx.drawImage(img, x, y, w, h)
  }

  ctx.restore()

  // Trazo del círculo
  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#93c5fd'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/* ===== Lifecycle ===== */
onMounted(async () => {
  readAuthFromStorage()
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'userId' || ev.key === 'nickname') readAuthFromStorage()
  })
  window.addEventListener('auth-sync', readAuthFromStorage)

  ensureCartItemId()
  await cargarPerfil()
  await nextTick()
  loadImage(BASE_KEYCHAIN_URL).finally(() => scheduleRender())
  await ensurePersonalization()
})
onUnmounted(() => {
  window.removeEventListener('auth-sync', readAuthFromStorage)
})

// Cuando cambie el lado, reasegura/recarga
watch(lado, async () => { await ensurePersonalization() })
</script>

<style scoped>
/* ===== Variables/estructura ===== */
.shop-page { display: block; }

/* Topbar fijo y clickeable siempre */
.page-topbar {
  --topbar-h: 56px;
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--topbar-h);
  z-index: 2000;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,.06);
  pointer-events: auto;
}
@media (min-width: 600px) { .page-topbar { --topbar-h: 64px; } }

.topbar-spacer { height: calc(var(--topbar-h) + 4px); }

/* Drawer por encima del topbar cuando se abre */
.drawer :deep(.v-navigation-drawer) { overflow: hidden; z-index: 2400; }

/* ===== Hero ===== */
.profile-hero {
  position: relative; overflow: hidden; border-radius: 20px;
  border: 1px solid rgba(17, 24, 39, 0.06);
  background: linear-gradient(180deg, #fff 0%, #f7f7fb 100%);
  box-shadow: 0 30px 50px -40px rgba(0, 0, 0, 0.35); isolation: isolate;
}
/* Evitar que capas decorativas capturen clics encima del topbar */
.hero-sheen,
.hero-waves,
.hero-waves * { pointer-events: none; }

.hero-sheen {
  position: absolute; inset: -40% -10% auto -10%; height: 140%;
  background:
    radial-gradient(60% 40% at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
    radial-gradient(50% 40% at 90% 0%, rgba(236, 72, 153, 0.10) 0%, transparent 60%);
  z-index: 0;
}
.hero-waves { position: absolute; inset: auto 0 0 0; height: 80px; z-index: 0; }
.hero-waves svg { width: 100%; height: 100%; display: block; }
.hero-waves path { fill: rgba(99, 102, 241, 0.08); }
.hero-inner {
  position: relative; z-index: 1; display: grid; gap: 18px;
  grid-template-columns: auto 1fr; align-items: center; padding: 20px 22px;
}
@media (min-width: 768px) { .hero-inner { padding: 26px 28px; } }
.hero-left { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.avatar-wrap { position: relative; }
.avatar {
  box-shadow: 0 0 0 4px #fff, 0 0 0 8px rgba(99, 102, 241, 0.18);
  background: #f3f4f6;
}
.avatar-fallback { font-weight: 800; color: #374151; }
.dot {
  position: absolute; right: 6px; bottom: 6px; width: 12px; height: 12px;
  border-radius: 999px; background: #10b981;
  box-shadow: 0 0 0 2px #fff, 0 0 12px rgba(16, 185, 129, 0.6);
}
.name-chip {
  font-size: .92rem; color: #111827; line-height: 1;
  background: rgba(255, 255, 255, 0.9); padding: 6px 12px;
  border: 1px solid rgba(17, 24, 39, 0.08); border-radius: 999px;
  backdrop-filter: blur(6px);
}
.hero-right { min-width: 0; }
.brand { font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.15; margin: 0 0 4px; font-weight: 900; letter-spacing: .2px; color: #0f172a; }
.tagline { color: #475569; font-size: clamp(.92rem, 1.5vw, 1rem); }

/* ===== Cards & Preview ===== */
.elevated-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06);
}
.section-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; }
.preview-wrap {
  position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 18px;
  border: 1px dashed #e5e7eb;
  background: radial-gradient(ellipse at center, #0f172a 0%, #0b0f19 65%, #0b0f19 100%);
  overflow: hidden;
}
.preview-wrap.is-dropping { border-color: #4f46e5; background: rgba(79, 70, 229, 0.06); }
.preview-canvas { width: 100%; height: 100%; display: block; user-select: none; }
.drop-hint {
  position: absolute; inset: 0; display: grid; place-items: center; text-align: center;
  color: #d7e1f0; font-weight: 600; backdrop-filter: blur(1px);
}
</style>
