<template>
  <v-container class="py-6">
    <v-row class="g-6">
      <!-- Columna izquierda: Lienzo / Preview circular -->
      <v-col cols="12" md="7" lg="8">
        <v-card class="elevated-card" rounded="xl" variant="elevated">
          <v-toolbar density="comfortable" flat>
            <v-toolbar-title class="text-subtitle-1 font-weight-medium">
              Vista previa
            </v-toolbar-title>
            <v-spacer />
            <v-chip size="small" variant="tonal" color="primary" class="mr-2">
              Lado {{ lado }}
            </v-chip>
            <v-btn
              variant="text"
              size="small"
              icon="mdi-refresh"
              :loading="isBusy"
              :disabled="isBusy"
              @click="ensurePersonalization"
              :title="'Refrescar capas'"
            />
          </v-toolbar>

          <v-divider />

          <!-- Zona de preview + dropzone -->
          <div
            class="preview-wrap"
            :class="{ 'is-dropping': isDropping }"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <canvas
              ref="canvasRef"
              class="preview-canvas"
              @mousedown="onPointerDown"
              @mousemove="onPointerMove"
              @mouseup="onPointerUp"
              @mouseleave="onPointerUp"
              @wheel.prevent="onWheel"
              @touchstart.passive="onTouchStart"
              @touchmove.passive="onTouchMove"
              @touchend.passive="onTouchEnd"
            />
            <div class="drop-hint" v-if="isDropping">
              <v-icon size="36" class="mb-2">mdi-cloud-upload</v-icon>
              Suelta tu imagen aquí
            </div>
          </div>

          <v-sheet class="px-5 py-3 text-caption" color="transparent">
            La vista previa es una simulación 2D. Las capas (foto/texto/sticker/filtro) se registran en tu BD.
          </v-sheet>
        </v-card>
      </v-col>

      <!-- Columna derecha: Panel de controles -->
      <v-col cols="12" md="5" lg="4">
        <v-card class="elevated-card" rounded="xl" variant="elevated">
          <v-toolbar density="comfortable" flat>
            <v-toolbar-title class="text-subtitle-1 font-weight-medium">
              Personalizar llavero
            </v-toolbar-title>
          </v-toolbar>

          <v-divider />

          <v-card-text class="pt-4">
            <!-- Selector de lado -->
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
            <div class="section-title">Imagen</div>
            <v-btn
              block
              color="primary"
              class="mb-2"
              prepend-icon="mdi-cloud-upload"
              :loading="uploading"
              :disabled="!personalizationId || uploading"
              @click="subirFoto"
            >
              Subir foto
            </v-btn>
            <div class="text-caption mb-4">
              También puedes <b>arrastrar y soltar</b> una imagen sobre la vista previa.
            </div>

            <!-- Controles de la capa activa -->
            <template v-if="activeLayer">
              <v-divider class="my-4" />

              <div class="section-title">Edición de la capa activa</div>

              <div class="d-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: .5rem;">
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-magnify-minus-outline"
                  @click="nudgeScale(-0.08)"
                  >Reducir</v-btn
                >
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-magnify-plus-outline"
                  @click="nudgeScale(0.08)"
                  >Ampliar</v-btn
                >
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-rotate-left"
                  @click="nudgeRotate(-5)"
                  >Rotar -</v-btn
                >
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-rotate-right"
                  @click="nudgeRotate(5)"
                  >Rotar +</v-btn
                >
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-restore"
                  @click="resetActive"
                  >Reset giro</v-btn
                >
                <v-btn
                  variant="tonal"
                  size="small"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  @click="deleteActive"
                  >Eliminar</v-btn
                >
              </div>

              <div class="d-flex ga-2 mb-4">
                <v-btn
                  block
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-arrow-expand-all"
                  @click="fitCircleActive"
                  >Ajustar al círculo</v-btn
                >
                <v-btn
                  block
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-crosshairs-gps"
                  @click="centerActive"
                  >Centrar</v-btn
                >
                <v-btn
                  block
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-arrow-up-bold"
                  @click="bringToFront"
                  >Traer al frente</v-btn
                >
              </div>

              <div class="d-flex ga-2 mb-3">
                <v-btn variant="text" size="small" prepend-icon="mdi-image-outline" @click="selectLastOfType('foto')"
                  >Seleccionar foto</v-btn
                >
                <v-btn variant="text" size="small" prepend-icon="mdi-format-text" @click="selectLastOfType('texto')"
                  >Seleccionar texto</v-btn
                >
              </div>

              <v-row class="mb-2" dense>
                <v-col cols="12">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption">Tamaño</span>
                    <div class="d-flex ga-1">
                      <v-btn icon="mdi-magnify-minus-outline" size="small" variant="text" @click="nudgeScale(-0.08)" />
                      <v-btn icon="mdi-magnify-plus-outline" size="small" variant="text" @click="nudgeScale(0.08)" />
                    </div>
                  </div>
                  <v-slider
                    v-model="uiScale"
                    :min="MIN_SCALE"
                    :max="maxScaleForActive"
                    :step="0.01"
                    hide-details
                    class="mt-1"
                    @update:model-value="applyUiScale"
                  />
                </v-col>
              </v-row>

              <v-row class="mb-2" dense>
                <v-col cols="12">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption">Rotación</span>
                    <div class="d-flex ga-1">
                      <v-btn icon="mdi-rotate-left" size="small" variant="text" @click="nudgeRotate(-5)" />
                      <v-btn icon="mdi-rotate-right" size="small" variant="text" @click="nudgeRotate(5)" />
                    </div>
                  </div>
                  <v-slider
                    v-model="uiRotation"
                    :min="-180"
                    :max="180"
                    :step="1"
                    hide-details
                    class="mt-1"
                    @update:model-value="applyUiRotation"
                  />
                </v-col>
              </v-row>
            </template>

            <v-divider class="my-4" />

            <!-- Texto -->
            <div class="section-title">Texto</div>
            <v-text-field
              v-model="textDraft"
              label="Escribe tu texto"
              variant="solo-filled"
              density="comfortable"
              hide-details
              class="mb-3"
              @keyup.enter="agregarTexto"
            />
            <v-slider v-model="textScale" :min="0.5" :max="2" :step="0.1" thumb-label class="mb-2" />
            <div class="d-flex ga-2 mb-4">
              <v-btn
                block
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-format-text"
                :disabled="!textDraft.trim() || !personalizationId"
                @click="agregarTexto"
                >Agregar texto</v-btn
              >
            </div>

            <v-divider class="my-4" />

            <!-- Filtros -->
            <div class="section-title">Filtros</div>
            <v-btn
              block
              color="surface-variant"
              variant="tonal"
              prepend-icon="mdi-tune"
              :disabled="!personalizationId"
              @click="aplicarFiltro"
            >
              Aplicar filtro (demo)
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar de error -->
    <v-snackbar v-model="showSnack" color="error" variant="flat" timeout="4000">
      {{ err }}
      <template #actions>
        <v-btn size="small" color="white" variant="text" @click="showSnack = false"> Cerrar </v-btn>
      </template>
    </v-snackbar>

    <!-- Overlay al subir -->
    <v-overlay :model-value="uploading" class="align-center justify-center">
      <v-card class="px-6 py-4" rounded="lg" elevation="8">
        <div class="d-flex align-center ga-3">
          <v-progress-circular indeterminate color="primary" />
          <span class="text-body-2">Subiendo imagen…</span>
        </div>
      </v-card>
    </v-overlay>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { get, post } from '../lib/api'

