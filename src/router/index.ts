import { createRouter, createWebHistory } from 'vue-router'
import RegistrationForm from '../components/RegistrationForm.vue'
import LoginView from '../views/LoginView.vue'
import RegistroConPDF from '../views/RegistroConPDF.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import Shop from '../views/Shop.vue'
import Cart from '../views/Cart.vue'
import Customize from '../views/Customize.vue'
import Checkout from '../views/Checkout.vue'
import DashboardView from '../views/DashboardView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/registro' },
    { path: '/registro', component: RegistrationForm },
    { path: '/login', component: LoginView },
    { path: '/registro-emailpdf', component: RegistroConPDF },
    { path: '/olvido', component: ForgotPassword },
    { path: '/reset-password', component: ResetPassword },
    { path: '/shop', component: Shop },
    { path: '/cart', component: Cart },
    { path: '/customize', component: Customize },
    { path: '/checkout', component: () => import('../views/Checkout.vue') },
    { path: '/tracking/:folio', component: () => import('../views/OrderTracking.vue') },
    { path: '/tracking-admin', component: () => import('../views/TrackingAdmin.vue') },
    { path: '/orders/history', component: () => import('../views/OrderHistory.vue') },
    { path: '/dashboard', component: DashboardView },
    { path: '/operador', component: () => import('../views/operador.vue') },
    { path: '/repartidor', component: () => import('../views/Repartidor.vue') },
    { path: '/supervisor', component: () => import('../views/Supervisor.vue') },
  ],
})