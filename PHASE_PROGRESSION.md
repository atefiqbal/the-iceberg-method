# Phase Progression System

Implementation of the 8-phase sequential progression system from SPEC.md Section 6.3.

## Overview

The phase progression system implements **progressive disclosure** - phases unlock sequentially as the merchant completes each stage of The Iceberg Method. This ensures proper sequencing of the bottom-up revenue scaling framework.

## Architecture

### Backend Components

#### 1. Phase Completion Entity
**Location**: `backend/src/phases/entities/phase-completion.entity.ts`

Tracks phase status for each merchant:
- `merchantId` + `phase` - Composite primary key
- `status` - One of: `locked`, `current`, `completed`
- `completedAt` - Timestamp when phase was completed
- `metadata` - JSONB for phase-specific data

#### 2. Phases Service
**Location**: `backend/src/phases/phases.service.ts`

Core business logic:
- `getAllPhases(merchantId)` - Returns all 8 phases with calculated status
- `getCurrentPhase(merchantId)` - Returns active phase
- `completePhase(merchantId, phase)` - Marks phase complete, unlocks next
- `initializePhases(merchantId)` - Sets up Phase 1 for new merchant
- `isPhaseUnlocked(merchantId, phase)` - Check if phase is accessible

**Progressive Disclosure Logic**:
```typescript
// Phase order from SPEC.md
const phaseOrder = [
  'deliverability',        // Phase 1
  'core_flows',            // Phase 2
  'segmentation',          // Phase 3
  'conversion_measurement',// Phase 4
  'cro_observation',       // Phase 5
  'revenue_activation',    // Phase 6
  'offer_construction',    // Phase 7
  'paid_acquisition'       // Phase 8
]

// Algorithm: First incomplete phase is "current",
// all previous are "completed", all future are "locked"
```

#### 3. Phases Controller
**Location**: `backend/src/phases/phases.controller.ts`

REST API endpoints:
- `GET /phases` - List all phases with status
- `GET /phases/current` - Get current active phase
- `GET /phases/completed` - List completed phases
- `POST /phases/:phase/complete` - Mark phase as completed
- `GET /phases/:phase/unlocked` - Check if phase is unlocked
- `POST /phases/initialize` - Initialize phases for merchant

### Frontend Components

#### 1. Phase API Route
**Location**: `frontend/src/app/api/phases/route.ts`

Next.js API route that proxies to backend with authentication.

#### 2. PhaseNavigation Component
**Location**: `frontend/src/components/PhaseNavigation.tsx`

Dynamic React component that:
- Fetches phase data from API
- Renders phases with visual status indicators
- Shows completed (green), current (blue), locked (gray)
- Provides loading states and error handling

#### 3. Dashboard Integration
**Location**: `frontend/src/app/dashboard/page.tsx`

Main dashboard uses `<PhaseNavigation />` component to display the 8-phase sequence dynamically.

## Phase Sequence

From SPEC.md Section 6.3:

1. **📧 Deliverability** - Monitor sender reputation and email deliverability
2. **🔄 Core Flows** - Set up lifecycle email automation flows
3. **🎯 Segmentation** - Configure customer segments and product ladder
4. **📊 Conversion Measurement** - Track email attribution and calculate RPR
5. **🔍 CRO Observation** - Identify funnel friction points
6. **💰 Revenue Activation** - Activate dormant lifecycle revenue
7. **🎁 Offer Construction** - Build margin-conscious promotional campaigns
8. **🚀 Paid Acquisition** - Scale with confidence once all gates pass

## Database Schema

### phase_completions table

```sql
CREATE TABLE phase_completions (
  "merchantId" UUID NOT NULL,
  phase VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'locked',
  "completedAt" TIMESTAMPTZ,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("merchantId", phase),
  FOREIGN KEY ("merchantId") REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_phase_completions_merchant_status
ON phase_completions("merchantId", status);
```

## Setup & Testing

### 1. Run Database Migration

The `phase_completions` table is created automatically by TypeORM synchronize in development mode. For production, use the migration:

```bash
cd backend
npm run migration:run
```

### 2. Seed Test Data

Create a test merchant and initialize phases:

```bash
cd backend
npx ts-node scripts/seed-test-data.ts
```

This outputs:
- Test merchant ID
- Valid JWT token (30-day expiry)
- Sample curl commands

### 3. Test Backend API

```bash
# Get all phases
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/phases

# Complete a phase
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/phases/deliverability/complete

# Get current phase
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/phases/current
```

