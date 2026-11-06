<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useSdms } from "./stores/sdms";
import Signup from "./views/Signup.vue";
import Students from "./views/Students.vue";
import Reports from "./views/Reports.vue";
import Admin from "./views/Admin.vue";
import History from "./views/History.vue";
import Dashboard from "./views/Dashboard.vue";
import DeductModal from "./components/DeductModal.vue";
import RecordIncident from "./views/RecordIncident.vue";
import AppIcon from "./components/AppIcon.vue";
import PageLoader from "./components/PageLoader.vue";

const st = useSdms();
const tab = ref("dashboard");
const selectedStudentId = ref(null);
const selectedStudent = computed(() =>
  st.students.find((student) => student.id === selectedStudentId.value),
);
const loading = ref(true);
const loadingTitle = ref("Welcome to Saint Joseph");
const loadingDescription = ref("Getting your workspace ready.");
const main = ref(null);
let timer;
const pages = computed(() => [
  {
    id: "dashboard",
    label: "Dashboard",
    navLabel: "Home",
    icon: "dashboard",
    description: "Getting your school overview ready.",
  },
  {
    id: "students",
    label: "Students",
    icon: "students",
    description: "Bringing your student directory into view.",
  },
  {
    id: "history",
    label: "History",
    icon: "history",
    description: "Getting your discipline records ready.",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    description: "Preparing your school insights.",
  },
  ...(st.isAdmin
    ? [
        {
          id: "admin",
          label: "Admin",
          icon: "settings",
          description: "Opening your school settings.",
        },
      ]
    : []),
]);
const recordPage = {
  id: "record",
  label: "Record incident",
  description: "Preparing your discipline workspace.",
};
const currentPage = computed(() =>
  tab.value === "record"
    ? recordPage
    : pages.value.find((page) => page.id === tab.value),
);
const initials = computed(() =>
  st.user?.u
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);
const firstName = computed(() => st.user?.u.split(/\s+/)[0] || "");
const dateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());
const greeting = computed(() => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
});

function finishLoading(focusPage = false) {
  clearTimeout(timer);
  timer = setTimeout(
    async () => {
      loading.value = false;
      if (focusPage) {
        await nextTick();
        main.value?.focus({ preventScroll: true });
      }
    },
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 620,
  );
}
function navigate(id) {
  if (loading.value || id === tab.value) return;
  const page =
    id === "record" ? recordPage : pages.value.find((page) => page.id === id);
  if (!page) return;
  loadingTitle.value = `Opening ${page.label.toLowerCase()}`;
  loadingDescription.value = page.description;
  loading.value = true;
  tab.value = id;
  window.scrollTo({ top: 0, behavior: "instant" });
  finishLoading(true);
}
function enter() {
  loadingTitle.value = "Welcome to your workspace";
  loadingDescription.value = "A brighter school day starts here.";
  loading.value = true;
  tab.value = "dashboard";
  window.scrollTo({ top: 0, behavior: "instant" });
  finishLoading(true);
}
function logout() {
  st.logout();
  tab.value = "dashboard";
  loadingTitle.value = "See you again soon";
  loadingDescription.value = "Getting the welcome page ready.";
  loading.value = true;
  window.scrollTo({ top: 0, behavior: "instant" });
  finishLoading(true);
}
watch(
  [tab, () => !!st.user],
  () => {
    const label = st.user ? currentPage.value?.label || "Dashboard" : "Welcome";
    document.title = `${label} · SDMS — Saint Joseph`;
  },
  { immediate: true },
);
onMounted(() => finishLoading());
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <div class="site-shell" :inert="loading || undefined">
    <header
      class="school-header"
      :class="{ 'school-header--welcome': !st.user }"
    >
      <div class="header-pattern" aria-hidden="true" />
      <div class="header-inner">
        <a
          class="school-brand"
          href="#main-content"
          aria-label="Saint Joseph Integrated Technical College"
        >
          <span class="brand-logo"
            ><img src="/logo.png" alt="Saint Joseph college crest"
          /></span>
          <span class="brand-name"
            ><strong>Saint Joseph</strong
            ><span>Integrated Technical College</span></span
          >
        </a>
        <div class="header-right">
          <span class="term-pill"><span />{{ st.term }}</span>
          <template v-if="st.user">
            <div class="header-divider" />
            <div class="user-profile">
              <span class="user-avatar">{{ initials }}</span
              ><span class="user-details"
                ><strong>{{ st.user.u }}</strong
                ><small>{{
                  st.user.role === "admin" ? "Administrator" : "Patron"
                }}</small></span
              >
            </div>
            <button
              class="header-logout"
              @click="logout"
              aria-label="Sign out"
              title="Sign out"
            >
              <AppIcon name="logout" />
            </button>
          </template>
          <span v-else class="header-caption"
            >Student discipline, thoughtfully managed.</span
          >
        </div>
      </div>
      <div v-if="st.user && tab !== 'record'" class="welcome-banner">
        <div>
          <p class="welcome-greeting">
            {{ greeting }}, {{ firstName }}
            <AppIcon class="tiny-sparkle" name="star" :size="17" />
          </p>
          <h1>
            A little guidance.<br class="mobile-break" />
            A brighter future.
          </h1>
          <p class="welcome-caption">
            Everything you need to support your students, in one place.
          </p>
        </div>
        <div class="welcome-date">
          <AppIcon name="calendar" :size="18" /><span>{{ dateLabel }}</span>
        </div>
      </div>
    </header>

    <main
      id="main-content"
      ref="main"
      tabindex="-1"
      :class="st.user ? 'workspace' : 'welcome-main'"
    >
      <Signup v-if="!st.user" @entered="enter" />
      <template v-else>
        <div class="workspace-breadcrumb noprint">
          <span>My workspace</span><span>/</span
          ><strong>{{ currentPage?.label }}</strong
          ><span class="workspace-indicator"><span />{{ st.term }}</span>
        </div>
        <div class="page-content" :key="tab">
          <Dashboard
            v-if="tab === 'dashboard'"
            @navigate="navigate"
            @record-incident="navigate('record')"
            @open-student="selectedStudentId = $event"
          />
          <RecordIncident v-else-if="tab === 'record'" @navigate="navigate" />
          <Students
            v-else-if="tab === 'students'"
            @recorded="navigate('history')"
          />
          <History v-else-if="tab === 'history'" />
          <Reports v-else-if="tab === 'reports'" />
          <Admin v-else-if="st.isAdmin" />
        </div>
        <footer class="workspace-footer noprint">
          <span>Saint Joseph Integrated Technical College</span
          ><span>Guidance. Growth. Excellence.</span>
        </footer>
      </template>
    </main>

    <nav v-if="st.user" class="bottom-nav noprint" aria-label="Main navigation">
      <button
        v-for="page in pages"
        :key="page.id"
        :class="{ active: tab === page.id }"
        :aria-current="tab === page.id ? 'page' : undefined"
        :aria-label="page.label"
        @click="navigate(page.id)"
      >
        <AppIcon :name="page.icon" :size="22" /><span>{{
          page.navLabel || page.label
        }}</span>
      </button>
    </nav>
  </div>
  <DeductModal
    v-if="selectedStudent"
    :student="selectedStudent"
    @close="selectedStudentId = null"
    @recorded="
      selectedStudentId = null;
      navigate('history');
    "
  />
  <PageLoader
    :active="loading"
    :title="loadingTitle"
    :description="loadingDescription"
  />
</template>
