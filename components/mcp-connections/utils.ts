export const notEmpty = <T,>(v: T | null | undefined): v is T => v !== null && v !== undefined

