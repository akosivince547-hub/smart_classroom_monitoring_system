<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../stores/auth.js";

const router = useRouter();

const storageKey = "classroom-management-demo-v1";
const timeSlots = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
];

const initialSessions = [
  {
    id: "session-1",
    room: "A1",
    slot: "08:00-09:00",
    course: "Programming 1",
    faculty: "Prof. Santos",
  },
  {
    id: "session-2",
    room: "A1",
    slot: "10:00-11:00",
    course: "Web Development",
    faculty: "Prof. Reyes",
  },
  {
    id: "session-3",
    room: "A2",
    slot: "09:00-10:00",
    course: "Database Systems",
    faculty: "Prof. Cruz",
  },
  {
    id: "session-4",
    room: "Computer Lab 1",
    slot: "13:00-14:00",
    course: "Computer Networks",
    faculty: "Prof. Garcia",
  },
  {
    id: "session-5",
    room: "Smart Hub",
    slot: "14:00-15:00",
    course: "Project Consultation",
    faculty: "Prof. Lim",
  },
];
const rooms = ["A1", "A2", "Computer Lab 1", "Computer Lab 2", "Smart Hub"];

function loadSavedState() {
  const defaults = {
    sessions: initialSessions,
    reservations: [],
    dismissedSessionIds: [],
  };

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaults;

    const parsed = JSON.parse(saved);
    return {
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions
        : defaults.sessions,
      reservations: Array.isArray(parsed.reservations)
        ? parsed.reservations
        : defaults.reservations,
      dismissedSessionIds: Array.isArray(parsed.dismissedSessionIds)
        ? parsed.dismissedSessionIds
        : defaults.dismissedSessionIds,
    };
  } catch (error) {
    console.error("Could not load the saved classroom demo state.", error);
    return defaults;
  }
}

const savedState = loadSavedState();
const state = reactive(savedState);

// Use the authenticated user from the auth store
const activeUser = computed(() => {
  const u = auth.state.currentUser;
  return u ? { name: u.name, role: u.role } : null;
});

const selectedSlot = ref("10:00-11:00");
const notice = ref("");
const pendingDismissalId = ref("");
const scheduleForm = reactive({
  room: rooms[0],
  slot: timeSlots[0],
  course: "",
  faculty: "",
});

const availableRooms = computed(() =>
  rooms.filter(
    (room) =>
      !getSession(room, selectedSlot.value) &&
      !getReservation(room, selectedSlot.value),
  ),
);

const myReservations = computed(() =>
  state.reservations.filter(
    (reservation) =>
      reservation.instructor === activeUser.value?.name ||
      reservation.student === activeUser.value?.name,
  ),
);

const sortedSessions = computed(() =>
  [...state.sessions].sort((first, second) => {
    const roomOrder = rooms.indexOf(first.room) - rooms.indexOf(second.room);
    return (
      roomOrder ||
      timeSlots.indexOf(first.slot) - timeSlots.indexOf(second.slot)
    );
  }),
);

function getSession(room, slot) {
  return state.sessions.find(
    (session) =>
      session.room === room &&
      session.slot === slot &&
      !state.dismissedSessionIds.includes(session.id),
  );
}

function getReservation(room, slot) {
  return state.reservations.find(
    (reservation) => reservation.room === room && reservation.slot === slot,
  );
}

function roomStatus(room, slot) {
  const session = getSession(room, slot);
  if (session)
    return {
      label: "In class",
      detail: `${session.course} · ${session.faculty}`,
      kind: "occupied",
    };

  const reservation = getReservation(room, slot);
  if (reservation)
    return {
      label: "Reserved",
      detail: `Reserved by ${reservation.instructor || reservation.student}`,
      kind: "reserved",
    };

  return { label: "Available", detail: "Ready to reserve", kind: "available" };
}

function handleSignOut() {
  auth.logout();
  router.push("/login");
}

function reserveRoom(room) {
  if (
    !activeUser.value ||
    (activeUser.value.role !== "Instructor" && activeUser.value.role !== "Faculty")
  ) {
    notice.value = "Only instructors are permitted to reserve classrooms.";
    return;
  }

  if (
    getSession(room, selectedSlot.value) ||
    getReservation(room, selectedSlot.value)
  ) {
    notice.value = "That room is no longer available for the selected time.";
    return;
  }

  state.reservations.push({
    id: `reservation-${Date.now()}`,
    room,
    slot: selectedSlot.value,
    instructor: activeUser.value.name,
    student: activeUser.value.name,
  });
  notice.value = `${room} is reserved for ${selectedSlot.value}.`;
}