/* ===================== CONFIG ===================== */
const BASE_KEYCHAIN_URL = '/images/llavero-base.png'
const CANVAS = { W: 680, H: 680 }
// círculo de trabajo (centro y radio relativos al canvas)
const CIRCLE = { cx: 0.5, cy: 0.58, r: 0.30 }
const NORMAL_SIDE_FACTOR = 0.85
const MIN_SCALE = 0.1
const FONT_BASE = 40

/* ===================== STATE ===================== */
const params = new URLSearchParams(globalThis.location?.search || '')
const carritoItemId = Number(params.get('itemId') || '1')
const lado = ref<'A' | 'B'>('A')
const personalizationId = ref<number | null>(null)

const layers = ref<any[]>([])
const err = ref(''); const showSnack = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageCache = new Map<string, HTMLImageElement>()
const textDraft = ref(''); const textScale = ref(1.0)
const isBusy = ref(false); const uploading = ref(false); const isDropping = ref(false)

/* Interacción */
type Mode = 'idle' | 'move'
const mode = ref<Mode>('idle')
const dragStart = ref({ x: 0, y: 0 })
const startState = ref<{ x: number; y: number; escala: number; rot: number } | null>(null)
const activeId = ref<number | string | null>(null)

/* UI sliders */
const uiScale = ref(1)
const uiRotation = ref(0)

