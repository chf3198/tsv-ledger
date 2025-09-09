#!/bin/bash

# Knowledge Transfer Protocol - One-Line Installer
# Installs kt-cli.sh for instant project setup with proven protocols

set -e

INSTALL_DIR="$HOME/.local/bin"
CLI_URL="https://raw.githubusercontent.com/[YOUR_USERNAME]/knowledge-transfer-protocols/main/cli/kt-cli.sh"
CLI_NAME="kt-cli"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Installing Knowledge Transfer Protocol CLI...${NC}"

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download the CLI tool
echo -e "${BLUE}📥 Downloading kt-cli.sh...${NC}"
if curl -s -f "$CLI_URL" -o "$INSTALL_DIR/$CLI_NAME"; then
    chmod +x "$INSTALL_DIR/$CLI_NAME"
    echo -e "${GREEN}✅ Installed: $INSTALL_DIR/$CLI_NAME${NC}"
else
    echo -e "${RED}❌ Failed to download CLI tool${NC}"
    echo -e "${RED}   Please check your internet connection and GitHub repository${NC}"
    exit 1
fi

# Check if install directory is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${BLUE}🔧 Adding $INSTALL_DIR to PATH...${NC}"
    
    # Add to appropriate shell config
    if [ -f "$HOME/.bashrc" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        echo -e "${GREEN}✅ Added to .bashrc${NC}"
    elif [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
        echo -e "${GREEN}✅ Added to .zshrc${NC}"
    fi
    
    export PATH="$HOME/.local/bin:$PATH"
fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo -e "${BLUE}Usage:${NC}"
echo "  kt-cli init my-awesome-app web-app"
echo "  kt-cli init payment-api api"
echo "  kt-cli help"
echo ""
echo -e "${BLUE}Get started:${NC}"
echo "  source ~/.bashrc  # Reload shell"
echo "  kt-cli init my-project"
echo ""
echo -e "${GREEN}Ready to create professional projects with proven Knowledge Transfer Protocols!${NC}"
