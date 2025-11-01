<!-- src/views/Operador.vue -->
<template>
  <div class="operador-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Panel Operador
        </h1>

        <div class="header-actions">
          <button @click="reload" class="btn-reload" :disabled="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"/>
              <path d="M20.49 15A9 9 0 0 1 6.36 18.36L1 14"/>
            </svg>
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>

          <button @click="logout" class="btn-logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Menu Principal -->
      <div v-if="currentView === 'menu'" class="menu-view">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ pendingOrders.length }}</h3>
              <p>Órdenes Pendientes</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon processing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ processingOrders.length }}</h3>
              <p>En Proceso</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon completed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ completedToday }}</h3>
              <p>Completadas Hoy</p>
            </div>
          </div>
        </div>

        <!-- Lista de Órdenes Pendientes -->
        <div class="orders-section">
          <h2 class="section-title">Órdenes Pendientes</h2>

          <div v-if="error" class="error-state">
            <p>{{ error }}</p>
          </div>

          <div v-else-if="loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="spin">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <p>Cargando...</p>
          </div>

          <div v-else-if="pendingOrders.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p>No hay órdenes pendientes</p>
          </div>

          <div v-else class="orders-grid">
            <div
              v-for="order in pendingOrders"
              :key="order.id || order.folio"
              class="order-card"
              @click="selectOrder(order)"
            >
              <div class="order-header">
                <span class="order-number">#{{ order.folio }}</span>
                <span class="order-badge new">Nueva</span>
              </div>

              <div class="order-images">
                <div class="image-preview">
                  <img :src="order.imageA" alt="Cara A" @error="onImgError($event)">
                  <span class="image-label">Cara A</span>
                </div>
                <div class="image-preview">
                  <img :src="order.imageB" alt="Cara B" @error="onImgError($event)">
                  <span class="image-label">Cara B</span>
                </div>
              </div>

              <div class="order-info">
                <p><strong>Cliente:</strong> {{ order.customerName }}</p>
                <p><strong>Tipo:</strong> {{ order.nfcType }}</p>
              </div>

              <button class="btn-primary">
                Procesar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Procesamiento -->
      <div v-else-if="currentView === 'processing'" class="processing-view">
        <button @click="backToMenu" class="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        Volver al menú
        </button>

        <div class="processing-card" v-if="selectedOrder">
          <div class="processing-header">
            <h2>Orden #{{ selectedOrder.folio }}</h2>
            <span class="customer-name">{{ selectedOrder.customerName }}</span>
          </div>

          <!-- Paso 1: Impresión -->
          <div class="step-container" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <div class="step-header">
              <div class="step-number">1</div>
              <h3>Impresión de Fotografías</h3>
            </div>
            <div v-if="currentStep === 1" class="step-content">
              <div class="images-display">
                <div class="image-full">
                  <img :src="selectedOrder.imageA" alt="Cara A" @error="onImgError($event)">
                  <p class="image-title">Cara A</p>
                </div>
                <div class="image-full">
                  <img :src="selectedOrder.imageB" alt="Cara B" @error="onImgError($event)">
                  <p class="image-title">Cara B</p>
                </div>
              </div>
              <button @click="sendToPrint" class="btn-action" :disabled="printing">
                <svg v-if="!printing" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                <div v-else class="spinner"></div>
                {{ printing ? 'Imprimiendo...' : 'Enviar a Imprimir' }}
              </button>
            </div>
          </div>

          <!-- Paso 2: Validación de Calidad -->
          <div class="step-container" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <div class="step-header">
              <div class="step-number">2</div>
              <h3>Validación de Calidad</h3>
            </div>
            <div v-if="currentStep === 2" class="step-content">
              <p class="step-description">¿La impresión tiene buena calidad?</p>
              <div class="button-group">
                <button @click="validateQuality(false)" class="btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  No, Reimprimir
                </button>
                <button @click="validateQuality(true)" class="btn-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sí, Continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Paso 3: Programación NFC -->
          <div class="step-container" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
            <div class="step-header">
              <div class="step-number">3</div>
              <h3>Programación NFC</h3>
            </div>
            <div v-if="currentStep === 3" class="step-content">
              <div class="nfc-info">
                <p><strong>Tipo:</strong> {{ selectedOrder.nfcType }}</p>

                <!-- Bloque de Datos con input readonly + copiar y link si es URL -->
                <div class="nfc-data">
                  <label>Datos a programar</label>
                  <div class="nfc-data-row">
                    <input class="nfc-input" :value="selectedOrder?.nfcData || ''" readonly>
                    <button class="btn-copy" @click="copyNfcData" :disabled="!selectedOrder?.nfcData">
                      Copiar
                    </button>
                  </div>
                  <a
                    v-if="isLikelyUrl(selectedOrder?.nfcData)"
                    :href="selectedOrder.nfcData"
                    target="_blank"
                    rel="noopener"
                    class="nfc-link"
                  >
                    Abrir enlace
                  </a>
                </div>
              </div>

              <div class="nfc-programming">
                <div class="nfc-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/>
                    <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
                    <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
                    <path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>
                  </svg>
                </div>
                <button
                  @click="programNFC"
                  class="btn-action"
                  :disabled="programming || !nfcSupported || !selectedOrder?.nfcData"
                >
                  <div v-if="programming" class="spinner"></div>
                  {{ programming ? 'Programando...' : 'Programar NFC' }}
                </button>
                <p v-if="!nfcSupported" class="nfc-warning">
                  Web NFC no disponible. Usa <b>Chrome en Android</b> y abre esta página por <b>HTTPS</b>.
                </p>
              </div>
            </div>
          </div>

          <!-- Paso 4: Validación Programación -->
          <div class="step-container" :class="{ active: currentStep === 4, completed: currentStep > 4 }">
            <div class="step-header">
              <div class="step-number">4</div>
              <h3>Validación de Programación</h3>
            </div>
            <div v-if="currentStep === 4" class="step-content">
              <p class="step-description">¿El NFC se programó correctamente?</p>
              <div class="button-group">
                <button @click="validateNFC(false)" class="btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  No, Reprogramar
                </button>
                <button @click="validateNFC(true)" class="btn-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sí, Continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Paso 5: Finalizar -->
          <div class="step-container" :class="{ active: currentStep === 5 }">
            <div class="step-header">
              <div class="step-number">5</div>
              <h3>Finalizar Orden</h3>
            </div>
            <div v-if="currentStep === 5" class="step-content">
              <div class="success-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>Orden {{ selectedOrder.folio }} completada exitosamente</p>
              </div>
              <button @click="finishOrder" class="btn-primary-large">
                Finalizar y Enviar a Reparto
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get /*, post */ } from '../lib/api'