/* rAF para render suave */
let rafId: number | null = null
function scheduleRender() {
  if (rafId != null) return
  rafId = requestAnimationFrame(() => { rafId = null; renderPreview() })
}

/* ========== CAPAS VISIBLES ========== */
const layersView = computed(() => {
  const pid = personalizationId.value
  const side = lado.value
  return layers.value
    .filter(l => (l.personalization_id == null || l.personalization_id === pid))
    .filter(l => (l.lado == null || l.lado === side))
    .filter(l => ['foto', 'texto', 'sticker', 'filtro'].includes(l.tipo_capa))
})
const activeLayer = computed(() => layersView.value.find(l => l.id === activeId.value) ?? null)

/* ===================== HELPERS ===================== */
function toastError(message: string) { err.value = message; showSnack.value = true }
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
  return raw.startsWith('/') ? raw : `/${raw}`
}

function pointerPos(evt: MouseEvent) {
  const c = canvasRef.value!, r = c.getBoundingClientRect()
  return { x: evt.clientX - r.left, y: evt.clientY - r.top }
}
function touchPos(t: Touch) {
  const c = canvasRef.value!, r = c.getBoundingClientRect()
  return { x: t.clientX - r.left, y: t.clientY - r.top }
}

/* ========= CÍRCULO en px ========= */
function circlePx(W: number, H: number) { const r = Math.min(W, H) * CIRCLE.r; return { cx: W * CIRCLE.cx, cy: H * CIRCLE.cy, r } }

/* ========= DIMS IMAGEN / TEXTO ========= */
function getImageDims(l: any): { w: number; h: number } | null {
  const u = resolveLayerUrl(l.archivo_url || l.url || null)
  if (!u) return null
  const img = imageCache.get(u)
  if (!img) return null
  return { w: img.naturalWidth, h: img.naturalHeight }
}
let measureCanvas: HTMLCanvasElement | null = null
let measureCtx: CanvasRenderingContext2D | null = null
function ensureMeasureCtx() {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
    measureCanvas.width = measureCanvas.height = 10
    measureCtx = measureCanvas.getContext('2d')
  }
  return measureCtx!
}
function getTextBoxAtScale1(l: any) {
  const ctx = ensureMeasureCtx()
  ctx.font = `600 ${FONT_BASE}px ${l.fuente || 'Arial'}`
  const text = l.texto || ''
  const m = ctx.measureText(text)
  const w = Math.max(1, m.width)
  const h = (m.actualBoundingBoxAscent || FONT_BASE * 0.8) + (m.actualBoundingBoxDescent || FONT_BASE * 0.2)
  return { w, h }
}

/* ========= Normalización base a círculo ========= */
function computeNormalizedK(diamPx: number, dims: { w: number; h: number } | null) {
  const targetSide = diamPx * NORMAL_SIDE_FACTOR
  if (!dims) return 1
  return Math.min(targetSide / dims.w, targetSide / dims.h)
}

