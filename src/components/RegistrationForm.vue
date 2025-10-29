<template>
  <v-card class="pa-8 registration-card" elevation="12" rounded="xl" variant="flat">
    <div class="text-center mb-6">
      <h1 class="title">¡Únete a nosotros!</h1>
      <p class="subtitle">Crea tu cuenta y comienza tu experiencia</p>
    </div>

    <v-form @submit.prevent="onSubmit">
      <div class="text-center mb-5">
        <div
          ref="stageRef"
          class="photo-stage mx-auto"
          :class="{ clickable: !basePhotoUrl }"
          @click="!basePhotoUrl && triggerFile()"
        >
          <template v-if="basePhotoUrl">
            <img
              :src="basePhotoUrl"
              alt="Foto de perfil"
              class="stage-photo"
              :style="{ filter: cssFilter }"
              @load="onBaseLoaded"
            />

            <div
              v-for="s in stickers"
              :key="s.id"
              class="sticker"
              :class="{ active: s.id === activeStickerId }"
              :style="stickerStyle(s)"
              @mousedown.prevent="startDrag($event, s.id)"
              @touchstart.prevent="startDrag($event, s.id)"
              @click.stop="activeStickerId = s.id"
            >
              <template v-if="s.type === 'emoji'">
                {{ s.char }}
              </template>
              <template v-else>
                <img
                  :src="s.src"
                  :alt="s.name"
                  class="sticker-img"
                  :style="{ transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }"
                  draggable="false"
                />
              </template>
            </div>

            <div class="stage-toolbar">
              <v-btn size="small" variant="tonal" @click.stop="openStickerDialog">Stickers</v-btn>
              <v-btn size="small" variant="tonal" @click.stop="showFilters = !showFilters">
                {{ showFilters ? 'Ocultar filtros' : 'Filtros' }}
              </v-btn>
              <v-btn size="small" variant="tonal" @click.stop="triggerFile">Cambiar foto</v-btn>
              <v-btn size="small" variant="tonal" @click.stop="openCamera">Usar cámara</v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="error"
                @click.stop="clearEdits"
                :disabled="!stickers.length && filterKind==='none' && filterLevel===50"
              >Limpiar</v-btn>
            </div>
          </template>

          <template v-else>
            <div class="photo-empty">
              <div class="photo-text">📷<br />Agregar foto</div>
            </div>
          </template>
        </div>

        <input ref="fileRef" type="file" accept="image/*" capture="environment" class="d-none" @change="onFileChange" />
      </div>

      <v-expand-transition>
        <div v-if="basePhotoUrl && showFilters" class="editor-wrap mb-6">
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Filtro</div>
            <div class="d-flex ga-2 flex-wrap">
              <v-chip
                v-for="opt in filterOptions"
                :key="opt.value"
                :color="filterKind === opt.value ? 'primary' : undefined"
                variant="tonal"
                @click="filterKind = opt.value"
              >
                {{ opt.label }}
              </v-chip>
            </div>
            <div class="d-flex align-center ga-4 mt-2">
              <span class="text-caption" style="width:70px">Intensidad</span>
              <v-slider
                v-model="filterLevel"
                min="0"
                max="100"
                step="1"
                class="flex-grow-1"
                density="compact"
                hide-details
              />
              <span class="text-caption" style="width:40px">{{ filterLevel }}</span>
            </div>
          </div>

          <div v-if="activeSticker" class="mt-3">
            <div class="text-subtitle-2 mb-2">Sticker seleccionado</div>
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-chip color="secondary" variant="tonal">{{ activeSticker.name || activeSticker.char }}</v-chip>
              <v-btn size="small" variant="tonal" @click="nudge('left')">←</v-btn>
              <v-btn size="small" variant="tonal" @click="nudge('up')">↑</v-btn>
              <v-btn size="small" variant="tonal" @click="nudge('right')">→</v-btn>
              <v-btn size="small" variant="tonal" @click="nudge('down')">↓</v-btn>
              <v-btn size="small" variant="tonal" @click="resizeSticker(1.1)">Aumentar</v-btn>
              <v-btn size="small" variant="tonal" @click="resizeSticker(0.9)">Reducir</v-btn>
              <v-btn size="small" variant="tonal" @click="rotateSticker(15)">Rotar +15°</v-btn>
              <v-btn size="small" variant="tonal" @click="rotateSticker(-15)">Rotar -15°</v-btn>
              <v-spacer />
              <v-btn size="small" variant="tonal" color="error" @click="removeActive">Quitar</v-btn>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-subtitle-2 mb-2">Stickers rápidos (emoji)</div>
            <div class="d-flex ga-2 flex-wrap">
              <v-btn
                v-for="emo in stickerEmojiPalette"
                :key="emo"
                size="small"
                variant="tonal"
                @click="addEmoji(emo)"
                :title="`Agregar ${emo}`"
              >
                {{ emo }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-expand-transition>

      <v-text-field
        v-model="form.email"
        label="Correo electrónico *"
        type="email"
        variant="outlined"
        density="comfortable"
        :error-messages="emailErrors"
        :hint="emailHint"
        persistent-hint
        class="mb-4"
        @blur="touch.email = true"
      />

      <v-text-field
        v-model="form.phone"
        label="Número de teléfono *"
        placeholder="+502 1234 5678"
        variant="outlined"
        density="comfortable"
        :error-messages="phoneErrors"
        :hint="phoneHint"
        persistent-hint
        class="mb-4"
        @update:model-value="sanitizePhone"
        @blur="touch.phone = true"
      />

      <v-text-field
        v-model="form.birthdate"
        label="Fecha de nacimiento *"
        type="date"
        variant="outlined"
        density="comfortable"
        :error-messages="birthErrors"
        class="mb-6"
        @blur="touch.birthdate = true"
      />

      <v-text-field
        v-model="form.nickname"
        label="Nickname *"
        placeholder="usuario_123"
        variant="outlined"
        density="comfortable"
        :error-messages="nickErrors"
        :hint="nickHint"
        persistent-hint
        class="mb-4"
        @update:model-value="sanitizeNickname"
        @blur="touch.nickname = true"
      />

      <v-text-field
        v-model="form.password"
        label="Contraseña *"
        type="password"
        variant="outlined"
        density="comfortable"
        :error-messages="passErrors"
        class="mb-2"
        @blur="touch.password = true"
      />
      <div class="d-flex align-center mb-4">
        <v-progress-linear
          class="flex-grow-1 mr-3"
          :model-value="passwordStrength.value"
          height="6"
          rounded
          :color="passwordStrength.color"
        />
        <span class="text-caption" :class="`text-${passwordStrength.color}`">{{ passwordStrength.label }}</span>
      </div>

      <v-text-field
        v-model="form.confirm"
        label="Confirmar contraseña *"
        type="password"
        variant="outlined"
        density="comfortable"
        :error-messages="confirmErrors"
        class="mb-6"
        @blur="touch.confirm = true"
      />

      <div class="mb-2 font-weight-medium">Preferencias de notificaciones *</div>
      <div class="radio-group mb-1">
        <v-sheet
          v-for="opt in notifOptions"
          :key="opt.value"
          class="radio-item"
          :class="{ selected: form.notifications.includes(opt.value) }"
          rounded="lg"
          border
          @click="toggleNotif(opt.value)"
        >
          <v-checkbox
            :model-value="form.notifications.includes(opt.value)"
            :label="opt.label"
            hide-details
            density="compact"
            color="primary"
            @click.stop="toggleNotif(opt.value)"
          />
        </v-sheet>
      </div>
      <div v-if="notifErrors.length" class="text-error text-caption mb-4">{{ notifErrors[0] }}</div>

      <v-alert v-if="errorMsg" type="error" class="mb-4" density="compact">{{ errorMsg }}</v-alert>

      <v-btn class="gradient-btn" size="large" block :disabled="!formValid || submitting" type="submit">
        <template v-if="submitting">
          <v-progress-circular indeterminate size="20" class="mr-2" />
          Creando cuenta...
        </template>
        <template v-else>Crear cuenta</template>
      </v-btn>
      <div class="mt-4 text-center">
        ¿Ya tienes cuenta?
        <v-btn to="/login" variant="text" color="primary">Inicia sesión</v-btn>
      </div>
    </v-form>

    <v-dialog v-model="camera.open" persistent max-width="520">
      <v-card>
        <v-card-title class="text-h6">Tomar foto</v-card-title>

        <v-card-text>
          <div class="cam-stage" ref="camStageRef">
            <video
              ref="videoRef"
              autoplay
              playsinline
              class="cam-video"
              :style="{ filter: cssFilter }"
            ></video>

            <div
              v-for="s in stickers"
              :key="s.id"
              class="sticker"
              :class="{ active: s.id === activeStickerId }"
              :style="stickerStyle(s)"
              @mousedown.prevent="startDrag($event, s.id)"
              @touchstart.prevent="startDrag($event, s.id)"
              @click.stop="activeStickerId = s.id"
            >
              <template v-if="s.type === 'emoji'">
                {{ s.char }}
              </template>
              <template v-else>
                <img
                  :src="s.src"
                  :alt="s.name"
                  class="sticker-img"
                  :style="{ transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }"
                  draggable="false"
                />
              </template>
            </div>

            <div class="stage-toolbar cam-toolbar">
              <v-btn size="small" variant="tonal" @click.stop="openStickerDialog">Stickers</v-btn>
              <v-btn size="small" variant="tonal" @click.stop="showFiltersCam = !showFiltersCam">
                {{ showFiltersCam ? 'Ocultar filtros' : 'Filtros' }}
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="error"
                @click.stop="clearEdits"
                :disabled="!stickers.length && filterKind==='none' && filterLevel===50"
              >Limpiar</v-btn>
            </div>
          </div>

          <canvas ref="canvasRef" class="d-none"></canvas>

          <div v-if="camera.snapshot" class="mt-3">
            <img :src="camera.snapshot" class="cam-preview" alt="Snapshot" />
          </div>

          <v-expand-transition>
            <div v-if="showFiltersCam" class="editor-wrap mt-3">
              <div class="mb-2">
                <div class="text-subtitle-2 mb-2">Filtro (en vivo)</div>
                <div class="d-flex ga-2 flex-wrap">
                  <v-chip
                    v-for="opt in filterOptions"
                    :key="opt.value"
                    :color="filterKind === opt.value ? 'primary' : undefined"
                    variant="tonal"
                    @click="filterKind = opt.value"
                  >
                    {{ opt.label }}
                  </v-chip>
                </div>
                <div class="d-flex align-center ga-4 mt-2">
                  <span class="text-caption" style="width:70px">Intensidad</span>
                  <v-slider
                    v-model="filterLevel"
                    min="0"
                    max="100"
                    step="1"
                    class="flex-grow-1"
                    density="compact"
                    hide-details
                  />
                  <span class="text-caption" style="width:40px">{{ filterLevel }}</span>
                </div>
              </div>

              <div v-if="activeSticker" class="mt-2">
                <div class="text-subtitle-2 mb-2">Sticker seleccionado</div>
                <div class="d-flex align-center ga-2 flex-wrap">
                  <v-chip color="secondary" variant="tonal">{{ activeSticker.name || activeSticker.char }}</v-chip>
                  <v-btn size="small" variant="tonal" @click="nudge('left')">←</v-btn>
                  <v-btn size="small" variant="tonal" @click="nudge('up')">↑</v-btn>
                  <v-btn size="small" variant="tonal" @click="nudge('right')">→</v-btn>
                  <v-btn size="small" variant="tonal" @click="nudge('down')">↓</v-btn>
                  <v-btn size="small" variant="tonal" @click="resizeSticker(1.1)">Aumentar</v-btn>
                  <v-btn size="small" variant="tonal" @click="resizeSticker(0.9)">Reducir</v-btn>
                  <v-btn size="small" variant="tonal" @click="rotateSticker(15)">Rotar +15°</v-btn>
                  <v-btn size="small" variant="tonal" @click="rotateSticker(-15)">Rotar -15°</v-btn>
                  <v-spacer />
                  <v-btn size="small" variant="tonal" color="error" @click="removeActive">Quitar</v-btn>
                </div>
              </div>

              <div class="mt-3">
                <div class="text-subtitle-2 mb-2">Stickers rápidos (emoji)</div>
                <div class="d-flex ga-2 flex-wrap">
                  <v-btn
                    v-for="emo in stickerEmojiPalette"
                    :key="emo"
                    size="small"
                    variant="tonal"
                    @click="addEmoji(emo)"
                    :title="`Agregar ${emo}`"
                  >
                    {{ emo }}
                  </v-btn>
                </div>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>

        <v-card-actions class="justify-space-between">
          <v-btn @click="takePhoto" color="primary" variant="flat">Capturar</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="closeCamera">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!camera.snapshot" @click="useSnapshot">Usar foto</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="stickersDialog" max-width="720">
      <v-card>
        <v-card-title class="text-h6">Elige un sticker</v-card-title>
        <v-card-text>
          <div class="sticker-grid">
            <div
              v-for="item in stickerCatalog"
              :key="item.id"
              class="sticker-card"
              @click="addImageSticker(item)"
            >
              <img :src="item.src" :alt="item.name" />
              <div class="sticker-name">{{ item.name }}</div>
            </div>
          </div>
          <div class="text-caption mt-2">Tip: después de agregar, puedes arrastrarlo, rotarlo y cambiar tamaño.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="stickersDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" color="success" timeout="2500">¡Cuenta creada exitosamente!</v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onUnmounted, onMounted } from 'vue'
