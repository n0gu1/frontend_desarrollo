<template>
    <v-container class="py-0 px-0">
        <!-- HERO -->
        <section class="dash-hero">
            <div class="sheen"></div>
            <div class="particles"></div>

            <div class="hero-inner">
                <div class="hero-left">
                    <div class="title-wrap">
                        <v-icon size="30" class="title-icon">mdi-view-dashboard</v-icon>
                        <div>
                            <div class="text-overline mb-1">Panel</div>
                            <h1 class="hero-title">Dashboard de ventas</h1>
                        </div>
                    </div>
                    <div class="hero-sub">
                        En tiempo real, con agrupación por día, semana o total.
                    </div>
                </div>
                <div class="hero-right">
                    <v-chip class="chip-soft" color="primary" variant="flat" prepend-icon="mdi-lightning-bolt">
                        Live 20s
                    </v-chip>
                </div>
            </div>

            <!-- TOOLBAR pegajosa -->
            <div class="toolbar-wrap">
                <div class="toolbar">
                    <div class="toolbar-item">
                        <v-text-field v-model="from" label="Desde" type="date" density="compact" hide-details
                            variant="outlined" />
                    </div>
                    <div class="toolbar-item">
                        <v-text-field v-model="to" label="Hasta" type="date" density="compact" hide-details
                            variant="outlined" />
                    </div>
                    <div class="toolbar-item">
                        <v-select v-model="granularity" :items="granularities" item-title="label" item-value="value"
                            label="Granularidad" density="compact" hide-details variant="outlined" />
                    </div>

                    <div class="toolbar-actions">
                        <v-btn color="primary" variant="flat" class="btn-refresh" @click="load" :loading="loading"
                            prepend-icon="mdi-refresh">
                            Actualizar
                        </v-btn>

                        <v-switch v-model="autoRefresh" inset class="ml-2" hide-details color="secondary"
                            :label="autoRefresh ? 'Auto (20s)' : 'Manual'" />
                    </div>
                </div>
            </div>
        </section>

        <v-container class="py-6 px-4 px-md-6">
            <v-alert v-if="error" type="error" class="mb-4 elevation-2">{{ error }}</v-alert>

            <!-- KPIs -->
            <v-row class="mb-4" dense>
                <v-col cols="12" md="4">
                    <v-card class="kpi-card kpi-ventas hover-bump" rounded="xl" elevation="8">
                        <v-card-text class="kpi-inner">
                            <div class="kpi-left">
                                <div class="kpi-label">Ventas (Q)</div>
                                <div class="kpi-value">Q {{ money(kpis.totalVentas) }}</div>
                                <div class="kpi-sub">Ingresos en el rango</div>
                            </div>
                            <div class="kpi-right">
                                <div class="kpi-icon-wrap">
                                    <v-icon size="34">mdi-cash-multiple</v-icon>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card class="kpi-card kpi-ordenes hover-bump" rounded="xl" elevation="8">
                        <v-card-text class="kpi-inner">
                            <div class="kpi-left">
                                <div class="kpi-label">Órdenes</div>
                                <div class="kpi-value">{{ kpis.totalOrdenes }}</div>
                                <div class="kpi-sub">Total de compras</div>
                            </div>
                            <div class="kpi-right">
                                <div class="kpi-icon-wrap">
                                    <v-icon size="34">mdi-receipt-text</v-icon>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card class="kpi-card kpi-ticket hover-bump" rounded="xl" elevation="8">
                        <v-card-text class="kpi-inner">
                            <div class="kpi-left">
                                <div class="kpi-label">Ticket promedio</div>
                                <div class="kpi-value">Q {{ money(kpis.avgTicket) }}</div>
                                <div class="kpi-sub">Promedio por orden</div>
                            </div>
                            <div class="kpi-right">
                                <div class="kpi-icon-wrap">
                                    <v-icon size="34">mdi-chart-donut</v-icon>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Skeleton cuando carga fuerte -->
            <div v-if="loading" class="mb-6">
                <v-row dense>
                    <v-col cols="12" lg="7">
                        <v-skeleton-loader type="article, list-item-two-line"
                            class="elevation-2 rounded-xl"></v-skeleton-loader>
                    </v-col>
                    <v-col cols="12" lg="5">
                        <v-skeleton-loader type="table" class="elevation-2 rounded-xl"></v-skeleton-loader>
                    </v-col>
                    <v-col cols="12" lg="7">
                        <v-skeleton-loader type="table" class="elevation-2 rounded-xl"></v-skeleton-loader>
                    </v-col>
                    <v-col cols="12" lg="5">
                        <v-skeleton-loader type="table" class="elevation-2 rounded-xl"></v-skeleton-loader>
                    </v-col>
                </v-row>
            </div>

            <v-row v-else dense>
                <!-- Serie temporal -->
                <v-col cols="12" lg="7">
                    <v-card rounded="xl" class="elevation-2 mb-4">
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon class="mr-2">mdi-chart-bar</v-icon>
                            Ventas por {{ granularityLabel }}
                        </v-card-title>
                        <v-divider />
                        <v-card-text>
                            <div v-if="series.length === 0" class="text-grey py-6 text-center">Sin datos en el rango.
                            </div>

                            <!-- Barras animadas -->
                            <div v-else class="bars">
                                <div v-for="(p, idx) in series" :key="idx" class="bar-row"
                                    :title="`${formatDate(p.bucket)} · Q ${money(p.total)} · ${p.ordenes} órdenes`">
                                    <div class="bar-label">
                                        <v-icon size="16" class="mr-1">mdi-calendar-month</v-icon>
                                        {{ shortDate(p.bucket) }}
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" :style="{
                                            '--w': barPct(p.total) + '%',
                                            width: 'var(--w)'
                                        }" />
                                    </div>
                                    <div class="bar-value">
                                        Q {{ money(p.total) }}
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Por estado -->
                <v-col cols="12" lg="5">
                    <v-card rounded="xl" class="elevation-2 mb-4">
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon class="mr-2">mdi-clipboard-check</v-icon>
                            Compras por estado
                        </v-card-title>
                        <v-divider />
                        <v-card-text>
                            <v-table density="comfortable" class="nice-table">
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th class="text-right">Órdenes</th>
                                        <th class="text-right">Total (Q)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="e in byEstado" :key="e.estado" class="row-hover">
                                        <td>
                                            <v-chip size="small" :color="stateColor(e.estado)" variant="flat"
                                                class="chip-soft">
                                                <v-icon size="16" class="mr-1">mdi-circle-small</v-icon>
                                                {{ e.estado }}
                                            </v-chip>
                                        </td>
                                        <td class="text-right">{{ e.ordenes }}</td>
                                        <td class="text-right">{{ money(e.total) }}</td>
                                    </tr>
                                    <tr v-if="byEstado.length === 0">
                                        <td colspan="3" class="text-center text-grey">Sin datos.</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-row v-if="!loading" dense>
                <!-- Por tipo de producto -->
                <v-col cols="12" lg="7">
                    <v-card rounded="xl" class="elevation-2 mb-4">
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon class="mr-2">mdi-shape</v-icon>
                            Ventas por tipo de producto
                        </v-card-title>
                        <v-divider />
                        <v-card-text>
                            <v-table density="comfortable" class="nice-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th class="text-right">Órdenes</th>
                                        <th class="text-right">Total (Q)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="t in byTipo" :key="t.tipo" class="row-hover">
                                        <td>{{ t.tipo }}</td>
                                        <td class="text-right">{{ t.ordenes }}</td>
                                        <td class="text-right">{{ money(t.total) }}</td>
                                    </tr>
                                    <tr v-if="byTipo.length === 0">
                                        <td colspan="3" class="text-center text-grey">Sin datos.</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Top productos -->
                <v-col cols="12" lg="5">
                    <v-card rounded="xl" class="elevation-2 mb-4">
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon class="mr-2">mdi-crown</v-icon>
                            Top productos
                        </v-card-title>
                        <v-divider />
                        <v-card-text>
                            <v-table density="comfortable" class="nice-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-right">Unidades</th>
                                        <th class="text-right">Ingresos (Q)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="p in topProductos" :key="p.nombre" class="row-hover">
                                        <td class="d-flex align-center">
                                            <v-icon class="mr-2" size="18">mdi-star</v-icon>
                                            {{ p.nombre }}
                                        </td>
                                        <td class="text-right">{{ p.unidades }}</td>
                                        <td class="text-right">{{ money(p.total) }}</td>
                                    </tr>
                                    <tr v-if="topProductos.length === 0">
                                        <td colspan="3" class="text-center text-grey">Sin datos.</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { get } from '../lib/api'