export default {
  name: 'OperadorView',
  setup() {
    const currentView = ref('menu') // 'menu' | 'processing'
    const currentStep = ref(1)
    const selectedOrder = ref(null)
    const printing = ref(false)
    const programming = ref(false)
    const completedToday = ref(0)
    const pendingOrders = ref([])
    const processingOrders = ref([])
    const loading = ref(false)
    const error = ref(null)

    const route = useRoute()
    const router = useRouter()

    const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

    const IMG_PLACEHOLDER =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#1a1f26"/><text x="50%" y="50%" fill="#4fd1c5" font-size="16" text-anchor="middle">Sin imagen</text></svg>'

    const urlFor = (p) => {
      if (!p) return IMG_PLACEHOLDER
      if (p.startsWith('data:')) return p
      if (p.startsWith('http://') || p.startsWith('https://')) return p
      if (!API_BASE) return p
      const clean = p.startsWith('/') ? p : '/' + p
      return API_BASE + clean
    }

    const onImgError = (ev) => { ev.target.src = IMG_PLACEHOLDER }

    const mapCard = (row) => {
      const orderId = row?.id ?? row?.ordenId ?? row?.orderId ?? null
      const name = row?.customerName && row.customerName.trim() !== '' ? row.customerName : 'Cliente'
      const folio = row?.folio || (orderId ? String(orderId) : 'SIN-FOLIO')
      return {
        id: orderId,
        folio,
        customerName: name,
        nfcType: row?.nfcType || 'Link',
        nfcData: row?.nfcData || '',  // viene del backend (url_general o qr_texto)
        imageA: urlFor(row?.imageA) || IMG_PLACEHOLDER,
        imageB: urlFor(row?.imageB) || IMG_PLACEHOLDER,
        status: 'pending'
      }
    }

    const fetchOperatorOrders = async (estado = 'CRE', limit = 50) => {
      return await get('/api/operator/orders', { params: { estado, limit } })
    }

    const hydrateImagesForCard = async (card) => {
      try {
        if (!card?.id || isNaN(Number(card.id))) return
        const r = await get(`/api/imagenes-b64/by-order/${card.id}`)
        if (r) {
          if (r.ladoA_b64) card.imageA = urlFor(r.ladoA_b64)
          if (r.ladoB_b64) card.imageB = urlFor(r.ladoB_b64)
          if (r.url_general && String(r.url_general).trim() !== '') {
            card.nfcData = String(r.url_general).trim()   // prioriza url_general
          }
        }
      } catch { /* silencioso */ }
    }

    const loadOrders = async () => {
      loading.value = true
      error.value = null
      try {
        const resp = await fetchOperatorOrders('CRE', 50)
        const arr = Array.isArray(resp?.items) ? resp.items : []
        const cards = arr.map(mapCard)
        pendingOrders.value = cards
        await Promise.all(cards.map(hydrateImagesForCard))
      } catch (e) {
        error.value = 'No se pudieron cargar las órdenes.'
      } finally {
        loading.value = false
      }
    }

    const reload = () => loadOrders()

    const logout = () => {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('Cerrando sesión...')
      }
    }

    const selectOrder = async (order) => {
      selectedOrder.value = { ...order }
      currentView.value = 'processing'
      currentStep.value = 1
      await hydrateImagesForCard(selectedOrder.value)
    }

    const backToMenu = () => {
      if (currentStep.value > 1 && !confirm('¿Estás seguro? Se perderá el progreso actual.')) return
      currentView.value = 'menu'
      selectedOrder.value = null
      currentStep.value = 1
    }

    // --- Web NFC: soporte en navegador
    const nfcSupported = ('NDEFReader' in window)

    // Abrir /impresion en nueva pestaña y saltar a Paso 2
    const sendToPrint = async () => {
      if (!selectedOrder.value) return
      printing.value = true

      const d = 35, gap = 6, copies = 1, labels = 1
      const url =
        `/impresion?orderId=${encodeURIComponent(selectedOrder.value.id || '')}` +
        `&folio=${encodeURIComponent(selectedOrder.value.folio || '')}` +
        `&d=${d}&gap=${gap}&copies=${copies}&labels=${labels}`

      window.open(url, '_blank')
      currentStep.value = 2
      updateOrderStatus('printed')
      printing.value = false
    }

    const validateQuality = (isGood) => {
      if (isGood) {
        currentStep.value = 3
        updateOrderStatus('quality_approved')
      } else {
        currentStep.value = 1
        alert('Reiniciando proceso de impresión...')
      }
    }

    // --- Web NFC: escribir link/texto a la etiqueta
    const programNFC = async () => {
      const data = (selectedOrder.value?.nfcData || '').trim()
      if (!data) {
        alert('No hay datos para programar')
        return
      }

      programming.value = true
      try {
        if (!('NDEFReader' in window)) {
          throw new Error('Web NFC no disponible. Usa Chrome en Android y abre el sitio por HTTPS.')
        }

        // Nota de tamaño típico NTAG213 (~144 bytes)
        if (isLikelyUrl(data)) {
          const bytes = new TextEncoder().encode(data).length
          if (bytes > 130) {
            console.warn('La URL podría ser grande para una NTAG213. Considera acortarla.')
          }
        }

        const ndef = new NDEFReader()
        const msg = isLikelyUrl(data)
          ? { records: [{ recordType: 'url', data }] }
          : { records: [{ recordType: 'text', data, lang: 'es' }] }

        await ndef.write(msg) // El navegador pedirá acercar la etiqueta

        currentStep.value = 4
        updateOrderStatus('nfc_programming_ok')
        alert('✓ Etiqueta programada correctamente')
      } catch (e) {
        console.error(e)
        updateOrderStatus('nfc_programming_error')
        alert('No se pudo programar la etiqueta: ' + (e?.message || e))
      } finally {
        programming.value = false
      }
    }

    const validateNFC = (isGood) => {
      if (isGood) {
        currentStep.value = 5
        updateOrderStatus('nfc_programmed')
      } else {
        currentStep.value = 3
        alert('Reprogramando NFC...')
      }
    }

    const finishOrder = () => {
      updateOrderStatus('ready_for_delivery')
      const idx = pendingOrders.value.findIndex(o => (o.id || o.folio) === (selectedOrder.value.id || selectedOrder.value.folio))
      if (idx > -1) pendingOrders.value.splice(idx, 1)
      processingOrders.value.push(selectedOrder.value)
      completedToday.value++
      alert(`✓ Orden ${selectedOrder.value.folio} finalizada y enviada al repartidor`)
      currentView.value = 'menu'
      selectedOrder.value = null
      currentStep.value = 1
    }

    const updateOrderStatus = (status) => {
      console.log(`[operador] actualizar estado ${selectedOrder.value?.folio} -> ${status}`)
      // Persistencia opcional:
      // await post(`/api/operator/orders/${selectedOrder.value.id}/advance`, { to: 'PROC' })
    }

    // Copiar al portapapeles los datos NFC
    const copyNfcData = async () => {
      const text = selectedOrder.value?.nfcData || ''
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        alert('Datos copiados al portapapeles')
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        alert('Datos copiados')
      }
    }

    const isLikelyUrl = (s) => {
      if (!s || typeof s !== 'string') return false
      return /^https?:\/\//i.test(s)
    }

    // Si volvemos de /impresion con ?step=quality&orderId=..., saltamos al Paso 2
    const tryJumpToQuality = () => {
      const step = route.query.step
      const qId = route.query.orderId
      if (step === 'quality' && qId) {
        const hit = pendingOrders.value.find(o => String(o.id ?? o.folio) === String(qId))
        if (hit) {
          selectOrder(hit)
          currentStep.value = 2
          router.replace({ query: {} }) // limpia query
        }
      }
    }

    onMounted(async () => {
      await loadOrders()
      tryJumpToQuality()
    })

    return {
      currentView, currentStep, selectedOrder,
      printing, programming, completedToday,
      pendingOrders, processingOrders, loading, error,
      reload, logout, selectOrder, backToMenu,
      sendToPrint, validateQuality, programNFC, validateNFC, finishOrder,
      onImgError, copyNfcData, isLikelyUrl,
      nfcSupported
    }
  }
}
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }
.operador-container { min-height: 100vh; background: linear-gradient(135deg, #0f1419 0%, #1a1f26 100%); color: #e1e8ed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

/* Header */
.header { background: rgba(20, 25, 30, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(79, 209, 197, 0.2); position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
.header-content { max-width: 1400px; margin: 0 auto; padding: 1.2rem 2rem; display: flex; justify-content: space-between; align-items: center; }
.title { display: flex; align-items: center; gap: 0.8rem; font-size: 1.5rem; font-weight: 700; color: #4fd1c5; }
.title .icon { width: 32px; height: 32px; stroke-width: 2; }
.header-actions { display: flex; gap: 0.6rem; }
.btn-logout, .btn-reload { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
.btn-reload { background: rgba(79, 209, 197, 0.1); border: 1px solid rgba(79, 209, 197, 0.3); color: #4fd1c5; }
.btn-reload:hover { background: rgba(79, 209, 197, 0.2); transform: translateY(-2px); }
.btn-logout { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
.btn-logout:hover { background: rgba(239, 68, 68, 0.2); transform: translateY(-2px); }

/* Main Content */
.main-content { max-width: 1400px; margin: 0 auto; padding: 2rem; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
.stat-card { background: rgba(20, 25, 30, 0.6); border: 1px solid rgba(79, 209, 197, 0.2); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; transition: all 0.3s ease; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(79, 209, 197, 0.15); border-color: rgba(79, 209, 197, 0.4); }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon svg { width: 30px; height: 30px; stroke-width: 2; }
.stat-icon.pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
.stat-icon.processing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.stat-icon.completed { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-info h3 { font-size: 2rem; font-weight: 700; color: #4fd1c5; }
.stat-info p { color: #9ca3af; font-size: 0.9rem; }

/* Orders */
.orders-section { margin-top: 2rem; }
.section-title { font-size: 1.5rem; color: #4fd1c5; margin-bottom: 1.5rem; font-weight: 600; }
.error-state { color: #ef4444; background: rgba(239,68,68,.1); padding: 1rem; border: 1px solid rgba(239,68,68,.3); border-radius: 8px; margin-bottom: 1rem; }
.empty-state { text-align: center; padding: 4rem 2rem; background: rgba(20, 25, 30, 0.4); border-radius: 12px; border: 1px dashed rgba(79, 209, 197, 0.3); }
.empty-state svg { width: 80px; height: 80px; color: #4fd1c5; opacity: 0.5; margin-bottom: 1rem; stroke-width: 1.5; }
.empty-state .spin { animation: spin 1s linear infinite; }
.empty-state p { color: #9ca3af; font-size: 1.1rem; }
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.order-card { background: rgba(20, 25, 30, 0.6); border: 1px solid rgba(79, 209, 197, 0.2); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; }
.order-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(79, 209, 197, 0.2); border-color: rgba(79, 209, 197, 0.5); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.order-number { font-size: 1.2rem; font-weight: 700; color: #4fd1c5; }
.order-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.order-badge.new { background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
.order-images { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem; }
.image-preview { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid rgba(79, 209, 197, 0.2); }
.image-preview img { width: 100%; height: 100%; object-fit: cover; }
.image-label { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.8); padding: 0.4rem; text-align: center; font-size: 0.75rem; color: #4fd1c5; font-weight: 600; }
.order-info { margin: 1rem 0; font-size: 0.9rem; line-height: 1.6; }
.order-info p { color: #9ca3af; }
.order-info strong { color: #e1e8ed; }
.btn-primary { width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); border: none; border-radius: 8px; color: #0f1419; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; font-size: 0.95rem; }
.btn-primary svg { width: 18px; height: 18px; stroke-width: 2.5; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79, 209, 197, 0.3); }

/* Processing */
.processing-view { max-width: 900px; margin: 0 auto; }
.btn-back { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.2rem; background: rgba(79, 209, 197, 0.1); border: 1px solid rgba(79, 209, 197, 0.3); border-radius: 8px; color: #4fd1c5; cursor: pointer; transition: all 0.3s ease; margin-bottom: 2rem; font-size: 0.95rem; font-weight: 500; }
.btn-back svg { width: 18px; height: 18px; stroke-width: 2; }
.btn-back:hover { background: rgba(79, 209, 197, 0.2); transform: translateX(-4px); }
.processing-card { background: rgba(20, 25, 30, 0.6); border: 1px solid rgba(79, 209, 197, 0.2); border-radius: 12px; padding: 2rem; }
.processing-header { text-align: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(79, 209, 197, 0.2); }
.processing-header h2 { font-size: 2rem; color: #4fd1c5; margin-bottom: 0.5rem; }
.customer-name { color: #9ca3af; font-size: 1.1rem; }

/* Steps */
.step-container { margin-bottom: 1.5rem; padding: 1.5rem; background: rgba(15, 20, 25, 0.5); border: 1px solid rgba(79, 209, 197, 0.15); border-radius: 10px; opacity: 0.5; transition: all 0.3s ease; }
.step-container.active { opacity: 1; border-color: rgba(79, 209, 197, 0.5); box-shadow: 0 4px 20px rgba(79, 209, 197, 0.1); }
.step-container.completed { opacity: 0.7; border-color: rgba(34, 197, 94, 0.3); }
.step-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.step-number { width: 40px; height: 40px; border-radius: 50%; background: rgba(79, 209, 197, 0.2); color: #4fd1c5; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
.step-container.completed .step-number { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.step-header h3 { color: #e1e8ed; font-size: 1.1rem; }
.step-content { margin-top: 1.5rem; padding-left: 3rem; }
.step-description { color: #9ca3af; margin-bottom: 1.5rem; font-size: 1rem; }
.images-display { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
.image-full { text-align: center; }
.image-full img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; border: 2px solid rgba(79, 209, 197, 0.3); margin-bottom: 0.8rem; }
.image-title { color: #4fd1c5; font-weight: 600; font-size: 0.95rem; }
.btn-action { width: 100%; padding: 1rem; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); border: none; border-radius: 8px; color: #0f1419; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; transition: all 0.3s ease; font-size: 1rem; }
.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-action:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(79, 209, 197, 0.3); }
.btn-action svg { width: 20px; height: 20px; stroke-width: 2.5; }
.spinner { width: 20px; height: 20px; border: 3px solid rgba(15, 20, 25, 0.3); border-top-color: #0f1419; border-radius: 50%; animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* NFC Data UI */
.nfc-data { margin: 10px 0 16px; }
.nfc-data label { display: block; font-size: .95rem; color: #9ca3af; margin-bottom: 6px; }
.nfc-data-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.nfc-input { width: 100%; padding: .6rem .8rem; border-radius: 8px; border: 1px solid rgba(79, 209, 197, 0.25); background: rgba(20,25,30,.55); color: #e1e8ed; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.btn-copy { padding: .6rem .9rem; border-radius: 8px; border: 1px solid rgba(79, 209, 197, 0.4); background: rgba(79, 209, 197, 0.15); color: #4fd1c5; cursor: pointer; }
.btn-copy:disabled { opacity: .6; cursor: not-allowed; }
.nfc-link { display: inline-block; margin-top: 6px; color: #93f2ff; text-decoration: underline; }
.nfc-warning { margin-top: .6rem; color: #fbbf24; font-size: .9rem; }

/* Responsive */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .orders-grid { grid-template-columns: 1fr; }
  .images-display { grid-template-columns: 1fr; }
  .button-group { grid-template-columns: 1fr; }
  .step-content { padding-left: 1rem; }
}
</style>
