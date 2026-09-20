// Καθαρό module (ΧΩΡΙΣ "use server") για location matching.
// Χρησιμοποιείται από server actions (dentists.ts) και τεστάρεται ανεξάρτητα.

import { SUBURB_TO_CITY, normalizeGreekText, transliterateGreek } from "@/lib/greek-places"

// Τυποποιημένες πόλεις: normalized παραλλαγή -> standard όνομα.
// Όλα τα keys είναι ήδη normalized (χωρίς τόνους, ς→σ, lowercase).
const CITY_VARIANTS: Record<string, string> = {
    "αθηνα": "Athens",
    "athens": "Athens",
    "athina": "Athens",
    "αττικη": "Athens",
    "attica": "Athens",
    "θεσσαλονικη": "Thessaloniki",
    "thessaloniki": "Thessaloniki",
    "salonica": "Thessaloniki",
    "πατρα": "Patra",
    "patra": "Patra",
    "patras": "Patra",
    "ηρακλειο": "Heraklion",
    "heraklion": "Heraklion",
    "iraklion": "Heraklion",
    "irakleio": "Heraklion",
    "λαρισα": "Larissa",
    "larissa": "Larissa",
    "larisa": "Larissa",
    "βολος": "Volos",
    "volos": "Volos",
    "ιωαννινα": "Ioannina",
    "ioannina": "Ioannina",
    "κομοτηνη": "Komotini",
    "komotini": "Komotini",
    "χανια": "Chania",
    "chania": "Chania",
    "ροδος": "Rhodes",
    "rhodes": "Rhodes",
    "κερκυρα": "Corfu",
    "corfu": "Corfu",
    "kerkyra": "Corfu",
    "καβαλα": "Kavala",
    "kavala": "Kavala",
    "ξανθη": "Xanthi",
    "xanthi": "Xanthi",
    "σερρες": "Serres",
    "serres": "Serres",
    "λαμια": "Lamia",
    "lamia": "Lamia",
    "κατερινη": "Katerini",
    "katerini": "Katerini",
    "τρικαλα": "Trikala",
    "trikala": "Trikala",
    "χαλκιδα": "Chalkida",
    "chalkida": "Chalkida",
    "χαλκις": "Chalkida",
    "κορινθος": "Korinthos",
    "korinthos": "Korinthos",
    "αγρινιο": "Agrinio",
    "agrinio": "Agrinio",
    "ρεθυμνο": "Rethymno",
    "rethymno": "Rethymno",
    "αλεξανδρουπολη": "Alexandroupoli",
    "alexandroupoli": "Alexandroupoli",
    "δραμα": "Drama",
    "drama": "Drama",
}

/**
 * Ανάγει ένα ελεύθερο κείμενο τοποθεσίας σε τυποποιημένη πόλη.
 * Π.χ. "Λεωφόρος Ηρακλείου 314, Νέα Ιωνία" -> "Athens",
 * "tsimiski 42, Thessaloniki" -> "Thessaloniki".
 * Επιστρέφει null αν δεν αναγνωρίζεται πόλη.
 */
export function resolveCityName(input: string): string | null {
    const n = normalizeGreekText(input)
    if (!n) return null

    // 1. Προάστια -> πόλη (για πολύ μικρά keys απαιτείται ολόκληρη λέξη)
    for (const [suburb, city] of Object.entries(SUBURB_TO_CITY)) {
        if (suburb.length < 4) {
            if (n.split(" ").includes(suburb)) return city
        } else if (n.includes(suburb)) {
            return city
        }
    }

    // 2. Πόλεις
    for (const [variant, city] of Object.entries(CITY_VARIANTS)) {
        if (n.includes(variant)) return city
    }

    return null
}

/**
 * Ελέγχει αν η τοποθεσία οδοντιάτρου ταιριάζει με την αναζήτηση.
 * Accent/case-insensitive, καταλαβαίνει προάστια ("Νέα Ιωνία" -> Αθήνα),
 * οδούς ("Αγίου Θωμά 74, Αθήνα" <-> "Αθήνα") και συντομογραφίες ("Θεσ").
 */
export function matchesLocation(dentistLocation: string, searchLocation: string): boolean {
    const nD = normalizeGreekText(dentistLocation)
    const nS = normalizeGreekText(searchLocation)
    if (!nD || !nS) return false
    if (nD === nS) return true

    // Και οι δύο πλευρές ανάγονται σε πόλη -> σύγκριση πόλεων
    const cD = resolveCityName(nD)
    const cS = resolveCityName(nS)
    if (cD && cS) return cD === cS

    // Αλλιώς: substring (π.χ. "θεσ" μέσα σε "θεσσαλονικη")
    if (nS.length >= 2 && (nD.includes(nS) || nS.includes(nD))) return true

    // Fallback λατινικής γραφής: "Thes" μέσα σε transliterated "thessaloniki"
    const trD = transliterateGreek(nD)
    const trS = transliterateGreek(nS)
    if (trS.length >= 2 && (trD.includes(trS) || trS.includes(trD))) return true

    // Τελευταίο fallback: όλα τα tokens της μίας πλευράς μέσα στην άλλη
    const tD = new Set(nD.split(" ").filter((t) => t.length >= 2))
    const tS = nS.split(" ").filter((t) => t.length >= 2)
    if (tS.length > 0 && tS.every((t) => tD.has(t))) return true
    const tDArr = [...tD]
    if (tDArr.length > 0 && tDArr.every((t) => tS.includes(t))) return true

    return false
}
