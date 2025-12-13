#!/bin/bash

# Tableau Retry Mechanism Deployment Script
# Date: 2025-12-13
# Purpose: Deploy retry mechanism to n8n workflow

set -e

# Configuration
WORKFLOW_ID="nCw8y2bLSMj4CD74"
N8N_URL="https://n8n.elstech.com.tw"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMDQ5N2U3ZS01N2JmLTQ4ODctYWE2Ny05MTkzZWUzOWUwMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyODQ4NDcyfQ.tf5PBPLrdnaTmTeSU4k_jFnpS3Q2kh09Rulm3i_J6Ps"
WORKFLOW_FILE="../workflows/top100-player-tableau-report-with-retry.json"
BACKUP_DIR="../backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Tableau Retry Mechanism Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Step 1: Validate JSON
echo -e "${YELLOW}[1/6] Validating workflow JSON...${NC}"
if ! jq empty "$WORKFLOW_FILE" 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON format${NC}"
    exit 1
fi

NODE_COUNT=$(jq '.nodes | length' "$WORKFLOW_FILE")
CONN_COUNT=$(jq '.connections | to_entries | length' "$WORKFLOW_FILE")

echo -e "${GREEN}✅ JSON valid${NC}"
echo "   - Nodes: $NODE_COUNT"
echo "   - Connections: $CONN_COUNT"
echo ""

# Step 2: Backup current workflow
echo -e "${YELLOW}[2/6] Backing up current workflow...${NC}"
BACKUP_FILE="$BACKUP_DIR/workflow-backup-$(date +%Y%m%d-%H%M%S).json"
mkdir -p "$BACKUP_DIR"

curl -s "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi
echo ""

# Step 3: Show changes
echo -e "${YELLOW}[3/6] New nodes to be added:${NC}"
jq -r '.nodes[] | select(.name | contains("View Metadata") or contains("Check Data") or contains("Today") or contains("Retry") or contains("Alert") or contains("5 Min")) | "   - \(.name)"' "$WORKFLOW_FILE"
echo ""

# Step 4: Confirm deployment
echo -e "${YELLOW}[4/6] Deployment confirmation${NC}"
echo -e "${YELLOW}This will:${NC}"
echo "   - Update workflow: $WORKFLOW_ID"
echo "   - Add 7 new nodes for retry mechanism"
echo "   - Modify workflow connections"
echo "   - Add execution timeout (1 hour)"
echo ""

read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Step 5: Deploy workflow
echo -e "${YELLOW}[5/6] Deploying workflow...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @"$WORKFLOW_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Workflow deployed successfully${NC}"
    echo ""
else
    echo -e "${RED}❌ Deployment failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${YELLOW}You can restore from backup:${NC}"
    echo "   curl -X PUT \"${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}\" \\"
    echo "     -H \"X-N8N-API-KEY: ${N8N_API_KEY}\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d @\"$BACKUP_FILE\""
    exit 1
fi

# Step 6: Verify deployment
echo -e "${YELLOW}[6/6] Verifying deployment...${NC}"

VERIFY=$(curl -s "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}")

VERIFY_NODE_COUNT=$(echo "$VERIFY" | jq '.nodes | length')
VERIFY_CONN_COUNT=$(echo "$VERIFY" | jq '.connections | to_entries | length')

if [ "$VERIFY_NODE_COUNT" = "$NODE_COUNT" ] && [ "$VERIFY_CONN_COUNT" = "$CONN_COUNT" ]; then
    echo -e "${GREEN}✅ Verification passed${NC}"
    echo "   - Nodes: $VERIFY_NODE_COUNT (expected: $NODE_COUNT)"
    echo "   - Connections: $VERIFY_CONN_COUNT (expected: $CONN_COUNT)"
else
    echo -e "${RED}⚠️  Verification warning${NC}"
    echo "   - Nodes: $VERIFY_NODE_COUNT (expected: $NODE_COUNT)"
    echo "   - Connections: $VERIFY_CONN_COUNT (expected: $CONN_COUNT)"
fi
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the workflow in n8n UI:"
echo "   ${N8N_URL}/workflow/${WORKFLOW_ID}"
echo ""
echo "2. Test the workflow manually"
echo ""
echo "3. Monitor first scheduled execution (tomorrow at 08:50)"
echo ""
echo "4. Check Slack channel for alerts if retry mechanism is triggered"
echo ""
echo -e "${YELLOW}To activate the workflow:${NC}"
echo "   curl -X PATCH \"${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}\" \\"
echo "     -H \"X-N8N-API-KEY: ${N8N_API_KEY}\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"active\": true}'"
echo ""
echo -e "${YELLOW}To rollback if needed:${NC}"
echo "   curl -X PUT \"${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}\" \\"
echo "     -H \"X-N8N-API-KEY: ${N8N_API_KEY}\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d @\"$BACKUP_FILE\""
echo ""