/* ========= Caja (w,h) de la capa en px ========= */
function getLayerBox(l: any, diamPx: number) {
  if (l.tipo_capa === 'texto') {
    const base = getTextBoxAtScale1(l)
    const s = l.escala || 1
    return { w: base.w * s, h: base.h * s }
  }
  const dims = getImageDims(l)
  const k0 = computeNormalizedK(diamPx, dims)
  const w = (dims?.w ?? diamPx) * k0 * (l.escala || 1)
  const h = (dims?.h ?? diamPx) * k0 * (l.escala || 1)
  return { w, h }
}

/* ========= Escala máx por capa ========= */
function maxScaleForLayer(l: any, diamPx: number) {
  const r = (diamPx / 2) * 0.98
  if (l.tipo_capa === 'texto') {
    const base = getTextBoxAtScale1(l)
    const half0 = Math.hypot(base.w, base.h) / 2
    return Math.max(MIN_SCALE, r / half0)
  }
  const dims = getImageDims(l)
  const k0 = computeNormalizedK(diamPx, dims)
  const half0 = Math.hypot((dims?.w ?? diamPx) * k0, (dims?.h ?? diamPx) * k0) / 2
  return Math.max(MIN_SCALE, r / half0)
}

const maxScaleForActive = computed(() => {
  const l = activeLayer.value
  if (!l) return 3
  const { r } = circlePx(CANVAS.W, CANVAS.H)
  return maxScaleForLayer(l, r * 2)
})

function clampLayerInside(l: any) {
  const W = CANVAS.W, H = CANVAS.H
  const { cx, cy, r } = circlePx(W, H)
  const diam = r * 2

  // escala tope
  const maxS = maxScaleForLayer(l, diam)
  l.escala = Math.max(MIN_SCALE, Math.min(l.escala || 1, maxS))

  // centro dentro del círculo considerando semidiagonal
  const { w, h } = getLayerBox(l, diam)
  const half = Math.hypot(w, h) / 2
  const maxOffset = Math.max(0, r - half)

  const x = (l.pos_x ?? 0.5) * W
  const y = (l.pos_y ?? 0.5) * H

  const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy)
  if (d > maxOffset) {
    const nx = cx + (dx / d) * maxOffset
    const ny = cy + (dy / d) * maxOffset
    l.pos_x = nx / W
    l.pos_y = ny / H
  } else {
    l.pos_x = Math.max(0, Math.min(1, l.pos_x ?? 0.5))
    l.pos_y = Math.max(0, Math.min(1, l.pos_y ?? 0.5))
  }
}

/* ===================== PERSONALIZACIÓN ===================== */
async function ensurePersonalization() {
  if (isBusy.value) return
  isBusy.value = true
  try {
    const r = await post('/api/local/personalizations', { carritoItemId, lado: lado.value })
    personalizationId.value = r.id
    await loadLayers(true)
  } catch (e: any) { toastError(getMsg(e)) }
  finally { isBusy.value = false }
}

/* ===================== SUBIDA ===================== */
async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
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

function onDragOver() { isDropping.value = true }
function onDragLeave() { isDropping.value = false }
async function onDrop(e: DragEvent) {
  isDropping.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadFile(file)
}

