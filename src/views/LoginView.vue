<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../stores/auth.js";

const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);

watch(
  () => auth.state.error,
  () => {},
);

function handleLogin() {
  const success = auth.login({
    email: email.value,
    password: password.value,
  });

  if (success) {
    router.push("/dashboard");
  }
}

function goToRegister() {
  auth.clearError();
  router.push("/register");
}
</script>

<template>
  <main class="auth-shell">
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-brand">
          <a href="/" class="brand" aria-label="SCMS home">
            <span class="brand-mark" aria-hidden="true">SCMS</span>
            <span>
              <strong>Smart Classroom Monitoring System</strong>
              <small>CPSU · San Carlos Campus</small>
            </span>
          </a>
        </div>
        <div class="auth-hero">
          <span class="eyebrow">SMART CLASSROOM MONITORING SYSTEM</span>
          <h1>Welcome<br /><span>back.</span></h1>
          <p>
            Sign in to check room availability, reserve study spaces, and manage
            campus schedules.
          </p>
          <div class="auth-features">
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Real-time room availability</span>
            </div>
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Instant reservations</span>
            </div>
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Schedule management</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <section class="auth-card" aria-labelledby="login-heading">
          <span class="card-icon" aria-hidden="true">✦</span>
          <h2 id="login-heading">Sign in</h2>
          <p>Enter your credentials to access the system.</p>

          <form class="auth-form" @submit.prevent="handleLogin">
            <label class="auth-field">
              Email address
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label class="auth-field">
              Password
              <div class="password-wrap">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  {{ showPassword ? "◉" : "○" }}
                </button>
              </div>
            </label>

            <p v-if="auth.state.error" class="auth-error" role="alert">
              {{ auth.state.error }}
            </p>

            <button class="button button-primary full-button" type="submit">
              Sign in <span aria-hidden="true">→</span>
            </button>
          </form>

          <div class="auth-divider"><span>or</span></div>

          <p class="auth-switch">
            Don't have an account?
            <button type="button" class="text-link" @click="goToRegister">
              Create one
            </button>
          </p>
        </section>
      </div>
    </div>
  </main>
</template>
