/**
 * BhoomiSetu — Statutory Workflow State Machine
 *
 * Encodes the legally-mandated RFCTLARR stage order as an immutable constant.
 * ALL stage transitions must go through validateTransition() — no skipping allowed.
 *
 * Legal order per RFCTLARR Act, 2013:
 *   1. proposal       — project initiated, SIA planned
 *   2. sia            — Social Impact Assessment underway
 *   3. section_11     — Preliminary Notification issued (freezes land transactions)
 *   4. section_19     — Declaration of Acquisition (must occur within 12m of Sec 11)
 *   5. award          — Compensation award declared (must occur within 12m of Sec 19)
 *   6. compensation   — Disbursement of compensation to landowners
 *   7. mutation       — Revenue record title transfer (most commonly missed stage)
 *   8. possession     — Physical possession (only after full compensation + R&R deposit)
 *   9. rr             — Rehabilitation & Resettlement implementation
 *  10. closed         — Project fully completed and closed
 *
 * Statutory 12-month windows (RFCTLARR, not configurable):
 *   - Section 11 → Section 19 : notified_on + 12 months  (lapse = re-notification required)
 *   - Section 19 → Award      : notified_on + 12 months  (lapse = acquisition void)
 *
 * Roles that can advance stages:
 *   - admin (full access)
 *   - collector, state_admin, central_ministry (legacy roles, NOT lrb, NOT citizen)
 */

// ── Stage order ───────────────────────────────────────────────────────────────

export const STAGES = [
  'proposal',
  'sia',
  'section_11',
  'section_19',
  'award',
  'compensation',
  'mutation',
  'possession',
  'rr',
  'closed',
] as const;

export type Stage = typeof STAGES[number];

export const STAGE_INDEX: Record<Stage, number> = Object.fromEntries(
  STAGES.map((s, i) => [s, i])
) as Record<Stage, number>;

// ── Stage metadata for UI ─────────────────────────────────────────────────────

export interface StageInfo {
  stage: Stage;
  index: number;          // 0-based
  label: string;          // short display label
  description: string;    // one-liner for tooltip
  actRef: string;         // RFCTLARR section or rule
  /** Which notification section is issued at this stage, if any */
  notificationSection?: 'section_11' | 'section_19';
  /** Days within which the NEXT stage must be reached from a notification at this stage.
   *  null = no statutory window for this particular transition. */
  statutoryWindowDays?: number;
}

export const STAGE_INFO: Record<Stage, StageInfo> = {
  proposal: {
    stage: 'proposal', index: 0,
    label: 'Proposal',
    description: 'Project proposal submitted; public purpose justification and SIA planned.',
    actRef: 'RFCTLARR §4',
  },
  sia: {
    stage: 'sia', index: 1,
    label: 'SIA',
    description: 'Social Impact Assessment study underway to estimate affected families and land.',
    actRef: 'RFCTLARR §4–9',
  },
  section_11: {
    stage: 'section_11', index: 2,
    label: 'Sec 11 Notification',
    description: 'Preliminary Notification issued. Freezes land transactions in notified area.',
    actRef: 'RFCTLARR §11',
    notificationSection: 'section_11',
    statutoryWindowDays: 365, // Section 19 must follow within 12 months
  },
  section_19: {
    stage: 'section_19', index: 3,
    label: 'Sec 19 Declaration',
    description: 'Declaration of Acquisition issued. Must occur within 12 months of Sec 11.',
    actRef: 'RFCTLARR §19',
    notificationSection: 'section_19',
    statutoryWindowDays: 365, // Award must follow within 12 months
  },
  award: {
    stage: 'award', index: 4,
    label: 'Award (Sec 26)',
    description: 'Compensation award declared by Collector. Must occur within 12 months of Sec 19.',
    actRef: 'RFCTLARR §23, §26, §30',
  },
  compensation: {
    stage: 'compensation', index: 5,
    label: 'Compensation',
    description: 'DBT-based compensation disbursement to landowners underway.',
    actRef: 'RFCTLARR §38(1)',
  },
  mutation: {
    stage: 'mutation', index: 6,
    label: 'Mutation',
    description: 'Revenue record title transfer (most commonly delayed stage nationally).',
    actRef: 'State Land Revenue Act',
  },
  possession: {
    stage: 'possession', index: 7,
    label: 'Possession (Sec 38)',
    description: 'Physical possession taken. Only after full compensation + R&R monetary deposit.',
    actRef: 'RFCTLARR §38',
  },
  rr: {
    stage: 'rr', index: 8,
    label: 'R&R',
    description: 'Rehabilitation & Resettlement implementation for displaced/affected families.',
    actRef: 'RFCTLARR §3(c), §31–44',
  },
  closed: {
    stage: 'closed', index: 9,
    label: 'Closed',
    description: 'Project fully completed — land acquired, compensation paid, R&R done.',
    actRef: 'RFCTLARR §44',
  },
};

