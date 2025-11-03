<!-- src/views/Repartidor.vue -->
<template>
  <div class="repartidor-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
            <polygon points="12 15 17 21 7 21 12 15"/>
          </svg>
          Panel Repartidor
        </h1>

        <div class="header-actions">
          <button @click="loadReadyOrders" class="btn-refresh" :disabled="loading || actionLoading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"/>
            </svg>
            {{ loading ? 'Cargando…' : 'Recargar' }}
          </button>

          <button @click="logout" class="btn-logout" :disabled="actionLoading">
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
      <!-- Mensaje de error -->
      <div v-if="error" class="error-banner">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Vista Listado de Órdenes -->
      <div v-if="currentView === 'orders'" class="orders-view">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>{{ assignedOrders.length }}</h3>
              <p>Órdenes READY</p>
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
          <div class="stat-card">
            <div class="stat-icon money">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-info">
              <h3>Q{{ totalCollected.toFixed(2) }}</h3>
              <p>Cobrado Hoy</p>
            </div>
          </div>
        </div>

        <div class="orders-section">
          <h2 class="section-title">Órdenes READY (todas)</h2>
          
          <div v-if="loading" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="spin">
              <circle cx="12" cy="12" r="10" style="opacity: .25"/>
              <path d="M22 12a10 10 0 0 0-10-10" />
            </svg>
            <p>Cargando órdenes…</p>
          </div>

          <div v-else-if="assignedOrders.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p>No hay órdenes READY</p>
          </div>

          <div v-else class="orders-list">
            <div 
              v-for="order in assignedOrders" 
              :key="order.folio || order.id"
              class="delivery-card"
              @click="selectOrder(order)"
            >
              <div class="delivery-header">
                <div class="order-info-header">
                  <span class="order-number">#{{ order.folio || order.id }}</span>
                  <span class="priority-badge" :class="order.priority">
                    {{ order.priority === 'high' ? 'Urgente' : 'Normal' }}
                  </span>
                </div>
                <div class="order-price">Q{{ Number(order.price).toFixed(2) }}</div>
              </div>

              <div class="customer-info">
                <div class="info-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <p class="label">Cliente</p>
                    <p class="value">{{ order.customerName }}</p>
                  </div>
                </div>
                <div class="info-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <p class="label">Dirección</p>
                    <p class="value">{{ order.address }}</p>
                  </div>
                </div>
                <div class="info-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <div>
                    <p class="label">Teléfono</p>
                    <p class="value">{{ order.phone }}</p>
                  </div>
                </div>
              </div>

              <button class="btn-deliver">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Procesar Entrega
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Entrega Individual -->
      <div v-else-if="currentView === 'delivery'" class="delivery-view">
        <button @click="backToOrders" class="btn-back" :disabled="actionLoading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div class="delivery-card-detail">
          <div class="detail-header">
            <h2>Orden #{{ selectedOrder.folio || selectedOrder.id }}</h2>
            <span class="price-badge">Q{{ Number(selectedOrder.price).toFixed(2) }}</span>
          </div>

          <!-- Información del Cliente -->
          <div class="detail-section">
            <h3 class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Información del Cliente
            </h3>
            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">{{ selectedOrder.customerName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Teléfono:</span>
                <a :href="'tel:' + selectedOrder.phone" class="info-link">
                  {{ selectedOrder.phone }}
                </a>
              </div>
              <div class="info-item">
                <span class="info-label">Dirección:</span>
                <span class="info-value">{{ selectedOrder.address }}</span>
              </div>
            </div>
          </div>

          <!-- Producto -->
          <div class="detail-section">
            <h3 class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Producto
            </h3>
            <div class="product-info">
              <p><strong>Tipo:</strong> Llavero NFC Personalizado</p>
              <p><strong>NFC:</strong> {{ selectedOrder.nfcType }}</p>
            </div>
          </div>

          <!-- Proceso de Entrega -->
          <div v-if="!orderReceived" class="delivery-process">
            <div class="process-step">
              <div class="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <p class="step-text">¿Confirmas que recibiste el producto y el cliente lo ha recibido?</p>
            </div>
            <button @click="confirmReceived" class="btn-confirm" :disabled="actionLoading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirmar Recibido
            </button>
          </div>

          <!-- Formulario de Pago -->
          <div v-else-if="!paymentCompleted" class="payment-section">
            <div class="payment-header">
              <h3>Forma de Pago</h3>
              <div class="payment-amount">Q{{ Number(selectedOrder.price).toFixed(2) }}</div>
            </div>

            <div class="payment-methods">
              <button 
                v-for="method in paymentMethods" 
                :key="method.id"
                @click="selectPaymentMethod(method.id)"
                class="payment-method"
                :class="{ active: selectedPaymentMethod === method.id }"
                :disabled="actionLoading"
              >
                <div class="method-icon">
                  <component :is="method.icon" />
                </div>
                <span>{{ method.name }}</span>
                <div v-if="selectedPaymentMethod === method.id" class="checkmark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </button>
            </div>

            <div v-if="selectedPaymentMethod === 'transfer'" class="transfer-details">
              <p class="transfer-note">Solicita al cliente el número de referencia de la transferencia</p>
              <input 
                v-model="transferReference" 
                type="text" 
                placeholder="Número de referencia"
                class="input-reference"
                :disabled="actionLoading"
              />
            </div>

            <button 
              @click="confirmPayment" 
              class="btn-confirm-payment"
              :disabled="(selectedPaymentMethod === 'transfer' && !transferReference) || actionLoading"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirmar Pago
            </button>
          </div>

          <!-- Entrega Completada -->
          <div v-else class="completion-section">
            <div class="success-animation">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3>¡Entrega Completada!</h3>
            <p class="completion-text">El cliente ha recibido su orden y el pago ha sido confirmado.</p>
            <div class="completion-details">
              <div class="detail-row">
                <span>Orden:</span>
                <strong>#{{ selectedOrder.folio || selectedOrder.id }}</strong>
              </div>
              <div class="detail-row">
                <span>Método de pago:</span>
                <strong>{{ getPaymentMethodName(selectedPaymentMethod) }}</strong>
              </div>
              <div class="detail-row">
                <span>Monto:</span>
                <strong>Q{{ Number(selectedOrder.price).toFixed(2) }}</strong>
              </div>
            </div>
            <button @click="finishDelivery" class="btn-finish" :disabled="actionLoading">
              Finalizar Entrega
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'RepartidorView',
  data() {
    return {
      currentView: 'orders',
      selectedOrder: null,
      orderReceived: false,
      paymentCompleted: false,
      selectedPaymentMethod: null,
      transferReference: '',
      completedToday: 0,
      totalCollected: 0,
      assignedOrders: [],
      loading: false,
      error: null,
      pageSize: 1000,
      repartidorUsuarioId: null,     // ← se establece en mounted()
      actionLoading: false,          // ← bloquea UI durante llamadas
      // Métodos de pago mostrados en UI
      paymentMethods: [
        { id: 'cash',      name: 'Efectivo',      icon: 'cash-icon' },
        { id: 'transfer',  name: 'Transferencia', icon: 'transfer-icon' },
        { id: 'card',      name: 'Tarjeta',       icon: 'card-icon' },
      ],
    }
  },
  components: {
    'cash-icon': {
      template: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      `
    },
    'transfer-icon': {
      template: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="17 11 12 6 7 11"/>
          <polyline points="17 18 12 13 7 18"/>
        </svg>
      `
    },
    'card-icon': {
      template: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      `
    }
  },
  mounted() {
    // Recupera id del repartidor desde storage (si lo manejas en login)
    this.repartidorUsuarioId = this.restoreCourierId();
    this.loadReadyOrders();
  },
  methods: {
    // === Helpers ===
    apiHeaders() {
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        // agrega Auth aquí si lo necesitas
      };
    },
    async apiGET(url) {
      const r = await fetch(url, { headers: this.apiHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    async apiPOST(url, body) {
      const r = await fetch(url, {
        method: 'POST',
        headers: this.apiHeaders(),
        body: JSON.stringify(body || {})
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`HTTP ${r.status}${txt ? `: ${txt}` : ''}`);
      }
      return r.json().catch(() => ({}));
    },
    restoreCourierId() {
      // intenta leer del storage (ajústalo al nombre que uses en tu login)
      const s = localStorage.getItem('repartidorUsuarioId') || localStorage.getItem('usuarioId');
      const n = Number(s);
      return Number.isFinite(n) && n > 0 ? n : null;
    },

    // Normaliza filas recibidas desde el backend
    normalizeOrder(row) {
      const id = row?.id ?? row?.ordenId ?? row?.orderId ?? null;
      const folio = row?.folio || row?.numero || row?.orderNumber || (id ? String(id) : 'SIN-FOLIO');
      const customerName =
        row?.customerName ||
        row?.nickname ||
        row?.contactoNombre ||
        row?.clienteNombre ||
        (row?.usuario_id ? `Cliente Usuario ${row.usuario_id}` : 'Cliente');

      return {
        id,
        folio,
        customerName,
        address: row?.address || row?.direccion || '',
        phone: row?.phone || row?.telefono || '',
        price: Number(row?.price ?? row?.total ?? row?.monto ?? 0),
        nfcType: row?.nfcType || 'Link',
        priority: row?.priority || 'normal',
        usuario_id: row?.usuario_id ?? null
      }
    },

    async loadReadyOrders() {
      this.loading = true;
      this.error = null;
      try {
        const qp = new URLSearchParams({ limit: String(this.pageSize) });
        if (this.repartidorUsuarioId) qp.set('repartidorUsuarioId', String(this.repartidorUsuarioId));
        const url = `/api/repartidor/orders-ready?` + qp.toString();

        const body = await this.apiGET(url);
        const rows =
          Array.isArray(body)        ? body :
          Array.isArray(body.items)  ? body.items :
          Array.isArray(body.data)   ? body.data :
          Array.isArray(body.rows)   ? body.rows : [];

        this.assignedOrders = rows.map(this.normalizeOrder);
      } catch (err) {
        this.error = err?.message || String(err);
        this.assignedOrders = [];
      } finally {
        this.loading = false;
      }
    },

    logout() {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // limpia storage si aplica
        // localStorage.removeItem('token'); localStorage.removeItem('usuarioId');
        location.reload();
      }
    },

    selectOrder(order) {
      this.selectedOrder = this.normalizeOrder(order);
      this.currentView = 'delivery';
      this.orderReceived = false;
      this.paymentCompleted = false;
      this.selectedPaymentMethod = null;
      this.transferReference = '';
    },

    backToOrders() {
      if (this.orderReceived && !this.paymentCompleted) {
        if (!confirm('El pago aún no se ha completado. ¿Deseas volver?')) {
          return;
        }
      }
      this.currentView = 'orders';
      this.selectedOrder = null;
    },

    // === Flujo de reparto (consume endpoints nuevos) ===
    async confirmReceived() {
      try {
        this.actionLoading = true;
        const folio = this.selectedOrder?.folio || this.selectedOrder?.id;
        await this.apiPOST(`/api/repartidor/orders/${encodeURIComponent(folio)}/confirm-received`, {
          repartidorUsuarioId: this.repartidorUsuarioId
        });
        this.orderReceived = true;
      } catch (e) {
        alert(`No se pudo confirmar recibido: ${e.message}`);
        console.error('confirm-received error', e);
      } finally {
        this.actionLoading = false;
      }
    },

    selectPaymentMethod(methodId) {
      this.selectedPaymentMethod = methodId;
      if (methodId !== 'transfer') this.transferReference = '';
    },

    async confirmPayment() {
      if (this.selectedPaymentMethod === 'transfer' && !this.transferReference) {
        alert('Por favor ingresa el número de referencia');
        return;
      }
      try {
        this.actionLoading = true;
        const folio = this.selectedOrder?.folio || this.selectedOrder?.id;
        await this.apiPOST(`/api/repartidor/orders/${encodeURIComponent(folio)}/confirm-payment`, {
          method: this.selectedPaymentMethod,                   // 'cash' | 'transfer' | 'card'
          reference: this.transferReference || null,
          repartidorUsuarioId: this.repartidorUsuarioId
        });
        this.paymentCompleted = true;
      } catch (e) {
        alert(`No se pudo registrar el pago: ${e.message}`);
        console.error('confirm-payment error', e);
      } finally {
        this.actionLoading = false;
      }
    },

    async finishDelivery() {
      const folio = this.selectedOrder?.folio || this.selectedOrder?.id;
      try {
        this.actionLoading = true;

        // 1) endpoint oficial
        try {
          await this.apiPOST(`/api/repartidor/orders/${encodeURIComponent(folio)}/finish-delivery`, {
            repartidorUsuarioId: this.repartidorUsuarioId
          });
        } catch (e1) {
          // 2) alias de compatibilidad (/finish) por si tu backend lo expone
          console.warn('finish-delivery falló, probando alias /finish', e1);
          await this.apiPOST(`/api/repartidor/orders/${encodeURIComponent(folio)}/finish`, {
            repartidorUsuarioId: this.repartidorUsuarioId
          });
        }

        // Remueve de la lista
        const key = (o) => (o.folio || o.id);
        const index = this.assignedOrders.findIndex(o => key(o) === key(this.selectedOrder));
        if (index > -1) this.assignedOrders.splice(index, 1);

        this.completedToday++;
        this.totalCollected += Number(this.selectedOrder.price || 0);

        alert('✓ Entrega finalizada exitosamente');
        this.currentView = 'orders';
        this.selectedOrder = null;
      } catch (e) {
        alert(`No se pudo finalizar la entrega: ${e.message}`);
        console.error('finish-delivery error', e);
      } finally {
        this.actionLoading = false;
      }
    },

    // (queda para compatibilidad si lo seguías usando en consola)
    async updateOrderStatus(status, data = null) {
      const folio = this.selectedOrder?.folio || this.selectedOrder?.id;
      console.log(`updateOrderStatus -> ${folio}: ${status}`, data);
    },

    getPaymentMethodName(methodId) {
      const method = this.paymentMethods.find(m => m.id === methodId);
      return method ? method.name : '';
    }
  }
}
</script>

<style scoped>
/* ====== estilos (sin cambios sustanciales) ====== */
* { margin: 0; padding: 0; box-sizing: border-box; }
.repartidor-container { min-height: 100vh; background: linear-gradient(135deg, #0f1419 0%, #1a1f26 100%); color: #e1e8ed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.header { background: rgba(20, 25, 30, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(79, 209, 197, 0.2); position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,.3); }
.header-content { max-width: 1400px; margin: 0 auto; padding: 1.2rem 2rem; display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; align-items: center; gap: .6rem; }
.title { display: flex; align-items: center; gap: .8rem; font-size: 1.5rem; font-weight: 700; color: #4fd1c5; }
.title .icon { width: 32px; height: 32px; stroke-width: 2; }
.btn-refresh { display: flex; align-items: center; gap: .5rem; padding: .6rem 1rem; background: rgba(79,209,197,.12); border: 1px solid rgba(79,209,197,.35); border-radius: 8px; color: #4fd1c5; cursor: pointer; transition: all .3s ease; font-size: .95rem; font-weight: 600; }
.btn-refresh svg { width: 18px; height: 18px; stroke-width: 2; }
.btn-refresh:hover { background: rgba(79,209,197,.2); transform: translateY(-1px); }
.btn-refresh:disabled { opacity: .6; cursor: not-allowed; }
.btn-logout { display: flex; align-items: center; gap: .5rem; padding: .6rem 1.2rem; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; color: #ef4444; cursor: pointer; transition: all .3s ease; font-size: .95rem; font-weight: 500; }
.btn-logout svg { width: 18px; height: 18px; stroke-width: 2; }
.btn-logout:hover { background: rgba(239,68,68,.2); transform: translateY(-2px); }
.error-banner { margin: 1rem auto 0; max-width: 1400px; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.35); color: #fecaca; padding: .8rem 1rem; border-radius: 8px; }
.main-content { max-width: 1400px; margin: 0 auto; padding: 2rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
.stat-card { background: rgba(20,25,30,.6); border: 1px solid rgba(79,209,197,.2); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; transition: all .3s ease; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(79,209,197,.15); border-color: rgba(79,209,197,.4); }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon svg { width: 30px; height: 30px; stroke-width: 2; }
.stat-icon.pending { background: rgba(251,191,36,.1); color: #fbbf24; }
.stat-icon.completed { background: rgba(34,197,94,.1); color: #22c55e; }
.stat-icon.money { background: rgba(79,209,197,.1); color: #4fd1c5; }
.stat-info h3 { font-size: 2rem; font-weight: 700; color: #4fd1c5; }
.stat-info p { color: #9ca3af; font-size: .9rem; }
.orders-section { margin-top: 2rem; }
.section-title { font-size: 1.5rem; color: #4fd1c5; margin-bottom: 1.5rem; font-weight: 600; }
.empty-state { text-align: center; padding: 4rem 2rem; background: rgba(20,25,30,.4); border-radius: 12px; border: 1px dashed rgba(79,209,197,.3); }
.empty-state svg { width: 80px; height: 80px; color: #4fd1c5; opacity: .5; margin-bottom: 1rem; stroke-width: 1.5; }
.empty-state .spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state p { color: #9ca3af; font-size: 1.1rem; }
.orders-list { display: grid; gap: 1.5rem; }
.delivery-card { background: rgba(20,25,30,.6); border: 1px solid rgba(79,209,197,.2); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all .3s ease; }
.delivery-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(79,209,197,.2); border-color: rgba(79,209,197,.5); }
.delivery-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(79,209,197,.1); }
.order-info-header { display: flex; flex-direction: column; gap: .5rem; }
.order-number { font-size: 1.3rem; font-weight: 700; color: #4fd1c5; }
.priority-badge { padding: .3rem .8rem; border-radius: 20px; font-size: .75rem; font-weight: 600; width: fit-content; }
.priority-badge.high { background: rgba(239,68,68,.2); color: #ef4444; border: 1px solid rgba(239,68,68,.3); animation: pulse-red 2s ease-in-out infinite; }
@keyframes pulse-red { 0%,100%{ box-shadow:0 0 0 0 rgba(239,68,68,.4);} 50%{ box-shadow:0 0 0 10px rgba(239,68,68,0);} }
.priority-badge.normal { background: rgba(79,209,197,.2); color: #4fd1c5; border: 1px solid rgba(79,209,197,.3); }
.order-price { font-size: 1.8rem; font-weight: 700; color: #4fd1c5; }
.customer-info { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.info-row { display: flex; align-items: flex-start; gap: 1rem; }
.info-row svg { width: 20px; height: 20px; color: #4fd1c5; flex-shrink: 0; margin-top: .2rem; stroke-width: 2; }
.label { font-size: .8rem; color: #9ca3af; margin-bottom: .2rem; }
.value { color: #e1e8ed; font-size: .95rem; line-height: 1.4; }
.btn-deliver { width: 100%; padding: 1rem; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); border: none; border-radius: 8px; color: #0f1419; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .6rem; transition: all .3s ease; font-size: 1rem; }
.btn-deliver svg { width: 20px; height: 20px; stroke-width: 2.5; }
.btn-deliver:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(79,209,197,.3); }
.delivery-view { max-width: 800px; margin: 0 auto; }
.btn-back { display: flex; align-items: center; gap: .5rem; padding: .7rem 1.2rem; background: rgba(79,209,197,.1); border: 1px solid rgba(79,209,197,.3); border-radius: 8px; color: #4fd1c5; cursor: pointer; transition: all .3s ease; margin-bottom: 2rem; font-size: .95rem; font-weight: 500; }
.btn-back svg { width: 18px; height: 18px; stroke-width: 2; }
.btn-back:hover { background: rgba(79,209,197,.2); transform: translateX(-4px); }
.delivery-card-detail { background: rgba(20,25,30,.6); border: 1px solid rgba(79,209,197,.2); border-radius: 12px; padding: 2rem; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(79,209,197,.2); }
.detail-header h2 { font-size: 2rem; color: #4fd1c5; }
.price-badge { font-size: 1.8rem; font-weight: 700; color: #4fd1c5; background: rgba(79,209,197,.1); padding: .5rem 1.2rem; border-radius: 8px; border: 1px solid rgba(79,209,197,.3); }
.detail-section { margin-bottom: 2rem; }
.section-header { display: flex; align-items: center; gap: .8rem; font-size: 1.2rem; color: #4fd1c5; margin-bottom: 1rem; font-weight: 600; }
.section-header svg { width: 24px; height: 24px; stroke-width: 2; }
.detail-info { background: rgba(15,20,25,.5); border: 1px solid rgba(79,209,197,.15); border-radius: 8px; padding: 1.2rem; }
.info-item { display: flex; justify-content: space-between; padding: .8rem 0; border-bottom: 1px solid rgba(79,209,197,.1); }
.info-item:last-child { border-bottom: none; }
.info-label { color: #9ca3af; font-weight: 500; }
.info-value { color: #e1e8ed; text-align: right; }
.info-link { color: #4fd1c5; text-decoration: none; transition: all .3s ease; }
.info-link:hover { color: #38b2ac; text-decoration: underline; }
.product-info { background: rgba(15,20,25,.5); border: 1px solid rgba(79,209,197,.15); border-radius: 8px; padding: 1.2rem; line-height: 1.8; }
.product-info p { color: #9ca3af; }
.product-info strong { color: #4fd1c5; }
.delivery-process { background: rgba(79,209,197,.05); border: 1px solid rgba(79,209,197,.2); border-radius: 12px; padding: 2rem; text-align: center; }
.process-step { margin-bottom: 2rem; }
.step-icon { width: 100px; height: 100px; margin: 0 auto 1.5rem; background: rgba(79,209,197,.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; }
.step-icon svg { width: 50px; height: 50px; color: #4fd1c5; stroke-width: 2; }
@keyframes pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(79,209,197,.4);} 50%{ box-shadow:0 0 0 20px rgba(79,209,197,0);} }
.step-text { color: #e1e8ed; font-size: 1.1rem; line-height: 1.6; }
.btn-confirm { width: 100%; padding: 1.2rem; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); border: none; border-radius: 8px; color: #0f1419; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .6rem; transition: all .3s ease; font-size: 1.1rem; }
.btn-confirm svg { width: 22px; height: 22px; stroke-width: 2.5; }
.btn-confirm:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(79,209,197,.3); }
.payment-section { background: rgba(79,209,197,.05); border: 1px solid rgba(79,209,197,.2); border-radius: 12px; padding: 2rem; }
.payment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(79,209,197,.2); }
.payment-header h3 { font-size: 1.5rem; color: #4fd1c5; }
.payment-amount { font-size: 2rem; font-weight: 700; color: #4fd1c5; }
.payment-methods { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.payment-method { position: relative; padding: 1.5rem 1rem; background: rgba(15,20,25,.5); border: 2px solid rgba(79,209,197,.2); border-radius: 10px; cursor: pointer; transition: all .3s ease; display: flex; flex-direction: column; align-items: center; gap: .8rem; color: #9ca3af; }
.payment-method:hover { border-color: rgba(79,209,197,.4); transform: translateY(-4px); box-shadow: 0 8px 20px rgba(79,209,197,.15); }
.payment-method.active { border-color: #4fd1c5; background: rgba(79,209,197,.1); color: #4fd1c5; }
.method-icon { width: 50px; height: 50px; border-radius: 50%; background: rgba(79,209,197,.1); display: flex; align-items: center; justify-content: center; }
.payment-method.active .method-icon { background: rgba(79,209,197,.2); }
.method-icon svg { width: 26px; height: 26px; stroke-width: 2; color: currentColor; }
.payment-method span { font-weight: 600; font-size: .95rem; }
.checkmark { position: absolute; top: -8px; right: -8px; width: 28px; height: 28px; background: #4fd1c5; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: checkmark .4s ease-in-out; }
.checkmark svg { width: 16px; height: 16px; color: #0f1419; stroke-width: 3; }
@keyframes checkmark { 0%{ transform: scale(0) rotate(45deg);} 50%{ transform: scale(1.2) rotate(45deg);} 100%{ transform: scale(1) rotate(0);} }
.transfer-details { margin-bottom: 1.5rem; }
.transfer-note { color: #9ca3af; margin-bottom: 1rem; font-size: .95rem; }
.input-reference { width: 100%; padding: 1rem; background: rgba(15,20,25,.7); border: 1px solid rgba(79,209,197,.3); border-radius: 8px; color: #e1e8ed; font-size: 1rem; transition: all .3s ease; }
.input-reference:focus { outline: none; border-color: #4fd1c5; box-shadow: 0 0 0 3px rgba(79,209,197,.1); }
.input-reference::placeholder { color: #6b7280; }
.btn-confirm-payment { width: 100%; padding: 1.2rem; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); border: none; border-radius: 8px; color: #0f1419; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .6rem; transition: all .3s ease; font-size: 1.1rem; }
.btn-confirm-payment:disabled { opacity: .5; cursor: not-allowed; }
.btn-confirm-payment:not(:disabled):hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(79,209,197,.3); }
.completion-section { text-align: center; padding: 2rem; background: rgba(34,197,94,.05); border: 1px solid rgba(34,197,94,.2); border-radius: 12px; }
.success-animation { width: 120px; height: 120px; margin: 0 auto 1.5rem; background: rgba(34,197,94,.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: success-pulse .6s ease-in-out; }
.success-animation svg { width: 60px; height: 60px; color: #22c55e; stroke-width: 2; animation: checkmark .6s ease-in-out; }
@keyframes success-pulse { 0%{ transform: scale(0); box-shadow:0 0 0 0 rgba(34,197,94,.4);} 50%{ transform: scale(1.1); box-shadow:0 0 0 30px rgba(34,197,94,0);} 100%{ transform: scale(1); box-shadow:0 0 0 0 rgba(34,197,94,.4);} }
.completion-section h3 { color: #22c55e; font-size: 1.8rem; margin-bottom: .8rem; }
.completion-text { color: #9ca3af; font-size: 1rem; margin-bottom: 2rem; line-height: 1.6; }
.completion-details { background: rgba(15,20,25,.5); border: 1px solid rgba(79,209,197,.15); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
.detail-row { display: flex; justify-content: space-between; padding: .8rem 0; border-bottom: 1px solid rgba(79,209,197,.1); }
.detail-row:last-child { border-bottom: none; }
.detail-row span { color: #9ca3af; }
.detail-row strong { color: #4fd1c5; }
.btn-finish { width: 100%; padding: 1.2rem; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border: none; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .6rem; transition: all .3s ease; font-size: 1.1rem; }
.btn-finish svg { width: 22px; height: 22px; stroke-width: 2.5; }
.btn-finish:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(34,197,94,.3); }
@media (max-width: 768px) { .main-content{ padding:1rem;} .stats-grid{ grid-template-columns:1fr; gap:1rem;} .orders-grid,.orders-list{ grid-template-columns:1fr;} .header-content{ padding:1rem;} .title{ font-size:1.2rem;} .title .icon{ width:24px; height:24px;} }
@media (max-width: 480px) { .stat-card,.stat-card-large{ padding:1rem;} .stat-icon{ width:50px; height:50px;} .stat-info h3,.stat-info-large h3{ font-size:1.5rem;} .section-title{ font-size:1.2rem;} }
</style>