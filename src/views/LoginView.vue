<!-- src/views/LoginView.vue -->
<template>
  <v-row justify="center">
    <v-col cols="12" md="5">
      <v-card class="pa-6" rounded="xl" elevation="8">
        <div class="text-h6 mb-1">Iniciar sesión</div>
        <div class="text-body-2 mb-4">Usa tu correo, teléfono o nickname</div>

        <v-text-field
          v-model="credential"
          label="Credencial"
          variant="outlined"
          :append-inner-icon="existsIcon"
          :color="existsColor"
          :hint="existsHint"
          persistent-hint
          class="mb-3"
        />

        <v-text-field
          v-model="password"
          label="Contraseña"
          :type="showPass ? 'text' : 'password'"
          variant="outlined"
          class="mb-1"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
        />

        <!-- Enlace a Olvidé mi contraseña -->
        <div class="d-flex justify-end mb-2">
          <RouterLink to="/olvido" class="text-caption">¿Olvidaste tu contraseña?</RouterLink>
        </div>

        <v-btn :loading="loading" block class="mt-1" color="primary" @click="doLogin">
          Entrar
        </v-btn>

        <v-divider class="my-6"></v-divider>

        <div class="text-subtitle-2 mb-2">O entrar con cámara</div>
        <v-btn variant="tonal" color="secondary" block @click="openCamera">
          Abrir cámara
        </v-btn>

        <v-dialog v-model="camera.open" persistent max-width="520">
          <v-card>
            <v-card-title class="text-h6">Tomar foto para iniciar sesión</v-card-title>
            <v-card-text>
              <div class="cam-wrap">
                <video ref="videoRef" autoplay playsinline class="cam-video"></video>
                <canvas ref="canvasRef" class="d-none"></canvas>
              </div>

              <v-alert v-if="segmenting" type="info" class="mt-3" density="comfortable">
                Procesando rostro…
              </v-alert>

              <div v-if="camera.snapshot" class="mt-3">
                <img :src="camera.snapshot" class="cam-preview" alt="Snapshot" />
              </div>

              <div class="mt-2 d-flex align-center ga-3">
                <v-switch
                  v-model="useLowThreshold"
                  color="secondary"
                  density="compact"
                  hide-details
                  :label="`Sensibilidad alta (${minPercent}% umbral)`"
                />
                <v-slider
                  v-model="minPercent"
                  min="40"
                  max="80"
                  step="0.5"
                  thumb-label
                  class="flex-grow-1"
                  density="compact"
                  hide-details
                />
              </div>

              <!-- Opción A: NO enviar credential por defecto; aquí puedes activar el filtro si lo deseas -->
              <div class="mt-2">
                <v-switch
                  v-model="useCredForCamera"
                  color="secondary"
                  density="compact"
                  hide-details
                  label="Filtrar por credencial (opcional)"
                />
                <div v-if="useCredForCamera && !(credential || '').trim().length" class="text-caption text-error mt-1">
                  Ingresa una credencial arriba para usar el filtro.
                </div>
              </div>
            </v-card-text>

            <v-card-actions class="justify-space-between">
              <div class="d-flex ga-2">
                <v-btn variant="text" @click="takePhoto" :loading="segmenting">Tomar foto</v-btn>
                <v-btn variant="text" @click="retake" :disabled="!camera.snapshot || segmenting">Repetir</v-btn>
              </div>
              <div class="d-flex ga-2">
                <v-btn variant="text" color="grey" @click="closeCamera" :disabled="segmenting">Cancelar</v-btn>
                <v-btn
                  color="primary"
                  :loading="loadingCam"
                  :disabled="!camera.snapshot || segmenting"
                  @click="doLoginWithCamera"
                >
                  Usar foto y entrar
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-alert v-if="msg" :type="ok ? 'success' : 'error'" class="mt-3" density="comfortable">
          {{ msg }}
        </v-alert>

        <div class="mt-4 text-center">
          ¿No tienes cuenta?
          <v-btn to="/registro" variant="text" color="primary">Regístrate</v-btn>
        </div>

        <!-- Debug -->
        <div class="mt-6">
          <v-switch v-model="showDebug" inset color="secondary" label="Mostrar debug"></v-switch>
          <div v-if="showDebug" class="debug-wrap">
            <pre class="debug-pre">{{ dbg.join('\n') }}</pre>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../lib/api'

const router = useRouter()

/* =========================
   Helper: ruta por roleId
   ========================= */
