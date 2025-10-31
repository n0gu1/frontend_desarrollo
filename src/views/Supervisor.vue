<template>
  <div class="supervisor-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Panel Supervisor
        </h1>
        <button @click="logout" class="btn-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Dashboard Overview -->
      <div class="dashboard-grid">
        <div class="stat-card-large">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div class="stat-info-large">
            <h3>{{ totalOrders }}</h3>
            <p>Órdenes Totales</p>
          </div>
        </div>

        <div class="stat-card-large">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-info-large">
            <h3>{{ pendingOrders }}</h3>
            <p>En Proceso</p>
          </div>
        </div>

        <div class="stat-card-large">
          <div class="stat-icon delivery">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
              <polygon points="12 15 17 21 7 21 12 15"/>
            </svg>
          </div>
          <div class="stat-info-large">
            <h3>{{ inDelivery }}</h3>
            <p>En Reparto</p>
          </div>
        </div>

        <div class="stat-card-large">
          <div class="stat-icon completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-info-large">
            <h3>{{ completedToday }}</h3>
            <p>Completadas Hoy</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Estado:</label>
          <select v-model="filterStatus" class="filter-select">
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="printing">Imprimiendo</option>
            <option value="programming">Programando NFC</option>
            <option value="ready">Listo para reparto</option>
            <option value="in_delivery">En reparto</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Operador:</label>
          <select v-model="filterOperator" class="filter-select">
            <option value="all">Todos</option>
            <option v-for="op in operators" :key="op.id" :value="op.id">
              {{ op.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Repartidor:</label>
          <select v-model="filterDelivery" class="filter-select">
            <option value="all">Todos</option>
            <option v-for="del in deliveryPersons" :key="del.id" :value="del.id">
              {{ del.name }}
            </option>
          </select>
        </div>

        <button @click="clearFilters" class="btn-clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Limpiar Filtros
        </button>
      </div>

      <!-- Orders Table -->
      <div class="orders-table-section">
        <div class="section-header">
          <h2>Seguimiento de Órdenes</h2>
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar orden o cliente..."
              class="search-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Operador</th>
                <th>Repartidor</th>
                <th>Estado</th>
                <th>Progreso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in filteredOrders" :key="order.id">
                <td>
                  <span class="order-id">#{{ order.id }}</span>
                </td>
                <td>
                  <div class="customer-cell">
                    <strong>{{ order.customerName }}</strong>
                    <span class="customer-phone">{{ order.phone }}</span>
                  </div>
                </td>
                <td>
                  <div class="person-badge" :class="order.operator ? 'assigned' : 'unassigned'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ order.operator || 'Sin asignar' }}
                  </div>
                </td>
                <td>
                  <div class="person-badge" :class="order.deliveryPerson ? 'assigned' : 'unassigned'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
                      <polygon points="12 15 17 21 7 21 12 15"/>
                    </svg>
                    {{ order.deliveryPerson || 'Sin asignar' }}
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="order.status">
                    {{ getStatusText(order.status) }}
                  </span>
                </td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: order.progress + '%' }"></div>
                    <span class="progress-text">{{ order.progress }}%</span>
                  </div>
                </td>
                <td>
                  <button @click="viewOrderDetails(order)" class="btn-view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredOrders.length === 0" class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <p>No se encontraron órdenes</p>
          </div>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button @click="closeModal" class="btn-close-modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div class="modal-header">
            <h2>Orden #{{ selectedOrder.id }}</h2>
            <span class="status-badge" :class="selectedOrder.status">
              {{ getStatusText(selectedOrder.status) }}
            </span>
          </div>

          <div class="modal-body">
            <!-- Timeline -->
            <div class="timeline-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Línea de Tiempo
              </h3>
              <div class="timeline">
                <div 
                  v-for="(event, index) in selectedOrder.timeline" 
                  :key="index"
                  class="timeline-item"
                  :class="{ active: event.completed }"
                >
                  <div class="timeline-marker">
                    <svg v-if="event.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <div v-else class="timeline-dot"></div>
                  </div>
                  <div class="timeline-content">
                    <h4>{{ event.title }}</h4>
                    <p>{{ event.description }}</p>
                    <span v-if="event.timestamp" class="timeline-time">{{ event.timestamp }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="info-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Información del Cliente
              </h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nombre:</span>
                  <span class="info-value">{{ selectedOrder.customerName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Teléfono:</span>
                  <span class="info-value">{{ selectedOrder.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Dirección:</span>
                  <span class="info-value">{{ selectedOrder.address }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Precio:</span>
                  <span class="info-value price">Q{{ selectedOrder.price.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Assignment Info -->
            <div class="info-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Asignaciones
              </h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Operador:</span>
                  <span class="info-value">{{ selectedOrder.operator || 'Sin asignar' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Repartidor:</span>
                  <span class="info-value">{{ selectedOrder.deliveryPerson || 'Sin asignar' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tipo NFC:</span>
                  <span class="info-value">{{ selectedOrder.nfcType }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Método de Pago:</span>
                  <span class="info-value">{{ selectedOrder.paymentMethod || 'Pendiente' }}</span>
                </div>
              </div>
            </div>

            <!-- Messages to Customer -->
            <div class="messages-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Mensajes Enviados al Cliente
              </h3>
              <div class="messages-list">
                <div 
                  v-for="(message, index) in selectedOrder.customerMessages" 
                  :key="index"
                  class="message-item"
                >
                  <div class="message-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div class="message-content">
                    <p>{{ message.text }}</p>
                    <span class="message-time">{{ message.timestamp }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'SupervisorView',
  data() {
    return {
      totalOrders: 45,
      pendingOrders: 12,
      inDelivery: 8,
      completedToday: 15,
      filterStatus: 'all',
      filterOperator: 'all',
      filterDelivery: 'all',
      searchQuery: '',
      selectedOrder: null,
      operators: [
        { id: 'op1', name: 'Juan Pérez' },
        { id: 'op2', name: 'Ana García' },
        { id: 'op3', name: 'Luis Torres' }
      ],
      deliveryPersons: [
        { id: 'del1', name: 'Carlos López' },
        { id: 'del2', name: 'María Rodríguez' },
        { id: 'del3', name: 'Pedro Martínez' }
      ],
      orders: [
        {
          id: '2845',
          customerName: 'Carlos Méndez',
          phone: '+502 1234-5678',
          address: 'Zona 10, Ciudad de Guatemala',
          operator: 'Juan Pérez',
          deliveryPerson: 'Carlos López',
          status: 'in_delivery',
          progress: 85,
          price: 185.00,
          nfcType: 'Link',
          paymentMethod: null,
          timeline: [
            { title: 'Orden Recibida', description: 'El cliente realizó su orden', completed: true, timestamp: '10:30 AM' },
            { title: 'Impresión', description: 'Fotografías enviadas a imprimir', completed: true, timestamp: '10:45 AM' },
            { title: 'Calidad Aprobada', description: 'Impresión validada correctamente', completed: true, timestamp: '11:00 AM' },
            { title: 'NFC Programado', description: 'Chip NFC programado exitosamente', completed: true, timestamp: '11:15 AM' },
            { title: 'En Reparto', description: 'Producto asignado a repartidor', completed: true, timestamp: '11:30 AM' },
            { title: 'En Camino', description: 'Repartidor en camino al cliente', completed: true, timestamp: '11:45 AM' },
            { title: 'Entregado', description: 'Pendiente de entrega', completed: false, timestamp: null }
          ],
          customerMessages: [
            { text: '¡Tu pedido ha sido recibido! Estamos preparándolo con cuidado.', timestamp: '10:30 AM' },
            { text: 'Tu producto está siendo impreso. ¡Pronto estará listo!', timestamp: '10:45 AM' },
            { text: 'Estamos programando tu llavero NFC con la información proporcionada.', timestamp: '11:15 AM' },
            { text: '¡Tu producto está listo y en camino! El repartidor llegará pronto.', timestamp: '11:45 AM' }
          ]
        },
        {
          id: '2846',
          customerName: 'María González',
          phone: '+502 9876-5432',
          address: 'Zona 15, Vista Hermosa II',
          operator: 'Ana García',
          deliveryPerson: null,
          status: 'ready',
          progress: 75,
          price: 185.00,
          nfcType: 'Contacto',
          paymentMethod: null,
          timeline: [
            { title: 'Orden Recibida', description: 'El cliente realizó su orden', completed: true, timestamp: '11:00 AM' },
            { title: 'Impresión', description: 'Fotografías enviadas a imprimir', completed: true, timestamp: '11:15 AM' },
            { title: 'Calidad Aprobada', description: 'Impresión validada correctamente', completed: true, timestamp: '11:30 AM' },
            { title: 'NFC Programado', description: 'Chip NFC programado exitosamente', completed: true, timestamp: '11:45 AM' },
            { title: 'Listo para Reparto', description: 'Esperando asignación de repartidor', completed: true, timestamp: '12:00 PM' },
            { title: 'En Reparto', description: 'Pendiente de asignación', completed: false, timestamp: null },
            { title: 'Entregado', description: 'Pendiente', completed: false, timestamp: null }
          ],
          customerMessages: [
            { text: '¡Tu pedido ha sido recibido! Estamos preparándolo con cuidado.', timestamp: '11:00 AM' },
            { text: 'Tu producto está siendo impreso. ¡Pronto estará listo!', timestamp: '11:15 AM' },
            { text: 'Estamos programando tu llavero NFC con la información proporcionada.', timestamp: '11:45 AM' },
            { text: '¡Tu producto está listo! Pronto será asignado a un repartidor.', timestamp: '12:00 PM' }
          ]
        },
        {
          id: '2847',
          customerName: 'José Ramírez',
          phone: '+502 5555-1234',
          address: 'Zona 1, Centro Histórico',
          operator: 'Juan Pérez',
          deliveryPerson: null,
          status: 'programming',
          progress: 50,
          price: 185.00,
          nfcType: 'Link',
          paymentMethod: null,
          timeline: [
            { title: 'Orden Recibida', description: 'El cliente realizó su orden', completed: true, timestamp: '12:00 PM' },
            { title: 'Impresión', description: 'Fotografías enviadas a imprimir', completed: true, timestamp: '12:15 PM' },
            { title: 'Calidad Aprobada', description: 'Impresión validada correctamente', completed: true, timestamp: '12:30 PM' },
            { title: 'NFC Programado', description: 'Programando chip NFC', completed: false, timestamp: null },
            { title: 'Listo para Reparto', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'En Reparto', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'Entregado', description: 'Pendiente', completed: false, timestamp: null }
          ],
          customerMessages: [
            { text: '¡Tu pedido ha sido recibido! Estamos preparándolo con cuidado.', timestamp: '12:00 PM' },
            { text: 'Tu producto está siendo impreso. ¡Pronto estará listo!', timestamp: '12:15 PM' },
            { text: 'Estamos programando tu llavero NFC con la información proporcionada.', timestamp: '12:35 PM' }
          ]
        },
        {
          id: '2848',
          customerName: 'Laura Martínez',
          phone: '+502 7777-9999',
          address: 'Zona 4, Mixco',
          operator: 'Luis Torres',
          deliveryPerson: null,
          status: 'pending',
          progress: 10,
          price: 185.00,
          nfcType: 'Link',
          paymentMethod: null,
          timeline: [
            { title: 'Orden Recibida', description: 'El cliente realizó su orden', completed: true, timestamp: '12:45 PM' },
            { title: 'Impresión', description: 'Pendiente de iniciar', completed: false, timestamp: null },
            { title: 'Calidad Aprobada', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'NFC Programado', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'Listo para Reparto', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'En Reparto', description: 'Pendiente', completed: false, timestamp: null },
            { title: 'Entregado', description: 'Pendiente', completed: false, timestamp: null }
          ],
          customerMessages: [
            { text: '¡Tu pedido ha sido recibido! Estamos preparándolo con cuidado.', timestamp: '12:45 PM' }
          ]
        },
        {
          id: '2844',
          customerName: 'Roberto Silva',
          phone: '+502 3333-4444',
          address: 'Zona 11, Las Charcas',
          operator: 'Ana García',
          deliveryPerson: 'María Rodríguez',
          status: 'delivered',
          progress: 100,
          price: 185.00,
          nfcType: 'Contacto',
          paymentMethod: 'Efectivo',
          timeline: [
            { title: 'Orden Recibida', description: 'El cliente realizó su orden', completed: true, timestamp: '09:00 AM' },
            { title: 'Impresión', description: 'Fotografías enviadas a imprimir', completed: true, timestamp: '09:15 AM' },
            { title: 'Calidad Aprobada', description: 'Impresión validada correctamente', completed: true, timestamp: '09:30 AM' },
            { title: 'NFC Programado', description: 'Chip NFC programado exitosamente', completed: true, timestamp: '09:45 AM' },
            { title: 'Listo para Reparto', description: 'Producto listo', completed: true, timestamp: '10:00 AM' },
            { title: 'En Reparto', description: 'Producto asignado a repartidor', completed: true, timestamp: '10:15 AM' },
            { title: 'Entregado', description: 'Entrega completada - Pago en efectivo', completed: true, timestamp: '10:45 AM' }
          ],
          customerMessages: [
            { text: '¡Tu pedido ha sido recibido! Estamos preparándolo con cuidado.', timestamp: '09:00 AM' },
            { text: 'Tu producto está siendo impreso. ¡Pronto estará listo!', timestamp: '09:15 AM' },
            { text: 'Estamos programando tu llavero NFC con la información proporcionada.', timestamp: '09:45 AM' },
            { text: '¡Tu producto está listo y en camino! El repartidor llegará pronto.', timestamp: '10:15 AM' },
            { text: '¡Entrega completada! Gracias por tu compra.', timestamp: '10:45 AM' }
          ]
        }
      ]
    }
  },
  computed: {
    filteredOrders() {
      return this.orders.filter(order => {
        const matchesStatus = this.filterStatus === 'all' || order.status === this.filterStatus;
        const matchesOperator = this.filterOperator === 'all' || order.operator === this.getOperatorName(this.filterOperator);
        const matchesDelivery = this.filterDelivery === 'all' || order.deliveryPerson === this.getDeliveryPersonName(this.filterDelivery);
        const matchesSearch = this.searchQuery === '' || 
          order.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        return matchesStatus && matchesOperator && matchesDelivery && matchesSearch;
      });
    }
  },
  methods: {
    logout() {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('Cerrando sesión...');
      }
    },
    getStatusText(status) {
      const statusMap = {
        'pending': 'Pendiente',
        'printing': 'Imprimiendo',
        'programming': 'Programando NFC',
        'ready': 'Listo para reparto',
        'in_delivery': 'En reparto',
        'delivered': 'Entregado'
      };
      return statusMap[status] || status;
    },
    getOperatorName(id) {
      const operator = this.operators.find(op => op.id === id);
      return operator ? operator.name : '';
    },
    getDeliveryPersonName(id) {
      const person = this.deliveryPersons.find(del => del.id === id);
      return person ? person.name : '';
    },
    clearFilters() {
      this.filterStatus = 'all';
      this.filterOperator = 'all';
      this.filterDelivery = 'all';
      this.searchQuery = '';
    },
    viewOrderDetails(order) {
      this.selectedOrder = { ...order };
    },
    closeModal() {
      this.selectedOrder = null;
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.supervisor-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f26 100%);
  color: #e1e8ed;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  background: rgba(20, 25, 30, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(79, 209, 197, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #4fd1c5;
}

.title .icon {
  width: 32px;
  height: 32px;
  stroke-width: 2;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-logout svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

/* Main Content */
.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card-large {
  background: rgba(20, 25, 30, 0.6);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 12px;
  padding: 1.8rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.stat-card-large:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(79, 209, 197, 0.15);
  border-color: rgba(79, 209, 197, 0.4);
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 35px;
  height: 35px;
  stroke-width: 2;
}

.stat-icon.total {
  background: rgba(79, 209, 197, 0.1);
  color: #4fd1c5;
}

.stat-icon.pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.stat-icon.delivery {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.completed {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-info-large h3 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4fd1c5;
  margin-bottom: 0.3rem;
}

.stat-info-large p {
  color: #9ca3af;
  font-size: 1rem;
}

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(20, 25, 30, 0.6);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  color: #4fd1c5;
  font-size: 0.9rem;
  font-weight: 600;
}

.filter-select {
  padding: 0.8rem;
  background: rgba(15, 20, 25, 0.7);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 8px;
  color: #e1e8ed;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #4fd1c5;
  box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.1);
}

.filter-select option {
  background: #1a1f26;
  color: #e1e8ed;
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  align-self: flex-end;
}

.btn-clear svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.btn-clear:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

/* Orders Table Section */
.orders-table-section {
  background: rgba(20, 25, 30, 0.6);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 12px;
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #4fd1c5;
  font-weight: 600;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
  flex: 1;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: #4fd1c5;
  stroke-width: 2;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 3rem;
  background: rgba(15, 20, 25, 0.7);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 8px;
  color: #e1e8ed;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4fd1c5;
  box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.1);
}

.search-input::placeholder {
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table thead {
  background: rgba(79, 209, 197, 0.1);
}

.orders-table th {
  padding: 1rem;
  text-align: left;
  color: #4fd1c5;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 2px solid rgba(79, 209, 197, 0.3);
}

.orders-table td {
  padding: 1.2rem 1rem;
  border-bottom: 1px solid rgba(79, 209, 197, 0.1);
}

.orders-table tbody tr {
  transition: all 0.3s ease;
}

.orders-table tbody tr:hover {
  background: rgba(79, 209, 197, 0.05);
}

.order-id {
  font-weight: 700;
  color: #4fd1c5;
  font-size: 1rem;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.customer-cell strong {
  color: #e1e8ed;
}

.customer-phone {
  color: #9ca3af;
  font-size: 0.85rem;
}

.person-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  width: fit-content;
}

.person-badge svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.person-badge.assigned {
  background: rgba(79, 209, 197, 0.1);
  color: #4fd1c5;
  border: 1px solid rgba(79, 209, 197, 0.2);
}

.person-badge.unassigned {
  background: rgba(107, 114, 128, 0.1);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.status-badge.pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-badge.printing {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.status-badge.programming {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.ready {
  background: rgba(79, 209, 197, 0.2);
  color: #4fd1c5;
  border: 1px solid rgba(79, 209, 197, 0.3);
}

.status-badge.in_delivery {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.delivered {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.progress-bar {
  position: relative;
  width: 120px;
  height: 28px;
  background: rgba(15, 20, 25, 0.7);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 14px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fd1c5 0%, #38b2ac 100%);
  transition: width 0.5s ease;
  border-radius: 14px;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 700;
  color: #e1e8ed;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.btn-view {
  padding: 0.6rem;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 6px;
  color: #4fd1c5;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-view svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.btn-view:hover {
  background: rgba(79, 209, 197, 0.2);
  transform: scale(1.1);
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-results svg {
  width: 60px;
  height: 60px;
  color: #4fd1c5;
  opacity: 0.5;
  margin-bottom: 1rem;
  stroke-width: 1.5;
}

.no-results p {
  font-size: 1.1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: rgba(20, 25, 30, 0.95);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.btn-close-modal {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 40px;
  height: 40px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close-modal svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.btn-close-modal:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: rotate(90deg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(79, 209, 197, 0.2);
  padding-right: 3rem;
}

.modal-header h2 {
  font-size: 2rem;
  color: #4fd1c5;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Timeline */
.timeline-section h3,
.info-section h3,
.messages-section h3 {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  color: #4fd1c5;
  margin-bottom: 1.5rem;
}

.timeline-section h3 svg,
.info-section h3 svg,
.messages-section h3 svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.6rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(79, 209, 197, 0.2);
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  padding-left: 2rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 0.3rem;
  width: 28px;
  height: 28px;
  background: rgba(20, 25, 30, 0.9);
  border: 2px solid rgba(79, 209, 197, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-item.active .timeline-marker {
  border-color: #4fd1c5;
  background: rgba(79, 209, 197, 0.2);
}

.timeline-marker svg {
  width: 14px;
  height: 14px;
  color: #4fd1c5;
  stroke-width: 3;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  background: rgba(79, 209, 197, 0.3);
  border-radius: 50%;
}

.timeline-item.active .timeline-dot {
  background: #4fd1c5;
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
}

.timeline-content h4 {
  color: #e1e8ed;
  font-size: 1rem;
  margin-bottom: 0.3rem;
}

.timeline-item.active .timeline-content h4 {
  color: #4fd1c5;
}

.timeline-content p {
  color: #9ca3af;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.timeline-time {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

/* Info Section */
.info-section {
  background: rgba(15, 20, 25, 0.5);
  border: 1px solid rgba(79, 209, 197, 0.15);
  border-radius: 10px;
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 600;
}

.info-value {
  color: #e1e8ed;
  font-size: 1rem;
}

.info-value.price {
  color: #4fd1c5;
  font-weight: 700;
  font-size: 1.3rem;
}

/* Messages Section */
.messages-section {
  background: rgba(15, 20, 25, 0.5);
  border: 1px solid rgba(79, 209, 197, 0.15);
  border-radius: 10px;
  padding: 1.5rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(79, 209, 197, 0.05);
  border-left: 3px solid #4fd1c5;
  border-radius: 8px;
}

.message-icon {
  width: 36px;
  height: 36px;
  background: rgba(79, 209, 197, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-icon svg {
  width: 18px;
  height: 18px;
  color: #4fd1c5;
  stroke-width: 2.5;
}

.message-content {
  flex: 1;
}

.message-content p {
  color: #e1e8ed;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.message-time {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

/* Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(15, 20, 25, 0.5);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(79, 209, 197, 0.3);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 209, 197, 0.5);
}

/* Responsive */
@media (max-width: 1200px) {
  .orders-table {
    font-size: 0.9rem;
  }
  
  .orders-table th,
  .orders-table td {
    padding: 0.8rem 0.6rem;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .table-container {
    overflow-x: scroll;
  }
  
  .orders-table {
    min-width: 900px;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>