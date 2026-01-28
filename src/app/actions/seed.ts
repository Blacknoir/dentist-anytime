"use server"

import { prisma } from "@/lib/prisma"

export async function seedBlogPosts() {
    // Get first 2 dentists
    const dentists = await prisma.dentistProfile.findMany({
        take: 2,
        include: { user: true }
    })

    if (dentists.length === 0) return { error: "No dentists found to attach posts to." }

    const posts = [
        {
            title_en: "The Future of Dental Implants: What to Expect",
            title_el: "Το Μέλλον των Οδοντικών Εμφυτευμάτων: Τι να Περιμένετε",
            content_en: "Dental implants have revolutionized restorative dentistry, offering a long-term solution for missing teeth that looks and feels natural. In this article, we explore the latest advancements in 3D guided surgery and biocompatible materials that make the process faster and more comfortable than ever. \n\nAdvancements in imaging technology now allow us to map your entire jaw with pinpoint accuracy, ensuring that implants are placed in the optimal position for longevity and aesthetics. Furthermore, new zirconia implants provide a metal-free alternative for patients with sensitivities, boasting excellent integration with bone tissue. \n\nIf you are considering dental implants, now is the most advanced time to start your journey.",
            content_el: "Τα οδοντικά εμφυτεύματα έχουν φέρει επανάσταση στην επανορθωτική οδοντιατρική, προσφέροντας μια μακροπρόθεσμη λύση για τα ελλείποντα δόντια που μοιάζει και έχει την αίσθηση φυσικού. Σε αυτό το άρθρο, εξερευνούμε τις τελευταίες εξελίξεις στην τρισδιάστατη καθοδηγούμενη χειρουργική και τα βιοσυμβατά υλικά που καθιστούν τη διαδικασία ταχύτερη και πιο άνετη από ποτέ. \n\nΟι εξελίξεις στην τεχνολογία απεικόνισης μας επιτρέπουν πλέον να χαρτογραφήσουμε ολόκληρη τη γνάθο σας με απόλυτη ακρίβεια, διασφαλίζοντας ότι τα εμφυτεύματα τοποθετούνται στη βέλτιστη θέση για μακροζωία και αισθητική. Επιπλέον, τα νέα εμφυτεύματα ζιρκονίας παρέχουν μια εναλλακτική λύση χωρίς μέταλλα για ασθενείς με ευαισθησίες, με εξαιρετική ενσωμάτωση στον οστικό ιστό. \n\nΑν σκέφτεστε τα οδοντικά εμφυτεύματα, τώρα είναι η πιο εξελιγμένη εποχή για να ξεκινήσετε το ταξίδι σας.",
            category: "Technology",
            slug: "future-of-dental-implants",
            image: "https://images.unsplash.com/photo-1629909608135-ca267c0d06b9?auto=format&fit=crop&q=80&w=800",
            dentistProfileId: dentists[0].id
        },
        {
            title_en: "5 Secrets to Maintaining Your Teeth Whitening Results",
            title_el: "5 Μυστικά για να Διατηρήσετε το Αποτέλεσμα της Λεύκανσης",
            content_en: "You've just invested in a brighter smile, but how do you keep it that way? Professional whitening works by removing deep stains from the enamel, but your daily habits will determine how long the results last. \n\n1. Avoid the 'Staining Culprits': Coffee, red wine, and tea are the main enemies of a white smile. Try to rinse with water immediately after consuming them. \n2. Use a Straw: When drinking cold beverages that contain dyes, use a straw to minimize contact with your front teeth. \n3. Maintain Rigorous Hygiene: Brushing twice a day and flossing prevents plaque buildup, which can make teeth look dull and yellow. \n4. Quit Smoking: Tobacco is one of the fastest ways to discolor teeth. \n\nFollowing these simple steps will ensure your smile stays brilliant for months to come.",
            content_el: "Μόλις επενδύσατε σε ένα πιο λαμπερό χαμόγελο, αλλά πώς θα το διατηρήσετε έτσι? Η επαγγελματική λεύκανση λειτουργεί αφαιρώντας βαθιούς λεκέδες από το σμάλτο, αλλά οι καθημερινές σας συνήθειες θα καθορίσουν πόσο θα διαρκέσουν τα αποτελέσματα. \n\n1. Αποφύγετε τους 'Εχθρούς': Ο καφές, το κόκκινο κρασί και το τσάι είναι οι κύριοι εχθροί ενός λευκού χαμόγελου. Προσπαθήστε να ξεπλένετε με νερό αμέσως μετά την κατανάλωσή τους. \n2. Χρησιμοποιήστε Καλαμάκι: Όταν πίνετε κρύα ροφήματα που περιέχουν χρωστικές, χρησιμοποιήστε καλαμάκι για να ελαχιστοποιήσετε την επαφή με τα μπροστινά σας δόντια. \n3. Διατηρήστε Αυστηρή Υγιεινή: Το βούρτσισμα δύο φορές την ημέρα και το οδοντικό νήμα εμποδίζουν τη συσσώρευση πλάκας, η οποία μπορεί να κάνει τα δόντια να φαίνονται θαμπά και κίτρινα. \n4. Διακοπή Καπνίσματος: Ο καπνός είναι ένας από τους πιο γρήγορους τρόπους για να αποχρωματιστούν τα δόντια. \n\nΑκολουθώντας αυτά τα απλά βήματα θα διασφαλίσετε ότι το χαμόγελό σας θα παραμείνει λαμπερό για μήνες.",
            category: "Advice",
            slug: "whitening-maintenance-secrets",
            image: "https://images.unsplash.com/photo-1593054941142-55bca2280d0d?auto=format&fit=crop&q=80&w=800",
            dentistProfileId: dentists[1] ? dentists[1].id : dentists[0].id
        },
        {
            title_en: "Correcting a Complex Overbite: A Case Study",
            title_el: "Διόρθωση Σύνθετης Σύγκλεισης: Μια Κλινική Μελέτη",
            content_en: "In this clinical highlight, we look at a 24-year-old patient with a severe class II malocclusion. Through a combined approach of clear aligner therapy and targeted elastic wear, we were able to achieve a functional and aesthetic result in just 14 months without the need for extractions. \n\nBefore treatment, the patient experienced difficulty chewing and was unhappy with their facial profile. The transition show the power of modern orthodontics. We used digital scanning to track progress every 4 weeks, ensuring the plan remained on schedule. \n\nThis case demonstrates that even non-invasive methods can yield dramatic results when correctly planned.",
            content_el: "Σε αυτή την κλινική μελέτη, εξετάζουμε έναν 24χρονο ασθενή με σοβαρή σύγκλειση κατηγορίας II. Μέσα από μια συνδυασμένη προσέγγιση θεραπείας με διαφανείς νάρθηκες και στοχευμένη χρήση ελαστικών, καταφέραμε να επιτύχουμε ένα λειτουργικό και αισθητικό αποτέλεσμα σε μόλις 14 μήνες χωρίς την ανάγκη εξαγωγών. \n\nΠριν από τη θεραπεία, ο ασθενής δυσκολευόταν στη μάσηση και δεν ήταν ευχαριστημένος με το προφίλ του προσώπου του. Η μετάβαση δείχνει τη δύναμη της σύγχρονης ορθοδοντικής. Χρησιμοποιήσαμε ψηφιακή σάρωση για την παρακολούθηση της προόδου κάθε 4 εβδομάδες, διασφαλίζοντας ότι το πλάνο παρέμεινε εντός προγράμματος. \n\nΑυτή η περίπτωση αποδεικνύει ότι ακόμα και οι μη επεμβατικές μέθοδοι μπορούν να αποφέρουν εντυπωσιακά αποτελέσματα όταν σχεδιαστούν σωστά.",
            category: "Case Study",
            slug: "complex-overbite-case-study",
            image: "https://images.unsplash.com/photo-1588776814546-1ffce47267a5?auto=format&fit=crop&q=80&w=800",
            dentistProfileId: dentists[0].id
        }
    ]

    for (const post of posts) {
        await prisma.blogPost.upsert({
            where: { slug: post.slug },
            update: post,
            create: post
        })
    }

    return { success: true, count: posts.length }
}