function routeForRole(roleId: number | null | undefined) {
  if (roleId === 5) return '/operador'
  if (roleId === 2) return '/supervisor'   // 👈 NUEVA regla
  return '/shop'
}

// ====== Constantes de SLA ======
const LOGIN_BUDGET_MS = 12_000
const EXISTS_TIMEOUT_MS = 5_000

// ====== Utilidad de presupuesto de tiempo (para cámara) ======
let loginDeadline = 0
function budgetSignal(deadlineMs: number) {
  const remaining = Math.max(1000, deadlineMs - Date.now())
  const ac = new AbortController()
  const id = window.setTimeout(() => ac.abort(), remaining)
  return { signal: ac.signal, cancel: () => window.clearTimeout(id), remaining }
}

// ====== LOGIN TRADICIONAL ======
const credential = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const msg = ref('')
const ok = ref(false)

async function doLogin() {
  loading.value = true; msg.value = ''; ok.value = false
  try {
    const payload = { credential: credential.value, password: password.value }
    dbgLog('POST /api/auth/login-with-role', payload)

    const ac = new AbortController()
    const timer = window.setTimeout(() => ac.abort(), LOGIN_BUDGET_MS)

    const r = await post('/api/auth/login-with-role', payload, { signal: ac.signal } as any)
    window.clearTimeout(timer)

    dbgLog('login resp', r)
    ok.value = !!r?.success
    msg.value = r?.message || (ok.value ? 'OK' : 'Credenciales inválidas')

    if (ok.value) {
      const uid = r?.id ?? r?.usuarioId ?? r?.userId
      if (uid) {
        localStorage.setItem('userId', String(uid))

        // Guardar roleId si viene
        const rid = r?.roleId ?? r?.rolId ?? r?.RolId
        if (rid !== null && rid !== undefined) {
          localStorage.setItem('roleId', String(rid))
        }

        window.dispatchEvent(new Event('auth-sync'))

        // 👇 Redirección condicional extendida
        const role = rid != null ? Number(rid) : null
        const target = routeForRole(role)
        router.push(target)
        return
      }
      router.push('/shop')
    }
  } catch (e: any) {
    msg.value = e?.name === 'AbortError' ? 'Tiempo excedido (intenta de nuevo)' : (e?.message || 'Error al iniciar sesión')
    dbgLog('login error', { message: e?.message })
  } finally { loading.value = false }
}

// ====== EXISTENCIA ======
const existsHint = ref('')
const existsColor = ref<'success' | 'error' | 'warning' | undefined>(undefined)
const existsIcon = ref<string | undefined>(undefined)

let t: number | undefined
watch(credential, (val) => {
  existsHint.value = ''
  existsColor.value = undefined
  existsIcon.value = undefined
  if (t) window.clearTimeout(t)
  if (!val?.trim()) return
  t = window.setTimeout(checkExists, 500)
})
async function checkExists() {
  const cred = credential.value.trim()
  try {
    const url = `/api/auth/exists?credential=${encodeURIComponent(cred)}`
    dbgLog(`GET ${url}`)

    const ac = new AbortController()
    const timer = window.setTimeout(() => ac.abort(), EXISTS_TIMEOUT_MS)

    const data = await get(url, { signal: ac.signal } as any)
    window.clearTimeout(timer)

    dbgLog('exists resp', data)
    if (data?.exists) {
      existsHint.value = data.active ? 'Usuario encontrado (activo)' : 'Usuario encontrado (inactivo)'
      existsColor.value = data.active ? 'success' : 'warning'
      existsIcon.value = data.active ? 'mdi-account-check' : 'mdi-account-off'
    } else {
      existsHint.value = 'No existe en la base de datos'
      existsColor.value = 'error'
      existsIcon.value = 'mdi-close-circle'
    }
  } catch (e: any) {
    existsHint.value = e?.name === 'AbortError' ? 'Tiempo excedido consultando existencia' : (e?.message || 'Error consultando existencia')
    existsColor.value = 'error'
    existsIcon.value = 'mdi-alert'
    dbgLog('exists error', { message: e?.message })
  }
}

// ====== LOGIN CON CÁMARA ======
const loadingCam = ref(false)
const segmenting = ref(false)
type Camera = { open: boolean; stream: MediaStream | null; snapshot: string }
const camera = ref<Camera>({ open: false, stream: null, snapshot: '' })
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const minPercent = ref(55)
const useLowThreshold = ref(true)
const useCredForCamera = ref(false)

type FacialTag = 'normal' | 'segmentado' | 'segmentado-low-th'
interface AttemptFacialOptions {
  useCredential?: boolean
  credential?: string
  endpoint?: string
}