async function uploadFile(f: File) {
  if (!personalizationId.value) return
  const tempId = `tmp_${Date.now()}`
  try {
    uploading.value = true
    const dataUrl = await readFileAsDataUrl(f)

    // Escala inicial normalizada a círculo
    const { r } = circlePx(CANVAS.W, CANVAS.H)
    let initialScale = 1
    try {
      const img = await loadImage(dataUrl)
      initialScale = computeNormalizedK(r * 2, { w: img.naturalWidth, h: img.naturalHeight })
    } catch { }

    const tempLayer = {
      id: tempId,
      personalization_id: personalizationId.value,
      lado: lado.value,
      tipo_capa: 'foto',
      url: dataUrl,
      z_index: 5,
      pos_x: 0.5,
      pos_y: 0.58,
      escala: initialScale,
      rotacion: 0,
    }
    layers.value = [...layers.value, tempLayer]
    activeId.value = tempId
    clampLayerInside(tempLayer)
    syncUiFromActive()
    scheduleRender()

    // Subida real
    const fd = new FormData()
    fd.append('personalizationId', String(personalizationId.value))
    fd.append('lado', String(lado.value))
    fd.append('file', f)

    let resp = await fetch('/api/local/uploads', { method: 'POST', body: fd, credentials: 'include' })
    if (!resp.ok && resp.status === 404) resp = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const up = await resp.json()

    await post(`/api/local/personalizations/${personalizationId.value}/layers`, {
      tipo_capa: 'foto',
      lado: lado.value,
      archivo_id: up.archivoId ?? null,
      url: up.url ?? null,
      z_index: 5,
      pos_x: tempLayer.pos_x,
      pos_y: tempLayer.pos_y,
      escala: tempLayer.escala,
      rotacion: 0,
    })

    layers.value = layers.value.filter(l => l.id !== tempId)
    await loadLayers(true)
  } catch (e: any) {
    layers.value = layers.value.filter(l => l.id !== tempId)
    scheduleRender()
    toastError(getMsg(e))
  } finally { uploading.value = false }
}

/* ===================== TEXTO / FILTROS ===================== */
async function agregarTexto() {
  if (!personalizationId.value) return
  const txt = textDraft.value.trim()
  if (!txt) return
  try {
    await post(`/api/local/personalizations/${personalizationId.value}/layers`, {
      tipo_capa: 'texto',
      lado: lado.value,
      texto: txt,
      fuente: 'Arial',
      color: '#000000',
      z_index: 10,
      pos_x: 0.5,
      pos_y: 0.87,
      escala: textScale.value,
      rotacion: 0,
    })
    textDraft.value = ''
    await loadLayers(true)
  } catch (e: any) { toastError(getMsg(e)) }
}

async function aplicarFiltro() {
  if (!personalizationId.value) return
  try {
    await post(`/api/local/personalizations/${personalizationId.value}/layers`, {
      tipo_capa: 'filtro',
      lado: lado.value,
      filtro_id: null,
      z_index: 50,
    })
    await loadLayers(false)
  } catch (e: any) { toastError(getMsg(e)) }
}

/* ===================== CARGA CAPAS + PRECARGA ===================== */
async function preloadImages(urls: string[]) {
  const uniq = Array.from(new Set(urls.filter(Boolean)))
  await Promise.all(uniq.map(u => loadImage(u)))
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

    for (const l of arr) {
      l.escala = typeof l.escala === 'number' ? l.escala : 1
      l.rotacion = typeof l.rotacion === 'number' ? l.rotacion : 0
    }

    // Mantén solo las capas del lado y personalización actual
    layers.value = arr.filter(l =>
      (l.personalization_id == null || l.personalization_id === personalizationId.value) &&
      (l.lado == null || l.lado === lado.value)
    )

    // Precargar visibles
    const urls = layersView.value.flatMap(l => {
      if (l.tipo_capa === 'foto') return [resolveLayerUrl(l.archivo_url || l.url || null)]
      if (l.tipo_capa === 'sticker') return [resolveLayerUrl(l.sticker_url || l.url || null)]
      return []
    }).filter((u): u is string => !!u)
    await preloadImages(urls)

    // Seleccionar última capa útil
    const last = [...layersView.value].reverse().find(l => l.tipo_capa === 'foto' || l.tipo_capa === 'texto')
    activeId.value = last?.id ?? null
    syncUiFromActive()
    scheduleRender()
  } catch (e: any) { toastError(getMsg(e) || 'No se pudieron cargar las capas') }
}

