<script setup>
import { computed } from "vue";
import {
  UsersRound,
  Search,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Check,
  ShieldCheck,
  TriangleAlert,
  Clock3,
  History,
  Download,
  Upload,
  Printer,
  SlidersHorizontal,
  ChartNoAxesCombined,
  CalendarDays,
  X,
  Star,
  BookOpen,
  RotateCcw,
  Settings,
  LogOut,
  UserRound,
  Mail,
  LockKeyhole,
  Trash2,
  LayoutDashboard,
  ClipboardList,
  Bell,
} from "@lucide/vue";

const props = defineProps({
  name: { type: String, default: "star" },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: Number, default: 2.2 },
});

// Named imports keep the standard Lucide set consistent and tree-shakable.
const icons = {
  dashboard: LayoutDashboard,
  students: UsersRound,
  search: Search,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "chevron-down": ChevronDown,
  plus: Plus,
  check: Check,
  shield: ShieldCheck,
  alert: TriangleAlert,
  clock: Clock3,
  history: History,
  download: Download,
  upload: Upload,
  print: Printer,
  filter: SlidersHorizontal,
  reports: ChartNoAxesCombined,
  calendar: CalendarDays,
  close: X,
  star: Star,
  book: BookOpen,
  refresh: RotateCcw,
  settings: Settings,
  logout: LogOut,
  user: UserRound,
  mail: Mail,
  lock: LockKeyhole,
  trash: Trash2,
  clipboard: ClipboardList,
  bell: Bell,
};
const icon = computed(() => icons[props.name] || Star);
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
    focusable="false"
    class="app-icon"
  />
</template>
