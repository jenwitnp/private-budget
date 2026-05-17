#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Supabase Production → Local Migration${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Project Details
PROJECT_ID="tybmdxojhfcnkcdpoedh"
PROJECT_REF="tybmdxojhfcnkcdpoedh"

echo -e "${YELLOW}Step 1: Supabase Authentication${NC}"
echo -e "You need a Supabase access token to proceed."
echo -e "Get it from: ${BLUE}https://app.supabase.com/account/tokens${NC}\n"
echo -e "Options:"
echo -e "  a) Provide token via environment variable: ${YELLOW}SUPABASE_ACCESS_TOKEN${NC}"
echo -e "  b) Use 'supabase login' to authenticate interactively"
echo -e "  c) Provide token when prompted\n"

# Check if token is already set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}Enter your Supabase access token (or press Enter to use 'supabase login'):${NC}"
  read -s TOKEN_INPUT
  
  if [ -n "$TOKEN_INPUT" ]; then
    export SUPABASE_ACCESS_TOKEN="$TOKEN_INPUT"
    echo -e "${GREEN}✓ Token set${NC}\n"
  else
    echo -e "${YELLOW}Using 'supabase login'...${NC}"
    supabase login
  fi
else
  echo -e "${GREEN}✓ Using SUPABASE_ACCESS_TOKEN from environment${NC}\n"
fi

# Step 2: Link production project
echo -e "${YELLOW}Step 2: Link Production Project${NC}"
echo -e "Project ID: ${BLUE}${PROJECT_REF}${NC}\n"

supabase link --project-ref "$PROJECT_REF" --no-prompt

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to link project${NC}"
  echo -e "Try running: ${YELLOW}supabase link --project-ref ${PROJECT_REF}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Project linked${NC}\n"

# Step 3: Verify local Supabase is running
echo -e "${YELLOW}Step 3: Verify Local Supabase${NC}"
if ! docker ps | grep -q "supabase_db_budget-project"; then
  echo -e "${YELLOW}Starting local Supabase...${NC}"
  supabase start
else
  echo -e "${GREEN}✓ Local Supabase is running${NC}"
fi
echo -e ""

# Step 4: Pull production database schema
echo -e "${YELLOW}Step 4: Pull Production Schema${NC}"
echo -e "This will download your production database structure and seed data...\n"

supabase db pull

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to pull schema${NC}"
  echo -e "Make sure:"
  echo -e "  1. You have a valid access token"
  echo -e "  2. The project is properly linked"
  echo -e "  3. Local Supabase is running"
  exit 1
fi
echo -e "${GREEN}✓ Schema pulled${NC}\n"

# Step 5: Push schema to local
echo -e "${YELLOW}Step 5: Push Schema to Local Database${NC}"
echo -e "Applying production schema to local database...\n"

supabase db push

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to push schema${NC}"
  echo -e "Try manually with: ${YELLOW}supabase db push${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Schema applied to local${NC}\n"

# Step 6: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Migration Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Local Supabase URLs:${NC}"
echo -e "  • Studio UI: http://127.0.0.1:54323"
echo -e "  • API: http://127.0.0.1:54321"
echo -e "  • Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open Studio: http://127.0.0.1:54323"
echo -e "  2. Verify your data is present"
echo -e "  3. Test your local setup"
echo -e "  4. Use ${BLUE}NEXT_PUBLIC_SUPABASE_DEV_MODE=true${NC} in .env.local for local Supabase\n"

echo -e "${YELLOW}To switch back to production:${NC}"
echo -e "  Set ${BLUE}NEXT_PUBLIC_SUPABASE_DEV_MODE=false${NC} in .env.local\n"

echo -e "${YELLOW}To stop local Supabase:${NC}"
echo -e "  Run: ${BLUE}supabase stop${NC}\n"
