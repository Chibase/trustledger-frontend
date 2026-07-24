export const SESSION_ROLE_COOKIE = "session-role";
export const TL_MODE_COOKIE = "tl-mode";
export const TL_USER_NAME_COOKIE = "tl-user-name";
export const TL_USER_EMAIL_COOKIE = "tl-user-email";
export const FRAPPE_SID_COOKIE = "tl-frappe-sid";
/** Active trial plan id */
export const TL_TRIAL_PLAN_COOKIE = "tl-trial-plan";
export const TL_TRIAL_STARTED_COOKIE = "tl-trial-started";
/** Demo org tenancy (Plan Owner / invitees) */
export const TL_ORG_ID_COOKIE = "tl-org-id";
export const TL_ORG_OWNER_COOKIE = "tl-org-owner";
export const TL_DESK_TIER_COOKIE = "tl-desk-tier";
export const TL_DESK_TIER_LOCKED_COOKIE = "tl-desk-tier-locked";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Default role for trial Plan Owner workspace. */
export const TRIAL_DEFAULT_ROLE = "admin" as const;

export type TlMode = "demo" | "live" | "trial";
