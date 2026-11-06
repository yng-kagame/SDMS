<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useSdms } from "../stores/sdms";
import { CRITICAL, MAX_MARKS, actionFor, status } from "../data/seed";
import AppIcon from "./AppIcon.vue";

const props = defineProps({ student: { type: Object, required: true } });
const emit = defineEmits(["close", "recorded"]);
const st = useSdms();
const mode = ref("deduct"),
  offense = ref(st.offenses[0]?.name || ""),
  points = ref(st.offenses[0]?.points || 1),
  note = ref(""),
  saved = ref(false),
  saveError = ref("");
const dialog = ref(null),
  closeButton = ref(null);
const cur = computed(() => st.marks(props.student));
const pick = () => {
  const selected = st.offenses.find((o) => o.name === offense.value);
  if (selected) points.value = selected.points;
};
const after = computed(() =>
  Math.min(
    MAX_MARKS,
    Math.max(
      0,
      cur.value + (mode.value === "deduct" ? -1 : 1) * Number(points.value),
    ),
  ),
);
const valid = computed(
  () =>
    Number.isInteger(Number(points.value)) &&
    Number(points.value) > 0 &&
    Number(points.value) <=
      (mode.value === "deduct" ? cur.value : MAX_MARKS - cur.value) &&
    (mode.value === "deduct"
      ? st.offenses.some((o) => o.name === offense.value)
      : !!note.value.trim()),
);
const initials = computed(() =>
  props.student.name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join(""),
);
function submit() {
  if (!valid.value) return;
  saveError.value = "";
  try {
    st.record(
      props.student.id,
      mode.value,
      mode.value === "deduct" ? offense.value : "Marks restored",
      Number(points.value),
      note.value.trim(),
    );
  } catch (error) {
    saveError.value =
      error.message || "Could not save the record. Please try again.";
    return;
  }
  note.value = "";
  if (mode.value === "deduct") emit("recorded");
  else saved.value = true;
}
const sms = computed(
  () =>
    `sms:${props.student.parentPhone}?body=` +
    encodeURIComponent(
      `SJITC: ${props.student.name} now has ${cur.value}/${MAX_MARKS} discipline marks. Please contact the school.`,
    ),
);
const fmt = (d) => new Date(d).toLocaleString();
let previousFocus, previousOverflow;
function handleKey(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
    return;
  }
  if (e.key !== "Tab" || !dialog.value) return;
  const items = [
    ...dialog.value.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
    ),
  ].filter((el) => el.getClientRects().length);
  const first = items[0],
    last = items.at(-1);
  if (!first) {
    e.preventDefault();
    dialog.value.focus();
    return;
  }
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKey);
  await nextTick();
  closeButton.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow ?? "";
  document.removeEventListener("keydown", handleKey);
  if (previousFocus?.isConnected) previousFocus.focus();
});
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <section
        ref="dialog"
        class="modal student-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-dialog-title"
        tabindex="-1"
      >
        <div class="modal-header">
          <div class="modal-student">
            <span class="avatar">{{ initials }}</span>
            <div>
              <p class="eyebrow">STUDENT RECORD</p>
              <h2 id="student-dialog-title">{{ student.name }}</h2>
              <p>
                {{ student.regNo }} · {{ student.level }} {{ student.trade }}
              </p>
            </div>
          </div>
          <button
            ref="closeButton"
            class="icon-button"
            type="button"
            aria-label="Close student record"
            @click="emit('close')"
          >
            <AppIcon name="close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="score-summary">
            <div>
              <span class="score-term">{{ st.term }}</span
              ><strong
                >{{ cur }}<small> / {{ MAX_MARKS }}</small></strong
              ><span>Discipline marks</span>
            </div>
            <span class="status-pill" :class="status(cur)"
              ><AppIcon :name="cur < 30 ? 'alert' : 'shield'" />{{
                cur < CRITICAL
                  ? "Critical"
                  : cur < 30
                    ? "Needs attention"
                    : "Good standing"
              }}</span
            >
          </div>
          <p v-if="actionFor(cur)" class="alert">
            <AppIcon name="alert" />{{ actionFor(cur) }}
          </p>
          <div class="parent-contact">
            <label class="field"
              >Parent phone<input
                v-model="student.parentPhone"
                type="tel"
                placeholder="07…"
                @change="st.save()" /></label
            ><a
              v-if="student.parentPhone"
              :href="sms"
              class="secondary-button sms"
              >Send SMS to parent<AppIcon name="arrow-up-right"
            /></a>
          </div>

          <div class="segmented-control" aria-label="Record type">
            <button
              type="button"
              :class="{ on: mode === 'deduct' }"
              :aria-pressed="mode === 'deduct'"
              @click="
                mode = 'deduct';
                saved = false;
              "
            >
              Remove marks
            </button>
            <button
              type="button"
              :class="{ on: mode === 'restore' }"
              :aria-pressed="mode === 'restore'"
              @click="
                mode = 'restore';
                saved = false;
              "
            >
              Restore marks
            </button>
          </div>
          <form class="record-form" @submit.prevent="submit">
            <p v-if="saveError" class="alert" role="alert">{{ saveError }}</p>
            <p v-if="mode === 'deduct' && !st.offenses.length" class="notice">
              No offenses have been configured. An administrator can add one in
              Administration.
            </p>
            <label v-if="mode === 'deduct'" class="field"
              >Offense<select
                v-model="offense"
                :disabled="!st.offenses.length"
                @change="pick"
              >
                <option v-if="!st.offenses.length" value="">
                  No offenses available
                </option>
                <option v-for="(o, i) in st.offenses" :key="i" :value="o.name">
                  {{ o.name }}
                </option>
              </select></label
            >
            <label class="field"
              >Number of marks<input
                v-model.number="points"
                type="number"
                min="1"
                :max="mode === 'deduct' ? cur : MAX_MARKS - cur"
                step="1"
                required
            /></label>
            <label class="field"
              >{{
                mode === "deduct"
                  ? "Note (optional)"
                  : "Reason for restoring marks"
              }}<input
                v-model="note"
                :required="mode === 'restore'"
                :placeholder="
                  mode === 'deduct'
                    ? 'Add a little context…'
                    : 'Explain why marks are being restored…'
                "
            /></label>
            <p v-if="mode === 'deduct' && after < CRITICAL" class="alert">
              <AppIcon name="alert" />This leaves {{ after }} marks. The student
              will require disciplinary committee review.
            </p>
            <div v-else class="marks-preview">
              <span>Marks after this record</span
              ><strong
                >{{ Number.isFinite(after) ? after : "—" }} /
                {{ MAX_MARKS }}</strong
              >
            </div>
            <p v-if="saved" class="notice" role="status">
              <AppIcon name="check" />Marks restored. This update is saved in
              the student's history.
            </p>
            <button class="primary-button" :disabled="!valid" type="submit">
              <AppIcon name="check" />{{
                mode === "deduct" ? "Save discipline record" : "Restore marks"
              }}
            </button>
          </form>

          <section class="student-history">
            <div class="history-heading">
              <h3>Recent history</h3>
              <span class="status-pill"
                >{{ student.history.length }} records</span
              >
            </div>
            <ul v-if="student.history.length" class="history record-history">
              <li v-for="(h, i) in student.history" :key="i">
                <span
                  class="history-mark"
                  :class="h.type === 'deduct' ? 'neg' : 'pos'"
                  >{{ h.type === "deduct" ? "−" : "+" }}{{ h.points }}</span
                >
                <div>
                  <strong>{{ h.offense }}</strong>
                  <p v-if="h.note">{{ h.note }}</p>
                  <small>{{ fmt(h.date) }} · {{ h.by }} · {{ h.term }}</small>
                </div>
              </li>
            </ul>
            <div v-else class="empty-state">
              <AppIcon name="history" />
              <p>A fresh start. No discipline records yet.</p>
            </div>
            <button
              v-if="st.isAdmin && student.history.length"
              class="secondary-button"
              type="button"
              @click="
                st.undoLast(student.id);
                saved = false;
              "
            >
              <AppIcon name="refresh" />Undo last entry
            </button>
          </section>
        </div>
        <div class="modal-footer">
          <span><AppIcon name="shield" />Student discipline record</span
          ><button
            class="secondary-button"
            type="button"
            @click="emit('close')"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.student-modal {
  max-width: 580px;
}
.modal-student {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}
.modal-student h2 {
  font-size: 1.2rem;
  margin: 4px 0;
}
.modal-student p:last-child {
  margin: 0;
  color: #68708b;
  font-size: 0.78rem;
}
.modal-student .avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.score-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: #f1f3ff;
  border: 1px solid #e4e8fa;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}