### 4. Test Frontend Integration

1. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser console and set auth token:
   ```javascript
   localStorage.setItem('auth_token', 'YOUR_JWT_TOKEN_HERE')
   ```

3. Navigate to `http://localhost:3002/dashboard`

4. Phase navigation should now show real data from backend

### 5. Interactive Testing Tool

Open `backend/scripts/test-phases.html` in your browser for an interactive UI to:
- Test phase progression
- Complete phases and see updates in real-time
- Verify progressive disclosure logic

## Example Flow

```bash
# 1. Initial state - Phase 1 is current
GET /phases
# Response: Phase 1 = current, Phases 2-8 = locked

# 2. Complete Phase 1
POST /phases/deliverability/complete

# 3. Check updated state - Phase 2 is now current
GET /phases
# Response: Phase 1 = completed, Phase 2 = current, Phases 3-8 = locked

# 4. Complete Phase 2
POST /phases/core_flows/complete

# 5. Progressive disclosure continues...
GET /phases
# Response: Phases 1-2 = completed, Phase 3 = current, Phases 4-8 = locked
```

## Integration Points

### Connecting Phase Completion to Gates

From SPEC.md, phases complete when their gates pass. Example integration:

```typescript
// In gates.service.ts
async checkDeliverabilityGate(merchantId: string) {
  const gate = await this.evaluateDeliverabilityGate(merchantId)

  if (gate.passing) {
    // Auto-complete Phase 1 when gate passes
    await this.phasesService.completePhase(merchantId, 'deliverability')
  }

  return gate
}
```

### Phase-Locked UI Elements

Use phase status to conditionally render features:

```typescript
const phases = await phasesService.getAllPhases(merchantId)
const coreFlowsUnlocked = phases.find(p => p.phase === 'core_flows')?.unlocked

if (!coreFlowsUnlocked) {
  return <LockedFeature message="Complete Phase 1 to unlock" />
}
```

## Future Enhancements

1. **Gate Integration** - Auto-complete phases when gates pass
2. **Phase Milestones** - Track sub-tasks within each phase
3. **Rollback Logic** - Re-lock phases if gates fail
4. **Phase Analytics** - Track time spent in each phase
5. **Webhook Events** - Notify external systems on phase transitions
6. **Phase Prerequisites** - Complex unlock logic beyond linear progression

## API Response Examples

### GET /phases

```json
[
  {
    "phase": "deliverability",
    "status": "completed",
    "name": "Deliverability",
    "description": "Monitor sender reputation and email deliverability",
    "completedAt": "2026-02-02T19:46:11.739Z",
    "unlocked": true
  },
  {
    "phase": "core_flows",
    "status": "current",
    "name": "Core Flows",
    "description": "Set up lifecycle email automation flows",
    "unlocked": true
  },
  {
    "phase": "segmentation",
    "status": "locked",
    "name": "Segmentation",
    "description": "Configure customer segments and product ladder",
    "unlocked": false
  }
  // ... remaining phases
]
```

### GET /phases/current

```json
{
  "currentPhase": "core_flows"
}
```

### POST /phases/:phase/complete

```json
{
  "success": true,
  "message": "Phase deliverability marked as completed"
}
```

## Files Changed/Created

### Backend
- ✅ `src/phases/entities/phase-completion.entity.ts` - Phase completion entity
- ✅ `src/phases/phases.service.ts` - Business logic
- ✅ `src/phases/phases.controller.ts` - REST endpoints
- ✅ `src/phases/phases.module.ts` - Module definition
- ✅ `src/app.module.ts` - Added PhasesModule
- ✅ `src/merchants/entities/merchant.entity.ts` - Added phaseCompletions relation
- ✅ `src/database/migrations/1700000008000-AddPhaseCompletions.ts` - Migration
- ✅ `scripts/seed-test-data.ts` - Test data seeding
- ✅ `scripts/test-phases.html` - Interactive testing UI

### Frontend
- ✅ `src/app/api/phases/route.ts` - API proxy route
- ✅ `src/components/PhaseNavigation.tsx` - Dynamic phase display
- ✅ `src/app/dashboard/page.tsx` - Updated to use PhaseNavigation

## Notes

- TypeORM synchronize auto-creates tables in development
- JWT tokens generated by seed script are valid for 30 days
- Frontend falls back to loading skeleton on API errors
- All API endpoints require JWT authentication
- Phase order is defined in `phases.service.ts` and matches SPEC.md