async function openCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('El navegador no soporta cámara')
    camera.value.open = true
    camera.value.snapshot = ''
    segmenting.value = false
    camera.value.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    if (videoRef.value) videoRef.value.srcObject = camera.value.stream
    dbgLog('camera opened')
  } catch (e: any) {
    msg.value = e?.message || 'No se pudo abrir la cámara'
    ok.value = false
    dbgLog('camera open error', { message: e?.message })
  }
}
function stopCamera() {
  camera.value.stream?.getTracks().forEach(t => t.stop())
  camera.value.stream = null
  dbgLog('camera stopped')
}
function closeCamera() {
  stopCamera()
  camera.value.open = false
  camera.value.snapshot = ''
  segmenting.value = false
}
function retake() { camera.value.snapshot = '' }

async function takePhoto() {
  const v = videoRef.value, c = canvasRef.value
  if (!v || !c) return
  c.width = v.videoWidth || 640
  c.height = v.videoHeight || 480
  const ctx = c.getContext('2d'); if (!ctx) return
  ctx.drawImage(v, 0, 0, c.width, c.height)
  let snap = c.toDataURL('image/jpeg', 0.85)
  snap = await compressIfLarge(snap, 1_800_000)
  camera.value.snapshot = snap
  dbgLog('snapshot taken', approximateInfoFromDataUrl(snap))
}

async function doLoginWithCamera() {
  if (!camera.value.snapshot) { msg.value = 'Primero toma una foto'; ok.value = false; return }
  loadingCam.value = true; msg.value = ''; ok.value = false

  loginDeadline = Date.now() + LOGIN_BUDGET_MS

  try {
    const firstThreshold = useLowThreshold.value ? minPercent.value : 60

    // 1) intento
    const first = await attemptFacial(
      camera.value.snapshot,
      firstThreshold,
      'normal',
      { useCredential: useCredForCamera.value, credential: credential.value }
    )
    if (first.ok) { afterSuccess(first); return }

    // 2) reintento segmentado
    if (isProviderNoResult(first) || (first.message || '').toLowerCase().includes('rostro')) {
      if (Date.now() >= loginDeadline) { showFail({ message: 'Tiempo excedido' }); return }
      dbgLog('POST /api/util/segmentar-rostro (retry)')
      const b1 = budgetSignal(loginDeadline)
      const seg = await post('/api/util/segmentar-rostro', { photoBase64: camera.value.snapshot }, { signal: b1.signal } as any)
      b1.cancel()
      segmenting.value = false

      dbgLog('segment retry resp', { ok: seg?.ok, seg: seg?.segmentado, len: seg?.dataUrl?.length })
      if (seg?.ok && seg?.segmentado && seg?.dataUrl) {
        const normalized = await toJpegWithMinSide(seg.dataUrl, 360, 0.92)
        camera.value.snapshot = normalized
        dbgLog('segment normalized', approximateInfoFromDataUrl(normalized))

        if (Date.now() >= loginDeadline) { showFail({ message: 'Tiempo excedido' }); return }
        const second = await attemptFacial(
          camera.value.snapshot,
          firstThreshold,
          'segmentado',
          { useCredential: useCredForCamera.value, credential: credential.value }
        )
        if (second.ok) { afterSuccess(second); return }

        // 3) último intento bajando umbral
        const lowered = Math.max(40, firstThreshold - 5)
        dbgLog('third attempt with lowered threshold', { lowered, firstThreshold })
        if (lowered < firstThreshold && Date.now() < loginDeadline) {
          const third = await attemptFacial(
            camera.value.snapshot,
            lowered,
            'segmentado-low-th',
            { useCredential: useCredForCamera.value, credential: credential.value }
          )
          if (third.ok) { afterSuccess(third); return }
          showFail(third); return
        }
        showFail(second); return
      }
    }
    showFail(first)
  } catch (e: any) {
    ok.value = false
    msg.value = e?.name === 'AbortError' ? 'Tiempo excedido (intenta de nuevo)' : (e?.message || 'Error al iniciar con cámara')
    dbgLog('login facial fast error', { message: e?.message })
  } finally {
    loadingCam.value = false
  }
}

