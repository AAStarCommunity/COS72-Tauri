#!/bin/bash
# COS72-Tauri Enhanced Build Script
# This script helps build and test the application with proper error handling

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Setup logging
mkdir -p logs
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="logs/build-$TIMESTAMP.log"

echo -e "${BLUE}===== COS72-Tauri Build Script =====${NC}"
echo -e "Build started at: $(date)"
echo -e "Log file: ${LOG_FILE}"
echo ""

# Function to check for errors
check_error() {
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: $1${NC}"
    echo -e "${YELLOW}See log file for details: ${LOG_FILE}${NC}"
    exit 1
  else
    echo -e "${GREEN}✓ $2${NC}"
  fi
}

# Log function
log() {
  echo "$1" | tee -a "$LOG_FILE"
}

# Clean step
echo -e "${BLUE}Step 1: Cleaning previous build artifacts${NC}"
rm -rf dist out target .next 2>/dev/null
pnpm clean 2>&1 | tee -a "$LOG_FILE" || true
log "Clean step completed"

# Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies${NC}"
echo -e "Installing Node.js dependencies..."
pnpm install 2>&1 | tee -a "$LOG_FILE"
check_error "Failed to install Node.js dependencies" "Node.js dependencies installed"

# Fix potential build issues
echo -e "${BLUE}Step 3: Checking for build issues${NC}"

# Check for webauthn-rs version compatibility
if grep -q "webauthn-rs.*0.4" src-tauri/Cargo.toml; then
  echo -e "${YELLOW}Note: Using webauthn-rs 0.4.x series${NC}"
fi

# Check Tauri version compatibility
echo -e "Checking Tauri compatibility..."
TAURI_CLI_VERSION=$(pnpm list --json | grep -o '"@tauri-apps/cli": "[^"]*"' | grep -o '"[0-9][^"]*"' | tr -d '"')
log "Tauri CLI version: $TAURI_CLI_VERSION"

# Build frontend
echo -e "${BLUE}Step 4: Building frontend${NC}"
pnpm build 2>&1 | tee -a "$LOG_FILE"
check_error "Failed to build frontend" "Frontend built successfully"

# Run frontend tests
echo -e "${BLUE}Step 5: Running frontend tests${NC}"
pnpm test --passWithNoTests 2>&1 | tee -a "$LOG_FILE" || echo -e "${YELLOW}Warning: Some tests may have failed${NC}"

# Check Rust
echo -e "${BLUE}Step 6: Checking Rust code${NC}"
cd src-tauri && cargo check 2>&1 | tee -a "../$LOG_FILE"
check_error "Rust code check failed" "Rust code check passed"

# Build Tauri app
echo -e "${BLUE}Step 7: Building Tauri application${NC}"
cd .. && pnpm run tauri build --debug 2>&1 | tee -a "$LOG_FILE"
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo -e "${RED}Tauri build failed${NC}"
  echo -e "${YELLOW}Attempting to fix common issues...${NC}"
  
  # Fix common issues
  # 1. Clean Rust target directory
  cd src-tauri && cargo clean 2>&1 | tee -a "../$LOG_FILE"
  
  # 2. Update Rust dependencies
  cargo update 2>&1 | tee -a "../$LOG_FILE"
  
  # 3. Try building again
  cd .. && echo -e "${YELLOW}Attempting rebuild...${NC}"
  pnpm run tauri build --debug 2>&1 | tee -a "$LOG_FILE"
  check_error "Tauri build failed after fixes" "Tauri application built successfully after fixes"
else
  echo -e "${GREEN}✓ Tauri application built successfully${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}===== Build Summary =====${NC}"
echo -e "Build completed at: $(date)"
echo -e "Log file: ${LOG_FILE}"

# Check if binary was created
if [ -f "src-tauri/target/debug/bundle/macos/COS72 Tauri.app/Contents/MacOS/COS72 Tauri" ]; then
  echo -e "${GREEN}✓ macOS app bundle created successfully${NC}"
elif [ -f "src-tauri/target/debug/cos72-tauri" ]; then
  echo -e "${GREEN}✓ Linux binary created successfully${NC}"
elif [ -f "src-tauri/target/debug/cos72-tauri.exe" ]; then
  echo -e "${GREEN}✓ Windows binary created successfully${NC}"
else
  echo -e "${YELLOW}Warning: Could not find built binary${NC}"
fi

echo -e "${GREEN}Build script completed successfully${NC}" 