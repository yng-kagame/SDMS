# SDMS – Saint Joseph Integrated Technical College

Student discipline management, built with Vue 3, Vite, and Pinia.

## Run locally

Requires Node.js 18 or later. From this directory:

```sh
npm ci
npm run dev
```

Use `npm run build` to create the production site in `dist/`, and `npm run preview` to check that build locally.

## Design

The blue-and-white interface preserves the original full-color school crest, with bold high-contrast typography, standard Lucide icons, rounded panels, a campus illustration, a translucent floating bottom navigation bar, responsive student record cards, and blurred page transitions with an orbiting star. Motion is reduced when the device requests it. The record dialog supports keyboard focus trapping and Escape to close, and reports retain a print layout.

The Dashboard shows actual active-term statistics, recent records, and students who need attention. Record incident opens a two-panel discipline page. Filter by RTQF level (L3, L4, L5) and trade (CSA, SOD, BDC, PWO), search the full matching class, and select a student to see their passport photo, name, registration number, class, and remaining marks beside the list.

Choose an offense, enter the marks to remove, and save. The student's balance and History update immediately, with the recorder's name, timestamp, active term, and before/after balances. Deductions cannot exceed the remaining balance; restorations cannot exceed the available headroom to 40. A failed save restores the previous state, and completed forms clear to prevent accidental duplicate submissions. Current-term totals come from saved data; the overview does not create example incidents. Critical status remains below 20 marks, while the attention list includes students below 30.

Passport photos can be uploaded or replaced from the selected profile (JPEG, PNG, or WebP, up to 5 MB). Images are resized to a passport format and saved in the same browser's IndexedDB. Students without a photo show a neutral placeholder. Photos are separate from the marks/history storage and are not included in CSV or Excel exports.

## Existing account and data behavior

Enter your full name to continue. The first account becomes the administrator; subsequent accounts are patrons. Entering an existing account name signs that person back in. Sign out returns to the welcome page.

Students, accounts, marks, offenses, and history are stored in the current browser's localStorage. The initial student directory is sample data. Backend integration should replace the local store and name-based account flow in `src/stores/sdms.js` with a real API and authentication.

Student search, level/trade filters, discipline deductions and restorations, Excel history export, CSV reports, printing, CSV student imports, term changes, and audit history remain available.
