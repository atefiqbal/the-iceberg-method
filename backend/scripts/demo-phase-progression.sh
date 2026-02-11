#!/bin/bash

# Demo script to show phase progression in action
# Run after seeding test data

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get JWT token from seed script output or use provided token
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: ./demo-phase-progression.sh YOUR_JWT_TOKEN${NC}"
  echo "Run 'npx ts-node scripts/seed-test-data.ts' first to get a token"
  exit 1
fi

TOKEN=$1
API_URL="http://localhost:3000"

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Phase Progression Demo                 ║${NC}"
echo -e "${BLUE}║   The Iceberg Method                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Function to display phases
show_phases() {
  echo -e "${GREEN}📊 Current Phase Status:${NC}"
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/phases" | \
    jq -r '.[] | "\(.phase | ascii_upcase): \(.status) \(if .unlocked then "🔓" else "🔒" end)"' | \
    nl -w2 -s'. '
  echo ""
}

# Function to get current phase
show_current() {
  CURRENT=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/phases/current" | jq -r '.currentPhase')
  echo -e "${YELLOW}▶️  Currently on: ${CURRENT}${NC}"
  echo ""
}

# Initial state
echo -e "${GREEN}=== INITIAL STATE ===${NC}"
show_phases
show_current

# Complete Phase 1
echo -e "${BLUE}🚀 Completing Phase 1: Deliverability...${NC}"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/phases/deliverability/complete" | jq '.'
echo ""

sleep 1

# Show updated state
echo -e "${GREEN}=== AFTER PHASE 1 COMPLETION ===${NC}"
show_phases
show_current

# Complete Phase 2
echo -e "${BLUE}🚀 Completing Phase 2: Core Flows...${NC}"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/phases/core_flows/complete" | jq '.'
echo ""

sleep 1

# Show updated state
echo -e "${GREEN}=== AFTER PHASE 2 COMPLETION ===${NC}"
show_phases
show_current

# Complete Phase 3
echo -e "${BLUE}🚀 Completing Phase 3: Segmentation...${NC}"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/phases/segmentation/complete" | jq '.'
echo ""

sleep 1

# Final state
echo -e "${GREEN}=== AFTER PHASE 3 COMPLETION ===${NC}"
show_phases
show_current

echo -e "${GREEN}✅ Demo completed!${NC}"
echo -e "${YELLOW}Notice how each phase unlocks sequentially as previous phases complete.${NC}"
echo ""