function cancelReservation(reservationId) {
  state.reservations = state.reservations.filter(
    (reservation) => reservation.id !== reservationId,
  );
  notice.value = "Your reservation has been cancelled.";
}

function dismissSession(session) {
  if (pendingDismissalId.value !== session.id) {
    pendingDismissalId.value = session.id;
    return;
  }

  state.dismissedSessionIds.push(session.id);
  pendingDismissalId.value = "";
  notice.value = `${session.room} is now marked vacant for ${session.slot}.`;
}

function addSchedule() {
  const course = scheduleForm.course.trim();
  const faculty = scheduleForm.faculty.trim();
  if (!course || !faculty) {
    notice.value =
      "Enter both a course and faculty name before adding a schedule.";
    return;
  }

  if (
    state.sessions.some(
      (session) =>
        session.room === scheduleForm.room &&
        session.slot === scheduleForm.slot,
    )
  ) {
    notice.value = "That room already has a scheduled class during this time.";
    return;
  }

  state.sessions.push({
    id: `session-${Date.now()}`,
    room: scheduleForm.room,
    slot: scheduleForm.slot,
    course,
    faculty,
  });
  scheduleForm.course = "";
  scheduleForm.faculty = "";
  notice.value = "The class has been added to the master schedule.";
}

function removeSchedule(session) {
  state.sessions = state.sessions.filter((item) => item.id !== session.id);
  state.dismissedSessionIds = state.dismissedSessionIds.filter(
    (id) => id !== session.id,
  );
  notice.value = `${session.course} was removed from the master schedule.`;
}

function resetDay() {
  state.reservations = [];
  state.dismissedSessionIds = [];
  pendingDismissalId.value = "";
  notice.value =
    "Daily reset complete. Reservations and early dismissals have been cleared.";
}