/* ===================== HIT TEST (unificado) ===================== */
function hitTest(pos: { x: number; y: number }) {
  const sorted = [...layersView.value].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0) || (a.id ?? 0) - (b.id ?? 0))
  const W = CANVAS.W, H = CANVAS.H
  for (let i = sorted.length - 1; i >= 0; i--) {
    const l = sorted[i]
    const cx = (l.pos_x ?? 0.5) * W
    const cy = (l.pos_y ?? 0.5) * H
    const { r } = circlePx(W, H)
    const diam = r * 2

    const ang = -((l.rotacion || 0) * Math.PI) / 180
    const dx = pos.x - cx, dy = pos.y - cy
    const rx = dx * Math.cos(ang) - dy * Math.sin(ang)
    const ry = dx * Math.sin(ang) + dy * Math.cos(ang)

    const { w, h } = getLayerBox(l, diam)
    const pad = l.tipo_capa === 'texto' ? 10 : 0
    if (Math.abs(rx) <= w / 2 + pad && Math.abs(ry) <= h / 2 + pad) return l.id
  }
  return null
}

/* ===================== INTERACCIÓN ===================== */
function onPointerDown(evt: MouseEvent) {
  const p = pointerPos(evt)
  const id = hitTest(p)
  if (id != null) {
    activeId.value = id
    const l = activeLayer.value
    if (l) {
      mode.value = 'move'
      dragStart.value = p
      startState.value = { x: l.pos_x, y: l.pos_y, escala: l.escala, rot: l.rotacion || 0 }
      syncUiFromActive()
    }
  } else {
    mode.value = 'idle'
    startState.value = null
  }
}

function onPointerMove(evt: MouseEvent) {
  if (mode.value === 'idle') return
  const l = activeLayer.value
  if (!l || !startState.value) return
  const p = pointerPos(evt)
  const W = CANVAS.W, H = CANVAS.H
  const dx = (p.x - dragStart.value.x) / W
  const dy = (p.y - dragStart.value.y) / H
  l.pos_x = Math.max(0, Math.min(1, startState.value.x + dx))
  l.pos_y = Math.max(0, Math.min(1, startState.value.y + dy))
  clampLayerInside(l)
  scheduleRender()
}

function onPointerUp() { mode.value = 'idle'; startState.value = null }

function onWheel(evt: WheelEvent) {
  const l = activeLayer.value
  if (!l) return
  if (evt.shiftKey) {
    l.rotacion = (l.rotacion || 0) + (evt.deltaY > 0 ? 6 : -6)
    uiRotation.value = l.rotacion
  } else {
    const f = evt.deltaY > 0 ? 0.92 : 1.08
    l.escala = Math.max(MIN_SCALE, l.escala * f)
  }
  clampLayerInside(l)
  uiScale.value = l.escala
  scheduleRender()
}

/* Touch (mover) */
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const p = touchPos(e.touches[0])
  const id = hitTest(p)
  if (id != null) {
    activeId.value = id
    const l = activeLayer.value
    if (l) {
      mode.value = 'move'
      dragStart.value = p
      startState.value = { x: l.pos_x, y: l.pos_y, escala: l.escala, rot: l.rotacion || 0 }
      syncUiFromActive()
    }
  } else { mode.value = 'idle'; startState.value = null }
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1 || mode.value === 'idle') return
  const l = activeLayer.value
  if (!l || !startState.value) return
  const p = touchPos(e.touches[0])
  const W = CANVAS.W; const H = CANVAS.H
  const dx = (p.x - dragStart.value.x) / W
  const dy = (p.y - dragStart.value.y) / H
  l.pos_x = Math.max(0, Math.min(1, startState.value.x + dx))
  l.pos_y = Math.max(0, Math.min(1, startState.value.y + dy))
  clampLayerInside(l)
  scheduleRender()
}
function onTouchEnd() { mode.value = 'idle'; startState.value = null }

