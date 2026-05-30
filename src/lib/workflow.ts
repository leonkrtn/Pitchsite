// ─────────────────────────────────────────────────────────────
//  Dynamic project workflow — single source of truth.
//  Every surface (freelancer viewer, pitch, project page, client
//  dashboard) renders its stepper and stage logic from here, so the
//  workflow stays consistent and is changed in exactly one place.
// ─────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'offen'
  | 'ausstehend'
  | 'escrow'
  | 'abgeliefert'
  | 'abgeschlossen'

export type Actor = 'designer' | 'client' | 'system'
export type Locale = 'de' | 'en'

export interface WorkflowStage {
  id: 'pitch' | 'agreement' | 'work' | 'review' | 'done'
  /** project.status values that resolve to this stage */
  statuses: ProjectStatus[]
  iconName: 'Send' | 'PenLine' | 'Hammer' | 'ClipboardCheck' | 'PartyPopper'
  /** who is expected to act in this stage */
  actor: Actor
  de: StageCopy
  en: StageCopy
}

interface StageCopy {
  /** short label for the stepper chips */
  short: string
  /** full title */
  title: string
  /** what is happening right now, from the designer's perspective */
  designerNow: string
  /** what is happening right now, from the client's perspective */
  clientNow: string
}

export const WORKFLOW: WorkflowStage[] = [
  {
    id: 'pitch',
    statuses: ['offen'],
    iconName: 'Send',
    actor: 'client',
    de: {
      short: 'Pitch',
      title: 'Pitch geteilt',
      designerNow: 'Dein Entwurf ist geteilt. Der Kunde sieht ihn an und hinterlässt Feedback.',
      clientNow: 'Sieh dir den Entwurf an, kommentiere Stellen und nimm das Projekt an.',
    },
    en: {
      short: 'Pitch',
      title: 'Pitch shared',
      designerNow: 'Your design is shared. The client is reviewing it and leaving feedback.',
      clientNow: 'Review the design, comment on details and accept the project.',
    },
  },
  {
    id: 'agreement',
    statuses: ['ausstehend'],
    iconName: 'PenLine',
    actor: 'client',
    de: {
      short: 'Vertrag',
      title: 'Vertrag & Zahlung',
      designerNow: 'Der Kunde nimmt an, unterschreibt und zahlt den Betrag in den Escrow ein.',
      clientNow: 'Unterschreibe den Vertrag und hinterlege den Betrag sicher im Escrow.',
    },
    en: {
      short: 'Contract',
      title: 'Contract & payment',
      designerNow: 'The client accepts, signs and deposits the amount into escrow.',
      clientNow: 'Sign the contract and deposit the amount securely into escrow.',
    },
  },
  {
    id: 'work',
    statuses: ['escrow'],
    iconName: 'Hammer',
    actor: 'designer',
    de: {
      short: 'Bearbeitung',
      title: 'In Bearbeitung',
      designerNow: 'Der Betrag ist gesichert. Arbeite das Projekt ab und liefere es final ab.',
      clientNow: 'Der Betrag liegt sicher im Escrow. Dein Designer arbeitet am Projekt.',
    },
    en: {
      short: 'In progress',
      title: 'In progress',
      designerNow: 'The amount is secured. Work through the project and deliver it.',
      clientNow: 'The amount is safely in escrow. Your designer is working on the project.',
    },
  },
  {
    id: 'review',
    statuses: ['abgeliefert'],
    iconName: 'ClipboardCheck',
    actor: 'client',
    de: {
      short: 'Abnahme',
      title: 'Abnahme ausstehend',
      designerNow: 'Geliefert. Der Kunde prüft die finale Abgabe und nimmt sie ab.',
      clientNow: 'Die finale Abgabe ist da. Prüfe sie und nimm sie ab oder fordere Änderungen an.',
    },
    en: {
      short: 'Approval',
      title: 'Awaiting approval',
      designerNow: 'Delivered. The client is reviewing the final hand-off and approving it.',
      clientNow: 'The final delivery is here. Review it and approve or request changes.',
    },
  },
  {
    id: 'done',
    statuses: ['abgeschlossen'],
    iconName: 'PartyPopper',
    actor: 'system',
    de: {
      short: 'Abgeschlossen',
      title: 'Abgeschlossen',
      designerNow: 'Der Kunde hat abgenommen. Der Betrag wird an dich ausgezahlt.',
      clientNow: 'Du hast die Abgabe abgenommen. Der Betrag wird an den Designer ausgezahlt.',
    },
    en: {
      short: 'Completed',
      title: 'Completed',
      designerNow: 'The client approved. The amount is being paid out to you.',
      clientNow: 'You approved the delivery. The amount is being paid out to the designer.',
    },
  },
]

export type StepState = 'done' | 'active' | 'open'

/** Index of the stage that the given status currently sits in. */
export function stageIndexForStatus(status: ProjectStatus): number {
  const i = WORKFLOW.findIndex(s => s.statuses.includes(status))
  return i === -1 ? 0 : i
}

export function currentStage(status: ProjectStatus): WorkflowStage {
  return WORKFLOW[stageIndexForStatus(status)]
}

/** State (done / active / open) for each stage, given the current status. */
export function stepStates(status: ProjectStatus): StepState[] {
  const current = stageIndexForStatus(status)
  return WORKFLOW.map((_, i) =>
    i < current ? 'done' : i === current ? 'active' : 'open',
  )
}

export function stageCopy(stage: WorkflowStage, locale: string): StageCopy {
  return locale === 'en' ? stage.en : stage.de
}

/** The single most important next action, phrased for a given viewer. */
export function nextActionFor(
  status: ProjectStatus,
  viewer: 'designer' | 'client',
  locale: string,
): string {
  const stage = currentStage(status)
  const copy = stageCopy(stage, locale)
  return viewer === 'designer' ? copy.designerNow : copy.clientNow
}