// ── Roles that can advance stages ────────────────────────────────────────────

export const STAGE_ADVANCE_ROLES = new Set(['admin', 'collector', 'state_admin', 'central_ministry']);

export function canAdvanceStage(role: string): boolean {
  return STAGE_ADVANCE_ROLES.has(role);
}

// ── Transition validation ────────────────────────────────────────────────────

export type TransitionError =
  | 'ALREADY_CLOSED'
  | 'NOT_SEQUENTIAL'
  | 'INVALID_FROM_STAGE'
  | 'INVALID_TO_STAGE'
  | 'UNAUTHORIZED_ROLE'
  | 'SECTION_11_DEADLINE_LAPSED'
  | 'SECTION_19_DEADLINE_LAPSED';

export interface TransitionResult {
  allowed: boolean;
  error?: TransitionError;
  message?: string;
  deadlineWarning?: string; // non-blocking warning about upcoming deadline
}

export interface TransitionContext {
  /** Current stage of the project */
  fromStage: Stage;
  /** Requested target stage */
  toStage: Stage;
  /** Role of the user requesting the transition */
  userRole: string;
  /** Section 11 notification deadline (ISO date string), if exists */
  sec11DeadlineOn?: string | null;
  /** Section 19 notification deadline (ISO date string), if exists */
  sec19DeadlineOn?: string | null;
}

/**
 * Validate whether a stage transition is legally and procedurally allowed.
 *
 * Rules (strict, in order):
 *   1. Role must be in STAGE_ADVANCE_ROLES
 *   2. fromStage must be a valid Stage
 *   3. toStage must be a valid Stage
 *   4. Project must not already be closed
 *   5. toStage must be exactly fromStage + 1 (no skipping, no going back)
 *   6. If toStage = section_19: check section_11 deadline_on has not lapsed
 *   7. If toStage = award: check section_19 deadline_on has not lapsed
 */
