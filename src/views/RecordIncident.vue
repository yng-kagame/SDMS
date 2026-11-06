<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useSdms } from "../stores/sdms";
import { CRITICAL, LEVELS, MAX_MARKS, status } from "../data/seed";
import AppIcon from "../components/AppIcon.vue";
import StudentPhoto from "../components/StudentPhoto.vue";

const emit = defineEmits(["navigate", "recorded"]);
const st = useSdms();
const trades = ["CSA", "SOD", "BDC", "PWO"];
const level = ref("");
const trade = ref("");
const query = ref("");
const selectedId = ref(null);
const profileHeading = ref(null);
const offenseIndex = ref("");
const points = ref("");
const note = ref("");
const saving = ref(false);
const error = ref("");
const saved = ref(null);

const matches = computed(() => {
  const search = query.value.trim().toLowerCase();
  return st.students.filter(
    (student) =>
      (!level.value || student.level === level.value) &&
      (!trade.value || student.trade === trade.value) &&
      (!search ||
        student.name.toLowerCase().includes(search) ||
        student.regNo.toLowerCase().includes(search)),
  );
});
const selected = computed(() =>
  st.students.find((student) => student.id === selectedId.value),
);
const currentMarks = computed(() =>
  selected.value ? st.marks(selected.value) : 0,
);
const chosenOffense = computed(() =>
  offenseIndex.value === "" ? null : st.offenses[Number(offenseIndex.value)],
);
const amount = computed(() => Number(points.value));
const validAmount = computed(
  () =>
    Number.isInteger(amount.value) &&
    amount.value > 0 &&
    amount.value <= currentMarks.value,
);
const valid = computed(
  () =>
    !!selected.value &&
    !!chosenOffense.value?.name?.trim() &&
    validAmount.value &&
    !!st.user &&
    !saving.value,
);
const after = computed(() =>
  validAmount.value ? currentMarks.value - amount.value : currentMarks.value,
);
const amountError = computed(() => {
  if (points.value === "") return "";
  if (!Number.isInteger(amount.value) || amount.value < 1)
    return "Enter a positive whole number of marks.";
  if (amount.value > currentMarks.value)
    return `Only ${currentMarks.value} marks are available to remove.`;
  return "";
});
const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const standing = (marks) =>
  marks < CRITICAL
    ? "Critical"
    : marks < 30
      ? "Needs attention"
      : "Good standing";

