<template>
  <div class="print-root">
    <!-- ÚNICO botón (no se imprime) -->
    <div class="toolbar">
      <button class="btn" @click="doPrint">Imprimir</button>
      <span class="meta">{{ folio || ('ORD #' + (orderIdParam || '')) }} · Ø {{ diameterMm }} mm</span>
    </div>

    <!-- Hoja Carta, contenido centrado -->
    <div class="sheet letter">
      <div class="grid">
        <!-- Par A/B (repite copies veces si lo envías por query ?copies=) -->
        <template v-for="n in copies" :key="'pair-'+n">
          <div class="cell" :style="cellStyle">
            <div class="circle" :style="circleStyle">
              <img class="circle-img" :src="imgA || placeholder" @error="usePlaceholder($event)" />
              <svg viewBox="0 0 1000 1000" class="cut"><circle cx="500" cy="500" r="497" fill="none" stroke="#000" stroke-width="6"/></svg>
            </div>
            <div v-if="showLabels" class="label">{{ labelA }}</div>
          </div>

          <div class="cell" :style="cellStyle">
            <div class="circle" :style="circleStyle">
              <img class="circle-img" :src="imgB || placeholder" @error="usePlaceholder($event)" />
              <svg viewBox="0 0 1000 1000" class="cut"><circle cx="500" cy="500" r="497" fill="none" stroke="#000" stroke-width="6"/></svg>
            </div>
            <div v-if="showLabels" class="label">{{ labelB }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../lib/api'

/* ======= Parámetros por query ======= */
const qs = new URLSearchParams(location.search)
const orderIdParam = qs.get('orderId') || ''       // preferido si viene
const folio = qs.get('folio') || ''                // alternativa
const diameterMm = Number(qs.get('d') || '35')     // diámetro del círculo (mm)
const gapMm = Number(qs.get('gap') || '6')         // separación entre piezas (mm)
const copies = Math.max(1, Number(qs.get('copies') || '1'))
const showLabels = qs.get('labels') !== '0'        // ?labels=0 para ocultar

const labelA = computed(() => (folio ? `${folio} · A` : 'A'))
const labelB = computed(() => (folio ? `${folio} · B` : 'B'))

/* ======= Datos de imágenes ======= */
const imgA = ref<string>('')  // data:... o ruta absoluta/relativa
const imgB = ref<string>('')

const API_BASE = String((import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE || '').replace(/\/+$/,'')

/* ======= Utilidades ======= */
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="18">Sin imagen</text>
</svg>`)

function usePlaceholder(ev: Event) { (ev.target as HTMLImageElement).src = placeholder }

function resolveUrl(raw?: string) {
  if (!raw) return ''
  if (/^data:image\//i.test(raw)) return raw
  if (/^https?:\/\//i.test(raw)) return raw
  const p = raw.startsWith('/') ? raw : '/' + raw
  return API_BASE ? `${API_BASE}${p}` : p
}

/* ======= Carga =======
   1) Si hay orderId -> /api/imagenes-b64/by-order/{id}
   2) Si no, buscar por folio en /api/operator/orders (estado CRE) y tomar imageA/B
*/
async function hydrate() {
  imgA.value = ''; imgB.value = '';

  // 1) por orderId (ideal, usa tabla imagenes_b64)
  if (/^\d+$/.test(orderIdParam)) {
    try {
      const r = await get(`/api/imagenes-b64/by-order/${Number(orderIdParam)}`)
      if (r) {
        imgA.value = resolveUrl(r.ladoA_b64)
        imgB.value = resolveUrl(r.ladoB_b64)
        if (!folio && r?.id) { /* opcional: nada */ }
        if (imgA.value || imgB.value) return
      }
    } catch { /* sigue */ }
  }

  // 2) por folio (usa tu endpoint de operador)
  if (folio) {
    try {
      const r2 = await get('/api/operator/orders', { params: { estado: 'CRE', limit: 500 } })
      const items = Array.isArray(r2?.items) ? r2.items : []
      const hit = items.find((x: any) => String(x?.folio) === String(folio))
      if (hit) {
        imgA.value = resolveUrl(hit.imageA)
        imgB.value = resolveUrl(hit.imageB)
      }
    } catch { /* ignore */ }
  }
}

onMounted(hydrate)

/* ======= Estilos calculados ======= */
const circleStyle = computed(() => ({
  width: diameterMm + 'mm',
  height: diameterMm + 'mm'
}))
const cellStyle = computed(() => ({
  width: diameterMm + 'mm',
  height: `calc(${diameterMm}mm + 6mm)` // deja espacio para etiqueta
}))

function doPrint() { window.print() }
</script>

<style scoped>
/* Toolbar (no imprime) */
.toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; background: #f7f7fb; border-bottom: 1px solid #e5e7eb;
}
.btn { padding: 8px 14px; border-radius: 6px; background:#111827; color:#fff; border:1px solid #1f2937; cursor:pointer; }
.meta { color:#374151; font-size:12px; }

/* Hoja Carta centrada */
.sheet.letter {
  width: 215.9mm; min-height: 279.4mm;  /* carta */
  margin: 12px auto; background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 10px 20px rgba(0,0,0,.06);
  padding: 8mm;

  /* Centrado del contenido */
  display: flex; align-items: center; justify-content: center;
}

/* Grid centrado y con gap en mm (se fija via CSS custom prop) */
.grid {
  --gapmm: 6mm;
  display: flex; flex-wrap: wrap;
  justify-content: center; align-content: center;
  gap: var(--gapmm);
}
:root, .sheet .grid { --gapmm: 6mm; }
</style>

<style scoped>
/* Celdas y círculo */
.cell { display: flex; flex-direction: column; align-items: center; }
.circle {
  position: relative; border-radius: 50%; overflow: hidden; background: #f3f4f6;
}
.circle-img { width: 100%; height: 100%; object-fit: cover; }
.cut { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.label { font: 10pt/1.2 system-ui, sans-serif; margin-top: 2mm; }

/* Impresión 1:1 (Forzamos Carta y margen pequeño) */
@media print {
  .toolbar { display: none !important; }
  @page { size: Letter; margin: 6mm; }
  .sheet.letter { box-shadow: none; margin: 0; padding: 8mm; }
}
</style>
