<script setup>
import { computed } from "vue";
import { useSdms } from "../stores/sdms";
import { CRITICAL, MAX_MARKS, status } from "../data/seed";
import AppIcon from "../components/AppIcon.vue";

const emit = defineEmits(["navigate", "record-incident", "open-student"]);
const st = useSdms();
const activeClasses = computed(
  () =>
    new Set(st.students.map((student) => `${student.level}-${student.trade}`))
      .size,
);
const termRecords = computed(() =>
  st.students
    .flatMap((student) =>
      student.history
        .filter((record) => record.term === st.term)
        .map((record) => ({ ...record, student })),
    )
    .sort((a, b) => b.date.localeCompare(a.date)),
);
const incidents = computed(() =>
  termRecords.value.filter((record) => record.type === "deduct"),
);
const marksRemoved = computed(() =>
  incidents.value.reduce((total, record) => total + Number(record.points), 0),
);
const recentRecords = computed(() => termRecords.value.slice(0, 5));
const attention = computed(() =>
  st.students
    .map((student) => ({ student, marks: st.marks(student) }))
    .filter(({ marks }) => marks < 30)
    .sort(
      (a, b) =>
        a.marks - b.marks || a.student.name.localeCompare(b.student.name),
    ),
);
const criticalCount = computed(
  () => attention.value.filter(({ marks }) => marks < CRITICAL).length,
);
const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const date = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const time = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
</script>