function resetDraft() {
  offenseIndex.value = "";
  points.value = "";
  note.value = "";
  error.value = "";
  saved.value = null;
}
async function chooseStudent(student) {
  if (selectedId.value === student.id) return;
  selectedId.value = student.id;
  resetDraft();
  await nextTick();
  profileHeading.value?.focus({ preventScroll: true });
  if (window.matchMedia("(max-width: 900px)").matches) {
    profileHeading.value?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
}
function pickOffense() {
  points.value = chosenOffense.value?.points ?? "";
  error.value = "";
  saved.value = null;
}
function clearFilters() {
  level.value = "";
  trade.value = "";
  query.value = "";
}
watch([level, trade, query], () => {
  if (
    selectedId.value !== null &&
    !matches.value.some((student) => student.id === selectedId.value)
  ) {
    selectedId.value = null;
    resetDraft();
  }
});
watch(
  () => selected.value?.id,
  (id) => {
    if (id === undefined) {
      selectedId.value = null;
      resetDraft();
    }
  },
);

function submit() {
  if (!valid.value || saving.value) return;
  saving.value = true;
  error.value = "";
  const student = selected.value;
  const removed = amount.value;
  try {
    const record = st.record(
      student.id,
      "deduct",
      chosenOffense.value.name,
      removed,
      note.value.trim(),
    );
    saved.value = { name: student.name, removed, remaining: st.marks(student) };
    // Clearing the completed draft also prevents a second click submitting it again.
    offenseIndex.value = "";
    points.value = "";
    note.value = "";
    emit("recorded", { studentId: student.id, record });
  } catch (reason) {
    error.value =
      reason?.message ||
      "The record could not be saved. Your details are still here; please try again.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="incident-heading">
    <div class="page-heading">
      <p class="eyebrow">GUIDANCE, ONE STUDENT AT A TIME</p>
      <h2>Record discipline</h2>
      <p class="subtitle">
        Find a student, review their profile, and record the incident. Date and
        time are saved automatically.
      </p>
    </div>
    <button class="secondary-button" @click="emit('navigate', 'history')">
      <AppIcon name="history" />View history
    </button>
  </div>

  <div class="incident-layout">
    <section class="panel student-finder" aria-labelledby="finder-title">
      <div class="panel-header incident-panel-heading">
        <span class="step-number">1</span>
        <h3 id="finder-title">Find a student</h3>
      </div>
      <div class="finder-controls">
        <div class="finder-filters">
          <label class="field"
            >RTQF level<select v-model="level" aria-label="RTQF level">
              <option value="">All levels</option>
              <option v-for="item in LEVELS" :key="item" :value="item">
                {{ item }}
              </option>
            </select></label
          >
          <label class="field"
            >Trade<select v-model="trade" aria-label="Student trade">
              <option value="">All trades</option>
              <option v-for="item in trades" :key="item" :value="item">
                {{ item }}
              </option>
            </select></label
          >
        </div>
        <label class="search-field finder-search"
          ><AppIcon name="search" /><input
            v-model="query"
            type="search"
            aria-label="Search class students"
            placeholder="Search name or registration number"
        /></label>
        <p class="finder-result-count" role="status" aria-live="polite">
          {{ matches.length }} {{ matches.length === 1 ? "student" : "students"
          }}<span v-if="level || trade">
            · {{ level || "All levels" }} {{ trade || "All trades" }}</span
          >
        </p>
      </div>
      <div
        class="finder-list"
        tabindex="0"
        role="region"
        aria-label="Matching students"
      >
        <ul v-if="matches.length" class="finder-students">
          <li v-for="student in matches" :key="student.id">
            <button
              type="button"
              class="finder-student"
              :class="{ 'is-selected': selectedId === student.id }"
              :aria-pressed="selectedId === student.id"
              :aria-label="`Select ${student.name}, ${student.regNo}, ${student.level} ${student.trade}`"
              @click="chooseStudent(student)"
            >
              <span class="avatar">{{ initials(student.name) }}</span
              ><span class="finder-student-info"
                ><strong>{{ student.name }}</strong
                ><small
                  >{{ student.regNo }} · {{ student.level }}
                  {{ student.trade }}</small
                ></span
              ><span
                class="finder-student-marks"
                :class="status(st.marks(student))"
                ><strong>{{ st.marks(student) }}</strong
                ><small>marks</small></span
              ><AppIcon
                v-if="selectedId === student.id"
                name="check"
                :size="17"
              />
            </button>
          </li>
        </ul>
        <div v-else class="empty-state finder-empty">
          <AppIcon name="search" />
          <h3>No matching students</h3>
          <p>Try another name or choose a different level and trade.</p>
          <button class="secondary-button" @click="clearFilters">
            Clear filters
          </button>
        </div>
      </div>
    </section>

    <section
      class="panel incident-details"
      aria-labelledby="incident-details-title"
    >
      <div class="panel-header incident-panel-heading">
        <span class="step-number">2</span>
        <h3 id="incident-details-title">Student profile &amp; incident</h3>
      </div>
      <div v-if="!selected" class="incident-prompt">
        <span><AppIcon name="user" :size="46" /></span>
        <h3>Select a student</h3>
        <p>
          Choose a level and trade, then select a student from the list to see
          their profile and enter incident details.
        </p>
      </div>
      <div v-else class="incident-selected">
        <div class="incident-profile">
          <StudentPhoto :key="selected.id" :student="selected" editable />
          <div class="incident-profile-info">
            <p class="eyebrow">STUDENT PROFILE</p>
            <h3 ref="profileHeading" tabindex="-1" class="profile-name">
              {{ selected.name }}
            </h3>
            <p class="profile-registration">{{ selected.regNo }}</p>
            <span class="profile-class"
              >{{ selected.level }} · {{ selected.trade }}</span
            ><span class="status-pill" :class="status(currentMarks)"
              ><AppIcon :name="currentMarks < 30 ? 'alert' : 'shield'" />{{
                standing(currentMarks)
              }}</span
            >
          </div>
          <div class="profile-marks" :class="status(currentMarks)">
            <strong
              >{{ currentMarks }}<small> / {{ MAX_MARKS }}</small></strong
            ><span>Remaining marks</span><small>{{ st.term }}</small>
          </div>
        </div>

        <div class="incident-entry">
          <div
            v-if="saved"
            class="incident-saved"
            role="status"
            aria-live="polite"
          >
            <AppIcon name="check" :size="23" />
            <div>
              <strong
                >{{ saved.removed }}
                {{ saved.removed === 1 ? "mark" : "marks" }} removed. Saved to
                History.</strong
              >
              <p>
                {{ saved.name }} now has {{ saved.remaining }} /
                {{ MAX_MARKS }} marks.
              </p>
              <button
                class="saved-history-link"
                @click="emit('navigate', 'history')"
              >
                View saved history<AppIcon name="arrow-right" :size="17" />
              </button>
            </div>
          </div>
          <p v-if="error" class="alert" role="alert">
            <AppIcon name="alert" />{{ error }}
          </p>
          <p v-if="!st.offenses.length" class="notice">
            <AppIcon name="alert" />No offenses are configured. Ask an
            administrator to add an offense before recording a deduction.
          </p>
          <p v-if="currentMarks === 0" class="notice">
            <AppIcon name="shield" />This student has no marks left to remove.
            Their current record is available in History.
          </p>

          <form class="incident-form" @submit.prevent="submit">
            <fieldset
              :disabled="
                saving || !st.user || !st.offenses.length || currentMarks === 0
              "
            >
              <legend>Incident details</legend>
              <label class="field"
                >Offense<select
                  v-model="offenseIndex"
                  aria-label="Offense"
                  required
                  @change="pickOffense"
                >
                  <option value="" disabled>Choose an offense</option>
                  <option
                    v-for="(offense, index) in st.offenses"
                    :key="index"
                    :value="index"
                  >
                    {{ offense.name }} · {{ offense.points }} suggested
                    {{ offense.points === 1 ? "mark" : "marks" }}
                  </option>
                </select></label
              >
              <label class="field"
                >Marks to remove<input
                  v-model="points"
                  type="number"
                  min="1"
                  :max="currentMarks"
                  step="1"
                  inputmode="numeric"
                  placeholder="Enter number of marks"
                  required
                  :aria-invalid="!!amountError"
                  :aria-describedby="
                    amountError ? 'incident-mark-error' : 'incident-mark-help'
                  "
                  @input="
                    error = '';
                    saved = null;
                  "
              /></label>
              <p
                v-if="amountError"
                id="incident-mark-error"
                class="incident-field-error"
                role="alert"
              >
                {{ amountError }}
              </p>
              <p v-else id="incident-mark-help" class="incident-form-hint">
                Use a positive whole number, up to the student's current
                balance.
              </p>
              <label class="field"
                >Incident note <span class="optional">(optional)</span
                ><textarea
                  v-model="note"
                  rows="3"
                  placeholder="Add what happened or any useful context…"
                  @input="error = ''"
                />
              </label>
              <div class="incident-calculation" aria-label="Mark calculation">
                <div>
                  <span>Current marks</span><strong>{{ currentMarks }}</strong>
                </div>
                <AppIcon name="arrow-right" :size="19" />
                <div>
                  <span>To remove</span
                  ><strong class="removed-marks">{{
                    validAmount ? "−" + amount : "—"
                  }}</strong>
                </div>
                <AppIcon name="arrow-right" :size="19" />
                <div>
                  <span>Marks remaining</span
                  ><strong :class="status(after)">{{ after }}</strong>
                </div>
              </div>
              <p v-if="validAmount && after < CRITICAL" class="alert">
                <AppIcon name="alert" />This leaves {{ after }} marks. The
                student will require disciplinary committee review.
              </p>
              <button
                class="primary-button save-incident"
                type="submit"
                :disabled="!valid"
              >
                <AppIcon name="check" />{{
                  saving ? "Saving record…" : "Remove marks & save"
                }}
              </button>
            </fieldset>
            <p class="incident-save-note">
              <AppIcon name="history" :size="16" />Saved immediately to History
              with your name, the date, time, and active term.
            </p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.incident-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  margin-bottom: 25px;
}
.incident-heading .page-heading {
  margin: 0;
}
.incident-heading h2 {
  font-size: 1.65rem;
  font-weight: 800;
}
.incident-heading .subtitle {
  font-size: 0.87rem;
  font-weight: 700;
  max-width: 750px;
  color: #475b7b;
}
.incident-heading > .secondary-button {
  flex-shrink: 0;
  font-weight: 750;
}
.incident-layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(0, 1.45fr);
  gap: 24px;
  align-items: start;
}
.incident-panel-heading {
  justify-content: flex-start;
  padding: 23px 25px;
  border-bottom: 1px solid #e4eaf5;
  gap: 13px;
}
.incident-panel-heading h3 {
  margin: 0;
  font-size: 1.03rem;
  color: #243b60;
  font-weight: 800;
}
.step-number {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: #233c88;
  color: white;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.finder-controls {
  padding: 24px 22px 10px;
}
.finder-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.finder-filters .field {
  font-size: 0.85rem;
  font-weight: 750;
  color: #3c5274;
}
.finder-filters select {
  font-size: 0.88rem;
  font-weight: 700;
  min-height: 48px;
}
.finder-search {
  min-width: 0;
  margin-top: 17px;
}
.finder-search input {
  font-size: 0.82rem;
  min-height: 48px;
}
.finder-result-count {
  font-size: 0.77rem;
  color: #526582;
  font-weight: 700;
  line-height: 1.7;
  margin: 15px 0 2px;
}
.finder-list {
  max-height: 590px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #b9c9e8 transparent;
}
.finder-students {
  padding: 0 13px 13px;
  margin: 0;
  list-style: none;
}
.finder-students li + li {
  border-top: 1px solid #e9edf5;
}
.finder-student {
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
  width: 100%;
  padding: 18px 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: #fff;
  min-height: 86px;
  color: #536c94;
}
.finder-student:hover {
  background: #f5f8ff;
}
.finder-student.is-selected {
  background: #eef3ff;
  border-color: #c6d4f2;
}
.finder-student .avatar {
  width: 39px;
  height: 39px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 800;
  background: #eaf0fb;
  color: #446393;
}
.finder-student-info {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  flex: 1;
}
.finder-student-info strong {
  font-size: 0.85rem;
  font-weight: 750;
  color: #293f61;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.finder-student-info small {
  font-size: 0.75rem;
  font-weight: 700;
  color: #526582;
  line-height: 1.5;
}
.finder-student-marks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  flex-shrink: 0;
  color: #24765f;
}
.finder-student-marks strong {
  font-size: 1.06rem;
  line-height: 1.2;
  font-weight: 800;
}
.finder-student-marks small {
  font-size: 0.75rem;
  font-weight: 700;
  color: #526582;
}
.finder-student-marks.warning {
  color: #9c6e12;
}
.finder-student-marks.critical {
  color: #b53d56;
}
.finder-empty {
  padding: 34px 17px;
}
.incident-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  padding: 45px 35px;
  text-align: center;
}
.incident-prompt > span {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: #f0f4fc;
  color: #738bad;
  margin-bottom: 23px;
}
.incident-prompt h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #344c71;
  margin: 0 0 14px;
}
.incident-prompt p {
  max-width: 410px;
  color: #526582;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.85;
  margin: 0;
}
.incident-selected {
  padding: 25px;
}
.incident-profile {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  text-align: center;
  padding-bottom: 26px;
  margin-bottom: 23px;
  border-bottom: 1px solid #e5ebf5;
}
.incident-profile-info {
  min-width: 0;
  width: 100%;
  flex: none;
}
.incident-profile-info .eyebrow {
  font-size: 0.75rem;
  letter-spacing: 1.2px;
}
.profile-name {
  font-size: 1.24rem;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: -0.3px;
  overflow-wrap: anywhere;
  margin: 0 0 7px;
  scroll-margin-top: 22px;
}
.profile-registration {
  font-size: 0.8rem;
  color: #526582;
  font-weight: 700;
  margin: 0 0 12px;
}
.profile-class {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  background: #eef2fc;
  color: #3c5689;
  font-weight: 800;
  font-size: 0.8rem;
  margin-right: 8px;
  margin-bottom: 9px;
}
.incident-profile-info .status-pill {
  font-size: 0.75rem;
  margin-bottom: 9px;
}
.profile-marks {
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: center;
  flex-shrink: 0;
  color: #24417a;
  background: #f4f7fd;
  padding: 15px 22px;
  border-radius: 14px;
  width: 100%;
  max-width: 320px;
}
.profile-marks > strong {
  font-size: 2.1rem;
  line-height: 1.2;
  letter-spacing: -1px;
  font-weight: 800;
}
.profile-marks > strong > small {
  font-size: 0.88rem;
  font-weight: 700;
  color: #526582;
  letter-spacing: 0;
}
.profile-marks > span {
  font-size: 0.75rem;
  font-weight: 750;
  color: #465e82;
}
.profile-marks > small {
  font-size: 0.75rem;
  font-weight: 700;
  color: #526582;
  max-width: 145px;
}
.profile-marks.warning > strong {
  color: #9c6e12;
}
.profile-marks.critical > strong {
  color: #b53d56;
}
.incident-saved {
  display: flex;
  gap: 12px;
  border: 1px solid #d2eadd;
  border-radius: 14px;
  padding: 17px;
  background: #eff9f3;
  color: #256b50;
  margin-bottom: 22px;
}
.incident-saved > svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.incident-saved strong {
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.6;
}
.incident-saved p {
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.7;
  margin: 5px 0 7px;
}
.saved-history-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #245d8d;
  font-weight: 800;
  font-size: 0.82rem;
  padding: 3px 0;
  background: none;
}
.saved-history-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.incident-form fieldset {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0;
  margin: 0;
  border: 0;
  min-width: 0;
}
.incident-form legend {
  padding: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #294365;
  margin-bottom: 20px;
}
.incident-form .field {
  font-size: 0.85rem;
  font-weight: 750;
  color: #3c5274;
}
.incident-form select,
.incident-form input,
.incident-form textarea {
  font-size: 0.86rem;
  font-weight: 700;
}
.incident-form textarea {
  resize: vertical;
  min-height: 92px;
  line-height: 1.7;
}
.incident-form-hint,
.incident-field-error {
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.7;
  margin: -9px 0 0;
}
.incident-form-hint {
  color: #526582;
}
.incident-field-error {
  color: #ad3e55;
}
.optional {
  font-size: 0.75rem;
  color: #657692;
  font-weight: 700;
  display: inline;
}
.incident-calculation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 20px 17px;
  background: #f1f5fd;
  border: 1px solid #e1e9f8;
  border-radius: 14px;
}
.incident-calculation > div {
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: center;
  min-width: 0;
}
.incident-calculation span {
  font-size: 0.75rem;
  font-weight: 750;
  color: #526582;
}
.incident-calculation strong {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.3;
  color: #24417a;
}
.incident-calculation strong.removed-marks {
  color: #b64d60;
}
.incident-calculation strong.critical {
  color: #b53d56;
}
.incident-calculation strong.warning {
  color: #9c6e12;
}
.incident-calculation > svg {
  color: #8295b7;
  flex-shrink: 0;
}
.save-incident {
  min-height: 49px;
  font-size: 0.9rem;
  font-weight: 800;
  width: 100%;
}
.incident-form .alert {
  margin-bottom: 0;
}
.incident-save-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #526582;
  line-height: 1.75;
  margin: 18px 0 0;
}
.incident-save-note > svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.incident-form fieldset:disabled {
  opacity: 0.6;
}
@media (max-width: 1120px) {
  .incident-layout {
    grid-template-columns: minmax(285px, 0.8fr) minmax(0, 1.3fr);
    gap: 18px;
  }
  .incident-selected {
    padding: 21px;
  }
  .incident-profile {
    flex-wrap: wrap;
    gap: 16px;
  }
  .profile-marks {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 13px;
    background: #f4f7fd;
    padding: 13px 15px;
    border-radius: 12px;
  }
  .profile-marks > strong {
    font-size: 1.7rem;
  }
  .profile-marks > small {
    margin-left: auto;
    text-align: right;
  }
  .incident-panel-heading {
    padding: 21px;
  }
  .finder-controls {
    padding-left: 19px;
    padding-right: 19px;
  }
  .finder-student {
    gap: 9px;
    padding: 17px 8px;
  }
  .finder-student-info strong {
    font-size: 0.81rem;
  }
}
@media (max-width: 900px) {
  .incident-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .finder-list {
    max-height: 390px;
  }
  .incident-prompt {
    min-height: 300px;
  }
  .incident-profile {
    flex-wrap: nowrap;
    gap: 20px;
  }
  .profile-marks {
    width: auto;
    flex-direction: column;
    align-items: center;
    padding: 0;
    background: none;
    text-align: center;
  }
  .profile-marks > small {
    margin-left: 0;
    text-align: center;
  }
  .incident-selected {
    padding: 25px;
  }
  .incident-heading {
    align-items: flex-start;
  }
  .incident-heading h2 {
    font-size: 1.45rem;
  }
  .incident-heading .subtitle {
    font-size: 0.85rem !important;
  }
}
@media (max-width: 560px) {
  .incident-heading {
    flex-direction: column;
    gap: 16px;
  }
  .incident-heading > .secondary-button {
    min-height: 42px;
  }
  .incident-panel-heading {
    padding: 20px;
  }
  .incident-panel-heading h3 {
    font-size: 0.98rem;
  }
  .finder-controls {
    padding: 20px 18px 10px;
  }
  .finder-filters {
    gap: 10px;
  }
  .finder-filters .field {
    font-size: 0.8rem;
  }
  .finder-filters select {
    font-size: 0.82rem;
  }
  .finder-students {
    padding: 0 10px 10px;
  }
  .finder-student {
    padding: 16px 8px;
  }
  .finder-list {
    max-height: 360px;
  }
  .incident-selected {
    padding: 20px 18px;
  }
  .incident-profile {
    flex-wrap: wrap;
    gap: 17px;
  }
  .incident-profile-info .eyebrow {
    font-size: 0.75rem;
  }
  .profile-name {
    font-size: 1.1rem;
  }
  .profile-registration {
    font-size: 0.75rem;
  }
  .profile-class {
    font-size: 0.75rem;
    padding: 5px 8px;
  }
  .incident-profile-info .status-pill {
    font-size: 0.75rem;
  }
  .profile-marks {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 13px;
    padding: 13px;
    background: #f4f7fd;
    border-radius: 12px;
    text-align: left;
  }
  .profile-marks > strong {
    font-size: 1.7rem;
  }
  .profile-marks > span {
    font-size: 0.75rem;
    max-width: 72px;
    line-height: 1.6;
  }
  .profile-marks > small {
    margin-left: auto;
    text-align: right;
    max-width: 110px;
    font-size: 0.75rem;
  }
  .incident-calculation {
    padding: 18px 12px;
    gap: 7px;
  }
  .incident-calculation span {
    font-size: 0.75rem;
  }
  .incident-calculation strong {
    font-size: 1.3rem;
  }
  .incident-calculation > svg {
    width: 15px;
  }
  .incident-save-note {
    font-size: 0.75rem;
  }
  .incident-prompt {
    min-height: 280px;
    padding: 35px 24px;
  }
  .incident-prompt p {
    font-size: 0.84rem;
  }
}

/* Keep the passport above the student's details while the form sits alongside. */
.incident-entry {
  min-width: 0;
}
@media (min-width: 1100px) {
  .incident-selected {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 23px;
    align-items: start;
  }
  .incident-profile {
    padding: 0 17px 0 0;
    margin: 0;
    border-bottom: 0;
    border-right: 1px solid #e5ebf5;
    gap: 15px;
  }
  .incident-profile-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .profile-class,
  .incident-profile-info .status-pill {
    margin-right: 0;
  }
  .profile-marks {
    width: 100%;
    max-width: none;
    flex-direction: column;
    align-items: center;
    padding: 14px 7px;
    text-align: center;
  }
  .profile-marks > strong {
    font-size: 1.8rem;
  }
  .profile-marks > small {
    margin-left: 0;
    align-self: center;
    text-align: center;
  }
}
</style>