/* ===================== CONTROLES PANEL ===================== */
function syncUiFromActive() {
  const l = activeLayer.value; if (!l) return
  uiScale.value = l.escala || 1
  uiRotation.value = l.rotacion || 0
}
function applyUiScale(v: number) {
  const l = activeLayer.value; if (!l) return
  l.escala = v; clampLayerInside(l); scheduleRender()
}
function applyUiRotation(v: number) {
  const l = activeLayer.value; if (!l) return
  l.rotacion = v; scheduleRender()
}
function nudgeScale(delta: number) {
  const l = activeLayer.value; if (!l) return
  l.escala = Math.max(MIN_SCALE, l.escala + delta)
  clampLayerInside(l); uiScale.value = l.escala; scheduleRender()
}
function nudgeRotate(deltaDeg: number) {
  const l = activeLayer.value; if (!l) return
  l.rotacion = (l.rotacion || 0) + deltaDeg
  uiRotation.value = l.rotacion; scheduleRender()
}
function centerActive() {
  const l = activeLayer.value; if (!l) return
  l.pos_x = 0.5; l.pos_y = CIRCLE.cy; clampLayerInside(l); scheduleRender()
}
function fitCircleActive() {
  const l = activeLayer.value; if (!l) return
  const { r } = circlePx(CANVAS.W, CANVAS.H)
  const maxS = maxScaleForLayer(l, r * 2)
  l.escala = Math.min(Math.max(0.9, maxS), maxS)
  clampLayerInside(l); uiScale.value = l.escala; scheduleRender()
}
function selectLastOfType(tipo: 'foto' | 'texto') {
  const last = [...layersView.value].reverse().find(l => l.tipo_capa === tipo)
  if (last) { activeId.value = last.id; syncUiFromActive(); scheduleRender() }
  else toastError(`No hay capas de tipo ${tipo}.`)
}
function bringToFront() {
  const l = activeLayer.value; if (!l) return
  const maxZ = layersView.value.reduce((m, x) => Math.max(m, x.z_index ?? 0), 0)
  l.z_index = maxZ + 1; scheduleRender()
}
function resetActive() {
  const l = activeLayer.value; if (!l) return
  l.rotacion = 0; uiRotation.value = 0; scheduleRender()
}
async function deleteActive() {
  const l = activeLayer.value; if (!l) return
  try {
    if (personalizationId.value && typeof l.id !== 'string') {
      try { await post(`/api/local/personalizations/${personalizationId.value}/layers/${l.id}/delete`, {}) }
      catch { await post(`/api/personalizations/${personalizationId.value}/layers/${l.id}/delete`, {}) }
    }
  } catch (e: any) { toastError(getMsg(e)) }
  finally {
    layers.value = layers.value.filter(x => x.id !== l.id)
    activeId.value = layersView.value[layersView.value.length - 1]?.id ?? null
    syncUiFromActive(); scheduleRender()
  }
}