<template>
  <div class="dashboard-heading">
    <div class="page-heading">
      <p class="eyebrow">YOUR SCHOOL WORKSPACE</p>
      <h2>Discipline overview</h2>
      <p class="subtitle">
        Here is what is happening across student discipline this term.
      </p>
    </div>
    <button
      class="primary-button record-incident"
      @click="emit('record-incident')"
    >
      <AppIcon name="plus" :size="21" /> Record incident
    </button>
  </div>

  <section
    class="metric-grid dashboard-metrics"
    aria-label="Current term overview"
  >
    <article class="metric-card">
      <div>
        <p class="metric-label">Registered students</p>
        <strong class="metric-value">{{ st.students.length }}</strong>
        <p class="metric-note">
          Across {{ activeClasses }}
          {{ activeClasses === 1 ? "active class" : "active classes" }}
        </p>
      </div>
      <span class="metric-icon"><AppIcon name="students" :size="24" /></span>
    </article>
    <article class="metric-card">
      <div>
        <p class="metric-label">Incidents this term</p>
        <strong class="metric-value">{{ incidents.length }}</strong>
        <p class="metric-note">Discipline incidents recorded</p>
      </div>
      <span class="metric-icon warning"
        ><AppIcon name="clipboard" :size="24"
      /></span>
    </article>
    <article class="metric-card">
      <div>
        <p class="metric-label">Marks removed</p>
        <strong class="metric-value">{{ marksRemoved }}</strong>
        <p class="metric-note">Total deductions, before restorations</p>
      </div>
      <span class="metric-icon marks-removed-icon"
        ><AppIcon name="alert" :size="24"
      /></span>
    </article>
    <article class="metric-card">
      <div>
        <p class="metric-label">Low remaining marks</p>
        <strong class="metric-value">{{ criticalCount }}</strong>
        <p class="metric-note">
          Students below {{ CRITICAL }} / {{ MAX_MARKS }} marks
        </p>
      </div>
      <span class="metric-icon good"><AppIcon name="shield" :size="24" /></span>
    </article>
  </section>

  <div class="dashboard-grid">
    <section
      class="panel recent-records-panel"
      aria-labelledby="recent-records-title"
    >
      <div class="panel-header dashboard-panel-heading">
        <div>
          <h3 id="recent-records-title">Recent discipline records</h3>
          <p>Latest student updates in {{ st.term }}</p>
        </div>
        <button
          class="dashboard-text-link"
          @click="emit('navigate', 'history')"
        >
          View all<AppIcon name="arrow-right" :size="19" />
        </button>
      </div>
      <div
        v-if="recentRecords.length"
        class="table-wrap"
        tabindex="0"
        role="region"
        aria-label="Recent discipline records table"
      >
        <table class="data-table dashboard-records-table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Record</th>
              <th scope="col">Marks</th>
              <th scope="col">Date &amp; time</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(record, index) in recentRecords"
              :key="`${record.student.id}-${record.date}-${index}`"
            >
              <td>
                <button
                  class="dashboard-student-link"
                  :aria-label="`Open ${record.student.name}'s record`"
                  @click="emit('open-student', record.student.id)"
                >
                  <span class="avatar">{{ initials(record.student.name) }}</span
                  ><span class="dashboard-cell-stack"
                    ><strong>{{ record.student.name }}</strong
                    ><small
                      >{{ record.student.regNo }} · {{ record.student.level }}
                      {{ record.student.trade }}</small
                    ></span
                  >
                </button>
              </td>
              <td>
                <span class="dashboard-cell-stack"
                  ><strong>{{ record.offense }}</strong
                  ><small>{{
                    record.note ||
                    (record.type === "deduct"
                      ? "Marks removed"
                      : "Marks restored")
                  }}</small></span
                >
              </td>
              <td>
                <span
                  class="dashboard-change"
                  :class="
                    record.type === 'deduct' ? 'deduction' : 'restoration'
                  "
                  >{{ record.type === "deduct" ? "−" : "+"
                  }}{{ record.points }}</span
                >
              </td>
              <td>
                <span class="dashboard-cell-stack dashboard-record-date"
                  ><strong>{{ date(record.date) }}</strong
                  ><small>{{ time(record.date) }}</small></span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="dashboard-empty">
        <span class="dashboard-empty-icon"
          ><AppIcon name="clipboard" :size="29"
        /></span>
        <h4>No records this term yet</h4>
        <p>
          New discipline records and restored marks will appear here as your
          team adds them.
        </p>
        <button class="secondary-button" @click="emit('record-incident')">
          <AppIcon name="plus" />Record first incident
        </button>
      </div>
      <div class="dashboard-panel-footer">
        <AppIcon name="clock" :size="16" /><span
          >Showing the
          {{
            recentRecords.length ? "latest " + recentRecords.length : "latest"
          }}
          updates for the active term</span
        >
      </div>
    </section>

    <section class="panel attention-panel" aria-labelledby="attention-title">
      <div class="panel-header dashboard-panel-heading">
        <div>
          <h3 id="attention-title">Needs attention</h3>
          <p>Students with fewer than 30 marks</p>
        </div>
        <span
          class="attention-count"
          :class="{ 'attention-count--active': attention.length }"
          >{{ attention.length }}</span
        >
      </div>
      <div class="attention-body">
        <ul v-if="attention.length" class="attention-list">
          <li v-for="item in attention.slice(0, 5)" :key="item.student.id">
            <button
              class="attention-student"
              :aria-label="`Open ${item.student.name}'s record, ${item.marks} marks remaining`"
              @click="emit('open-student', item.student.id)"
            >
              <span class="avatar">{{ initials(item.student.name) }}</span>
              <span class="dashboard-cell-stack"
                ><strong>{{ item.student.name }}</strong
                ><small
                  >{{ item.student.level }} {{ item.student.trade }} ·
                  {{ item.student.regNo }}</small
                ></span
              >
              <span class="attention-score" :class="status(item.marks)"
                ><strong>{{ item.marks }}</strong
                ><small>marks</small></span
              >
            </button>
          </li>
        </ul>
        <div v-else class="dashboard-empty attention-empty">
          <span class="dashboard-empty-icon good"
            ><AppIcon name="shield" :size="29"
          /></span>
          <h4>Everyone is in good standing</h4>
          <p>No students currently have fewer than 30 discipline marks.</p>
        </div>
        <button
          class="dashboard-text-link attention-view-all"
          @click="emit('navigate', 'students')"
        >
          View student directory<AppIcon name="arrow-right" :size="19" />
        </button>
        <div class="term-balance-note">
          <AppIcon name="shield" :size="22" />
          <div>
            <strong>Term balances are automatic</strong>
            <p>
              Each student starts with {{ MAX_MARKS }} marks. Balances reflect
              deductions and restorations in the active term.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div class="dashboard-term-summary">
    <span class="dashboard-term-icon"
      ><AppIcon name="calendar" :size="21"
    /></span>
    <div>
      <span>ACTIVE TERM</span><strong>{{ st.term }}</strong>
    </div>
    <button class="dashboard-text-link" @click="emit('navigate', 'reports')">
      View term report<AppIcon name="arrow-right" :size="19" />
    </button>
  </div>
