export const SESSION_ROLE_COOKIE = "session-role";
export const TL_MODE_COOKIE = "tl-mode";
export const TL_USER_NAME_COOKIE = "tl-user-name";
export const TL_USER_EMAIL_COOKIE = "tl-user-email";
export const FRAPPE_SID_COOKIE = "tl-frappe-sid";
/** Active trial plan id: starter | growth | enterprise */
export const TL_TRIAL_PLAN_COOKIE = "tl-trial-plan";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Default role for open trial (no login). */
export const TRIAL_DEFAULT_ROLE = "client" as const;

export type TlMode = "demo" | "live";