watch(
  state,
  (value) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error("Could not save the classroom demo state.", error);
      notice.value =
        "Changes could not be saved in this browser. Check your storage settings.";
    }
  },
  { deep: true },
);
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a
        class="brand"
        href="#"
        aria-label="SCMS home"
      >
        <span class="brand-mark" aria-hidden="true">SCMS</span>
        <span>
          <strong>Smart Classroom Monitoring System</strong>
          <small>CPSU · San Carlos Campus</small>
        </span>
      </a>
      <div v-if="activeUser" class="user-menu">
        <span class="user-avatar" aria-hidden="true">{{
          activeUser.name.charAt(0).toUpperCase()
        }}</span>
        <span class="user-label"
          ><strong>{{ activeUser.name }}</strong
          ><small>{{ activeUser.role }}</small></span
        >
        <button class="button button-quiet" type="button" @click="handleSignOut">
          Sign out
        </button>
      </div>
    </header>

    <template v-if="activeUser">
      <section class="dashboard-heading">
        <div>
          <span class="eyebrow">{{ activeUser.role }} PORTAL</span>
          <h1>
            {{
              activeUser.role === "Student"
                ? "Classroom Availability"
                : (activeUser.role === "Instructor" || activeUser.role === "Faculty")
                  ? "Instructor Workspace"
                  : "Schedule Management"
            }}
          </h1>
          <p>
            {{
              activeUser.role === "Student"
                ? "View live room occupancy and scheduled classes across campus."
                : (activeUser.role === "Instructor" || activeUser.role === "Faculty")
                  ? "Reserve available classrooms, manage your room bookings, and release rooms early when class is finished."
                  : "Manage room schedules and restore the daily timetable."
            }}
          </p>
        </div>
        <div class="date-chip">
          <span aria-hidden="true">▦</span> Today <small>· Live schedule</small>
        </div>
      </section>

      <p v-if="notice" class="notice" role="status">
        <span>{{ notice }}</span>
        <button
          type="button"
          aria-label="Dismiss notification"
          @click="notice = ''"
        >
          ×
        </button>
      </p>

      <!-- Student View: View Availability Only (No Reservation Permission) -->
      <section v-if="activeUser.role === 'Student'" class="dashboard-grid">
        <div class="main-column">
          <section class="panel availability-panel">
            <div class="panel-heading">
              <div>
                <h2>Room availability & status</h2>
                <p>Select a time to check current room status.</p>
              </div>
              <label class="select-wrap">
                <span class="sr-only">Select a time slot</span>
                <select v-model="selectedSlot">
                  <option v-for="slot in timeSlots" :key="slot" :value="slot">
                    {{ slot }}
                  </option>
                </select>
              </label>
            </div>
            <div class="room-list">
              <article v-for="room in rooms" :key="room" class="room-row">
                <span class="room-icon" aria-hidden="true">▦</span>
                <div class="room-info">
                  <h3>{{ room }}</h3>
                  <p>{{ roomStatus(room, selectedSlot).detail }}</p>
                </div>
                <span
                  :class="['status-pill', roomStatus(room, selectedSlot).kind]"
                >
                  <span></span>{{ roomStatus(room, selectedSlot).label }}
                </span>
              </article>
            </div>
            <p v-if="availableRooms.length === 0" class="empty-note">
              No rooms are open at this time. Try another time slot.
            </p>
          </section>
        </div>

        <aside class="side-column">
          <section class="tip-card">
            <span aria-hidden="true">ℹ</span>
            <div>
              <strong>Student Notice</strong>
              <p>
                Classroom reservations are only permitted for Instructors. Students may monitor real-time room availability and schedules.
              </p>
            </div>
          </section>

          <section class="panel today-classes-panel">
            <div class="panel-heading">
              <div>
                <h2>Today's classes</h2>
                <p>Scheduled lectures</p>
              </div>
              <span class="count-badge">{{ state.sessions.length }}</span>
            </div>
            <div v-if="state.sessions.length" class="reservation-list">
              <article
                v-for="session in sortedSessions.slice(0, 5)"
                :key="session.id"
                class="reservation-item"
              >
                <div class="room-icon" style="width: 28px; height: 28px; font-size: 13px;" aria-hidden="true">▦</div>
                <div>
                  <strong>{{ session.course }}</strong>
                  <small>{{ session.room }} · {{ session.slot }} · {{ session.faculty }}</small>
                </div>
              </article>
            </div>
          </section>
        </aside>
      </section>

      <!-- Instructor / Faculty View: Can Reserve Rooms & Dismiss Classes -->
      <section
        v-else-if="activeUser.role === 'Instructor' || activeUser.role === 'Faculty'"
        class="dashboard-grid"
      >
        <div class="main-column">
          <section class="panel availability-panel">
            <div class="panel-heading">
              <div>
                <h2>Reserve a classroom</h2>
                <p>Select a time slot and reserve an available room for your lecture or activity.</p>
              </div>
              <label class="select-wrap">
                <span class="sr-only">Select a time slot</span>
                <select v-model="selectedSlot">
                  <option v-for="slot in timeSlots" :key="slot" :value="slot">
                    {{ slot }}
                  </option>
                </select>
              </label>
            </div>
            <div class="room-list">
              <article v-for="room in rooms" :key="room" class="room-row">
                <span class="room-icon" aria-hidden="true">▦</span>
                <div class="room-info">
                  <h3>{{ room }}</h3>
                  <p>{{ roomStatus(room, selectedSlot).detail }}</p>
                </div>
                <span
                  :class="['status-pill', roomStatus(room, selectedSlot).kind]"
                >
                  <span></span>{{ roomStatus(room, selectedSlot).label }}
                </span>
                <button
                  v-if="roomStatus(room, selectedSlot).kind === 'available'"
                  class="button button-primary reserve-button"
                  type="button"
                  @click="reserveRoom(room)"
                >
                  Reserve
                </button>
              </article>
            </div>
            <p v-if="availableRooms.length === 0" class="empty-note">
              No rooms are open at this time. Try another time slot.
            </p>
          </section>

          <!-- Teaching schedule & dismiss early -->
          <section class="panel faculty-panel" style="margin-top: 24px; margin-bottom: 0;">
            <div class="panel-heading">
              <div>
                <h2>Today's teaching schedule</h2>
                <p>Release classroom early when your class has finished.</p>
              </div>
              <span class="count-badge">{{
                state.sessions.filter(
                  (session) => !state.dismissedSessionIds.includes(session.id),
                ).length
              }}</span>
            </div>
            <div v-if="state.sessions.length" class="schedule-list">
              <article
                v-for="session in sortedSessions"
                :key="session.id"
                class="schedule-row"
              >
                <div class="schedule-time">{{ session.slot }}</div>
                <span class="room-icon" aria-hidden="true">▦</span>
                <div class="room-info">
                  <h3>{{ session.course }}</h3>
                  <p>{{ session.room }} · {{ session.faculty }}</p>
                </div>
                <span
                  v-if="state.dismissedSessionIds.includes(session.id)"
                  class="status-pill available"
                  ><span></span>Released</span
                >
                <div v-else class="schedule-action">
                  <template v-if="pendingDismissalId === session.id">
                    <span class="confirm-label">Release this room?</span>
                    <button
                      class="button button-primary"
                      type="button"
                      @click="dismissSession(session)"
                    >
                      Confirm
                    </button>
                    <button
                      class="button button-quiet"
                      type="button"
                      @click="pendingDismissalId = ''"
                    >
                      Keep
                    </button>
                  </template>
                  <button
                    v-else
                    class="button button-outline"
                    type="button"
                    @click="dismissSession(session)"
                  >
                    Dismiss class
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="empty-state">
              <span aria-hidden="true">✓</span>
              <p>No classes are scheduled today.</p>
            </div>
          </section>
        </div>

        <aside class="side-column">
          <section class="panel reservation-panel">
            <div class="panel-heading">
              <div>
                <h2>My reservations</h2>
                <p>Rooms you have reserved today.</p>
              </div>
              <span class="count-badge">{{ myReservations.length }}</span>
            </div>
            <div v-if="myReservations.length" class="reservation-list">
              <article
                v-for="reservation in myReservations"
                :key="reservation.id"
                class="reservation-item"
              >
                <div class="reservation-symbol" aria-hidden="true">✓</div>
                <div>
                  <strong>{{ reservation.room }}</strong>
                  <small>{{ reservation.slot }}</small>
                </div>
                <button
                  class="text-button"
                  type="button"
                  @click="cancelReservation(reservation.id)"
                >
                  Cancel
                </button>
              </article>
            </div>
            <div v-else class="empty-state">
              <span aria-hidden="true">⌁</span>
              <p>You don't have any reservations yet.</p>
            </div>
          </section>

          <section class="tip-card">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>Instructor Tip</strong>
              <p>
                Dismissing classes or releasing rooms early will immediately make them available for other instructors.
              </p>
            </div>
          </section>
        </aside>
      </section>

      <!-- Admin View -->
      <section v-else class="admin-layout">
        <section class="panel admin-schedule">
          <div class="panel-heading">
            <div>
              <h2>Master schedule</h2>
              <p>
                {{ state.sessions.length }} scheduled classes across
                {{ rooms.length }} rooms.
              </p>
            </div>
          </div>
          <div class="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Faculty</th>
                  <th><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="session in sortedSessions" :key="session.id">
                  <td>
                    <strong>{{ session.room }}</strong>
                  </td>
                  <td>{{ session.slot }}</td>
                  <td>{{ session.course }}</td>
                  <td>{{ session.faculty }}</td>
                  <td>
                    <button
                      class="text-button delete-button"
                      type="button"
                      :aria-label="`Remove ${session.course} schedule`"
                      @click="removeSchedule(session)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                <tr v-if="!state.sessions.length">
                  <td colspan="5" class="table-empty">
                    No classes in the master schedule.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside class="admin-side">
          <section class="panel add-schedule-panel">
            <div class="panel-heading">
              <div>
                <h2>Add a class</h2>
                <p>Add a room and time to the timetable.</p>
              </div>
            </div>
            <form class="schedule-form" @submit.prevent="addSchedule">
              <label
                >Room<select v-model="scheduleForm.room">
                  <option v-for="room in rooms" :key="room">{{ room }}</option>
                </select></label
              >
              <label
                >Time<select v-model="scheduleForm.slot">
                  <option v-for="slot in timeSlots" :key="slot">
                    {{ slot }}
                  </option>
                </select></label
              >
              <label
                >Course name<input
                  v-model="scheduleForm.course"
                  placeholder="e.g. Software Engineering"
              /></label>
              <label
                >Faculty name<input
                  v-model="scheduleForm.faculty"
                  placeholder="e.g. Prof. Dela Cruz"
              /></label>
              <button class="button button-primary full-button" type="submit">
                Add to schedule <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
          <section class="reset-card">
            <div>
              <span class="reset-icon" aria-hidden="true">↻</span>
              <div>
                <strong>Daily reset</strong>
                <p>Clear temporary reservations and early dismissals.</p>
              </div>
            </div>
            <button
              class="button button-outline full-button"
              type="button"
              @click="resetDay"
            >
              Reset today's activity
            </button>
          </section>
        </aside>
      </section>
    </template>

    <footer class="app-footer">
      <span
        >Smart Classroom Monitoring System <span class="footer-dot">·</span> CPSU San Carlos Campus</span
      >
      <span>Local interactive demo — changes are saved in this browser.</span>
    </footer>
  </main>
</template>
