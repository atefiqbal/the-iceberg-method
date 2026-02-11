# plan.md
## Implementation Plan — The Iceberg Method

**Source of Truth:** PRD.md (v1.3 Final)  
**Status:** Execution Plan  
**Audience:** Agentic IDEs (Claude Code), engineers, builders  
**Rule:** If this plan conflicts with PRD.md, PRD.md wins.

---

## 0. Planning Principles

- This plan follows the **enforced sequencing** defined in the PRD.
- No phase may be skipped.
- Paid acquisition features must not be implemented until downstream gates pass.
- Safeguards and thresholds are **logic gates**, not documentation.

---

## 1. System Overview

### Core System Modules
1. **Lifecycle & Deliverability Module**
2. **Segmentation & Journey Engine**
3. **Conversion & Funnel Analytics**
4. **CRO Observation Layer**
5. **Offer & Promotion Engine**
6. **Governance, Metrics & Safeguards**

Each module maps directly to PRD sections and metrics.

---

## 2. Phase 1 — Foundations (Deliverability & Lifecycle)

### Objectives
- Ensure communication actually reaches users.
- Capture high-intent post-purchase and abandonment moments.

### Tasks
- Implement email/SMS deliverability health checks:
  - Hard bounce ≤ 0.5%
  - Soft bounce warnings at 3%, fail at ≥5%
- Build lifecycle flow triggers:
  - Welcome / onboarding
  - Abandoned checkout
  - Abandoned cart
  - Browse abandonment
  - Post-purchase education
  - Win-back / reactivation
- Enforce **deliverability gate**:
  - Block campaigns/promos if thresholds are violated.

### Outputs
- Deliverability status dashboard
- Lifecycle flow engine with trigger validation

---

## 3. Phase 2 — Segmentation & Journey Logic

### Objectives
- Prevent generic messaging.
- Enable product- and journey-relative communication.

### Tasks
- Implement segmentation logic:
  - Pre-purchase vs post-purchase
  - Product-based progression (step 1 → step 2 → step 3)
- Store journey state per user.
- Ensure all messaging references journey state.

### Outputs
- Segmentation ruleset
- Journey state model

---

## 4. Phase 3 — Conversion & Funnel Measurement

### Objectives
- Identify bottlenecks before scaling traffic.

### Tasks
- Track funnel steps:
  - Session
  - Add to cart
  - Initiate checkout
  - Purchase
- Segment funnel metrics by:
  - Device (mobile vs desktop)
  - Traffic source
- Establish baselines using 14–30 day lookback.
- Implement variance monitoring:
  - ±10% WoW acceptable
  - CR <2% for 3 days → critical alert

### Outputs
- Funnel throughput dashboard
- Automated variance alerts

---

## 5. Phase 4 — CRO Observation Layer

### Objectives
- Diagnose friction before optimization.

### Tasks
- Integrate behavior observation:
  - Heatmaps
  - Session recordings
- Tag friction events:
  - Rage clicks
  - Dead clicks
  - Checkout abandonment points
- Prioritize “money pages”:
  - Homepage
  - Product detail pages
  - Checkout

### Outputs
- CRO diagnostics panel
- Money page issue queue

---

## 6. Phase 5 — Revenue Activation (Existing Customers)

### Objectives
- Generate fast, backend revenue safely.

### Tasks
- Implement reactivation messaging:
  - Low-friction prompts (e.g., nine-word style)
- Build promo engine:
  - 4–7 day campaign support
  - Frequency controls enforced
- Monitor fatigue signals:
  - Unsubscribes
  - Revenue-per-recipient decay

### Gates
- Promotions blocked if:
  - Deliverability gate fails
  - Fatigue thresholds exceeded

### Outputs
- Campaign engine
- Fatigue safeguard logic

---

## 7. Phase 6 — Offer Construction

### Objectives
- Create an attraction mechanism that funds acquisition.

### Tasks
- Support offer components:
  - Bundles
  - Upsells
  - Post-purchase offers
- Track:
  - AOV lift
  - Margin contribution
- Enforce cash recovery rules:
  - Break-even window capped
  - Monitor net profitability (returns included)

### Outputs
- Offer configuration system
- Profitability tracking

---

## 8. Phase 7 — Paid Acquisition Enablement

### Objectives
- Scale traffic only after system stability.

### Gates (All Required)
- Deliverability healthy
- Funnel throughput stable
- CRO issues addressed
- Offer margin validated

### Tasks
- Enable paid traffic inputs (Meta, etc.)
- Monitor:
  - ROAS
  - MER
  - CAC payback

### Outputs
- Traffic scaling controls
- Acquisition monitoring

---

## 9. Governance & Weekly Cadence

### Weekly “Monday Ritual”

**Roles**
- Driver: runs meeting
- Data Lead: prepares metrics
- Decider: final authority

**Agenda**
1. Revenue vs target
2. Funnel health
3. Lifecycle performance
4. CRO issues
5. Decisions & owners

### Escalation Protocol
1. Containment
2. Diagnosis
3. Correction

Triggered by consecutive red cycles.

---

## 10. Definition of Done

The system is complete when:
- All PRD metrics are tracked.
- All safeguards are enforced as logic gates.
- No traffic can scale without downstream health.
- Ownership and escalation are codified.

---

## 11. Handoff Rules for Agentic IDEs

- Do not reorder phases.
- Do not bypass gates.
- Do not invent new goals.
- Ask before deviating.

This plan is execution law.
