// Τοπική βάση ελληνικών τόπων — fallback όταν το Google Places αποτυγχάνει
// (π.χ. REQUEST_DENIED) ώστε το autocomplete να δουλεύει ΠΑΝΤΑ.
// Οι συντεταγμένες είναι προσεγγιστικές (κέντρο περιοχής) και αρκούν για
// ακτινική αναζήτηση + αυτόματη συμπλήρωση.

export interface LocalPlace {
    id: string
    /** Ονομασία όπως εμφανίζεται στις προτάσεις */
    name: string
    /** Τυποποιημένη πόλη-μητέρα (Athens, Thessaloniki, Patra, ...) */
    parent: string
    lat: number
    lng: number
}

export const LOCAL_PLACES: LocalPlace[] = [
    // --- Αθήνα ---
    { id: "athina", name: "Αθήνα", parent: "Athens", lat: 37.9838, lng: 23.7275 },
    { id: "peiraias", name: "Πειραιάς", parent: "Athens", lat: 37.9429, lng: 23.6469 },
    { id: "marousi", name: "Μαρούσι", parent: "Athens", lat: 38.0558, lng: 23.8047 },
    { id: "nea-ionia", name: "Νέα Ιωνία", parent: "Athens", lat: 38.0347, lng: 23.7492 },
    { id: "neo-irakleio", name: "Νέο Ηράκλειο", parent: "Athens", lat: 38.0466, lng: 23.7667 },
    { id: "kifisia", name: "Κηφισιά", parent: "Athens", lat: 38.0735, lng: 23.8084 },
    { id: "glyfada", name: "Γλυφάδα", parent: "Athens", lat: 37.8715, lng: 23.7512 },
    { id: "peristeri", name: "Περιστέρι", parent: "Athens", lat: 38.0116, lng: 23.6928 },
    { id: "kallithea", name: "Καλλιθέα", parent: "Athens", lat: 37.9553, lng: 23.7007 },
    { id: "xalandri", name: "Χαλάνδρι", parent: "Athens", lat: 38.0226, lng: 23.7969 },
    { id: "ag-paraskevi", name: "Αγία Παρασκευή", parent: "Athens", lat: 38.0116, lng: 23.8627 },
    { id: "vrilissia", name: "Βριλήσσια", parent: "Athens", lat: 38.0369, lng: 23.8337 },
    { id: "ilioupoli", name: "Ηλιούπολη", parent: "Athens", lat: 37.9295, lng: 23.7511 },
    { id: "zografou", name: "Ζωγράφου", parent: "Athens", lat: 37.9739, lng: 23.7711 },
    { id: "egaleo", name: "Αιγάλεω", parent: "Athens", lat: 37.9966, lng: 23.6805 },
    { id: "ilion", name: "Ίλιον", parent: "Athens", lat: 38.0333, lng: 23.7 },
    { id: "galatsi", name: "Γαλάτσι", parent: "Athens", lat: 38.0167, lng: 23.75 },
    { id: "nea-filadelfeia", name: "Νέα Φιλαδέλφεια", parent: "Athens", lat: 38.0417, lng: 23.7389 },
    { id: "alimos", name: "Άλιμος", parent: "Athens", lat: 37.9149, lng: 23.7219 },
    { id: "voula", name: "Βούλα", parent: "Athens", lat: 37.8466, lng: 23.7727 },
    { id: "xolargos", name: "Χολαργός", parent: "Athens", lat: 38.0, lng: 23.8 },
    { id: "koridallos", name: "Κορυδαλλός", parent: "Athens", lat: 37.9786, lng: 23.6514 },
    { id: "nikaia", name: "Νίκαια", parent: "Athens", lat: 37.9667, lng: 23.6333 },

    // --- Θεσσαλονίκη ---
    { id: "thessaloniki", name: "Θεσσαλονίκη", parent: "Thessaloniki", lat: 40.6401, lng: 22.9444 },
    { id: "kalamaria", name: "Καλαμαριά", parent: "Thessaloniki", lat: 40.573, lng: 22.9425 },
    { id: "evosmos", name: "Εύοσμος", parent: "Thessaloniki", lat: 40.6597, lng: 22.739 },
    { id: "stavroupoli", name: "Σταυρούπολη", parent: "Thessaloniki", lat: 40.6692, lng: 22.7361 },
    { id: "sykies", name: "Συκιές", parent: "Thessaloniki", lat: 40.65, lng: 22.95 },
    { id: "neapoli-thes", name: "Νεάπολη Θεσσαλονίκης", parent: "Thessaloniki", lat: 40.6542, lng: 22.9281 },
    { id: "ampelokipoi", name: "Αμπελόκηποι Θεσσαλονίκης", parent: "Thessaloniki", lat: 40.6453, lng: 22.9167 },
    { id: "pylaia", name: "Πυλαία", parent: "Thessaloniki", lat: 40.6031, lng: 22.9572 },
    { id: "thermi", name: "Θέρμη", parent: "Thessaloniki", lat: 40.5486, lng: 23.02 },
    { id: "oraiokastro", name: "Ωραιόκαστρο", parent: "Thessaloniki", lat: 40.7333, lng: 22.9167 },
    { id: "menemeni", name: "Μενεμένη", parent: "Thessaloniki", lat: 40.6542, lng: 22.9 },

    // --- Υπόλοιπη Ελλάδα ---
    { id: "patra", name: "Πάτρα", parent: "Patra", lat: 38.2466, lng: 21.7346 },
    { id: "rio", name: "Ρίο", parent: "Patra", lat: 38.3, lng: 21.7833 },
    { id: "irakleio-kritis", name: "Ηράκλειο Κρήτης", parent: "Heraklion", lat: 35.3387, lng: 25.1442 },
    { id: "nea-alikarnassos", name: "Νέα Αλικαρνασσός", parent: "Heraklion", lat: 35.3333, lng: 25.1667 },
    { id: "larisa", name: "Λάρισα", parent: "Larissa", lat: 39.639, lng: 22.4191 },
    { id: "volos", name: "Βόλος", parent: "Volos", lat: 39.361, lng: 22.9425 },
    { id: "ioannina", name: "Ιωάννινα", parent: "Ioannina", lat: 39.665, lng: 20.8537 },
    { id: "komotini", name: "Κομοτηνή", parent: "Komotini", lat: 41.122, lng: 25.4066 },
    { id: "xanthi", name: "Ξάνθη", parent: "Xanthi", lat: 41.1439, lng: 24.8875 },
    { id: "kavala", name: "Καβάλα", parent: "Kavala", lat: 40.9397, lng: 24.4069 },
    { id: "serres", name: "Σέρρες", parent: "Serres", lat: 41.0846, lng: 23.5447 },
    { id: "katerini", name: "Κατερίνη", parent: "Katerini", lat: 40.2719, lng: 22.5078 },
    { id: "lamia", name: "Λαμία", parent: "Lamia", lat: 38.9042, lng: 22.4311 },
    { id: "trikala", name: "Τρίκαλα", parent: "Trikala", lat: 39.5556, lng: 21.7675 },
    { id: "xalkida", name: "Χαλκίδα", parent: "Chalkida", lat: 38.462, lng: 23.5961 },
    { id: "korinthos", name: "Κόρινθος", parent: "Korinthos", lat: 37.9386, lng: 22.9322 },
    { id: "agrinio", name: "Αγρίνιο", parent: "Agrinio", lat: 38.625, lng: 21.4075 },
    { id: "xania", name: "Χανιά", parent: "Chania", lat: 35.5138, lng: 24.018 },
    { id: "rethymno", name: "Ρέθυμνο", parent: "Rethymno", lat: 35.3667, lng: 24.4667 },
    { id: "rodos", name: "Ρόδος", parent: "Rhodes", lat: 36.4341, lng: 28.2176 },
    { id: "kerkyra", name: "Κέρκυρα", parent: "Corfu", lat: 39.6243, lng: 19.9217 },
    { id: "alexandroupoli", name: "Αλεξανδρούπολη", parent: "Alexandroupoli", lat: 40.8456, lng: 25.8744 },
    { id: "drama", name: "Δράμα", parent: "Drama", lat: 41.1499, lng: 24.146 },
]

