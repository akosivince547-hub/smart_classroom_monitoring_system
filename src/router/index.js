import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../stores/auth.js";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";

const routes = [
  {
    path: "/",
    redirect: () => {
      return auth.isLoggedIn.value ? "/dashboard" : "/login";
    },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { guest: true },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const loggedIn = auth.isLoggedIn.value;

  if (to.meta.requiresAuth && !loggedIn) {
    // Not logged in — redirect to login
    next({ name: "Login" });
  } else if (to.meta.guest && loggedIn) {
    // Already logged in — redirect to dashboard
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;