</template>

<style scoped>
.dashboard-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}
.dashboard-heading .page-heading {
  margin: 0;
}
.dashboard-heading h2 {
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.7px;
}
.dashboard-heading .subtitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475b7b;
}
.record-incident {
  min-height: 48px;
  padding: 13px 21px;
  font-size: 0.9rem;
  font-weight: 750;
  flex-shrink: 0;
}
.dashboard-metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.dashboard-metrics .metric-card {
  padding: 23px 20px;
  gap: 10px;
  justify-content: space-between;
  min-width: 0;
}
.dashboard-metrics .metric-card > div {
  min-width: 0;
}
.dashboard-metrics .metric-label {
  font-size: 0.84rem;
  color: #475b7b;
  font-weight: 700;
  line-height: 1.5;
  min-height: 2.6em;
}
.dashboard-metrics .metric-value {
  font-size: 2.15rem;
  font-weight: 800;
  color: #172d54;
}
.dashboard-metrics .metric-note {
  font-size: 0.78rem;
  line-height: 1.6;
  font-weight: 600;
  color: #526582;
  margin-top: 11px;
}
.dashboard-metrics .metric-icon {
  width: 45px;
  height: 45px;
  margin-top: 0;
  border-radius: 14px;
}
.marks-removed-icon {
  color: #be4359;
  background: #fbeef1;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.95fr) minmax(300px, 1fr);
  gap: 22px;
  align-items: start;
}
.dashboard-panel-heading {
  align-items: center;
  padding: 25px 24px;
  border-bottom: 1px solid #e5eaf4;
}
.dashboard-panel-heading h3 {
  margin: 0 0 8px;
  font-size: 1.08rem;
  font-weight: 800;
  color: #193052;
  letter-spacing: -0.3px;
}
.dashboard-panel-heading p {
  color: #526582;
  font-size: 0.83rem;
  font-weight: 600;
  line-height: 1.6;
  margin: 0;
}
.dashboard-text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 0.85rem;
  font-weight: 750;
  color: #2d56a3;
  background: transparent;
  padding: 8px 0;
  white-space: nowrap;
}
.dashboard-text-link:hover {
  color: #172d6a;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.dashboard-records-table {
  min-width: 650px;
  font-size: 0.85rem;
}
.dashboard-records-table th {
  font-size: 0.75rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  color: #526582;
}
.dashboard-records-table td {
  padding-top: 20px;
  padding-bottom: 20px;
}
.dashboard-student-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0;
  background: none;
  text-align: left;
  color: inherit;
}
.dashboard-student-link:hover strong {
  color: #2d56a3;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dashboard-student-link .avatar,
.attention-student .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 0.78rem;
  font-weight: 800;
  background: #eaf0fb;
  color: #355c99;
}
.dashboard-cell-stack {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.dashboard-cell-stack strong {
  font-size: 0.84rem;
  line-height: 1.45;
  font-weight: 750;
  color: #263b5d;
}
.dashboard-cell-stack small {
  font-size: 0.76rem;
  line-height: 1.55;
  font-weight: 600;
  color: #526582;
  overflow-wrap: anywhere;
}
.dashboard-records-table td:nth-child(2) {
  min-width: 170px;
  max-width: 260px;
}
.dashboard-record-date {
  min-width: 90px;
}
.dashboard-change {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 10px;
  min-width: 40px;
  font-size: 0.85rem;
  font-weight: 800;
}
.dashboard-change.deduction {
  color: #b83249;
  background: #fff1f3;
  border-color: #f8dce2;
}
.dashboard-change.restoration {
  color: #24735e;
  background: #edf8f2;
  border-color: #d7ede2;
}
.dashboard-empty {
  text-align: center;
  padding: 42px 30px;
  color: #526582;
}
.dashboard-empty-icon {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #eef2fc;
  color: #4264a6;
  margin: 0 auto 18px;
}
.dashboard-empty-icon.good {
  color: #327d6b;
  background: #edf7f2;
}
.dashboard-empty h4 {
  margin: 0 0 11px;
  font-size: 1rem;
  font-weight: 800;
  color: #263b5d;
}
.dashboard-empty p {
  max-width: 370px;
  margin: 0 auto 23px;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.8;
}
.dashboard-empty .secondary-button {
  font-size: 0.85rem;
  font-weight: 750;
  min-height: 45px;
}
.dashboard-panel-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 17px 24px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #526582;
  background: #fcfdff;
  border-top: 1px solid #e9edf6;
  line-height: 1.5;
}
.attention-count {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  flex-shrink: 0;
  border: 1px solid #dce6ee;
  border-radius: 50%;
  background: #f1f6f8;
  font-size: 0.83rem;
  font-weight: 800;
  color: #526582;
}
.attention-count--active {
  border-color: #f4dfb3;
  background: #fff7e5;
  color: #9a650f;
}
.attention-body {
  padding: 5px 21px 21px;
}
.attention-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.attention-list li {
  border-bottom: 1px solid #e9edf6;
}
.attention-student {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 11px;
  padding: 20px 0;
  text-align: left;
  background: none;
  color: inherit;
  border-radius: 4px;
}
.attention-student:hover strong {
  color: #2d56a3;
}
.attention-student .dashboard-cell-stack {
  flex: 1;
}
.attention-score {
  min-width: 49px;
  padding: 8px 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border-radius: 10px;
  background: #fff6e2;
  color: #93671c;
  flex-shrink: 0;
}
.attention-score strong {
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.2;
}
.attention-score small {
  font-size: 0.72rem;
  font-weight: 650;
}
.attention-score.critical {
  color: #b33850;
  background: #fff0f3;
}
.attention-empty {
  padding: 30px 5px 5px;
}
.attention-empty p {
  font-size: 0.85rem;
  margin-bottom: 15px;
}
.attention-empty h4 {
  font-size: 0.95rem;
}
.attention-view-all {
  width: 100%;
  margin: 10px 0 14px;
  padding: 10px 0;
  font-size: 0.81rem;
}
.term-balance-note {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #f0f5ff;
  border: 1px solid #dce6fa;
  border-radius: 12px;
  color: #345c9e;
}
.term-balance-note > svg {
  flex-shrink: 0;
}
.term-balance-note strong {
  display: block;
  font-size: 0.79rem;
  font-weight: 800;
  line-height: 1.5;
}
.term-balance-note p {
  color: #4d6386;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.7;
  margin: 7px 0 0;
}
.dashboard-term-summary {
  display: flex;
  align-items: center;
  gap: 13px;
  background: #ecf0fa;
  border: 1px solid #dfe6f5;
  padding: 18px 23px;
  border-radius: 17px;
  margin-top: 24px;
}
.dashboard-term-icon {
  display: grid;
  place-items: center;
  background: #fff;
  color: #3c5895;
  border: 1px solid #e0e7f7;
  width: 43px;
  height: 43px;
  border-radius: 12px;
}
.dashboard-term-summary > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.dashboard-term-summary > div > span {
  color: #526582;
  font-size: 0.71rem;
  font-weight: 800;
  letter-spacing: 1px;
}
.dashboard-term-summary strong {
  color: #263b5d;
  font-size: 0.9rem;
  font-weight: 800;
}
.dashboard-term-summary .dashboard-text-link {
  margin-left: auto;
}
@media (max-width: 1100px) {
  .dashboard-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dashboard-metrics .metric-label {
    min-height: 0;
  }
  .dashboard-grid {
    grid-template-columns: minmax(0, 1.7fr) minmax(290px, 1fr);
    gap: 18px;
  }
  .dashboard-panel-heading {
    padding: 22px 20px;
  }
  .dashboard-panel-heading h3 {
    font-size: 1rem;
  }
  .dashboard-panel-heading p {
    font-size: 0.8rem;
  }
  .dashboard-records-table {
    min-width: 620px;
  }
}
@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .attention-body {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 0 24px;
    align-items: center;
    padding-top: 15px;
  }
  .attention-list,
  .attention-empty {
    grid-column: 1;
    grid-row: 1 / span 2;
  }
  .attention-view-all,
  .term-balance-note {
    grid-column: 2;
  }
  .attention-view-all {
    margin: 0 0 10px;
  }
  .attention-empty {
    padding: 15px 5px;
  }
  .attention-empty p {
    margin-bottom: 0;
  }
  .attention-list li:last-child {
    border-bottom: 0;
  }
  .term-balance-note {
    align-self: start;
  }
}
@media (max-width: 760px) {
  .dashboard-heading {
    flex-wrap: wrap;
    gap: 18px;
    margin-bottom: 22px;
  }
  .dashboard-heading h2 {
    font-size: 1.45rem;
  }
  .dashboard-heading .subtitle {
    font-size: 0.86rem !important;
  }
  .record-incident {
    width: 100%;
    min-height: 47px;
  }
  .dashboard-metrics {
    gap: 12px;
  }
  .dashboard-metrics .metric-card {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 16px;
    padding: 19px 16px;
    border-radius: 17px;
  }
  .dashboard-metrics .metric-label {
    font-size: 0.81rem;
  }
  .dashboard-metrics .metric-value {
    font-size: 1.9rem;
  }
  .dashboard-metrics .metric-note {
    font-size: 0.75rem;
    line-height: 1.7;
  }
  .dashboard-metrics .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .dashboard-metrics .metric-icon svg {
    width: 22px;
    height: 22px;
  }
  .dashboard-panel-heading {
    padding: 23px 20px;
    flex-wrap: nowrap;
    gap: 12px;
  }
  .dashboard-panel-heading h3 {
    font-size: 1.02rem;
    line-height: 1.5;
  }
  .dashboard-panel-heading p {
    font-size: 0.8rem;
  }
  .dashboard-panel-heading > .dashboard-text-link {
    font-size: 0.78rem;
    gap: 5px;
  }
  .dashboard-empty {
    padding: 32px 20px;
  }
  .dashboard-panel-footer {
    padding: 16px 20px;
    font-size: 0.75rem;
  }
  .attention-body {
    display: block;
    padding: 4px 19px 19px;
  }
  .attention-empty {
    padding: 28px 8px 10px;
  }
  .attention-empty p {
    font-size: 0.85rem;
  }
  .attention-view-all {
    margin: 7px 0 15px;
  }
  .attention-student {
    padding: 19px 0;
  }
  .dashboard-term-summary {
    padding: 16px;
    gap: 10px;
    flex-wrap: wrap;
  }
  .dashboard-term-summary .dashboard-text-link {
    width: 100%;
    justify-content: flex-start;
    margin: 6px 0 0 53px;
    font-size: 0.83rem;
  }
  .dashboard-term-summary strong {
    font-size: 0.88rem;
  }
}
@media (max-width: 390px) {
  .dashboard-metrics {
    gap: 10px;
  }
  .dashboard-metrics .metric-card {
    padding: 17px 13px;
  }
  .dashboard-metrics .metric-label {
    font-size: 0.79rem;
  }
  .dashboard-metrics .metric-note {
    font-size: 0.74rem;
  }
  .dashboard-panel-heading h3 {
    font-size: 0.95rem;
  }
  .dashboard-panel-heading > .dashboard-text-link {
    font-size: 0.75rem;
  }
  .dashboard-cell-stack strong {
    font-size: 0.8rem;
  }
  .dashboard-cell-stack small {
    font-size: 0.74rem;
  }
  .attention-student {
    gap: 9px;
  }
  .attention-student .avatar {
    width: 35px;
    height: 35px;
    font-size: 0.73rem;
  }
  .attention-score {
    min-width: 43px;
  }
}
</style>