import { post } from '../lib/api'

type Form = {
  email: string; phone: string; birthdate: string; nickname: string; password: string; confirm: string;
  notifications: Array<'email' | 'whatsapp'>
}
type Touch = Record<keyof Omit<Form, 'notifications'>, boolean> & { notifications: boolean }
type Camera = { open: boolean; stream: MediaStream | null; snapshot: string }

const fileRef   = ref<HTMLInputElement | null>(null)
const basePhotoUrl = ref<string>('')      
const naturalSize = reactive({ w: 0, h: 0 }) 

const camera   = reactive<Camera>({ open: false, stream: null, snapshot: '' })
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef= ref<HTMLCanvasElement | null>(null)
const camStageRef = ref<HTMLElement | null>(null)

const form = reactive<Form>({ email: '', phone: '', birthdate: '', nickname: '', password: '', confirm: '', notifications: [] })
const touch = reactive<Touch>({ email: false, phone: false, birthdate: false, nickname: false, password: false, confirm: false, notifications: false })
const submitting = ref(false); const snack = ref(false); const errorMsg = ref('')

const serverErrors = reactive<{ email?: string; phone?: string; nickname?: string }>({})
const notifOptions = [{ value: 'email' as const, label: '📧 Correo electrónico' }, { value: 'whatsapp' as const, label: '💬 WhatsApp' }]

