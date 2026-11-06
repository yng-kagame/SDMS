<script setup>
import { ref, computed, watch } from "vue";
import { useSdms } from "../stores/sdms";
import { TRADES, LEVELS, MAX_MARKS, CRITICAL, status } from "../data/seed";
import DeductModal from "../components/DeductModal.vue";
import AppIcon from "../components/AppIcon.vue";

const emit = defineEmits(["recorded"]);
const st = useSdms();
const showDone = ref(false);
const doneToday = (s) =>
  s.history.some(
    (h) =>
      h.type === "deduct" &&
      h.term === st.term &&
      new Date(h.date).toDateString() === new Date().toDateString(),
  );
const q = ref(""),
  level = ref(""),
  trade = ref(""),
  onlyLow = ref(false),
  selectedId = ref(null);
const page = ref(1);
const pageSize = 8;
const list = computed(() =>
  st.students.filter((s) => {
    const t = q.value.trim().toLowerCase();
    return (
      (!t ||
        s.name.toLowerCase().includes(t) ||
        s.regNo.toLowerCase().includes(t)) &&
      (!level.value || s.level === level.value) &&
      (!trade.value || s.trade === trade.value) &&
      (!onlyLow.value || st.marks(s) < CRITICAL) &&
      (showDone.value || !doneToday(s))
    );
  }),
);
const pages = computed(() =>
  Math.max(1, Math.ceil(list.value.length / pageSize)),
);
const visible = computed(() =>
  list.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
const selected = computed(() =>
  st.students.find((s) => s.id === selectedId.value),
);
const critical = computed(
  () => st.students.filter((s) => st.marks(s) < CRITICAL).length,
);
const warning = computed(
  () =>
    st.students.filter((s) => st.marks(s) >= CRITICAL && st.marks(s) < 30)
      .length,
);
const good = computed(
  () => st.students.length - critical.value - warning.value,
);
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
const standing = (marks) =>
  marks < CRITICAL
    ? "Critical"
    : marks < 30
      ? "Needs attention"
      : "Good standing";
watch([q, level, trade, onlyLow, showDone], () => {
  page.value = 1;
});
watch(pages, (count) => {
  if (page.value > count) page.value = count;
});
function resetFilters() {
  q.value = "";
  level.value = "";
  trade.value = "";
  onlyLow.value = false;
  showDone.value = false;
}
</script>

<template>
  <section class="metric-grid" aria-label="Student overview">
    <article class="metric-card">
      <span class="metric-icon"><AppIcon name="students" /></span>
      <div>
        <p class="metric-label">Total students</p>
        <strong class="metric-value">{{ st.students.length }}</strong>
        <p class="metric-note">Across all levels &amp; trades</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon good"><AppIcon name="shield" /></span>
      <div>
        <p class="metric-label">Good standing</p>
        <strong class="metric-value">{{ good }}</strong>
        <p class="metric-note">30–40 discipline marks</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon warning"><AppIcon name="alert" /></span>
      <div>
        <p class="metric-label">Needs attention</p>
        <strong class="metric-value">{{ warning + critical }}</strong>
        <p class="metric-note">
          {{ warning }} warning <span aria-hidden="true">·</span>
          {{ critical }} critical
        </p>
      </div>
    </article>
  </section>

  <section class="panel">
    <div class="panel-header directory-heading">
      <div class="page-heading">
        <p class="eyebrow">YOUR SCHOOL, AT A GLANCE</p>
        <h2>
          Student directory<span class="count-pill">{{
            st.students.length
          }}</span>
        </h2>
        <p class="subtitle">
          A little attention. A better future for every student.
        </p>
      </div>
      <span class="term-pill"><AppIcon name="calendar" />{{ st.term }}</span>
    </div>
    <div class="filter-bar">
      <div class="filters">
        <label class="search-field"
          ><AppIcon name="search" /><input
            v-model="q"
            aria-label="Search students"
            placeholder="Search name or registration number…"
        /></label>
        <select v-model="level" aria-label="Filter students by level">
          <option value="">All levels</option>
          <option v-for="l in LEVELS" :key="l">{{ l }}</option>
        </select>
        <select v-model="trade" aria-label="Filter students by trade">
          <option value="">All trades</option>
          <option v-for="t in TRADES" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="filter-options">
        <label class="check-label"
          ><input v-model="onlyLow" type="checkbox" />Critical only</label
        >
        <label class="check-label"
          ><input v-model="showDone" type="checkbox" />Include students recorded
          today</label
        >
        <span class="result-count">{{ list.length }} students found</span>
      </div>
    </div>
    <div
      class="table-wrap desktop-student-table"
      tabindex="0"
      role="region"
      aria-label="Student directory table"
    >
      <table class="data-table student-table">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Registration</th>
            <th scope="col">Class</th>
            <th scope="col">Discipline marks</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in visible" :key="s.id">
            <td>
              <div class="student-cell">
                <span class="avatar" :class="`avatar-${s.id % 4}`">{{
                  initials(s.name)
                }}</span
                ><strong>{{ s.name }}</strong>
              </div>
            </td>
            <td class="muted registration">{{ s.regNo }}</td>
            <td>
              <span class="class-pill"
                >{{ s.level }} <span aria-hidden="true">·</span>
                {{ s.trade }}</span
              >
            </td>
            <td>
              <div class="score-cell" :class="status(st.marks(s))">
                <span
                  ><b>{{ st.marks(s) }}</b
                  ><small> / {{ MAX_MARKS }}</small></span
                ><span class="score-track"
                  ><span
                    :style="{ width: `${(st.marks(s) / MAX_MARKS) * 100}%` }"
                  ></span
                ></span>
              </div>
            </td>
            <td>
              <span class="status-pill" :class="status(st.marks(s))"
                ><span aria-hidden="true" class="status-dot"></span
                >{{ standing(st.marks(s)) }}</span
              >
            </td>
            <td>
              <button
                class="row-action"
                :aria-label="`Open ${s.name}'s record`"
                @click="selectedId = s.id"
              >
                View record <AppIcon name="arrow-right" />
              </button>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="6">
              <div class="empty-state">
                <AppIcon name="search" />
                <h3>No students found</h3>
                <p>Try another name, registration number, or filter.</p>
                <button class="secondary-button" @click="resetFilters">
                  Clear filters
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <section class="mobile-student-list" aria-label="Student records">
      <article v-for="s in visible" :key="s.id" class="mobile-student-card">
        <div class="mobile-student-heading">
          <div class="mobile-student-identity">
            <span class="avatar" :class="`avatar-${s.id % 4}`">{{
              initials(s.name)
            }}</span>
            <div>
              <strong>{{ s.name }}</strong
              ><span>{{ s.regNo }}</span>
            </div>
          </div>
          <span class="status-pill" :class="status(st.marks(s))"
            ><span aria-hidden="true" class="status-dot"></span
            >{{ standing(st.marks(s)) }}</span
          >
        </div>
        <div class="mobile-student-detail">
          <div class="mobile-student-class">
            <span>Class &amp; trade</span
            ><strong
              >{{ s.level }} <span aria-hidden="true">·</span>
              {{ s.trade }}</strong
            >
          </div>
          <div class="mobile-student-score">
            <span>Discipline marks</span>
            <div class="score-cell" :class="status(st.marks(s))">
              <span
                ><b>{{ st.marks(s) }}</b
                ><small> / {{ MAX_MARKS }}</small></span
              ><span class="score-track"
                ><span
                  :style="{ width: `${(st.marks(s) / MAX_MARKS) * 100}%` }"
                ></span
              ></span>
            </div>
          </div>
        </div>
        <button
          class="mobile-record-button"
          :aria-label="`Open ${s.name}'s record`"
          @click="selectedId = s.id"
        >
          View student record <AppIcon name="arrow-right" />
        </button>
      </article>
      <div v-if="!list.length" class="empty-state">
        <AppIcon name="search" />
        <h3>No students found</h3>
        <p>Try another name, registration number, or filter.</p>
        <button class="secondary-button" @click="resetFilters">
          Clear filters
        </button>
      </div>
    </section>
    <div class="table-footer">
      <span
        >{{ list.length ? (page - 1) * pageSize + 1 : 0 }}–{{
          Math.min(page * pageSize, list.length)
        }}
        of {{ list.length }} students</span
      >
      <div class="pagination" aria-label="Student pages">
        <button class="secondary-button" :disabled="page === 1" @click="page--">
          Previous</button
        ><span>Page {{ page }} of {{ pages }}</span
        ><button
          class="secondary-button"
          :disabled="page === pages"
          @click="page++"
        >
          Next <AppIcon name="arrow-right" />
        </button>
      </div>
    </div>
  </section>
  <p class="page-footnote">
    <AppIcon name="shield" />Every record is a step toward a more supportive
    school.
  </p>
  <DeductModal
    v-if="selected"
    :student="selected"
    @close="selectedId = null"
    @recorded="
      selectedId = null;
      emit('recorded');
    "
  />
</template>

<style scoped>
.mobile-student-list {
  display: none;
}
@media (max-width: 760px) {
  .desktop-student-table {
    display: none;
  }
  .mobile-student-list {
    display: grid;
    gap: 12px;
    padding: 0 20px 20px;
  }
  .mobile-student-card {
    min-width: 0;
    border: 1px solid #e5eaf5;
    border-radius: 17px;
    background: #fff;
    overflow: hidden;
  }
  .mobile-student-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 14px 14px;
  }
  .mobile-student-identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mobile-student-identity .avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    font-size: 0.78rem;
    border-radius: 12px;
  }
  .mobile-student-identity > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .mobile-student-identity strong {
    font-size: 0.8rem;
    line-height: 1.5;
    color: #3a4668;
    overflow-wrap: anywhere;
  }
  .mobile-student-identity > div > span {
    font-size: 0.78rem;
    color: #4b6085;
  }
  .mobile-student-heading > .status-pill {
    font-size: 0.78rem;
    line-height: 1.5;
    gap: 5px;
    flex-shrink: 0;
    margin-top: 2px;
    padding: 5px 7px;
  }
  .mobile-student-detail {
    display: flex;
    align-items: start;
    gap: 16px;
    padding: 14px;
    margin: 0 14px;
    border-top: 1px dashed #e6ebf5;
    padding-left: 0;
    padding-right: 0;
  }
  .mobile-student-class {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .mobile-student-class > span,
  .mobile-student-score > span {
    font-size: 0.78rem;
    color: #4b6085;
  }
  .mobile-student-class > strong {
    font-size: 0.78rem;
    color: #4f6088;
    font-weight: 700;
  }
  .mobile-student-class > strong > span {
    color: #a8b4d0;
    padding: 0 3px;
  }
  .mobile-student-score {
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 47%;
  }
  .mobile-student-score .score-cell {
    max-width: none;
    min-width: 0;
    gap: 8px;
  }
  .mobile-student-score .score-cell b {
    font-size: 0.82rem;
  }
  .mobile-student-score .score-track {
    height: 4px;
  }
  .mobile-record-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    width: 100%;
    border-top: 1px solid #eaf0fa;
    border-radius: 0;
    background: #f4f7ff;
    color: #415c9d;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .mobile-record-button svg {
    width: 15px;
    height: 15px;
  }
  .mobile-record-button:hover {
    background: #e9efff;
  }
}
@media (max-width: 390px) {
  .mobile-student-list {
    padding-left: 14px;
    padding-right: 14px;
    gap: 11px;
  }
  .mobile-student-heading {
    gap: 8px;
    padding: 14px 11px 12px;
  }
  .mobile-student-identity {
    gap: 8px;
  }
  .mobile-student-identity .avatar {
    width: 31px;
    height: 31px;
    font-size: 0.78rem;
    border-radius: 10px;
  }
  .mobile-student-identity strong {
    font-size: 0.78rem;
  }
  .mobile-student-heading > .status-pill {
    font-size: 0.78rem;
    padding: 5px;
    gap: 4px;
  }
  .mobile-student-detail {
    margin-left: 11px;
    margin-right: 11px;
  }
}
@media print {
  .desktop-student-table {
    display: block;
  }
  .mobile-student-list {
    display: none;
  }
}
</style>
