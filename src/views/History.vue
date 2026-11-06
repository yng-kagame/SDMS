<script setup>
import { ref, computed } from "vue";
import * as XLSX from "xlsx";
import { useSdms } from "../stores/sdms";
import { LEVELS, TRADES } from "../data/seed";
import AppIcon from "../components/AppIcon.vue";

const st = useSdms();
const q = ref(""),
  from = ref(""),
  to = ref(""),
  level = ref(""),
  trade = ref(""),
  type = ref("");
const day = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const time = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const all = computed(() =>
  st.students
    .flatMap((s) =>
      s.history.map((h) => ({
        ...h,
        regNo: s.regNo,
        name: s.name,
        level: s.level,
        trade: s.trade,
      })),
    )
    .sort((a, b) => b.date.localeCompare(a.date)),
);
const rows = computed(() =>
  all.value.filter((r) => {
    const t = q.value.trim().toLowerCase();
    return (
      (!t ||
        r.name.toLowerCase().includes(t) ||
        r.regNo.toLowerCase().includes(t)) &&
      (!level.value || r.level === level.value) &&
      (!trade.value || r.trade === trade.value) &&
      (!type.value || r.type === type.value) &&
      (!from.value || day(r.date) >= from.value) &&
      (!to.value || day(r.date) <= to.value)
    );
  }),
);
const removed = computed(
  () => all.value.filter((r) => r.type === "deduct").length,
);
const restored = computed(
  () => all.value.filter((r) => r.type === "restore").length,
);
function exportXlsx() {
  const data = rows.value.map((r, i) => ({
    No: i + 1,
    Date: day(r.date),
    Time: time(r.date),
    "Reg. no": r.regNo,
    Student: r.name,
    Level: r.level,
    Trade: r.trade,
    Type: r.type === "deduct" ? "Marks removed" : "Marks restored",
    Offense: r.offense,
    Marks: r.type === "deduct" ? -r.points : r.points,
    Note: r.note,
    "Recorded by": r.by,
    Term: r.term,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({
    wch: k === "Student" || k === "Offense" || k === "Note" ? 26 : 14,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Discipline history");
  XLSX.writeFile(wb, `discipline-history-${day(new Date())}.xlsx`);
}
function resetFilters() {
  q.value = "";
  from.value = "";
  to.value = "";
  level.value = "";
  trade.value = "";
  type.value = "";
}
</script>

<template>
  <section class="metric-grid" aria-label="History overview">
    <article class="metric-card">
      <span class="metric-icon"><AppIcon name="history" /></span>
      <div>
        <p class="metric-label">Total records</p>
        <strong class="metric-value">{{ all.length }}</strong>
        <p class="metric-note">A complete picture of progress</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon warning"><AppIcon name="alert" /></span>
      <div>
        <p class="metric-label">Marks removed</p>
        <strong class="metric-value">{{ removed }}</strong>
        <p class="metric-note">Recorded discipline incidents</p>
      </div>
    </article>
    <article class="metric-card">
      <span class="metric-icon good"><AppIcon name="refresh" /></span>
      <div>
        <p class="metric-label">Marks restored</p>
        <strong class="metric-value">{{ restored }}</strong>
        <p class="metric-note">Positive steps forward</p>
      </div>
    </article>
  </section>
  <section class="panel">
    <div class="panel-header">
      <div class="page-heading">
        <p class="eyebrow">EVERY STEP, RECORDED</p>
        <h2>Discipline history</h2>
        <p class="subtitle">
          Follow student progress and find the details that matter.
        </p>
      </div>
      <button
        class="primary-button"
        :disabled="!rows.length"
        @click="exportXlsx"
      >
        <AppIcon name="download" />Export Excel
      </button>
    </div>
    <div class="filter-bar">
      <div class="filters history-filters">
        <label class="search-field"
          ><AppIcon name="search" /><input
            v-model="q"
            aria-label="Search discipline history"
            placeholder="Search name or registration number…"
        /></label>
        <select v-model="level" aria-label="Filter history by level">
          <option value="">All levels</option>
          <option v-for="l in LEVELS" :key="l">{{ l }}</option>
        </select>
        <select v-model="trade" aria-label="Filter history by trade">
          <option value="">All trades</option>
          <option v-for="t in TRADES" :key="t">{{ t }}</option>
        </select>
        <select v-model="type" aria-label="Filter history by record type">
          <option value="">All records</option>
          <option value="deduct">Marks removed</option>
          <option value="restore">Marks restored</option>
        </select>
      </div>
      <div class="filters date-filters">
        <label class="date-field"
          >From<input
            v-model="from"
            type="date"
            :max="to || undefined" /></label
        ><label class="date-field"
          >To<input v-model="to" type="date" :min="from || undefined" /></label
        ><span class="result-count"
          >{{ rows.length }}
          {{ rows.length === 1 ? "record" : "records" }} found</span
        >
      </div>
    </div>
    <div
      class="table-wrap"
      tabindex="0"
      role="region"
      aria-label="Discipline history table"
    >
      <table class="data-table history-table">
        <thead>
          <tr>
            <th scope="col">Date &amp; time</th>
            <th scope="col">Student</th>
            <th scope="col">Class</th>
            <th scope="col">Record</th>
            <th scope="col">Marks</th>
            <th scope="col">Note</th>
            <th scope="col">Recorded by</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i">
            <td>
              <span class="cell-stack"
                >{{ day(r.date) }}<small>{{ time(r.date) }}</small></span
              >
            </td>
            <td>
              <span class="cell-stack"
                ><strong>{{ r.name }}</strong
                ><small>{{ r.regNo }}</small></span
              >
            </td>
            <td>
              <span class="class-pill">{{ r.level }} · {{ r.trade }}</span>
            </td>
            <td>
              <span class="cell-stack"
                >{{ r.offense }}<small>{{ r.term }}</small></span
              >
            </td>
            <td>
              <span
                class="change-pill"
                :class="r.type === 'deduct' ? 'neg' : 'pos'"
                >{{ r.type === "deduct" ? "−" : "+" }}{{ r.points }}</span
              >
            </td>
            <td class="note-cell muted">{{ r.note || "—" }}</td>
            <td>{{ r.by }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7">
              <div class="empty-state">
                <AppIcon name="history" />
                <h3>
                  {{ all.length ? "No matching records" : "A fresh start" }}
                </h3>
                <p>
                  {{
                    all.length
                      ? "Try a different date range or clear your filters."
                      : "Student discipline records will appear here as you add them."
                  }}
                </p>
                <button
                  v-if="all.length"
                  class="secondary-button"
                  @click="resetFilters"
                >
                  Clear filters
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <span
        >{{ rows.length }} {{ rows.length === 1 ? "record" : "records" }}</span
      ><span class="footer-hint"
        ><AppIcon name="clock" />Most recent first</span
      >
    </div>
  </section>
</template>