async function triggerFile() { try { await startCamera() } catch { fileRef.value?.click() } }

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-support')
  camera.open = true; camera.snapshot = ''
  camera.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
  if (videoRef.value) videoRef.value.srcObject = camera.stream
}

async function openCamera() {
  try { await startCamera() }
  catch { fileRef.value?.click() }
}

function stopCamera() { camera.stream?.getTracks().forEach(t => t.stop()); camera.stream = null }
function closeCamera() { stopCamera(); camera.open = false; camera.snapshot = '' }
function takePhoto() {
  const v = videoRef.value, c = canvasRef.value; if (!v || !c) return
  c.width = v.videoWidth; c.height = v.videoHeight; const ctx = c.getContext('2d'); if (!ctx) return
  ctx.drawImage(v, 0, 0, c.width, c.height)
  camera.snapshot = c.toDataURL('image/jpeg', 0.9)
}
function useSnapshot() {
  if (!camera.snapshot) return
  setBasePhoto(camera.snapshot) 
  closeCamera()
}
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
  if (basePhotoUrl.value.startsWith('blob:')) URL.revokeObjectURL(basePhotoUrl.value)
  setBasePhoto(URL.createObjectURL(f)) 
}
onUnmounted(() => { stopCamera(); if (basePhotoUrl.value.startsWith('blob:')) URL.revokeObjectURL(basePhotoUrl.value) })
function onBaseLoaded(ev: Event) {
  const img = ev.target as HTMLImageElement
  naturalSize.w = img.naturalWidth; naturalSize.h = img.naturalHeight
}