.score-summary > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.score-summary strong {
  font-size: 2.1rem;
  letter-spacing: -1.5px;
  color: #23318c;
}
.score-summary strong small {
  font-size: 1rem;
  color: #68708b;
  font-weight: 700;
  letter-spacing: 0;
}
.score-summary > div > span {
  font-size: 0.78rem;
  color: #68708b;
}
.score-summary .score-term {
  color: #58628e;
}
.parent-contact {
  display: flex;
  align-items: end;
  gap: 12px;
  margin: 20px 0;
}
.parent-contact .field {
  flex: 1;
  min-width: 0;
}
.parent-contact .sms {
  font-size: 0.78rem;
  min-height: 46px;
  flex-shrink: 0;
}
.record-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 22px;
}
.marks-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 12px 0;
  color: #68708b;
}
.marks-preview strong {
  color: #2d398a;
  font-size: 1rem;
}
.student-history {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #eceef7;
}
.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.history-heading h3 {
  margin: 0;
  font-size: 0.95rem;
}
.record-history li {
  display: flex;
  align-items: start;
  justify-content: start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f1f7;
}
.record-history li > div {
  min-width: 0;
}
.record-history strong {
  font-size: 0.83rem;
  font-weight: 700;
}
.record-history p {
  font-size: 0.8rem;
  color: #68708b;
  margin: 5px 0;
}
.record-history small {
  display: block;
  font-size: 0.78rem;
  color: #68708b;
  white-space: normal;
  line-height: 1.6;
  margin-top: 5px;
}
.history-mark {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  background: #f4f5fb;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}
.modal-footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #68708b;
}
.modal-footer > span svg {
  width: 15px;
  height: 15px;
}
.empty-state > svg {
  width: 30px;
  height: 30px;
}
@media (max-width: 520px) {
  .parent-contact {
    flex-direction: column;
    align-items: stretch;
  }
  .score-summary {
    padding: 16px;
    gap: 8px;
  }
  .score-summary .status-pill {
    font-size: 0.78rem;
  }
  .modal-student h2 {
    font-size: 1rem;
  }
  .modal-student .avatar {
    width: 40px;
    height: 40px;
  }
  .modal-footer > span {
    max-width: 160px;
    font-size: 0.78rem;
  }
}
</style>
