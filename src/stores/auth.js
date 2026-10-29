import { reactive, computed } from "vue";

const AUTH_USERS_KEY = "campus-rooms-users";
const AUTH_SESSION_KEY = "campus-rooms-session";

function loadUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  if (user) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

const state = reactive({
  currentUser: loadSession(),
  error: "",
});

export const auth = {
  state,

  isLoggedIn: computed(() => !!state.currentUser),

  currentUser: computed(() => state.currentUser),

  register({ name, email, password, role }) {
    state.error = "";

    if (!name || !email || !password || !role) {
      state.error = "All fields are required.";
      return false;
    }

    if (password.length < 6) {
      state.error = "Password must be at least 6 characters.";
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      state.error = "Please enter a valid email address.";
      return false;
    }

    const users = loadUsers();
    const exists = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (exists) {
      state.error = "An account with this email already exists.";
      return false;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // In a real app, hash this on the server
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login after registration
    const sessionUser = { ...newUser };
    delete sessionUser.password;
    state.currentUser = sessionUser;
    saveSession(sessionUser);

    return true;
  },

  login({ email, password }) {
    state.error = "";

    if (!email || !password) {
      state.error = "Email and password are required.";
      return false;
    }

    const users = loadUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase().trim() &&
        u.password === password,
    );

    if (!user) {
      state.error = "Invalid email or password.";
      return false;
    }

    const sessionUser = { ...user };
    delete sessionUser.password;
    state.currentUser = sessionUser;
    saveSession(sessionUser);

    return true;
  },

  logout() {
    state.currentUser = null;
    state.error = "";
    saveSession(null);
  },

  clearError() {
    state.error = "";
  },
};