const stageRef = ref<HTMLElement | null>(null)
const showFilters = ref(true)
const showFiltersCam = ref(false)

type FilterKind = 'none'|'bn'|'sepia'|'warm'|'cool'|'bright'|'contrast'
const filterKind  = ref<FilterKind>('none')
const filterLevel = ref<number>(50) // 0..100
const filterOptions = [
  { value: 'none',    label: 'Ninguno' },
  { value: 'bn',      label: 'B/N' },
  { value: 'sepia',   label: 'Sepia' },
  { value: 'warm',    label: 'Cálido' },
  { value: 'cool',    label: 'Frío' },
  { value: 'bright',  label: 'Brillo' },
  { value: 'contrast',label: 'Contraste' },
] as const

const cssFilter = computed(() => buildFilterCss(filterKind.value, filterLevel.value))
function buildFilterCss(kind: FilterKind, lvl: number) {
  const t = Math.max(0, Math.min(100, lvl)) / 100 // 0..1
  switch (kind) {
    case 'none':    return 'none'
    case 'bn':      return `grayscale(${t})`
    case 'sepia':   return `sepia(${t})`
    case 'bright':  return `brightness(${1 + t*0.6})`
    case 'contrast':return `contrast(${1 + t*0.8})`
    case 'warm':    return `saturate(${1 + t*0.6}) hue-rotate(${-15*t}deg)`
    case 'cool':    return `saturate(${1 + t*0.4}) hue-rotate(${15*t}deg)`
  }
}

type StickerEmoji = { id: string; type: 'emoji'; char: string; name?: string; x: number; y: number; size: number; rot: number }
type StickerImg   = { id: string; type: 'img';   src: string;  name: string;   x: number; y: number; size: number; rot: number }
type Sticker = StickerEmoji | StickerImg
const stickers = reactive<Sticker[]>([])
const activeStickerId = ref<string | null>(null)
const activeSticker = computed(() => stickers.find(s => s.id === activeStickerId.value) || null)

const stickerEmojiPalette = ['😎','👑','🎩','🥸','😺','🤠','💖','✨', '👌']
function addEmoji(char: string) {
  const s: StickerEmoji = { id: 'e'+randId(), type: 'emoji', char, name: char, x: 0.5, y: 0.5, size: 0.22, rot: 0 }
  stickers.push(s); activeStickerId.value = s.id
}

