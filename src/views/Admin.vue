<script setup>
import { ref } from "vue";
import { useSdms } from "../stores/sdms";
import { LEVELS, TRADES } from "../data/seed";
import AppIcon from "../components/AppIcon.vue";

const st = useSdms();
const term = ref(""),
  msg = ref(""),
  error = ref(false),
  deleteId = ref("");
const f = ref({
  regNo: "",
  name: "",
  level: "L3",
  trade: "SOD",
  parentPhone: "",
});
const off = ref({ name: "", points: 1 });
const notify = (text, isError = false) => {
  msg.value = text;
  error.value = isError;
};
const validPoints = (n) => Number.isInteger(Number(n)) && Number(n) > 0;

function add() {
  const student = {
    ...f.value,
    regNo: f.value.regNo.trim(),
    name: f.value.name.trim(),
    parentPhone: f.value.parentPhone.trim(),
  };
  if (!student.regNo || !student.name)
    return notify("Enter a registration number and full name.", true);
  if (
    st.students.some(
      (s) => s.regNo.toLowerCase() === student.regNo.toLowerCase(),
    )
  )
    return notify("That registration number already exists.", true);
  st.addStudent(student);
  f.value.regNo = f.value.name = f.value.parentPhone = "";
  notify(`${student.name} has been added to the directory.`);
}
async function imp(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    notify(
      `${st.importCsv(await file.text())} students imported. Duplicate or invalid rows were skipped.`,
    );
  } catch {
    notify(
      "We could not read that file. Please choose a valid CSV file.",
      true,
    );
  } finally {
    e.target.value = "";
  }
}
function addOff() {
  const name = off.value.name.trim();
  if (!name || !validPoints(off.value.points))
    return notify(
      "Enter an offense and a positive whole number of marks.",
      true,
    );
  if (st.offenses.some((o) => o.name.toLowerCase() === name.toLowerCase()))
    return notify("That offense already exists.", true);
  st.offenses.push({ name, points: Number(off.value.points) });
  st.log("offense added", name);
  off.value = { name: "", points: 1 };
  notify("New offense added.");
}
function saveOff(o) {
  o.name = o.name.trim();
  if (!o.name) o.name = "Other offense";
  if (!validPoints(o.points)) o.points = 1;
  st.save();
}
function delOff(i) {
  const [removed] = st.offenses.splice(i, 1);
  st.log("offense removed", removed.name);
  notify("Offense removed. Existing discipline records are kept.");
}
function del() {
  const student = st.students.find((s) => s.id === Number(deleteId.value));
  if (
    student &&
    confirm(
      `Delete ${student.name} and their discipline history? This cannot be undone.`,
    )
  ) {
    st.removeStudent(student.id);
    deleteId.value = "";
    notify(`${student.name} has been removed.`);
  }
}
function newTerm() {
  const name = term.value.trim();
  if (
    name &&
    confirm(
      "Start a new term? Everyone returns to 40 marks. Previous history is kept.",
    )
  ) {
    st.newTerm(name);
    term.value = "";
    notify(`Started ${name}. Previous discipline history is still available.`);
  }
}
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">MAKE IT YOURS</p>
      <h2>Administration</h2>
      <p class="subtitle">A well-organized school starts with the details.</p>
    </div>
    <span class="status-pill"><AppIcon name="shield" /> Administrator</span>
  </div>
  <p v-if="msg" :class="error ? 'alert' : 'notice'" role="status">
    <AppIcon :name="error ? 'alert' : 'check'" />{{ msg }}
  </p>

  <div class="admin-grid">
    <section class="panel">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="calendar" /></span>
          <div>
            <h3>Academic term</h3>
            <p>Keep every record in the right chapter.</p>
          </div>
        </div>
      </div>
      <div class="panel-body">
        <div class="current-term">
          <span>Current term</span><strong>{{ st.term }}</strong
          ><span class="status-pill good">Active</span>
        </div>
        <form class="admin-stack" @submit.prevent="newTerm">
          <label class="field"
            >New term name<input
              v-model="term"
              placeholder="e.g. 2026 – Term 2"
              required
          /></label>
          <p class="form-hint">
            Starting a new term resets all students to 40 marks. Previous
            records stay in History.
          </p>
          <button
            type="submit"
            class="secondary-button"
            :disabled="!term.trim()"
          >
            <AppIcon name="refresh" />Start new term
          </button>
        </form>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="students" /></span>
          <div>
            <h3>Add a student</h3>
            <p>A new face. A fresh start.</p>
          </div>
        </div>
      </div>
      <form class="panel-body admin-stack" @submit.prevent="add">
        <div class="form-grid">
          <label class="field"
            >Registration number<input
              v-model="f.regNo"
              placeholder="SJ26-001"
              required
          /></label>
          <label class="field"
            >Full name<input
              v-model="f.name"
              placeholder="Student's full name"
              required
          /></label>
          <label class="field"
            >Level<select v-model="f.level">
              <option v-for="l in LEVELS" :key="l">{{ l }}</option>
            </select></label
          >
          <label class="field"
            >Trade<select v-model="f.trade">
              <option v-for="t in TRADES" :key="t">{{ t }}</option>
            </select></label
          >
        </div>
        <label class="field"
          >Parent phone <span class="optional">(optional)</span
          ><input v-model="f.parentPhone" type="tel" placeholder="07…"
        /></label>
        <button class="primary-button" type="submit">
          <AppIcon name="plus" />Add student
        </button>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="upload" /></span>
          <div>
            <h3>Import a class</h3>
            <p>Bring your student list together.</p>
          </div>
        </div>
      </div>
      <div class="panel-body admin-stack">
        <label class="import-zone"
          ><AppIcon name="upload" /><strong>Choose a CSV file</strong
          ><span>Import several students at once.</span
          ><input type="file" accept=".csv,text/csv" @change="imp"
        /></label>
        <p class="form-hint">
          Columns, in order:
          <code>regNo, name, level, trade, parentPhone</code>. Use levels L3–L5
          and trades SOD, CSA, BDC, or PWO.
        </p>
      </div>
    </section>

    <section class="panel offense-panel">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="shield" /></span>
          <div>
            <h3>Offenses &amp; marks</h3>
            <p>Set clear expectations for everyone.</p>
          </div>
        </div>
        <span class="status-pill">{{ st.offenses.length }} offenses</span>
      </div>
      <div class="panel-body">
        <div class="offense-list">
          <div v-for="(o, i) in st.offenses" :key="i" class="offense-row">
            <label class="field"
              ><span class="sr-only">Offense {{ i + 1 }} name</span
              ><input v-model="o.name" @change="saveOff(o)"
            /></label>
            <label class="field"
              ><span class="sr-only">Marks for offense {{ i + 1 }}</span
              ><input
                v-model.number="o.points"
                type="number"
                min="1"
                step="1"
                @change="saveOff(o)"
            /></label>
            <button
              type="button"
              class="icon-button"
              :aria-label="`Remove ${o.name}`"
              @click="delOff(i)"
            >
              <AppIcon name="trash" />
            </button>
          </div>
          <p v-if="!st.offenses.length" class="empty-state">
            Add an offense below to start recording deductions.
          </p>
        </div>
        <form class="offense-add" @submit.prevent="addOff">
          <label class="field"
            >New offense<input
              v-model="off.name"
              placeholder="Offense name"
              required
          /></label>
          <label class="field"
            >Marks<input
              v-model.number="off.points"
              type="number"
              min="1"
              step="1"
              required
          /></label>
          <button class="primary-button" type="submit" aria-label="Add offense">
            <AppIcon name="plus" />
          </button>
        </form>
      </div>
    </section>

    <section class="panel admin-audit">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="history" /></span>
          <div>
            <h3>Audit trail</h3>
            <p>The latest 50 actions in your workspace.</p>
          </div>
        </div>
        <span class="status-pill"
          >{{ Math.min(st.audit.length, 50) }} entries</span
        >
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date &amp; time</th>
              <th>Recorded by</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in st.audit.slice(0, 50)" :key="i">
              <td>{{ new Date(a.date).toLocaleString() }}</td>
              <td>{{ a.user }}</td>
              <td>
                <span class="status-pill">{{ a.action }}</span>
              </td>
              <td>{{ a.detail || "—" }}</td>
            </tr>
            <tr v-if="!st.audit.length">
              <td colspan="4" class="empty-state">
                Your workspace activity will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel admin-delete">
      <div class="panel-header">
        <div class="admin-section-title">
          <span class="section-icon"><AppIcon name="trash" /></span>
          <div>
            <h3>Remove a student</h3>
            <p>Permanently delete a student and their history.</p>
          </div>
        </div>
      </div>
      <form class="panel-body filters" @submit.prevent="del">
        <label class="field"
          >Select student<select v-model="deleteId">
            <option value="">Choose a student…</option>
            <option v-for="s in st.students" :key="s.id" :value="s.id">
              {{ s.regNo }} · {{ s.name }}
            </option>
          </select></label
        ><button type="submit" class="danger-button" :disabled="!deleteId">
          <AppIcon name="trash" />Remove student
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  align-items: start;
}
.admin-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-section-title h3 {
  margin: 0;
  font-size: 1rem;
}
.admin-section-title p {
  margin: 5px 0 0;
  color: var(--muted, #68708b);
  font-size: 0.78rem;
  line-height: 1.5;
}
.section-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #edf0ff;
  color: #2c3898;
  flex-shrink: 0;
}
.admin-stack {
  display: flex;
  flex-direction: column;
  gap: 17px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.current-term {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
  background: #f4f5fc;
  border: 1px solid #e9eaf4;
  border-radius: 16px;
  margin-bottom: 20px;
}
.current-term > span:first-child {
  color: #68708b;
  font-size: 0.8rem;
  width: 100%;
}
.current-term strong {
  font-size: 0.95rem;
  margin-right: auto;
}
.form-hint {
  color: var(--muted, #68708b);
  font-size: 0.78rem;
  line-height: 1.7;
  margin: 0;
}
.form-hint code {
  overflow-wrap: anywhere;
  color: #414b85;
}
.optional {
  color: #68708b;
  font-weight: 700;
}
.import-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  padding: 28px 14px;
  background: #f8f9ff;
  border: 1.5px dashed #ccd2eb;
  border-radius: 18px;
  color: #303e90;
  cursor: pointer;
}
.import-zone > svg {
  width: 30px;
  height: 30px;
  margin-bottom: 3px;
}
.import-zone > span {
  font-size: 0.78rem;
  color: #68708b;
}
.import-zone input {
  width: 100%;
  margin-top: 10px;
  font-size: 0.78rem;
}
.offense-panel {
  grid-column: 2;
  grid-row: 2 / span 1;
}
.offense-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.offense-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px 38px;
  gap: 8px;
  align-items: center;
}
.offense-row input {
  min-height: 40px;
  font-size: 0.8rem;
}
.offense-add {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px 42px;
  gap: 8px;
  align-items: end;
  border-top: 1px solid #eceef7;
  margin-top: 18px;
  padding-top: 18px;
}
.offense-add button {
  min-height: 44px;
  padding: 10px;
}
.admin-audit,
.admin-delete {
  grid-column: 1 / -1;
}
.admin-delete .filters {
  align-items: end;
  margin: 0;
  gap: 14px;
}
.admin-delete .field {
  flex: 1;
}
.admin-audit td:last-child {
  white-space: normal;
  min-width: 220px;
  max-width: 450px;
}
.admin-audit td:first-child {
  white-space: nowrap;
}
@media (max-width: 760px) {
  .admin-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .offense-panel {
    grid-column: auto;
    grid-row: auto;
  }
  .admin-audit,
  .admin-delete {
    grid-column: auto;
  }
  .form-grid {
    gap: 12px;
  }
  .admin-delete .filters {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
