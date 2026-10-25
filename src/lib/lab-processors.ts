export interface SubProcessor {
    name: string
    purpose: string
    dataCategories: string
    location: string
    safeguards: string
    url: string
}

/**
 * Register of sub-processors used by the Dentora Lab module.
 * Updated whenever a provider changes — changes are announced to Lab users.
 */
export const LAB_SUBPROCESSORS: SubProcessor[] = [
    {
        name: "Vercel Inc.",
        purpose: "Φιλοξενία της εφαρμογής και εκτέλεση serverless functions",
        dataCategories: "Στοιχεία λογαριασμού, εργασίες, αρχεία, τεχνικά δεδομένα",
        location: "ΕΕΑ / ΗΠΑ (ανάλογα με την περιοχή εγκατάστασης)",
        safeguards: "SLA, υπογραφή DPA, κρυπτογράφηση σε μεταφορά, διαχείριση πρόσβασης",
        url: "https://vercel.com/legal/dpa",
    },
    {
        name: "Neon (Snowflake Inc.)",
        purpose: "Βάση δεδομένων της πλατφόρμας",
        dataCategories: "Στοιχεία λογαριασμού, εργασίες, προσφορές, αποδείξεις συγκατάθεσης, καταγραφές πρόσβασης",
        location: "ΕΕΑ (Γερμανία/Ελβετία)",
        safeguards: "Κρυπτογράφηση σε αποθήκευση και μεταφορά, private networking, backups 30 ημέρες",
        url: "https://neon.tech/legal/data-processing-addendum",
    },
    {
        name: "Vercel Blob",
        purpose: "Αποθήκευση αρχείων CAD (STL, φωτογραφίες, οδηγίες)",
        dataCategories: "Αρχεία εργασιών και αρχεία επαλήθευσης",
        location: "ΕΕΑ / ΗΠΑ",
        safeguards: "Κρυπτογράφηση εφαρμογής (AES-256-GCM), πρόσβαση μέσω εξουσιοδοτημένου endpoint, unguessable paths",
        url: "https://vercel.com/legal/dpa",
    },
    {
        name: "Stripe Inc.",
        purpose: "Επεξεργασία πληρωμών και συμμόρφωση KYC/AML των designers",
        dataCategories: "Στοιχεία χρέωσης, ταυτότητας πληρωμής, αναγνωριστικά συναλλαγών",
        location: "ΕΕΑ / ΗΠΑ",
        safeguards: "PCI DSS, tokenization, δεν αποθηκεύονται στοιχεία κάρτας στη Dentora",
        url: "https://stripe.com/legal/dpa",
    },
    {
        name: "Google LLC (OAuth)",
        purpose: "Σύνδεση/εγγραφή λογαριασμού",
        dataCategories: "Email, όνομα, εικόνα προφίλ",
        location: "ΕΕΑ / ΗΠΑ",
        safeguards: "OAuth 2.0, ελάχιστα δεδομένα, πολιτική απορρήτου υποεξεργαστή",
        url: "https://policies.google.com/terms",
    },
    {
        name: "Meta Platforms (OAuth)",
        purpose: "Σύνδεση/εγγραφή λογαριασμού",
        dataCategories: "Email, όνομα, εικόνα προφίλ",
        location: "ΕΕΑ / ΗΠΑ",
        safeguards: "OAuth 2.0, ελάχιστα δεδομένα, πολιτική απορρήτου υποεξεργαστή",
        url: "https://www.facebook.com/legal/dpa",
    },
]

export const LAB_RETENTION_POLICY = [
    { item: "Αρχεία εργασιών (STL, φωτογραφίες, οδηγίες)", period: "24 μήνες από την ολοκλήρωση" },
    { item: "Ολοκληρωμένα/παραδομένα αρχεία", period: "24 μήνες από την ολοκλήρωση" },
    { item: "Καταγραφές πρόσβασης αρχείων", period: "12 μήνες" },
    { item: "Αποδείξεις συγκατάθεσης (έλεγχος συμμόρφωσης)", period: "5 έτη" },
    { item: "Στοιχεία συναλλαγών / φορολογικά παραστατικά", period: "10 έτη" },
    { item: "Backups βάσης δεδομένων", period: "30 ημέρες (κύλιση)" },
    { item: "Καταγραφές ελέγχου (audit log)", period: "5 έτη" },
]

export const LAB_SECURITY_CONTROLS = [
    {
        title: "Κρυπτογράφηση αρχείων",
        text: "Κάθε αρχείο CAD κρυπτογραφείται με AES-256-GCM πριν αποθηκευτεί. Η λήψη γίνεται μόνο μέσω εξουσιοδοτημένου endpoint που αποκρυπτογραφεί στη μνήμη.",
    },
    {
        title: "Έλεγχος πρόσβασης",
        text: "Μόνο ο ιδιοκτήτης της εργασίας, ο designer στον οποίο έγινε η ανάθεση και εξουσιοδοτημένα πρόσωπα συμμόρφωσης της πλατφόρμας έχουν πρόσβαση στα αρχεία.",
    },
    {
        title: "Καταγραφή πρόσβασης",
        text: "Κάθε λήψη ή απόπειρα λήψης αρχείου καταγράφεται με χρόνο, χρήστη, IP και user agent.",
    },
    {
        title: "Δικαιόλογηση 2FA",
        text: "Οι χρήστες μπορούν (και συνιστάται) να ενεργοποιήσουν 2FA. Με ενεργοποιημένο 2FA, η λήψη αρχείων απαιτεί πρόσφατη δικαιολόγηση (10 λεπτά).",
    },
    {
        title: "Αναφορά περιστατικών",
        text: "Κάθε επιβεβαιωμένο περιστατικό ασφαλείας καταγράφεται, αξιολογείται και γνωστοποιείται στους επηρεαζόμενους χρήστες.",
    },
    {
        title: "Διαδικασία διαγραφής",
        text: "Οι χρήστες μπορούν να ζητήσουν διαγραφή των δεδομένων τους. Τα backups διαγράφονται αυτόματα έως τη λήξη του κύκλου ζωής τους (30 ημέρες).",
    },
]