const stickerCatalog = [
  { id: 'horns',    name: 'Cachos',      src: new URL('../assets/stickers/horns.svg', import.meta.url).toString(),     defSize: 0.58, defY: 0.23 },
  { id: 'cat-ears', name: 'Orejas gato', src: new URL('../assets/stickers/cat-ears.svg', import.meta.url).toString(),  defSize: 0.62, defY: 0.25 },
  { id: 'anime-eyes', name: 'Ojos anime',src: new URL('../assets/stickers/anime-eyes.svg', import.meta.url).toString(), defSize: 0.55, defY: 0.54 },
  { id: 'blush',    name: 'Rubor',       src: new URL('../assets/stickers/blush.svg', import.meta.url).toString(),     defSize: 0.45, defY: 0.65 },
  { id: 'sparkles', name: 'Brillos',     src: new URL('../assets/stickers/sparkles.svg', import.meta.url).toString(),  defSize: 0.40, defY: 0.40 },
  { id: 'crown',    name: 'Corona',      src: new URL('../assets/stickers/crown.svg', import.meta.url).toString(),     defSize: 0.45, defY: 0.18 },
  { id: 'umg',    name: 'umg',      src: new URL('../assets/stickers/umg.svg', import.meta.url).toString(),     defSize: 0.45, defY: 0.18 },
  { id: 'lentes',    name: 'lentes',      src: new URL('../assets/stickers/lentes.svg', import.meta.url).toString(),     defSize: 0.45, defY: 0.18 },
  { id: 'sombrerovaquero',    name: 'sombrerovaquero',      src: new URL('../assets/stickers/sombrerovaquero.svg', import.meta.url).toString(),     defSize: 0.45, defY: 0.18 },
]
const stickersDialog = ref(false)
function openStickerDialog(){ stickersDialog.value = true }
function addImageSticker(item: {id:string; name:string; src:string; defSize:number; defY:number}) {
  const s: StickerImg = {
    id: 'i'+randId(),
    type: 'img', name: item.name, src: item.src,
    x: 0.5, y: item.defY, size: item.defSize, rot: 0
  }
  stickers.push(s)
  activeStickerId.value = s.id
  stickersDialog.value = false
}

function removeActive() {
  const i = stickers.findIndex(s => s.id === activeStickerId.value)
  if (i >= 0) stickers.splice(i, 1); activeStickerId.value = null
}
function clearEdits() {
  filterKind.value = 'none'; filterLevel.value = 50
  stickers.splice(0, stickers.length); activeStickerId.value = null
}
function nudge(dir: 'left'|'right'|'up'|'down') {
  const s = activeSticker.value; if (!s) return
  const delta = 0.01
  if (dir === 'left')  s.x = clamp01(s.x - delta)
  if (dir === 'right') s.x = clamp01(s.x + delta)
  if (dir === 'up')    s.y = clamp01(s.y - delta)
  if (dir === 'down')  s.y = clamp01(s.y + delta)
}
function resizeSticker(factor: number) {
  const s = activeSticker.value; if (!s) return
  s.size = clamp(0.05, 0.9, s.size * factor)
}
function rotateSticker(deg: number) {
  const s = activeSticker.value; if (!s) return
  s.rot = ((s.rot + deg) % 360 + 360) % 360
}
function clamp(min:number, max:number, v:number) { return Math.max(min, Math.min(max, v)) }
function clamp01(v:number) { return clamp(0, 1, v) }
function randId(){ return Math.random().toString(36).slice(2,9) }

function getStageEl(): HTMLElement | null {
  return camera.open ? camStageRef.value : stageRef.value
}

function stickerStyle(s: Sticker) {
  const stage = getStageEl()
  const w = stage ? stage.clientWidth  : 1
  const h = stage ? stage.clientHeight : 1
  const px = s.x * w
  const py = s.y * h
  const fontPx = Math.round(s.size * w)
  if (s.type === 'emoji') {
    return { left: px + 'px', top: py + 'px', fontSize: fontPx + 'px', transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }
  } else {
    return { left: px + 'px', top: py + 'px', width: fontPx + 'px', height: 'auto', transform: 'translate(-50%, -50%)' }
  }
}

let dragId: string | null = null
let dragging = false
function startDrag(ev: MouseEvent | TouchEvent, id: string) {
  dragId = id; dragging = true
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', onDragEnd)
}
function onDragMove(e: MouseEvent | TouchEvent) {
  if (!dragging || !dragId) return
  const stage = getStageEl(); if (!stage) return
  const rect = stage.getBoundingClientRect()
  let cx = 0, cy = 0
  if (e instanceof TouchEvent) { const t = e.touches[0]; if (!t) return; cx = t.clientX; cy = t.clientY }
  else { cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY }
  const relX = clamp01((cx - rect.left) / rect.width)
  const relY = clamp01((cy - rect.top)  / rect.height)
  const s = stickers.find(st => st.id === dragId); if (!s) return
  s.x = relX; s.y = relY
  if ((e as any).cancelable) e.preventDefault()
}
function onDragEnd() {
  dragging = false; dragId = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragEnd)
}

