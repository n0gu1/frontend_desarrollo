<template>
  <v-container class="py-6" v-if="ready">
    <v-row>
      <!-- Col izquierda: Datos de entrega -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" class="mb-4">
          <v-card-title class="text-subtitle-1 font-weight-medium">Datos de entrega</v-card-title>
          <v-card-text>
            <v-select
              label="Área de entrega"
              :items="areas"
              item-title="nombre"
              item-value="id"
              v-model="form.areaId"
              @update:modelValue="loadPuntos"
              :loading="loadingAreas"
              :disabled="loadingAreas"
            />
            <v-select
              label="Punto de entrega"
              :items="puntos"
              item-title="nombre"
              item-value="id"
              v-model="form.puntoEntregaId"
              :loading="loadingPuntos"
              :disabled="!form.areaId || loadingPuntos"
            />
            <v-text-field label="Contacto (nombre)" v-model="form.contactoNombre" />
            <v-text-field label="Teléfono" v-model="form.telefono" />
            <v-textarea label="Descripción / Referencias" v-model="form.descripcion" rows="3" />
            <v-radio-group v-model="form.metodoPago" inline>
              <v-radio label="Efectivo" value="efectivo" />
              <v-radio label="Tarjeta" value="tarjeta" />
            </v-radio-group>
          </v-card-text>
        </v-card>

        <v-btn color="primary" :loading="submitting" @click="submitCheckout" :disabled="!canSubmit">
          Confirmar y crear orden(es)
        </v-btn>
      </v-col>

      <!-- Col derecha: Resumen del carrito -->
      <v-col cols="12" md="6">
        <v-card rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-medium">Resumen del carrito</v-card-title>
          <v-divider />
          <v-list density="comfortable">
            <v-list-item v-for="it in items" :key="it.id">
              <v-list-item-title class="d-flex justify-space-between">
                <span>#{{ it.producto_id }} — {{ it.nombre }}</span>
                <span>x{{ it.cantidad }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="d-flex justify-space-between">
                <span>Q {{ it.precio_unitario.toFixed(2) }}</span>
                <span>Subtotal: Q {{ (it.cantidad * it.precio_unitario).toFixed(2) }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-divider />
          <div class="d-flex justify-end pa-4 text-h6">
            Total: <span class="ml-2">Q {{ total.toFixed(2) }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Resultado -->
    <v-dialog v-model="showResult" max-width="640">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-medium">Orden(es) creada(s)</v-card-title>
        <v-card-text>
          <p>Se generaron {{ result?.itemsProcesados }} orden(es):</p>
          <ul class="pl-6">
            <li v-for="o in result?.ordenes" :key="o.ordenId">
              Folio <b>{{ o.folio }}</b> — Total Q {{ o.total.toFixed(2) }}
            </li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="goThanks">Aceptar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo para capturar correo si falta -->
    <v-dialog v-model="showEmailDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-medium">Tu correo para enviar la constancia</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="emailInput"
            label="Correo electrónico"
            :error="emailError !== ''"
            :error-messages="emailError"
            placeholder="tucorreo@ejemplo.com"
            @keyup.enter="confirmEmail"
            autofocus
          />
          <v-text-field
            v-model="nicknameInput"
            label="Tu nombre/apodo"
            placeholder="Opcional"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelEmail">Cancelar</v-btn>
          <v-btn color="primary" @click="confirmEmail">Guardar y continuar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>

  <v-container v-else class="py-10 text-center">
    <v-progress-circular indeterminate />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../lib/api'

type Area  = { id:number; nombre:string }
type Punto = { id:number; nombre:string }
type Item  = { id:number; producto_id:number; nombre:string; cantidad:number; precio_unitario:number; subtotal:number }
type PreviewResp = { items: Item[]; total: number }
type CheckoutResp = {
  scope: 'local'|'default'
  usuarioId: number
  itemsProcesados: number
  ordenes: { ordenId:number; folio:string; total:number; entregaId?:number|null }[]
}

const router = useRouter()

// Estado de usuario y correo
const userId        = ref<number>(Number(localStorage.getItem('userId') || '0'))
const userEmail     = ref<string>(localStorage.getItem('userEmail') || '')
const userNickname  = ref<string>(localStorage.getItem('userNickname') || 'cliente')

// Diálogo de email si falta
const showEmailDialog = ref(false)
const emailInput      = ref(userEmail.value || '')
const nicknameInput   = ref(userNickname.value || '')
const emailError      = ref('')

const ready  = ref(false)
const items = ref<Item[]>([])
const total = computed(() => items.value.reduce((acc, it) => acc + (it.cantidad * it.precio_unitario), 0))

const areas = ref<Area[]>([])
const puntos = ref<Punto[]>([])
const loadingAreas  = ref(false)
const loadingPuntos = ref(false)

const form = ref({
  areaId: null as number | null,
  puntoEntregaId: null as number | null,
  contactoNombre: '',
  telefono: '',
  descripcion: '',
  metodoPago: 'efectivo'
})

const submitting = ref(false)
const showResult = ref(false)
const result = ref<CheckoutResp | null>(null)
const canSubmit = computed(() =>
  userId.value > 0 && items.value.length > 0 &&
  !!form.value.areaId && !!form.value.puntoEntregaId &&
  !!form.value.metodoPago
)

/* ================== utils ================== */
function isValidEmail(s: string): boolean {
  // validación simple/rápida
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}
function ensureEmail(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (userEmail.value && isValidEmail(userEmail.value)) {
      console.log('[receipt-email] usando correo de localStorage:', userEmail.value)
      return resolve()
    }
    // Pedirlo en diálogo
    emailInput.value = userEmail.value || ''
    nicknameInput.value = userNickname.value || ''
    emailError.value = ''
    showEmailDialog.value = true

    // Esperar a que el usuario confirme/cancele
    const check = setInterval(() => {
      if (!showEmailDialog.value) {
        clearInterval(check)
        if (userEmail.value && isValidEmail(userEmail.value)) resolve()
        else reject(new Error('Correo no proporcionado'))
      }
    }, 100)
  })
}
function confirmEmail() {
  const e = (emailInput.value || '').trim()
  if (!isValidEmail(e)) {
    emailError.value = 'Ingresa un correo válido'
    return
  }
  emailError.value = ''
  userEmail.value = e
  localStorage.setItem('userEmail', e)

  const nn = (nicknameInput.value || '').trim()
  if (nn) {
    userNickname.value = nn
    localStorage.setItem('userNickname', nn)
  }
  console.log('[receipt-email] correo/nickname guardados:', userEmail.value, userNickname.value)
  showEmailDialog.value = false
}
function cancelEmail() {
  emailError.value = ''
  showEmailDialog.value = false
}

/* ================== cargas ================== */
async function loadAreas() {
  loadingAreas.value = true
  try {
    areas.value = await get('/api/Local/areas')
  } catch (e) {
    console.error('Error cargando áreas:', e)
    areas.value = []
    alert('No se pudieron cargar las áreas de entrega (falta endpoint en API).')
  } finally {
    loadingAreas.value = false
  }
}

async function loadPuntos() {
  puntos.value = []
  if (!form.value.areaId) return
  loadingPuntos.value = true
  try {
    const q = encodeURIComponent(String(form.value.areaId))
    puntos.value = await get(`/api/Local/puntos?areaId=${q}`)
  } catch (e) {
    console.error('Error cargando puntos:', e)
    puntos.value = []
    alert('No se pudieron cargar los puntos de entrega (falta endpoint en API).')
  } finally {
    loadingPuntos.value = false
  }
}

async function loadPreview() {
  try {
    const q = encodeURIComponent(String(userId.value))
    const r: PreviewResp = await get(`/api/Local/cart?usuarioId=${q}`)
    items.value = r?.items || []
  } catch (e) {
    console.error('Error cargando preview del carrito:', e)
    items.value = []
    alert('No se pudo cargar el resumen del carrito.')
  }
}

/* ================== submit ================== */
async function submitCheckout() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      usuarioId: userId.value,
      metodoPago: form.value.metodoPago,
      direccion: {
        descripcion: form.value.descripcion || null,
        contactoNombre: form.value.contactoNombre || null,
        telefono: form.value.telefono || null,
        areaId: form.value.areaId,
        puntoEntregaId: form.value.puntoEntregaId
      }
    }

    // 1) Crear orden(es)
    const r: CheckoutResp = await post('/api/local/checkout', payload)
    result.value = r
    showResult.value = true
    console.log('[checkout] ok', r)

    // 2) Primer folio
    const folio = r?.ordenes?.[0]?.folio
    console.log('[checkout] folio', folio)

    // 3) Antes de enviar constancia, garantizar correo
    await ensureEmail()

    // 4) Enviar constancia por correo (PDF con QR)
    if (folio) {
      const itemsForReceipt = items.value.map(it => ({
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario
      }))

      try {
        const resp = await post('/api/orders/receipt-email', {
          email: userEmail.value,
          nickname: userNickname.value || 'cliente',
          folio,
          total: total.value,
          items: itemsForReceipt
        })
        console.log('[receipt-email] ok', resp)
      } catch (mailErr:any) {
        console.error('[receipt-email] fail', mailErr)
        alert('No se pudo enviar la constancia por correo. Revisa la consola para más detalles.')
      }

      // 5) Redirigir a tracking
      showResult.value = false
      router.push(`/tracking/${folio}`)
    }
  } catch (e:any) {
    console.error('[checkout] fail', e)
    alert('No se pudo completar el checkout.')
  } finally {
    submitting.value = false
  }
}

function goThanks() {
  showResult.value = false
  router.push('/shop')
}

/* ================== mounted ================== */
onMounted(async () => {
  if (!userId.value) {
    router.push('/login')
    return
  }
  try {
    await Promise.all([loadAreas(), loadPreview()])
  } catch (err) {
    console.error('Error inicial en checkout:', err)
  } finally {
    ready.value = true
  }
})
</script>