/** ======= Filtros ======= */
const todayISO = () => new Date().toISOString().slice(0, 10)
function addDays(base: string, delta: number) {
    const d = new Date(base + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    return d.toISOString().slice(0, 10)
}

// defaults: última semana, granularidad día
const to = ref<string>(todayISO())
const from = ref<string>(addDays(to.value, -7))
const granularities = [
    { label: 'Día', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Total', value: 'total' },
]
const granularity = ref<'day' | 'week' | 'total'>('day')
const granularityLabel = computed(() => granularities.find(g => g.value === granularity.value)?.label || 'día')

/** ======= Estado ======= */
const loading = ref(false)
const error = ref<string | null>(null)

type KPI = { totalVentas: number; totalOrdenes: number; avgTicket: number }
const kpis = ref<KPI>({ totalVentas: 0, totalOrdenes: 0, avgTicket: 0 })

type SerieP = { bucket: string; total: number; ordenes: number }
const series = ref<SerieP[]>([])

type GroupRow = { estado: string; ordenes: number; total: number }
const byEstado = ref<GroupRow[]>([])
type TipoRow = { tipo: string; ordenes: number; total: number }
const byTipo = ref<TipoRow[]>([])
type TopProd = { nombre: string; unidades: number; total: number }
const topProductos = ref<TopProd[]>([])

/** ======= Polling ======= */
const autoRefresh = ref(true)
let timer: any = null

watch([from, to, granularity], () => { load() })

onMounted(async () => {
    await load()
    if (autoRefresh.value) startPolling()
})
onBeforeUnmount(() => stopPolling())
watch(autoRefresh, (v) => { v ? startPolling() : stopPolling() })

function startPolling() {
    stopPolling()
    timer = window.setInterval(load, 20000) // 20s
}
function stopPolling() {
    if (timer) { window.clearInterval(timer); timer = null }
}

/** ======= Carga / Normalización ======= */
async function load() {
    loading.value = true; error.value = null
    try {
        const params = new URLSearchParams({
            from: from.value,
            to: to.value,
            granularity: granularity.value,
        })
        const r = await get<any>(`/api/dashboard?${params.toString()}`)
        normalize(r)
    } catch (e: any) {
        error.value = e?.message || 'No se pudo cargar el dashboard.'
        // limpiar pero mantener estructura
        kpis.value = { totalVentas: 0, totalOrdenes: 0, avgTicket: 0 }
        series.value = []
        byEstado.value = []
        byTipo.value = []
        topProductos.value = []
    } finally {
        loading.value = false
    }
}

function normalize(r: any) {
    // KPIs
    const totalVentas = num(r?.kpis?.totalVentas ?? r?.totals?.ventas ?? r?.ventas_total)
    const totalOrdenes = num(r?.kpis?.totalOrdenes ?? r?.totals?.ordenes ?? r?.ordenes_total)
    const avgTicket = num(
        r?.kpis?.avgTicket ??
        (totalOrdenes ? totalVentas / totalOrdenes : 0)
    )
    kpis.value = { totalVentas, totalOrdenes, avgTicket }

    // Series temporales
    const rawSeries = r?.series ?? r?.timeSeries ?? []
    series.value = (rawSeries || []).map((p: any) => ({
        bucket: p.bucket ?? p.date ?? p.dia ?? p.semana ?? '—',
        total: num(p.total ?? p.amount ?? p.ventas ?? 0),
        ordenes: num(p.ordenes ?? p.count ?? p.orders ?? 0),
    }))

    // Por estado
    const est = r?.byEstado ?? r?.ordersByState ?? []
    byEstado.value = (est || []).map((e: any) => ({
        estado: e.estado ?? e.state ?? '—',
        ordenes: num(e.ordenes ?? e.count ?? e.orders ?? 0),
        total: num(e.total ?? e.amount ?? e.ventas ?? 0),
    }))

    // Por tipo
    const tipos = r?.byTipoProducto ?? r?.byProductType ?? []
    byTipo.value = (tipos || []).map((t: any) => ({
        tipo: t.tipo ?? t.type ?? t.nombre ?? '—',
        ordenes: num(t.ordenes ?? t.count ?? t.orders ?? 0),
        total: num(t.total ?? t.amount ?? t.ventas ?? 0),
    }))

    // Top productos
    const top = r?.topProductos ?? r?.topProducts ?? []
    topProductos.value = (top || []).map((p: any) => ({
        nombre: p.nombre ?? p.name ?? `#${p.producto_id ?? ''}`,
        unidades: num(p.unidades ?? p.qty ?? p.quantity ?? 0),
        total: num(p.total ?? p.amount ?? p.ventas ?? 0),
    }))
}

/** ======= Utils ======= */
function num(n: any) { const v = Number(n ?? 0); return isFinite(v) ? v : 0 }
function money(n: any) { return num(n).toFixed(2) }
function formatDate(s: string) {
    if (!s) return '—'
    const d = new Date(s)
    return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString()
}
function shortDate(s: string) {
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(5) // MM-DD
    return s
}
const maxTotal = computed(() => {
    return series.value.reduce((m, p) => Math.max(m, p.total), 0) || 1
})
function barPct(total: number) {
    return Math.max(2, Math.round((total / maxTotal.value) * 100)) // mínimo 2%
}
function stateColor(t: string) {
    const s = (t || '').toLowerCase()
    if (s.includes('entregado') || s.includes('listo') || s.includes('final')) return 'success'
    if (s.includes('pend') || s.includes('ruta') || s.includes('proceso')) return 'warning'
    if (s.includes('fall') || s.includes('cancel')) return 'error'
    return 'grey'
}
</script>

<style scoped>
/* ======= HERO ======= */
.dash-hero {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 18px 22px 0;
    background:
        radial-gradient(1200px 60% at 100% -10%, #eef2ff 0%, transparent 60%),
        radial-gradient(900px 50% at -10% 0%, #fdf2f8 0%, transparent 60%),
        linear-gradient(180deg, #ffffff 0%, #fbfbfd 40%, #ffffff 100%);
    border-bottom: 1px solid rgba(17, 24, 39, 0.06);
    box-shadow: 0 30px 40px -40px rgba(0, 0, 0, 0.25);
}

.sheen {
    position: absolute;
    inset: -10% -10% auto -10%;
    height: 120%;
    background:
        radial-gradient(50% 40% at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
        radial-gradient(50% 40% at 90% 0%, rgba(236, 72, 153, 0.10) 0%, transparent 60%);
    z-index: 0;
    pointer-events: none;
}

.particles::before,
.particles::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        radial-gradient(3px 3px at 20% 30%, rgba(99, 102, 241, 0.18) 50%, transparent 50%),
        radial-gradient(4px 4px at 70% 20%, rgba(236, 72, 153, 0.16) 50%, transparent 50%),
        radial-gradient(3px 3px at 85% 60%, rgba(14, 165, 233, 0.16) 50%, transparent 50%);
    background-repeat: no-repeat;
    animation: floaty 10s ease-in-out infinite alternate;
}

@keyframes floaty {
    from {
        transform: translateY(0px);
    }

    to {
        transform: translateY(6px);
    }
}

.hero-inner {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 10px 2px 14px;
}

.title-wrap {
    display: flex;
    gap: 12px;
    align-items: center;
}

.title-icon {
    color: #4f46e5;
}

.hero-title {
    margin: 0;
    font-weight: 900;
    letter-spacing: .2px;
    color: #0f172a;
}

.hero-sub {
    color: #475569;
}

.chip-soft {
    border-radius: 999px;
}

/* TOOLBAR pegajosa */
.toolbar-wrap {
    position: sticky;
    top: 72px;
    z-index: 2;
}

.toolbar {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(3, minmax(180px, 220px)) 1fr;
    align-items: center;
    padding: 10px 0 12px;
}

.toolbar-item :deep(.v-field) {
    background: #fff;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.btn-refresh {
    border-radius: 999px;
}

/* ======= KPI CARDS ======= */
.kpi-card {
    overflow: hidden;
    position: relative;
    color: #0f172a;
}

.kpi-inner {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
}

.kpi-left .kpi-label {
    font-size: .82rem;
    color: #6b7280;
}

.kpi-left .kpi-value {
    font-size: 1.65rem;
    font-weight: 800;
    letter-spacing: .2px;
}

.kpi-left .kpi-sub {
    color: #6b7280;
    font-size: .82rem;
}

.kpi-right .kpi-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #fff;
    box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.35);
}

/* Gradientes sutiles por KPI */
.kpi-ventas {
    background: linear-gradient(180deg, #ffffff 0%, #eef2ff 100%);
}

.kpi-ventas .kpi-icon-wrap {
    background: linear-gradient(180deg, #4f46e5, #22d3ee);
}

.kpi-ordenes {
    background: linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%);
}

.kpi-ordenes .kpi-icon-wrap {
    background: linear-gradient(180deg, #ec4899, #f59e0b);
}

.kpi-ticket {
    background: linear-gradient(180deg, #ffffff 0%, #ecfeff 100%);
}

.kpi-ticket .kpi-icon-wrap {
    background: linear-gradient(180deg, #06b6d4, #10b981);
}

/* Hover micro-interacción */
.hover-bump {
    transition: transform .18s ease, box-shadow .18s ease;
}

.hover-bump:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 30px -18px rgba(0, 0, 0, .25);
}

/* ======= BARRAS ======= */
.bars {
    display: grid;
    gap: 12px;
}

.bar-row {
    display: grid;
    grid-template-columns: 110px 1fr 150px;
    gap: 10px;
    align-items: center;
}

.bar-label {
    font-variant-numeric: tabular-nums;
    color: #6b7280;
    display: flex;
    align-items: center;
}

.bar-track {
    height: 12px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    overflow: hidden;
    position: relative;
}

.bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #6366f1, #06b6d4);
    width: 0%;
    animation: grow 700ms ease forwards;
}

@keyframes grow {
    from {
        width: 0%;
    }

    to {
        width: var(--w, 0%);
    }
}

.bar-value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

/* ======= TABLAS ======= */
.nice-table thead th {
    font-weight: 700;
    color: #334155;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
}

.row-hover:hover {
    background: #fafafa;
}

/* ======= RESPONSIVE ======= */
@media (max-width: 960px) {
    .toolbar {
        grid-template-columns: 1fr 1fr;
    }

    .toolbar-actions {
        grid-column: 1 / -1;
        justify-content: flex-start;
    }

    .bar-row {
        grid-template-columns: 90px 1fr 110px;
    }
}
</style>
