import { defineStore } from "pinia";
import { seed, OFFENSES, MAX_MARKS, LEVELS, TRADES } from "../data/seed";

const KEY = "sdms-v2";
// TODO (backend team): replace localStorage + signup with real API and authentication

export const useSdms = defineStore("sdms", {
  state: () => {
    const data = JSON.parse(localStorage.getItem(KEY) || "null") || {
      students: seed(),
      offenses: OFFENSES,
      audit: [],
      accounts: [],
      term: "2026 – Term 1",
      user: null,
    };
    return {
      ...data,
      // Never reuse an identity that may have a stored passport photo.
      nextStudentId: Math.max(
        Number(data.nextStudentId) || 1,
        ...data.students.map((student) => Number(student.id) + 1),
      ),
    };
  },
  getters: { isAdmin: (s) => s.user?.role === "admin" },
  actions: {
    save() {
      localStorage.setItem(KEY, JSON.stringify(this.$state));
    },
    log(action, detail) {
      this.audit.unshift({
        date: new Date().toISOString(),
        user: this.user?.u,
        action,
        detail,
      });
      this.save();
    },
    // no login page: signing up with a name that already exists signs that person back in.
    // The first account created becomes admin, everyone after is a patron.
    signup(name) {
      name = name.trim();
      if (!name) return false;
      this.accounts ||= [];
      let a = this.accounts.find(
        (x) => x.name.toLowerCase() === name.toLowerCase(),
      );
      if (!a) {
        a = { name, role: this.accounts.length ? "patron" : "admin" };
        this.accounts.push(a);
      }
      this.user = { u: a.name, role: a.role };
      this.log("signup", a.role);
      return true;
    },
    logout() {
      this.log("logout", "");
      this.user = null;
      this.save();
    },
    // marks are calculated from the current term's history, so a new term resets everyone to 40
    marks(s) {
      return s.history
        .filter((h) => h.term === this.term)
        .slice()
        .reverse()
        .reduce(
          (balance, h) =>
            Math.min(
              MAX_MARKS,
              Math.max(
                0,
                balance +
                  (h.type === "restore" ? Number(h.points) : -Number(h.points)),
              ),
            ),
          MAX_MARKS,
        );
    },
    record(id, type, offense, points, note) {
      if (!this.user?.u)
        throw new Error("Sign in before recording an incident.");
      const s = this.students.find((x) => x.id === id);
      if (!s)
        throw new Error(
          "This student could not be found. Select a student again.",
        );
      if (!["deduct", "restore"].includes(type))
        throw new Error("Choose a valid record type.");
      const amount = Number(points);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_MARKS) {
        throw new Error(
          `Enter a whole number of marks between 1 and ${MAX_MARKS}.`,
        );
      }
      const reason = typeof offense === "string" ? offense.trim() : "";
      if (!reason)
        throw new Error("Choose an offense before saving the record.");
      const before = this.marks(s);
      if (type === "deduct" && amount > before)
        throw new Error(`Only ${before} marks are available to remove.`);
      if (type === "restore" && amount > MAX_MARKS - before)
        throw new Error(`Only ${MAX_MARKS - before} marks can be restored.`);
      const entry = {
        date: new Date().toISOString(),
        type,
        offense: reason,
        points: amount,
        note: String(note ?? "").trim(),
        by: this.user.u,
        term: this.term,
        marksBefore: before,
        marksAfter: before + (type === "deduct" ? -amount : amount),
      };
      const previousHistory = s.history.slice();
      const previousAudit = this.audit.slice();
      s.history.unshift(entry);
      this.audit.unshift({
        date: entry.date,
        user: this.user.u,
        action: type,
        detail: `${s.name} (${s.regNo}) ${type === "deduct" ? "-" : "+"}${amount} ${reason} ${entry.note}`,
      });
      try {
        this.save();
      } catch (error) {
        s.history = previousHistory;
        this.audit = previousAudit;
        throw new Error(
          "Could not save this record. Please try again; the student's marks have not changed.",
          { cause: error },
        );
      }
      return entry;
    },
    undoLast(id) {
      const s = this.students.find((x) => x.id === id);
      const h = s.history.shift();
      if (h)
        this.log(
          "undo",
          `${s.name} (${s.regNo}) removed entry: ${h.offense} ${h.points}`,
        );
    },
    addStudent(d) {
      const id = Math.max(
        this.nextStudentId,
        Math.max(0, ...this.students.map((student) => student.id)) + 1,
      );
      this.nextStudentId = id + 1;
      this.students.push({
        parentPhone: "",
        history: [],
        ...d,
        id,
      });
      this.log("add student", `${d.name} (${d.regNo})`);
    },
    removeStudent(id) {
      const s = this.students.find((x) => x.id === id);
      this.students = this.students.filter((x) => x.id !== id);
      this.log("delete student", `${s.name} (${s.regNo})`);
    },
    // CSV columns: regNo,name,level,trade,parentPhone  (invalid rows/header are skipped)
    importCsv(text) {
      let n = 0;
      for (const line of text.split(/\r?\n/)) {
        const [regNo, name, level, trade, parentPhone = ""] = line
          .split(",")
          .map((x) => x.trim());
        if (
          !name ||
          !LEVELS.includes(level) ||
          !TRADES.includes(trade) ||
          this.students.some((s) => s.regNo === regNo)
        )
          continue;
        this.addStudent({ regNo, name, level, trade, parentPhone });
        n++;
      }
      return n;
    },
    newTerm(name) {
      this.term = name;
      this.log("new term", name);
    },
  },
});
