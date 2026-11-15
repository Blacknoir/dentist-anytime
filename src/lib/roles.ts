// The roles of the platform and the rules around them.
//
// The role of a user is decided on the server only. A role that arrives from
// the client (a form field, a query parameter or a cookie) is never trusted:
// it is checked against this allowlist and ADMIN is never part of it.

export const LAB_ROLES = ["DENTIST", "LAB", "DESIGNER"] as const
export type LabRole = (typeof LAB_ROLES)[number]

export const USER_ROLES = ["PATIENT", "DENTIST", "LAB", "DESIGNER", "ADMIN"] as const
export type UserRole = (typeof USER_ROLES)[number]

/** The role of a professional that can work in the Lab marketplace. */
export function isLabRole(value: unknown): value is LabRole {
    return typeof value === "string" && (LAB_ROLES as readonly string[]).includes(value)
}

/**
 * The roles of the main site (patient or dentist). The Lab has its own list
 * (dentist, lab, CAD designer).
 */
export const MAIN_ROLES = ["PATIENT", "DENTIST"] as const
export type MainRole = (typeof MAIN_ROLES)[number]

export function normalizeMainRole(value: unknown): MainRole {
    return value === "DENTIST" ? "DENTIST" : "PATIENT"
}

/**
 * Normalises a role that comes from the client. Only the professional roles
 * of the Lab are accepted: PATIENT is the default and ADMIN can never be
 * requested.
 */
export function normalizeLabRole(value: unknown): LabRole | "PATIENT" {
    if (value === "PATIENT") return "PATIENT"
    return isLabRole(value) ? value : "PATIENT"
}

/** The role that owns a marketplace profile. */
export function profileRoleFor(role: string): "DENTIST" | "LAB" | "DESIGNER" | null {
    if (role === "DENTIST" || role === "LAB" || role === "DESIGNER") return role
    return null
}

/** The label of a role (used in the interface). */
export const ROLE_LABELS: Record<string, string> = {
    PATIENT: "Ασθενής",
    DENTIST: "Οδοντίατρος",
    LAB: "Οδοντοτεχνικό εργαστήριο",
    DESIGNER: "CAD Designer",
    ADMIN: "Διαχειριστής",
}
