<script setup>
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../stores/auth.js";

const router = useRouter();

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
});

const showPassword = ref(false);
const showConfirm = ref(false);
const localError = ref("");

watch(
  () => auth.state.error,
  () => {},
);

function handleRegister() {
  localError.value = "";
  auth.clearError();

  if (!form.role) {
    localError.value = "Please select a role.";
    return;
  }

  if (form.password !== form.confirmPassword) {
    localError.value = "Passwords do not match.";
    return;
  }

  const success = auth.register({
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
  });

  if (success) {
    router.push("/dashboard");
  }
}

function goToLogin() {
  auth.clearError();
  router.push("/login");
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
          <h1>Create your<br /><span>account.</span></h1>
          <p>
            Join Smart Classroom Monitoring System to start finding and reserving available
            classrooms on campus.
          </p>
          <div class="auth-features">
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Students — view schedules & availability</span>
            </div>
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Instructors — reserve rooms & manage classes</span>
            </div>
            <div class="auth-feature">
              <span aria-hidden="true">✦</span>
              <span>Admins — control the schedule</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <section class="auth-card" aria-labelledby="register-heading">
          <span class="card-icon" aria-hidden="true">✦</span>
          <h2 id="register-heading">Create account</h2>
          <p>Fill in your details to get started.</p>

          <form class="auth-form" @submit.prevent="handleRegister">
            <label class="auth-field">
              Full name
              <input
                v-model="form.name"
                type="text"
                autocomplete="name"
                placeholder="Juan Dela Cruz"
                required
              />
            </label>

            <label class="auth-field">
              Email address
              <input
                v-model="form.email"
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
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="At least 6 characters"
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

            <label class="auth-field">
              Confirm password
              <div class="password-wrap">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Re-enter your password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showConfirm = !showConfirm"
                  :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                >
                  {{ showConfirm ? "◉" : "○" }}
                </button>
              </div>
            </label>

            <fieldset class="role-fieldset">
              <legend>Select your role</legend>
              <div class="role-select-options">
                <label
                  class="role-select-option"
                  :class="{ active: form.role === 'Student' }"
                >
                  <input
                    v-model="form.role"
                    type="radio"
                    name="role"
                    value="Student"
                  />
                  <span class="role-icon student-icon" aria-hidden="true"
                    >S</span
                  >
                  <span>
                    <strong>Student</strong>
                    <small>View availability only</small>
                  </span>
                </label>
                <label
                  class="role-select-option"
                  :class="{ active: form.role === 'Instructor' }"
                >
                  <input
                    v-model="form.role"
                    type="radio"
                    name="role"
                    value="Instructor"
                  />
                  <span class="role-icon faculty-icon" aria-hidden="true"
                    >F</span
                  >
                  <span>
                    <strong>Instructor</strong>
                    <small>Reserve & manage rooms</small>
                  </span>
                </label>
                <label
                  class="role-select-option"
                  :class="{ active: form.role === 'Admin' }"
                >
                  <input
                    v-model="form.role"
                    type="radio"
                    name="role"
                    value="Admin"
                  />
                  <span class="role-icon admin-icon" aria-hidden="true">A</span>
                  <span>
                    <strong>Admin</strong>
                    <small>Full control</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <p
              v-if="localError || auth.state.error"
              class="auth-error"
              role="alert"
            >
              {{ localError || auth.state.error }}
            </p>

            <button class="button button-primary full-button" type="submit">
              Create account <span aria-hidden="true">→</span>
            </button>
          </form>

          <div class="auth-divider"><span>or</span></div>

          <p class="auth-switch">
            Already have an account?
            <button type="button" class="text-link" @click="goToLogin">
              Sign in
            </button>
          </p>
        </section>
      </div>
    </div>
  </main>
</template>

