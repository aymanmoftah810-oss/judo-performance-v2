/**
 * ValidationError — thrown by any Service layer when input data is invalid.
 * UI modules catch this (via `instanceof ValidationError`) and show the
 * message as a toast without needing to know the validation rules
 * themselves.
 *
 * IMPORTANT: this is the ONE shared definition. Every service must import
 * it from here rather than declaring its own local class — two separate
 * `class ValidationError extends Error {}` declarations are NOT the same
 * class, so `instanceof` checks in a UI module that talks to more than one
 * service would silently fail to catch errors from the "other" service's
 * class. (This was found and fixed during Phase 2 — see PHASE2 report.)
 */
export class ValidationError extends Error {}
