"use client"

import { Check } from "lucide-react"
import React from "react"

export type StepStatus = "complete" | "current" | "upcoming"

export interface StepItem {
  name: string
  description?: string
  href?: string
  status: StepStatus
}

export interface CreateClubStepsProps {
  steps?: StepItem[]
  currentStep?: number
  onStepClick?: (step: number) => void
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function CreateClubStepsSidebar({ steps, currentStep = 1, onStepClick }: CreateClubStepsProps) {
  const defaultSteps: StepItem[] = [
    { name: "Account", description: "Sign in to continue.", href: "#", status: "complete" },
    { name: "Club basics", description: "Name, contact, and address.", href: "#", status: "current" },
    { name: "Payments & verification", description: "Stripe Connect setup.", href: "#", status: "upcoming" },
    { name: "Team", description: "Invite administrators.", href: "#", status: "upcoming" },
    { name: "Review & create", description: "Confirm and launch.", href: "#", status: "upcoming" },
  ]

  // Generate steps based on current step if no custom steps provided
  const items = steps ?? defaultSteps.map((step, index) => {
    const stepNumber = index + 1
    let status: StepStatus = "upcoming"
    
    if (stepNumber < currentStep) {
      status = "complete"
    } else if (stepNumber === currentStep) {
      status = "current"
    }
    
    return { ...step, status }
  })

  return (
    <nav aria-label="Progress" className="steps-nav">
      <ol role="list" className="steps-list">
        {items.map((step, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={step.name} className={cx("step-item", !isLast && "step-item--spaced")}> 
              {step.status === "complete" ? (
                <>
                  {!isLast && <div aria-hidden="true" className={cx("step-connector", "step-connector--complete")} />}
                  <button 
                    type="button"
                    onClick={() => onStepClick?.(idx + 1)}
                    className={cx("step-link", "step-link--complete")}
                  > 
                    <span className="step-icon-wrap">
                      <span className={cx("step-icon", "step-icon--complete")}>
                        <Check aria-hidden="true" className="step-icon-check" />
                      </span>
                    </span>
                    <span className="step-texts">
                      <span className={cx("step-title", "step-title--complete")}>{step.name}</span>
                      {step.description ? (
                        <span className={cx("step-desc", "step-desc--muted")}>{step.description}</span>
                      ) : null}
                    </span>
                  </button>
                </>
              ) : step.status === "current" ? (
                <>
                  {!isLast && <div aria-hidden="true" className={cx("step-connector", "step-connector--idle")} />}
                  <div aria-current="step" className={cx("step-link", "step-link--current")}>
                    <span aria-hidden="true" className="step-icon-wrap">
                      <span className={cx("step-icon", "step-icon--current")}> 
                        <span className="step-icon-dot" />
                      </span>
                    </span>
                    <span className="step-texts">
                      <span className={cx("step-title", "step-title--current")}>{step.name}</span>
                      {step.description ? (
                        <span className={cx("step-desc", "step-desc--muted")}>{step.description}</span>
                      ) : null}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {!isLast && <div aria-hidden="true" className={cx("step-connector", "step-connector--idle")} />}
                  <div className={cx("step-link", "step-link--upcoming")}>
                    <span aria-hidden="true" className="step-icon-wrap">
                      <span className={cx("step-icon", "step-icon--upcoming")}>
                        <span className="step-icon-dot step-icon-dot--transparent" />
                      </span>
                    </span>
                    <span className="step-texts">
                      <span className={cx("step-title", "step-title--upcoming")}>{step.name}</span>
                      {step.description ? (
                        <span className={cx("step-desc", "step-desc--muted")}>{step.description}</span>
                      ) : null}
                    </span>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
