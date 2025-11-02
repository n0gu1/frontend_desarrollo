<!-- src/views/Supervisor.vue -->
<template>
  <div class="supervisor-container">
    <header class="header">
      <div class="header-content">
        <h1 class="title" v-once>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Panel Supervisor
        </h1>
        <button @click="reload" class="btn-logout" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {{ loading ? 'Actualizando…' : 'Recargar' }}
        </button>
      </div>
    </header>

    <main class="main-content">
      <div class="section-header" style="margin-bottom: 1rem;">
        <h2 v-once>Órdenes</h2>
      </div>

      <div class="orders-table-section">
        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th style="width:160px;">Folio</th>
                <th>Cliente</th>
                <th style="width:420px;">Operador</th>
              </tr>
            </thead>

            <tbody v-if="loading && visibleOrders.length === 0">
              <tr v-for="n in 6" :key="'sk-' + n">
                <td><div class="skeleton pill" style="width:100px;height:18px;"></div></td>
                <td><div class="skeleton" style="width:240px;height:18px;"></div></td>
                <td>
                  <div class="skeleton" style="width:280px;height:32px;margin-bottom:.5rem;"></div>
                  <div class="skeleton pill" style="width:110px;height:32px;"></div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="o in visibleOrders" :key="o.id || o.folio">
                <td><span class="order-id">#{{ o.folio }}</span></td>
                <td>
                  <div class="customer-cell">
                    <strong>{{ o.customerName }}</strong>
                  </div>
                </td>
                <td>
                  <div class="operator-cell">
                    <select
                      v-model="selectedOperators[o.id]"
                      class="filter-select"
                      :disabled="saving[o.id]"
                    >
                      <option :value="''">— Sin asignar —</option>
                      <option
                        v-for="op in operators"
                        :key="op.usuarioId"
                        :value="String(op.usuarioId)"
                      >
                        {{ op.nickname }} ({{ op.usuarioId }})
                      </option>
                    </select>

                    <button
                      class="btn-assign"
                      :disabled="saving[o.id]"
                      @click="assign(o.id, selectedOperators[o.id])"
                      title="Guardar asignación"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Asignar
                    </button>

                    <span v-if="saving[o.id]" class="saving-hint">Guardando…</span>
                    <span v-else-if="assignedNames[o.id]" class="assigned-hint">
                      Asignado: {{ assignedNames[o.id] }}
                    </span>
                    <span v-else-if="operators.length === 0" class="saving-hint">
                      Sin operadores (rol 5)
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!loading && visibleOrders.length === 0" class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>No hay órdenes disponibles</p>
          </div>

          <div v-if="error" class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { get, post } from '../lib/api'

export default {
  name: 'SupervisorView',
  data() {
    return {
      orders: [],
      operators: [],
      selectedOperators: {},
      assignedNames: {},
      saving: {},
      loading: false,
      error: null,
      _refreshTimer: null,
      _assignedIds: new Set()
    }
  },

  computed: {
    visibleOrders() {
      if (!this._assignedIds || this._assignedIds.size === 0) return this.orders
      return this.orders.filter(o => !this._assignedIds.has(Number(o.id)))
    }
  },

  methods: {
    logout() { if (confirm('¿Estás seguro de que deseas cerrar sesión?')) console.log('Cerrando sesión…') },

    mapOrder(row) {
      const id = row?.id ?? row?.ordenId ?? null
      const folio = row?.folio || (id ? String(id) : 'SIN-FOLIO')
      const name =
        (row?.customerName && String(row.customerName).trim() !== '')
          ? row.customerName
          : (row?.clienteNombre && String(row.clienteNombre).trim() !== '')
            ? row.clienteNombre
            : 'Cliente'
      return { id, folio, customerName: name }
    },

    async loadOrders(limit = 200) {
      const resp = await get('/api/operator/orders', { params: { estado: 'CRE', limit } })
      const arr = Array.isArray(resp) ? resp : (Array.isArray(resp?.items) ? resp.items : [])
      this.orders = arr.map(this.mapOrder)
    },

    async loadOperators() {
      const list = await get('/api/supervisor/operators', { params: { rolId: 5, soloActivos: 1, limit: 500 } })
      const arr = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : [])
      this.operators = arr.map(o => ({
        usuarioId: Number(o.usuarioId ?? o.UsuarioId ?? o.id),
        nickname: o.nickname ?? o.Nickname ?? `usuario-${o.usuarioId ?? o.UsuarioId ?? o.id}`,
        email: o.email ?? o.Email ?? null
      }))
    },

    async loadAssignments() {
      try {
        const ids = this.orders.map(o => o.id).filter(Boolean)
        if (ids.length === 0) { this._assignedIds = new Set(); return }

        const res = await get('/api/supervisor/orders/assignments', { params: { ids: ids.join(',') } })
        const arr = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : [])

        const assigned = new Set(arr.map(r => Number(r.ordenId ?? r.OrdenId)).filter(v => !Number.isNaN(v)))
        this._assignedIds = assigned

        const nickFromList = (opId) => {
          const hit = this.operators.find(x => Number(x.usuarioId) === Number(opId))
          return hit?.nickname || null
        }
        arr.forEach(r => {
          const ordenId = Number(r.ordenId ?? r.OrdenId)
          const opIdRaw = r.operadorUsuarioId ?? r.OperadorUsuarioId ?? null
          const opId = (opIdRaw == null) ? null : Number(opIdRaw)
          if (opId == null || Number.isNaN(opId)) {
            this.selectedOperators[ordenId] = ''
            delete this.assignedNames[ordenId]
          } else {
            this.selectedOperators[ordenId] = String(opId)
            const nick = r.operadorNickname ?? r.OperadorNickname ?? nickFromList(opId)
            if (nick) this.assignedNames[ordenId] = nick
          }
        })
      } catch { this._assignedIds = new Set() }
    },

    async reload() {
      this.loading = true
      this.error = null
      try {
        await Promise.all([this.loadOrders(), this.loadOperators()])
        await this.loadAssignments()
      } catch (e) {
        console.error(e)
        this.error = 'No se pudieron cargar datos.'
      } finally {
        this.loading = false
      }
    },

    async assign(ordenId, operadorUsuarioId) {
      if (!ordenId) return
      try {
        this.saving[ordenId] = true
        const opId = (operadorUsuarioId === '' || operadorUsuarioId == null) ? null : Number(operadorUsuarioId)

        await post(`/api/supervisor/orders/${ordenId}/assign-operator`, { operadorUsuarioId: opId })

        if (opId == null || Number.isNaN(opId)) {
          this.selectedOperators[ordenId] = ''
          delete this.assignedNames[ordenId]
          this._assignedIds.delete(Number(ordenId))
        } else {
          const nick = this.operators.find(x => Number(x.usuarioId) === Number(opId))?.nickname || `usuario-${opId}`
          this.selectedOperators[ordenId] = String(opId)
          this.assignedNames[ordenId] = nick
          this._assignedIds.add(Number(ordenId))
          this.orders = this.orders.filter(o => Number(o.id) !== Number(ordenId)) // desaparecer ya
        }

        await this.loadAssignments().catch(() => {})
      } catch (e) {
        alert('No se pudo guardar la asignación')
        console.error(e)
      } finally {
        this.saving[ordenId] = false
      }
    }
  },

  async mounted() {
    await this.reload()
    this._refreshTimer = setInterval(() => {
      this.loadOrders()
        .then(() => this.loadAssignments())
        .catch(() => {})
    }, 60000)
  },

  beforeUnmount() {
    if (this._refreshTimer) clearInterval(this._refreshTimer)
  }
}
</script>

