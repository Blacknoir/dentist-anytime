// Safe extraction of an error message. The errors of a server action are
// real Error objects, but a rejected promise can carry anything.

export function errorMessage(error: unknown, fallback = "Η ενέργεια απέτυχε.") {
    if (error instanceof Error && error.message) return error.message
    if (typeof error === "object" && error !== null && "message" in error) {
        const message = (error as { message?: unknown }).message
        if (typeof message === "string" && message) return message
    }
    return fallback
}