export function validateTransition(ctx: TransitionContext): TransitionResult {
  const { fromStage, toStage, userRole } = ctx;

  // Rule 1: Role check
  if (!canAdvanceStage(userRole)) {
    return {
      allowed: false,
      error: 'UNAUTHORIZED_ROLE',
      message: `Role '${userRole}' is not authorised to advance project stages. ` +
               `Only admin, collector, state_admin, or central_ministry may do so.`,
    };
  }

  // Rule 2 & 3: Valid stage names
  if (!(fromStage in STAGE_INDEX)) {
    return { allowed: false, error: 'INVALID_FROM_STAGE', message: `Unknown stage: ${fromStage}` };
  }
  if (!(toStage in STAGE_INDEX)) {
    return { allowed: false, error: 'INVALID_TO_STAGE', message: `Unknown target stage: ${toStage}` };
  }

  // Rule 4: Not already closed
  if (fromStage === 'closed') {
    return {
      allowed: false,
      error: 'ALREADY_CLOSED',
      message: 'Project is already closed. No further stage transitions are permitted.',
    };
  }

  // Rule 5: Must be exactly +1 (no skipping, no going backwards)
  const fromIdx = STAGE_INDEX[fromStage];
  const toIdx = STAGE_INDEX[toStage];

  if (toIdx !== fromIdx + 1) {
    const direction = toIdx < fromIdx ? 'backward' : toIdx > fromIdx + 1 ? `skipping stages` : '';
    return {
      allowed: false,
      error: 'NOT_SEQUENTIAL',
      message: `Stage transition from '${fromStage}' to '${toStage}' is not allowed. ` +
               `${direction ? `Going ${direction} is not permitted. ` : ''}` +
               `Next valid stage is '${STAGES[fromIdx + 1]}'.`,
    };
  }

  // Rule 6: section_11 → section_19 deadline check
  if (toStage === 'section_19' && ctx.sec11DeadlineOn) {
    const deadline = new Date(ctx.sec11DeadlineOn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > deadline) {
      return {
        allowed: false,
        error: 'SECTION_11_DEADLINE_LAPSED',
        message: `Section 11 statutory window has lapsed (deadline was ${ctx.sec11DeadlineOn}). ` +
                 `Under RFCTLARR §19, Declaration must be issued within 12 months of Preliminary Notification. ` +
                 `A fresh Section 11 Notification is required to proceed.`,
      };
    }
    // Warn if close to deadline (within 60 days)
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    if (daysLeft <= 60) {
      return {
        allowed: true,
        deadlineWarning: `Section 11 deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${ctx.sec11DeadlineOn}). Advance to Section 19 promptly.`,
      };
    }
  }

  // Rule 7: section_19 → award deadline check
  if (toStage === 'award' && ctx.sec19DeadlineOn) {
    const deadline = new Date(ctx.sec19DeadlineOn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > deadline) {
      return {
        allowed: false,
        error: 'SECTION_19_DEADLINE_LAPSED',
        message: `Section 19 statutory window has lapsed (deadline was ${ctx.sec19DeadlineOn}). ` +
                 `Under RFCTLARR §25, the Award must be passed within 12 months of the Declaration. ` +
                 `The acquisition proceedings may need to be re-initiated.`,
      };
    }
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    if (daysLeft <= 60) {
      return {
        allowed: true,
        deadlineWarning: `Section 19 deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${ctx.sec19DeadlineOn}). Pass the award promptly to avoid lapse.`,
      };
    }
  }

  return { allowed: true };
}

// ── Deadline urgency computation ──────────────────────────────────────────────

export type DeadlineUrgency = 'green' | 'amber' | 'red' | 'lapsed';

/**
 * Compute deadline urgency from pct_elapsed (0–100+).
 * Matches the spec thresholds exactly:
 *   <60%  → green
 *   60-90% → amber (alert Collector)
 *   >90%  → red (escalate to State + Central)
 *   past deadline → lapsed (re-notification required)
 */
export function computeUrgency(pctElapsed: number, pastDeadline: boolean): DeadlineUrgency {
  if (pastDeadline) return 'lapsed';
  if (pctElapsed >= 90) return 'red';
  if (pctElapsed >= 60) return 'amber';
  return 'green';
}

/** Format a countdown string from today to a deadline date */
export function formatCountdown(deadlineOn: string): {
  daysLeft: number;
  label: string;
  isPast: boolean;
} {
  const deadline = new Date(deadlineOn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msLeft = deadline.getTime() - today.getTime();
  const daysLeft = Math.ceil(msLeft / 86400000);
  const isPast = daysLeft < 0;

  let label: string;
  if (isPast) {
    label = `Lapsed ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`;
  } else if (daysLeft === 0) {
    label = 'Due today';
  } else if (daysLeft === 1) {
    label = '1 day left';
  } else if (daysLeft <= 30) {
    label = `${daysLeft} days left`;
  } else {
    const months = Math.floor(daysLeft / 30);
    const days = daysLeft % 30;
    label = `${months}m ${days}d left`;
  }

  return { daysLeft, label, isPast };
}