// ===== attemptFacial =====
async function attemptFacial(
  dataUrl: string,
  minPercent: number,
  tag: FacialTag = 'normal',
  options: AttemptFacialOptions = {}
) {
  const {
    useCredential = false,
    credential: credVal = '',
    endpoint = '/api/auth/login-facial-fast'
  } = options

  const payload: any = { photoBase64: dataUrl, minPercent }
  if (useCredential && credVal?.trim()) payload.credential = credVal.trim()

  const b = budgetSignal(loginDeadline)
  dbgLog(`POST ${endpoint}`, {
    tag,
    hasCred: !!payload.credential,
    minPercent: payload.minPercent,
    bytes: (payload.photoBase64 || '').length,
    remainingMs: b.remaining
  })

  const r = await post(endpoint, payload, { signal: b.signal } as any)
  b.cancel()

  dbgLog('login facial fast resp', { tag, ...r })
  return { ok: !!(r?.success && r?.matched), message: r?.message, raw: r }
}

function isProviderNoResult(res: { message?: string }) {
  const m = (res.message || '').toLowerCase()
  return m.includes('proveedor sin resultado') || m.includes('no face') || m.includes('no se detectó')
}

function afterSuccess(res: any) {
  ok.value = true
  const r = res.raw || {}
  const percentText = typeof r.percent === 'number' ? r.percent.toFixed(1) + '%' : (r.percent ?? '—')
  msg.value = `OK. Usuario=${r.userId ?? r.usuarioId ?? r.id ?? 'N/A'} (${r.email || r.nickname || 's/n'}) score=${r.score ?? '—'} (${percentText})`

  const uid = r?.userId ?? r?.usuarioId ?? r?.id
  if (uid) {
    localStorage.setItem('userId', String(uid))

    ;(async () => {
      let rid = r?.roleId ?? r?.rolId ?? r?.RolId
      if (rid == null) {
        try {
          const got = await get<{ userId:number; rolId:number }>(`/api/users/${uid}/role`)
          if (got && got.rolId != null) rid = got.rolId
        } catch { /* silencioso */ }
      }
      if (rid != null) localStorage.setItem('roleId', String(rid))
      window.dispatchEvent(new Event('auth-sync'))

      // 👇 Redirección condicional extendida (incluye supervisor)
      const role = rid != null ? Number(rid) : null
      const target = routeForRole(role)
      closeCamera()
      router.push(target)
    })()
    return
  }

  closeCamera()
  router.push('/shop')
}

function showFail(res: any) {
  ok.value = false
  msg.value = res?.message || 'No hubo coincidencia'
}

// ===== util =====
const showDebug = ref(false)
const dbg = ref<string[]>([])
function dbgLog(line: string, extra?: any) {
  const stamp = new Date().toISOString()
  const text = extra !== undefined ? `${line} → ${JSON.stringify(extra).slice(0, 400)}${JSON.stringify(extra).length > 400 ? '…' : ''}` : line
  dbg.value.push(`[${stamp}] ${text}`)
  if (dbg.value.length > 200) dbg.value.shift()
  if (extra !== undefined) console.debug(line, extra); else console.debug(line)
}

function approximateInfoFromDataUrl(d: string) {
  try {
    const head = d.split(',', 2)[0] || ''
    const mime = head.slice(5, head.indexOf(';')) || 'data'
    return { bytes: d.length, mime }
  } catch { return { bytes: d.length } }
}

async function compressIfLarge(dataUrl: string, maxLen = 1_800_000) {
  if (!dataUrl || dataUrl.length <= maxLen) return dataUrl
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      let q = 0.85; let out = canvas.toDataURL('image/jpeg', q)
      while (out.length > maxLen && q > 0.4) {
        q -= 0.1
        out = canvas.toDataURL('image/jpeg', q)
      }
      resolve(out)
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function toJpegWithMinSide(dataUrl: string, minSide = 360, quality = 0.92) {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const w0 = img.naturalWidth || 1
      const h0 = img.naturalHeight || 1
      const sideMin = Math.min(w0, h0)
      const scale = sideMin < minSide ? (minSide / sideMin) : 1
      const w = Math.round(w0 * scale)
      const h = Math.round(h0 * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      const out = canvas.toDataURL('image/jpeg', quality)
      resolve(out)
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

onUnmounted(() => { stopCamera() })
</script>

<style scoped>
.cam-wrap { position: relative; }
.cam-video { width: 100%; border-radius: 12px; background: #000; }
.cam-preview { width: 100%; border-radius: 12px; }
.debug-wrap { border: 1px dashed #cbd5e0; border-radius: 12px; padding: 8px; background: #fafafa; max-height: 220px; overflow: auto; }
.debug-pre { margin: 0; font-size: 12px; white-space: pre-wrap; line-height: 1.25; }
</style>