const COMBINING_LO = 0x300; const COMBINING_HI = 0x36f;

function stripCombiningMarks(s: string): string {
    let out = ""
    for (const ch of s) {
        const code = ch.codePointAt(0) ?? 0
        if (code < COMBINING_LO || code > COMBINING_HI) out += ch
    }
    return out
}

function normalize(input: string): string {
    return stripCombiningMarks((input || "").toLowerCase().normalize("NFD"))
        .replace(/ς/g, "σ")
        .trim()
}

/** Public normalizer: lowercase, φεύγουν τόνοι/διαλυτικά, ς→σ. */
export function normalizeGreekText(input: string): string {
    return normalize(input)
}

/**
 * Greek -> latin transliteration ώστε "Thes" να βρίσκει "Θεσσαλονίκη"
 * και "Nea Ionia" τη "Νέα Ιωνία". Δουλεύει πάνω σε normalized κείμενο.
 */
const TRANSLIT: Record<string, string> = {
    "α": "a", "β": "v", "γ": "g", "δ": "d", "ε": "e", "ζ": "z",
    "η": "i", "θ": "th", "ι": "i", "κ": "k", "λ": "l", "μ": "m",
    "ν": "n", "ξ": "x", "ο": "o", "π": "p", "ρ": "r", "σ": "s",
    "τ": "t", "υ": "y", "φ": "f", "χ": "ch", "ψ": "ps", "ω": "o",
}