<style scoped>
*{margin:0;padding:0;box-sizing:border-box}
.supervisor-container{min-height:100vh;background:linear-gradient(135deg,#0f1419 0%,#1a1f26 100%);color:#e1e8ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.header{background:rgba(20,25,30,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(79,209,197,.2);position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.header-content{max-width:1600px;margin:0 auto;padding:1.2rem 2rem;display:flex;justify-content:space-between;align-items:center}
.title{display:flex;align-items:center;gap:.8rem;font-size:1.5rem;font-weight:700;color:#4fd1c5}
.title .icon{width:32px;height:32px;stroke-width:2}
.btn-logout{display:flex;align-items:center;gap:.5rem;padding:.6rem 1.2rem;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#ef4444;cursor:pointer;transition:all .3s ease;font-size:.95rem;font-weight:500}
.btn-logout:hover{background:rgba(239,68,68,.2);transform:translateY(-2px)}
.main-content{max-width:1600px;margin:0 auto;padding:2rem}
.section-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
.section-header h2{font-size:1.5rem;color:#4fd1c5;font-weight:600}
.orders-table-section{background:rgba(20,25,30,.6);border:1px solid rgba(79,209,197,.2);border-radius:12px;padding:2rem}
.table-container{overflow-x:auto}
.orders-table{width:100%;border-collapse:collapse}
.orders-table thead{background:rgba(79,209,197,.1)}
.orders-table th{padding:1rem;text-align:left;color:#4fd1c5;font-weight:600;font-size:.9rem;border-bottom:2px solid rgba(79,209,197,.3)}
.orders-table td{padding:1.2rem 1rem;border-bottom:1px solid rgba(79,209,197,.1)}
.orders-table tbody tr{transition:all .3s ease}
.orders-table tbody tr:hover{background:rgba(79,209,197,.05)}
.order-id{font-weight:700;color:#4fd1c5;font-size:1rem}
.customer-cell{display:flex;flex-direction:column;gap:.3rem}
.customer-cell strong{color:#e1e8ed}
.no-results{text-align:center;padding:3rem;color:#9ca3af}
.no-results svg{width:60px;height:60px;color:#4fd1c5;opacity:.5;margin-bottom:1rem;stroke-width:1.5}
.skeleton{position:relative;overflow:hidden;background:rgba(79,209,197,.08);border-radius:8px}
.skeleton.pill{border-radius:999px}
.skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(79,209,197,.15) 50%,rgba(255,255,255,0) 100%);animation:shimmer 1.3s infinite}
@keyframes shimmer{100%{transform:translateX(100%)}}
.operator-cell{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.filter-select{padding:.6rem .8rem;background:rgba(15,20,25,.7);border:1px solid rgba(79,209,197,.3);border-radius:8px;color:#e1e8ed;font-size:.95rem;cursor:pointer;min-width:260px}
.filter-select:focus{outline:none;border-color:#4fd1c5;box-shadow:0 0 0 3px rgba(79,209,197,.1)}
.btn-assign{display:flex;align-items:center;gap:.4rem;padding:.55rem .9rem;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);border-radius:8px;color:#22c55e;cursor:pointer;transition:all .2s ease;font-size:.92rem;font-weight:600}
.btn-assign svg{width:18px;height:18px;stroke-width:3}
.btn-assign:hover{background:rgba(34,197,94,.2);transform:translateY(-1px)}
.btn-assign:disabled{opacity:.6;cursor:not-allowed;transform:none}
.saving-hint{color:#9ca3af;font-size:.85rem}
.assigned-hint{color:#4fd1c5;font-size:.85rem}
</style>