function setBasePhoto(url: string) { basePhotoUrl.value = url }

const emailErrors = computed(() => {
  if (!touch.email) return []; if (!form.email) return ['El correo electrónico es requerido']
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email); return ok ? [] : ['Formato de email inválido']
})
const emailHint = computed(() => emailErrors.value.length ? '' : '✓ Correo válido')

const normalizePhone = (v: string) => v.replace(/[\s-]/g, '')
function sanitizePhone(v: string) { form.phone = v.replace(/[^\d+\s-]/g, ''); serverErrors.phone = '' }
function sanitizeNickname(v: string) { form.nickname = v.replace(/[^a-zA-Z0-9_]/g, ''); serverErrors.nickname = '' }
function mimeFromDataUrl(url?: string | null) { const m = /^data:([^;]+);base64,/.exec(url || ''); return m ? m[1] : null }

const phoneErrors = computed(() => {
  if (!touch.phone) return []; const v = form.phone.trim(); if (!v) return ['El número de teléfono es requerido']
  const clean = normalizePhone(v); const re = /^(\+502)?\d{8}$|^\+\d{10,15}$/; return re.test(clean) ? [] : ['Formato inválido. Use +502XXXXXXXX o formato E.164']
})
const phoneHint = computed(() => phoneErrors.value.length ? '' : '✓ Número válido')

const birthErrors = computed(() => {
  if (!touch.birthdate) return []; if (!form.birthdate) return ['La fecha de nacimiento es requerida']
  const b = new Date(form.birthdate); if (isNaN(b.getTime())) return ['Fecha no válida']
  const t = new Date(); let age = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--; return age < 13 ? ['Debes tener al menos 13 años para registrarte'] : []
})

const nickErrors = computed(() => {
  if (!touch.nickname) return []; const v = form.nickname.trim()
  if (!v) return ['El nickname es requerido']; if (v.length < 4 || v.length > 20) return ['El nickname debe tener entre 4 y 20 caracteres']; return []
})
const nickHint = computed(() => nickErrors.value.length ? '' : '✓ Nickname disponible')

