// MOCK DATA – replace with backend API (see stores/sdms.js)
export const TRADES = ['SOD', 'CSA', 'BDC', 'PWO']
export const LEVELS = ['L3', 'L4', 'L5']
export const MAX_MARKS = 40
export const CRITICAL = 20

// default marks are suggestions; the patron can change them per case
export const OFFENSES = [
  { name: 'Late coming', points: 2 },
  { name: 'Uniform / appearance', points: 3 },
  { name: 'Absent without permission', points: 5 },
  { name: 'Phone misuse', points: 5 },
  { name: 'Disrespect to staff', points: 8 },
  { name: 'Cheating in exam', points: 10 },
  { name: 'Vandalism', points: 10 },
  { name: 'Fighting', points: 15 },
  { name: 'Alcohol / drugs', points: 20 },
  { name: 'Other', points: 1 },
]

const first = ['Audrick', 'Brayan', 'Aline', 'Eric', 'Grace', 'Jean', 'Divine', 'Claude', 'Sandrine', 'Patrick', 'Diane', 'Emmanuel', 'Chantal', 'Olivier', 'Ines']
const last = ['Mugisha', 'Uwimana', 'Niyonsenga', 'Habimana', 'Ishimwe', 'Mukamana', 'Nshuti', 'Iradukunda', 'Uwase', 'Kamanzi', 'Hakizimana']
const sizes = { 'L3-BDC': 45, 'L4-PWO': 7 } // everything else ≈ 22

export function seed() {
  const out = []
  let n = 0
  for (const level of LEVELS)
    for (const trade of TRADES) {
      const count = sizes[`${level}-${trade}`] ?? 22
      for (let i = 0; i < count; i++, n++)
        out.push({
          id: n + 1,
          name: `${first[n % first.length]} ${last[(n * 7 + i) % last.length]}`,
          regNo: 'SJ26-' + String(n + 1).padStart(3, '0'), level, trade, parentPhone: '', history: [],
        })
    }
  return out
}

export const status = (m) => (m < CRITICAL ? 'critical' : m < 30 ? 'warning' : 'good')
// automatic actions by threshold
export const actionFor = (m) => (m < CRITICAL ? 'Send to disciplinary committee' : m < 25 ? 'Call parent to school' : m < 30 ? 'Warn the student' : '')
