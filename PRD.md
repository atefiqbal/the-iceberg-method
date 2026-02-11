# Product Requirements Document (PRD)
## The Iceberg Method — Bottom-Up Revenue Scaling for Shopify DTC Brands

**Version:** v1.3 (Final)  
**Date:** 2026-01-31  
**Status:** FINAL — Approved for Circulation  
**Owner:** Growth / Revenue Systems  
**Intended Use:** Internal operating framework; practitioner-facing use permitted with evidence context

---

## 1. Title & Snapshot

**Snapshot (Executive):**  
The Iceberg Method is a bottom-up revenue scaling framework for Shopify direct-to-consumer brands designed to deliver **≥20% revenue lift within 90 days** by sequencing growth work in the following order:

**Post-purchase monetization → Conversion integrity → Offer construction → Paid acquisition**

The framework prioritizes capital efficiency, diagnostic clarity, and repeatability under bootstrapped constraints. Growth is unlocked by stabilizing the “mass of the iceberg” (retention, lifecycle, CRO) before scaling traffic, reducing wasted spend and conversion collapse risk.

---

## 2. Problem

### Symptoms
- Brands scale paid traffic before fixing deliverability, lifecycle flows, segmentation, and checkout friction.
- Core flows exist only as templates.
- Segmentation is coarse (buyer vs non-buyer).
- Checkout trust breaks persist.

### Impact
- Traffic amplifies leaks, causing wasted ad spend and declining ROAS.
- Revenue growth becomes volatile.
- Backend revenue remains under-leveraged.

### Stakes
For bootstrapped Shopify brands with limited runway, premature scaling threatens cash flow and long-term viability. Fixing foundations first is a strategic necessity, not an optimization preference.

---

## 3. Context / Background

The Iceberg Method was developed through 90-day performance sprints targeting ≥20% revenue lift. It reframes the traditional funnel as an iceberg: the first purchase is the visible tip, while the majority of revenue and profit are generated post-purchase.

The method applies strict Pareto discipline (“80/20 of the 80/20”) under constraints of time, capital, and team bandwidth.

---

## 4. Users / Personas

### 4.1 Shopify DTC Founders (Bootstrapped)
- **Goals:** Fast revenue lift without burning cash; repeatable growth system.
- **Pain Points:** Ads feel expensive and unpredictable; unclear bottlenecks.
- **Importance:** Primary decision-makers and budget holders.

### 4.2 High-AOV / High-LTV Operators
- **Goals:** Maximize backend revenue; accelerate cash recovery.
- **Pain Points:** Under-leveraged lifecycle messaging; generic communication.
- **Importance:** Highest ROI cohort for the framework.

### 4.3 Growth Marketers / Operators
- **Goals:** Clear prioritization and diagnostic clarity.
- **Pain Points:** Pressure to run ads before systems are ready.
- **Importance:** Execution quality determines success.

---

## 5. Goals

### Primary Goals
1. **Achieve ≥20% revenue lift within 90 days**  
   Measured against a **14–30 day pre-engagement baseline**, excluding anomaly days.

2. **Increase post-purchase revenue contribution before scaling acquisition**  
   Target: **20–30% of total revenue** from lifecycle marketing; **up to ~40%** for high-performing brands.

### Supporting Goals
3. **Stabilize funnel throughput prior to traffic increases**  
   Maintain step-level conversion rates within defined variance bands.

4. **Establish a repeatable diagnostic growth system**  
   Weekly review cadence with clear ownership and escalation.

---

## 6. Non-Goals

- Traffic-first scaling strategies
- Exhaustive CRO, email, or media playbooks
- Universal applicability to low-margin or low-repeat-purchase models

---

## 7. Functional Requirements

### 7.1 Lifecycle Infrastructure

**Deliverability Gate**
- Hard bounce rate ≤ **0.5%**
- Soft bounce warning at **3%**, failure at **≥5%**
- Spam complaint rate ≤ **0.1%**