const passErrors = computed(() => {
  if (!touch.password) return []; const v = form.password; const e: string[] = []
  if (v.length < 8) e.push('mínimo 8 caracteres'); if (!/[A-Z]/.test(v)) e.push('una mayúscula'); if (!/[a-z]/.test(v)) e.push('una minúscula')
  if (!/\d/.test(v)) e.push('un número'); if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) e.push('un carácter especial')
  return e.length ? ['Falta: ' + e.join(', ')] : []
})
const passwordStrength = computed(() => {
  const v = form.password; let s = 0; if (v.length >= 8) s += 20; if (/[A-Z]/.test(v)) s += 20; if (/[a-z]/.test(v)) s += 20; if (/\d/.test(v)) s += 20; if (/[!@#$%^&*(),.?":{}|<>]/.test(v)) s += 20
  if (s < 40) return { value: s, label: 'Débil', color: 'error' }; if (s < 80) return { value: s, label: 'Regular', color: 'warning' }; return { value: s, label: 'Fuerte', color: 'success' }
})
const confirmErrors = computed(() => { if (!touch.confirm) return []; if (!form.confirm) return ['Debes confirmar la contraseña']; return form.confirm !== form.password ? ['Las contraseñas no coinciden'] : [] })
const notifErrors = computed(() => { if (!touch.notifications) return []; return form.notifications.length === 0 ? ['Debes seleccionar al menos una preferencia de notificación'] : [] })
function toggleNotif(v: 'email' | 'whatsapp') { touch.notifications = true; const i = form.notifications.indexOf(v); if (i >= 0) form.notifications.splice(i, 1); else form.notifications.push(v) }

const formValid = computed(() =>
  emailErrors.value.length === 0 &&
  phoneErrors.value.length === 0 &&
  birthErrors.value.length === 0 &&
  nickErrors.value.length === 0 &&
  passErrors.value.length === 0 &&
  confirmErrors.value.length === 0 &&
  form.notifications.length > 0
)

async function composeEditedImage(): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    try {
      if (!basePhotoUrl.value) return resolve('')

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = async () => {
        const w0 = img.naturalWidth || 1
        const h0 = img.naturalHeight || 1

        // 2) Center-crop cuadrado (como el stage redondo)
        const side = Math.min(w0, h0)
        const sx = Math.floor((w0 - side) / 2)
        const sy = Math.floor((h0 - side) / 2)

        // 3) Canvas final
        const canvas = document.createElement('canvas')
        canvas.width = side
        canvas.height = side
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No canvas 2D'))

        ctx.filter = buildFilterCss(filterKind.value, filterLevel.value)
        ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side)

        const bmpMap = new Map<string, ImageBitmap>()
        const imgMap = new Map<string, HTMLImageElement>() 
        await Promise.all(
          stickers.filter(s => s.type === 'img').map(async (s) => {
            const si = s as StickerImg
            try {
              const bmp = await loadStickerBitmap(si.src)
              if (bmp) { bmpMap.set(s.id, bmp); return }
            } catch {}
            // fallback Image()
            const im = await loadStickerImage(si.src)
            if (im) imgMap.set(s.id, im)
          })
        )

        ctx.filter = 'none'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        const fontStack = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`

        for (const s of stickers) {
          const px = s.x * side
          const py = s.y * side
          const sizePx = Math.round(s.size * side)

          ctx.save()
          ctx.translate(px, py)
          ctx.rotate((s.rot || 0) * Math.PI / 180)

          if (s.type === 'emoji') {
            ctx.font = `${sizePx}px ${fontStack}`
            ctx.fillText(s.char, 0, 0)
          } else {
            const bmp = bmpMap.get(s.id)
            if (bmp) {
              const ratio = bmp.height / Math.max(1, bmp.width)
              const drawW = sizePx
              const drawH = sizePx * ratio
              ctx.drawImage(bmp, -drawW / 2, -drawH / 2, drawW, drawH)
            } else {
              const im = imgMap.get(s.id)
              if (im) {
                const ratio = (im.naturalHeight || im.height) / Math.max(1, (im.naturalWidth || im.width))
                const drawW = sizePx
                const drawH = sizePx * ratio
                ctx.drawImage(im, -drawW / 2, -drawH / 2, drawW, drawH)
              }
            }
          }
          ctx.restore()
        }

        let out = canvas.toDataURL('image/png')
        if (out.length > 1900000) {
          out = await reencodeToJpeg(out, 0.92)
          if (out.length > 1900000) out = await reencodeToJpeg(out, 0.85)
        }
        resolve(out)
      }
      img.onerror = () => reject(new Error('No se pudo cargar la imagen base'))
      img.src = basePhotoUrl.value
    } catch (e) { reject(e) }
  })
}

async function loadStickerBitmap(src: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(src, { cache: 'force-cache' })
    if (!res.ok) return null
    const blob = await res.blob() 
    try {
      const bmp = await createImageBitmap(blob)
      return bmp
    } catch {
      return null
    }
  } catch {
    return null
  }
}

function loadStickerImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => resolve(null)
    im.src = src
  })
}

async function reencodeToJpeg(dataUrl: string, quality = 0.92): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 1
      canvas.height = img.naturalHeight || 1
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toDataURL('image/jpeg', quality)
      resolve(out)
    }
    img.onerror = () => resolve(dataUrl) 
    img.src = dataUrl
  })
}



async function getOriginalDataUrl(): Promise<string> {
  if (!basePhotoUrl.value) return ''
  if (basePhotoUrl.value.startsWith('data:')) return basePhotoUrl.value

  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas 2D'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => reject(new Error('No se pudo cargar la imagen original'))
    img.src = basePhotoUrl.value
  })
}

function resetForm() {
  form.email = ''; form.phone = ''; form.birthdate = ''; form.nickname = ''; form.password = ''; form.confirm = ''; form.notifications = []
  Object.keys(touch).forEach(k => ((touch as any)[k] = false))
  serverErrors.email = serverErrors.phone = serverErrors.nickname = ''
  if (basePhotoUrl.value.startsWith('blob:')) URL.revokeObjectURL(basePhotoUrl.value)
  basePhotoUrl.value = ''
  stickers.splice(0, stickers.length); activeStickerId.value = null
  filterKind.value = 'none'; filterLevel.value = 50
}

async function onSubmit() {
  Object.keys(touch).forEach(k => ((touch as any)[k] = true))
  if (!formValid.value) return
  submitting.value = true; errorMsg.value = ''; serverErrors.email = serverErrors.phone = serverErrors.nickname = ''

  let originalDataUrl: string | null = null
  let editedDataUrl: string | null = null
  try {
    originalDataUrl = basePhotoUrl.value ? await getOriginalDataUrl() : null
  } catch (e) {
    console.error('Original conversion error', e)
    originalDataUrl = basePhotoUrl.value || null
  }
  try {
    const noEdits = (filterKind.value === 'none' && filterLevel.value === 50 && stickers.length === 0)
    editedDataUrl = basePhotoUrl.value ? (noEdits ? null : await composeEditedImage()) : null
  } catch (e) {
    console.error('Compose error', e)
    editedDataUrl = null
  }

  // Mimes
  const photoMime  = originalDataUrl ? (mimeFromDataUrl(originalDataUrl) || 'image/jpeg') : null
  const photo2Mime = editedDataUrl   ? (mimeFromDataUrl(editedDataUrl)   || 'image/png')  : null

  try {
    const data = await post('/api/auth/register', {
      email: form.email,
      phone: form.phone || null,
      birthdate: form.birthdate,
      nickname: form.nickname,
      password: form.password,
      photoBase64:  originalDataUrl,  
      photoMime:    photoMime,
      photo2Base64: editedDataUrl,    
      photo2Mime:   photo2Mime,
      roleId: 4
    })
    console.debug('Usuario creado', data?.id)

    try {
      await post('/api/notifications/registration-receipt', {
        email: form.email.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim()
      })
      console.debug('Comprobante enviado al correo.')
    } catch (mailErr:any) {
      console.warn('No se pudo enviar el comprobante de registro:', mailErr?.message || mailErr)
    }

    snack.value = true
    resetForm()
  } catch (e: any) {
    const msg = e?.message || ''
    const m = msg.toLowerCase()
    if (e?.status === 409) {
      if (m.includes('teléfono') || m.includes('telefono')) serverErrors.phone = msg
      else if (m.includes('email') || m.includes('correo')) serverErrors.email = msg
      else if (m.includes('nickname') || m.includes('usuario')) serverErrors.nickname = msg
      else errorMsg.value = msg
    } else if (e?.status === 422 || e?.status === 400) {
      errorMsg.value = msg
    } else if (e?.status === 413) {
      errorMsg.value = 'La fotografía supera el límite (2MB)'
    } else {
      errorMsg.value = msg || 'Error al registrar'
    }
  } finally { submitting.value = false }
}

function setStageKeyListeners() {
  window.addEventListener('keydown', (e) => {
    if (!activeSticker.value) return
    if (e.key === 'Delete' || e.key === 'Backspace') { removeActive(); e.preventDefault(); return }
    if (e.key === 'ArrowLeft')  { nudge('left');  e.preventDefault() }
    if (e.key === 'ArrowRight') { nudge('right'); e.preventDefault() }
    if (e.key === 'ArrowUp')    { nudge('up');    e.preventDefault() }
    if (e.key === 'ArrowDown')  { nudge('down');  e.preventDefault() }
    if (e.key === '+')          { resizeSticker(1.1); e.preventDefault() }
    if (e.key === '-')          { resizeSticker(0.9); e.preventDefault() }
    if (e.key === 'r' || e.key === 'R') { rotateSticker(15); e.preventDefault() }
  })
}
onMounted(() => setStageKeyListeners())
</script>

<style scoped>
.registration-card {
  max-width: 820px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.title {
  color: #2d3748;
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #718096;
  font-size: clamp(14px, 2.5vw, 16px);
  margin-top: 8px;
}

.photo-stage {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
  border-radius: 50%;
  border: 3px dashed #cbd5e0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(102,126,234,0.05);
  overflow: hidden;
}
.photo-stage.clickable:hover { border-color: #667eea; background: rgba(102, 126, 234, 0.1); cursor: pointer; }

.photo-empty { text-align: center; color: #718096; font-size: 14px; }
.stage-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; user-select: none; pointer-events: none; }

.stage-toolbar {
  position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px; background: rgba(255,255,255,0.7); padding: 4px 8px;
  border-radius: 999px; backdrop-filter: blur(6px);
}

.cam-stage { position: relative; }
.cam-video { width: 100%; border-radius: 12px; background: #000; }

.cam-toolbar { bottom: 8px; }

.sticker {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  user-select: none; cursor: move; line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
  z-index: 2;
}
.sticker.active { outline: 2px dashed #7c3aed; outline-offset: 2px; border-radius: 8px; }
.sticker-img { display: block; width: 100%; height: auto; pointer-events: none; }

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.sticker-card {
  border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; background: #fff; transition: 0.15s;
}
.sticker-card:hover { background: #f8fafc; }
.sticker-card img { width: 100%; height: auto; }
.sticker-name { margin-top: 6px; font-size: 12px; color: #475569; }

.editor-wrap { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: rgba(255,255,255,0.7); }
.radio-group { display: flex; flex-direction: column; gap: 12px; }
.radio-item { padding: 8px 12px; border: 2px solid #e2e8f0; transition: 0.2s; background: rgba(255, 255, 255, 0.9); }
.radio-item:hover { border-color: #cbd5e0; background: rgba(102, 126, 234, 0.05); }
.radio-item.selected { border-color: #667eea; background: rgba(102, 126, 234, 0.1); }

.gradient-btn {
  color: white !important;
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
}
.cam-preview { width: 100%; border-radius: 12px; }
</style>