/* ===================== RENDER (cache + rAF) ===================== */
function renderPreview() {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const W = (canvas.width = CANVAS.W)
  const H = (canvas.height = CANVAS.H)

  // Fondo
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0B0F19'
  ctx.fillRect(0, 0, W, H)

  // Base (usa cache; si no, carga y re-render)
  const base = imageCache.get(BASE_KEYCHAIN_URL)
  if (base) {
    const r = Math.min(W / base.naturalWidth, H / base.naturalHeight)
    const bw = base.naturalWidth * r, bh = base.naturalHeight * r
    const bx = (W - bw) / 2, by = (H - bh) / 2
    ctx.drawImage(base, bx, by, bw, bh)
  } else {
    loadImage(BASE_KEYCHAIN_URL).then(() => scheduleRender())
  }

  // Oscurecer fuera del círculo
  const { cx, cy, r } = circlePx(W, H)
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true)
  ctx.fill('evenodd')
  ctx.restore()

  // Capas visibles ordenadas
  const sorted = [...layersView.value].sort((a, b) => {
    const zi = (a.z_index ?? 0) - (b.z_index ?? 0)
    return zi !== 0 ? zi : (a.id ?? 0) - (b.id ?? 0)
  })

  // Clip circular
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // Dibuja TODAS
  for (const l of sorted) {
    const x = Math.round((l.pos_x ?? 0.5) * W)
    const y = Math.round((l.pos_y ?? 0.5) * H)

    if (l.tipo_capa === 'foto' || l.tipo_capa === 'sticker') {
      const url = resolveLayerUrl(l.archivo_url || l.sticker_url || l.url || null)
      if (!url) continue
      const img = imageCache.get(url)
      if (!img) { loadImage(url).then(() => scheduleRender()); continue }
      ctx.save()
      ctx.translate(x, y)
      if (l.rotacion) ctx.rotate((Number(l.rotacion) * Math.PI) / 180)
      const { r: rMask } = circlePx(W, H)
      const k0 = Math.min((rMask * 2 * NORMAL_SIDE_FACTOR) / img.naturalWidth, (rMask * 2 * NORMAL_SIDE_FACTOR) / img.naturalHeight)
      const w = img.naturalWidth * k0 * (l.escala || 1)
      const h = img.naturalHeight * k0 * (l.escala || 1)
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
      ctx.restore()
      continue
    }

    if (l.tipo_capa === 'texto') {
      ctx.save()
      ctx.translate(x, y)
      if (l.rotacion) ctx.rotate((Number(l.rotacion) * Math.PI) / 180)
      ctx.scale(l.escala || 1, l.escala || 1)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = l.color || '#000'
      ctx.font = `600 ${FONT_BASE}px ${l.fuente || 'Arial'}`
      ctx.fillText(l.texto || '', 0, 0)
      ctx.restore()
    }
  }

  // Resalte selección
  const a = activeLayer.value
  if (a) {
    const x = Math.round((a.pos_x ?? 0.5) * W)
    const y = Math.round((a.pos_y ?? 0.5) * H)
    ctx.save()
    ctx.translate(x, y)
    if (a.rotacion) ctx.rotate((Number(a.rotacion) * Math.PI) / 180)
    ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(147,197,253,0.9)'
    const { r: rMask } = circlePx(W, H)
    const { w, h } = getLayerBox(a, rMask * 2)
    ctx.strokeRect(-w / 2, -h / 2, w, h)
    ctx.restore()
  }

  ctx.restore()

  // Borde del círculo
  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#93c5fd'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/* ===================== MONTAJE & ATAJOS ===================== */
function onKey(e: KeyboardEvent) {
  if (!activeLayer.value) return
  if (e.key === '+' || e.key === '=') { nudgeScale(0.08) }
  if (e.key === '-' || e.key === '_') { nudgeScale(-0.08) }
  if (e.key.toLowerCase() === 'r' && !e.shiftKey) { nudgeRotate(5) }
  if (e.key.toLowerCase() === 'r' && e.shiftKey) { nudgeRotate(-5) }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const l = activeLayer.value!
    const step = e.shiftKey ? 0.01 : 0.005
    if (e.key === 'ArrowUp') l.pos_y = Math.max(0, (l.pos_y ?? 0.5) - step)
    if (e.key === 'ArrowDown') l.pos_y = Math.min(1, (l.pos_y ?? 0.5) + step)
    if (e.key === 'ArrowLeft') l.pos_x = Math.max(0, (l.pos_x ?? 0.5) - step)
    if (e.key === 'ArrowRight') l.pos_x = Math.min(1, (l.pos_x ?? 0.5) + step)
    clampLayerInside(l); scheduleRender()
  }
  if (e.key === 'Delete') deleteActive()
}

onMounted(async () => {
  await nextTick()
  // Precarga base para evitar parpadeos y asegura que getImageDims funcione
  loadImage(BASE_KEYCHAIN_URL).finally(() => scheduleRender())
  await ensurePersonalization()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => { window.removeEventListener('keydown', onKey) })
watch(lado, async () => { await ensurePersonalization() })

defineExpose({ MIN_SCALE })
</script>

<style scoped>
.elevated-card {
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.preview-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  border: 1px dashed #e5e7eb;
  background:
    radial-gradient(ellipse at center, #0f172a 0%, #0b0f19 65%, #0b0f19 100%);
  overflow: hidden;
}

.preview-wrap.is-dropping {
  border-color: #4f46e5;
  background: rgba(79, 70, 229, 0.06);
}

.preview-canvas {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  touch-action: none;
  cursor: grab;
}

.preview-canvas:active {
  cursor: grabbing;
}

.drop-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  color: #d7e1f0;
  font-weight: 600;
  backdrop-filter: blur(1px);
}
</style>