**Mandatory Core Flows (6)**
1. Welcome / First-purchase onboarding  
2. Abandoned checkout  
3. Abandoned cart  
4. Browse abandonment  
5. Post-purchase education  
6. Win-back / reactivation  

---

### 7.2 Segmentation & Messaging
- Journey-based segmentation (pre-purchase vs post-purchase)
- Product-relative progression segmentation (step-based cross-sell and upsell)

---

### 7.3 Revenue Activation
- Reactivation via low-friction engagement prompts (e.g., nine-word email)
- Short-term promotional campaigns (4–7 days) with frequency controls

---

### 7.4 Conversion Rate Optimization (CRO)
- Step-level funnel throughput tracking:
  - Session → Add to Cart → Initiate Checkout → Purchase
- Visitor behavior analysis (screen recordings, heatmaps)
- Priority optimization of “money pages”:
  - Homepage
  - Product detail pages
  - Checkout

---

### 7.5 Offer Construction
- Margin-optimized attraction offers designed to fund acquisition sustainably
- Emphasis on AOV lift via bundles, upsells, and post-purchase offers

---

## 8. Non-Functional Requirements

- Weekly diagnostic cadence (“Monday Ritual”)
- Device-segmented reporting (mobile vs desktop)
- Checkout trust and brand consistency
- Rapid iteration without structural rebuilds

---

## 9. Risks & Dependencies

### Key Risks
- Deliverability degradation suppresses lifecycle revenue
- Conversion collapse when traffic scales prematurely
- Promotional fatigue from over-frequency
- Cash constraints from extended break-even windows

### Dependencies
- Reliable ESP (email/SMS)
- Accurate analytics and event tracking
- Clear ownership of weekly diagnostics

---

## 10. Metrics / Success Criteria

### Baselines
- **Revenue baseline:** 14–30 day lookback; anomaly days excluded
- **Conversion rate benchmarks:**
  - Median: **1.4–1.8%**
  - Top 20%: **≥3.2%**
  - Top 10%: **≥4.7%**
  - Desktop ≈ **1.9%**
  - Mobile ≈ **1.2%** (≈79% of traffic)
- **Post-purchase revenue share:** **20–30%**, up to **~40%** optimized

---

### Thresholds & Triggers

**Deliverability**
- Hard bounce >0.5% → immediate remediation
- Soft bounce ≥3% → warning; ≥5% → fail state

**Funnel Throughput**
- Acceptable variance: **±10% WoW**
- Critical trigger: Conversion rate < **2%** for **3 consecutive days**

**Promotion Fatigue**
- Rising unsubscribe rates
- Sustained revenue-per-recipient (RPR) decay

**Cash Recovery**
- Strictly capped break-even window for bootstrapped brands
- Profitability monitored net of returns (≈15.8%)

---

## 11. Rollout & Safeguards

**Enforced Sequence**
1. Deliverability
2. Core flows
3. Segmentation
4. Reactivation
5. CRO
6. Promotions
7. Offer construction
8. Paid acquisition

**Safeguards**
- Block scaling if deliverability or throughput breaches thresholds
- Promotion frequency limits enforced
- Cash recovery window enforcement

---

## 12. Governance & Ownership

- **Driver:** Runs weekly diagnostic review
- **Data Lead:** Metric accuracy and preparation
- **Decider:** Founder or Head of Marketing (final authority)

**Escalation Protocol**
1. Containment
2. Diagnosis
3. Correction  
Triggered by consecutive red cycles.

---

## 13. Evidence Confidence & Defensibility

The ≥20% revenue lift within 90 days is **defensible and conditional**. Practitioner evidence demonstrates that modest conversion rate improvements (e.g., 1.5% → 1.8%) yield ~20% revenue lift at constant traffic.

Attribution inflation and macro headwinds are mitigated via:
- Marketing Efficiency Ratio (MER)
- Incrementality testing and holdouts

---

## 14. Version Note

**v1.3 — Final**  
All QA-identified gaps resolved using industry benchmarks and practitioner evidence. Baselines, thresholds, ownership, and safeguards are now operational. Document approved for execution and circulation.

---
