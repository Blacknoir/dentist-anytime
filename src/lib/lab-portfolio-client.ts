"use client"

// The categories of the portfolio. They are also used on the server (the
// list lives in src/lib/lab-portfolio.ts) - this copy keeps the client
// bundle free of the server only module.

export const PORTFOLIO_CATEGORIES = [
    "Κορώνες",
    "Εμφύτεμα",
    "Προσθετικά",
    "Ορθοδοντικά",
    "Χειροτεχνία",
    "Άλλο",
] as const
