<script setup>
import { ref, computed } from "vue";
import { useSdms } from "../stores/sdms";
import {
  TRADES,
  LEVELS,
  CRITICAL,
  MAX_MARKS,
  actionFor,
  status,
} from "../data/seed";
import AppIcon from "../components/AppIcon.vue";

const st = useSdms();
const level = ref(""),
  trade = ref(""),
  onlyLow = ref(false);
const rows = computed(() =>
  st.students
    .filter(
      (s) =>
        (!level.value || s.level === level.value) &&
        (!trade.value || s.trade === trade.value) &&
        (!onlyLow.value || st.marks(s) < CRITICAL),
    )
    .map((s) => ({ ...s, m: st.marks(s) }))
    .sort((a, b) => a.m - b.m),
);
const average = computed(() =>
  rows.value.length
    ? (rows.value.reduce((sum, s) => sum + s.m, 0) / rows.value.length).toFixed(
        1,
      )
    : "—",
);
const critical = computed(
  () => rows.value.filter((s) => s.m < CRITICAL).length,
);
const printPage = () => window.print();
function exportCsv() {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["regNo", "name", "level", "trade", "marks", "action", "parentPhone"],
    ...rows.value.map((r) => [
      r.regNo,
      r.name,
      r.level,
      r.trade,
      r.m,
      actionFor(r.m),
      r.parentPhone,
    ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `discipline-report-${st.term}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <section class="metric-grid noprint" aria-label="Report overview">
    <article class="metric-card">
      <span class="metric-icon"><AppIcon name="reports" /></span>
      <div>
        <p class="metric-label">Students in report</p>
        <strong class="metric-value">{{ rows.length }}</strong>
        <p class="metric-note">Based on your selected filters</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon good"><AppIcon name="star" /></span>
      <div>
        <p class="metric-label">Average marks</p>
        <strong class="metric-value"
          >{{ average }}<small> / {{ MAX_MARKS }}</small></strong
        >
        <p class="metric-note">Current term discipline score</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon warning"><AppIcon name="alert" /></span>
      <div>
        <p class="metric-label">Committee referrals</p>
        <strong class="metric-value">{{ critical }}</strong>
        <p class="metric-note">Students below {{ CRITICAL }} marks</p>
      </div>
    </article>
  </section>
  <section class="panel">
    <div class="panel-header">
      <div class="page-heading">
        <p class="eyebrow">INSIGHT INTO ACTION</p>
        <h2>Discipline reports</h2>
        <p class="subtitle">Clear insights to support the right next step.</p>
      </div>
      <div class="actions noprint">
        <button class="secondary-button" @click="printPage">
          <AppIcon name="print" />Print / PDF</button
        ><button
          class="primary-button"
          :disabled="!rows.length"
          @click="exportCsv"
        >
          <AppIcon name="download" />Export CSV
        </button>
      </div>
    </div>
    <div class="filter-bar noprint">
      <div class="filters">
        <select v-model="level" aria-label="Filter report by level">
          <option value="">All levels</option>
          <option v-for="l in LEVELS" :key="l">{{ l }}</option></select
        ><select v-model="trade" aria-label="Filter report by trade">
          <option value="">All trades</option>
          <option v-for="t in TRADES" :key="t">{{ t }}</option></select
        ><label class="check-label"
          ><input v-model="onlyLow" type="checkbox" />Critical only · committee
          list</label
        ><span class="result-count">{{ rows.length }} students</span>
      </div>
    </div>
    <h3 class="printonly">{{ st.term }} {{ level }} {{ trade }}</h3>
    <div
      class="table-wrap"
      tabindex="0"
      role="region"
      aria-label="Discipline report table"
    >
      <table class="data-table report-table">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Registration</th>
            <th scope="col">Class</th>
            <th scope="col">Marks</th>
            <th scope="col">Recommended action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id">
            <td>
              <strong>{{ r.name }}</strong>
            </td>
            <td class="muted registration">{{ r.regNo }}</td>
            <td>
              <span class="class-pill">{{ r.level }} · {{ r.trade }}</span>
            </td>
            <td>
              <span class="status-pill" :class="status(r.m)"
                >{{ r.m }} / {{ MAX_MARKS }}</span
              >
            </td>
            <td>
              <span :class="['recommended-action', { muted: !actionFor(r.m) }]"
                ><AppIcon :name="actionFor(r.m) ? 'alert' : 'check'" />{{
                  actionFor(r.m) || "No action needed"
                }}</span
              >
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="5">
              <div class="empty-state">
                <AppIcon name="reports" />
                <h3>No students in this report</h3>
                <p>Adjust your filters to include more students.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <span>{{ rows.length }} students · {{ st.term }}</span
      ><span class="footer-hint"
        ><AppIcon name="shield" />Lowest marks first</span
      >
    </div>
  </section>
</template>