export function transliterateGreek(input: string): string {
    return normalize(input)
        .split("")
        .map((ch) => TRANSLIT[ch] ?? ch)
        .join("")
}

/**
 * Τοπική αναζήτηση τόπων (case/accent-insensitive, prefix + substring,
 * με υποστήριξη λατινικής γραφής).
 * Επιστρέφει το πολύ `limit` αποτελέσματα, με τα startsWith πρώτα.
 */
export function searchLocalPlaces(input: string, limit = 6): LocalPlace[] {
    const q = normalize(input)
    if (q.length < 2) return []
    const qLatin = transliterateGreek(input)

    const rank1: LocalPlace[] = []
    const rank2: LocalPlace[] = []
    const rank3: LocalPlace[] = []
    const rank4: LocalPlace[] = []

    for (const place of LOCAL_PLACES) {
        const name = normalize(place.name)
        const nameLatin = transliterateGreek(place.name)
        if (name.startsWith(q)) rank1.push(place)
        else if (nameLatin.startsWith(qLatin)) rank2.push(place)
        else if (name.includes(q)) rank3.push(place)
        else if (nameLatin.includes(qLatin)) rank4.push(place)
    }

    return [...rank1, ...rank2, ...rank3, ...rank4].slice(0, limit)
}

export function getLocalPlace(id: string): LocalPlace | undefined {
    return LOCAL_PLACES.find((p) => p.id === id)
}

/**
 * Προάστιο (normalized) -> τυποποιημένη πόλη. Χρησιμοποιείται από το
 * location matching ώστε "Νέα Ιωνία" / "Μαρούσι" να ανάγονται σε Athens κ.λπ.
 */
const MAIN_CITY_IDS = new Set([
    "athina", "thessaloniki", "patra", "irakleio-kritis",
    "larisa", "volos", "ioannina", "komotini",
])

export const SUBURB_TO_CITY: Record<string, string> = (() => {
    const map: Record<string, string> = {}
    for (const place of LOCAL_PLACES) {
        if (!MAIN_CITY_IDS.has(place.id)) {
            map[normalize(place.name)] = place.parent
        }
    }
    // Συνώνυμα / ορθογραφικές παραλλαγές
    map["αμαρουσιο"] = "Athens"
    map["ηρακλειο αττικης"] = "Athens"
    map["νεα ιωνια αττικης"] = "Athens"
    map["πυργετος"] = "Larissa"
    map["πυργετος λαρισας"] = "Larissa"
    map["αθηνα"] = "Athens"
    return map
})()
