#!/bin/bash

# Knowledge Transfer Protocol CLI Tool
# Version: 1.0
# Purpose: Bootstrap new projects with proven Knowledge Transfer Protocols
# Source: TSV Ledger v2.2.1 - Texas Sunset Venues Business Intelligence Platform

set -e

# Configuration
GITHUB_REPO="https://raw.githubusercontent.com/[YOUR_USERNAME]/knowledge-transfer-protocols/main"
PROTOCOL_VERSION="v1.0"
CLI_VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Knowledge Transfer Protocol CLI v${CLI_VERSION}           ║${NC}"
echo -e "${BLUE}║     Professional Project Setup with Proven Protocols        ║${NC}"
echo -e "${BLUE}║           Source: TSV Ledger v2.2.1 (Validated)             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to display help
show_help() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./kt-cli.sh init <project-name> [project-type]"
    echo "  ./kt-cli.sh validate <project-directory>"
    echo "  ./kt-cli.sh update <project-directory>"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  init      Initialize new project with Knowledge Transfer Protocols"
    echo "  validate  Validate existing project against protocol standards"
    echo "  update    Update protocols in existing project to latest version"
    echo ""
    echo -e "${YELLOW}Project Types:${NC}"
    echo "  web-app   Web application (Node.js/Express) [default]"
    echo "  api       REST API server"
    echo "  cli       Command-line tool"
    echo "  library   Reusable library/package"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./kt-cli.sh init my-awesome-app web-app"
    echo "  ./kt-cli.sh init payment-api api"
    echo "  ./kt-cli.sh validate ./my-project"
    echo "  ./kt-cli.sh update ./my-project"
    exit 0
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check for required tools
    local missing_tools=()
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Please install missing tools and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
}

# Function to download protocol file
download_protocol() {
    local file_path=$1
    local local_path=$2
    local url="${GITHUB_REPO}/${file_path}"
    
    echo -e "${BLUE}📥 Downloading: ${file_path}${NC}"
    
    if curl -s -f "$url" -o "$local_path"; then
        echo -e "${GREEN}✅ Downloaded: $local_path${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to download: $file_path${NC}"
        echo -e "${YELLOW}   Falling back to local templates...${NC}"
        return 1
    fi
}

# Function to create project structure
create_project_structure() {
    local project_name=$1
    local project_type=$2
    
    echo -e "${BLUE}🏗️  Creating project structure for: $project_name${NC}"
    
    # Create main project directory
    mkdir -p "$project_name"
    cd "$project_name"
    
    # Create standard directory structure (following CodeOrganizationFramework.md)
    local directories=(
        "src"
        "tests"
        "docs" 
        "data"
        "public"
        "scripts"
        "BestPractices/Generic"
        "BestPractices/ProjectSpecific"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created: $dir/${NC}"
    done
    
    # Create initial files
    touch README.md
    touch .gitignore
    touch "docs/API_DOCUMENTATION.md"
    touch "docs/DEVELOPMENT.md"
    touch "data/README.md"
    
    echo -e "${GREEN}✅ Project structure created${NC}"
}

# Function to setup protocols
setup_protocols() {
    local project_type=$1
    
    echo -e "${BLUE}📋 Setting up Knowledge Transfer Protocols...${NC}"
    
    # Protocol files to download
    local protocols=(
        "Core/v1.0/Generic/CodeOrganizationFramework.md"
        "Core/v1.0/Generic/GitWorkflowPatterns.md"
        "Core/v1.0/Generic/DocumentationFramework.md"
        "Core/v1.0/Generic/ProtocolEvolutionFramework.md"
        "Core/v1.0/Generic/README.md"
    )
    
    # Download protocols
    for protocol in "${protocols[@]}"; do
        local filename=$(basename "$protocol")
        local local_path="BestPractices/Generic/$filename"
        
        if ! download_protocol "$protocol" "$local_path"; then
            # Create fallback template
            create_fallback_protocol "$filename" "$local_path"
        fi
    done
    
    # Create project-specific protocol template
    create_project_specific_protocols "$project_type"
    
    echo -e "${GREEN}✅ Protocols setup complete${NC}"
}

# Function to create fallback protocols (if GitHub not available)
create_fallback_protocol() {
    local filename=$1
    local local_path=$2
    
    case "$filename" in
        "README.md")
            cat > "$local_path" << 'EOF'
# Knowledge Transfer Protocols - Generic Patterns

This directory contains universal patterns proven effective in the TSV Ledger project.

## Core Protocols
- CodeOrganizationFramework.md - Project structure standards
- GitWorkflowPatterns.md - Version control best practices  
- DocumentationFramework.md - Knowledge capture standards

## Usage
Apply these protocols to ensure professional development standards and seamless knowledge transfer.
EOF
            ;;
        "CodeOrganizationFramework.md")
            cat > "$local_path" << 'EOF'
# Code Organization Framework

## Standard Directory Structure
```
project/
├── src/           # Core application logic
├── tests/         # Testing framework
├── docs/          # Documentation
├── data/          # Data files
├── public/        # Static assets
├── scripts/       # Automation scripts
└── BestPractices/ # Knowledge transfer protocols
```

## Implementation Guidelines
1. Separate concerns across directories
2. Use clear, descriptive naming
3. Maintain consistent structure
4. Document organization decisions
EOF
            ;;
        *)
            echo "# $filename" > "$local_path"
            echo "Protocol template - refer to Knowledge Transfer Protocol repository for complete implementation." >> "$local_path"
            ;;
    esac
    
    echo -e "${YELLOW}📄 Created fallback: $local_path${NC}"
}

# Function to create project-specific protocols
create_project_specific_protocols() {
    local project_type=$1
    
    cat > "BestPractices/ProjectSpecific/HANDOFF_GUIDE.md" << EOF
# Project Handoff Guide

**Project:** $(basename $(pwd))
**Type:** $project_type
**Created:** $(date +"%Y-%m-%d")
**Knowledge Transfer Protocol:** v1.0

## Project Overview
[Describe your project purpose and goals]

## Architecture & Design
[Document your technical architecture]

## Development Workflow
[Explain development processes and practices]

## Key Features
[List and explain main functionality]

## Deployment & Operations
[Document deployment and operational procedures]

## Knowledge Transfer Checklist
- [ ] Code organization follows protocols
- [ ] Documentation is complete
- [ ] Tests cover core functionality
- [ ] Git workflow is documented
- [ ] Handoff materials are ready

---
**This guide ensures seamless knowledge transfer to new team members.**
EOF

    cat > "BestPractices/ProjectSpecific/BusinessDomainKnowledge.md" << EOF
# Business Domain Knowledge

**Project:** $(basename $(pwd))
**Domain:** [Your business domain]
**Last Updated:** $(date +"%Y-%m-%d")

## Business Context
[Explain the business context and requirements]

## Domain Rules
[Document business rules and constraints]

## Key Stakeholders
[List important stakeholders and their roles]

## Success Metrics
[Define how success is measured]

## Compliance Requirements
[Note any regulatory or compliance needs]

---
**This knowledge ensures development aligns with business needs.**
EOF

    echo -e "${GREEN}✅ Project-specific protocols created${NC}"
}

# Function to setup package.json based on project type
setup_package_json() {
    local project_name=$1
    local project_type=$2
    
    echo -e "${BLUE}📦 Setting up package.json...${NC}"
    
    case "$project_type" in
        "web-app")
            cat > "package.json" << EOF
{
  "name": "$project_name",
  "version": "1.0.0",
  "description": "Web application built with Knowledge Transfer Protocols",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "node tests/test-runner.js",
    "test-quick": "node tests/quick-test.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "keywords": ["web-app", "knowledge-transfer-protocols"],
  "author": "",
  "license": "MIT"
}
EOF
            ;;
        "api")
            cat > "package.json" << EOF
{
  "name": "$project_name",
  "version": "1.0.0",
  "description": "REST API built with Knowledge Transfer Protocols",
  "main": "src/api.js",
  "scripts": {
    "start": "node src/api.js",
    "dev": "nodemon src/api.js",
    "test": "node tests/api-tests.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "keywords": ["api", "rest", "knowledge-transfer-protocols"],
  "author": "",
  "license": "MIT"
}
EOF
            ;;
        *)
            # Default package.json
            npm init -y > /dev/null
            ;;
    esac
    
    echo -e "${GREEN}✅ Package.json configured for $project_type${NC}"
}

# Function to create initial README
create_readme() {
    local project_name=$1
    local project_type=$2
    
    cat > "README.md" << EOF
# $project_name

**Type:** $project_type  
**Created:** $(date +"%Y-%m-%d")  
**Knowledge Transfer Protocol:** v1.0

## Overview
[Describe your project]

## Quick Start
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
\`\`\`

## Project Structure
Following Knowledge Transfer Protocol CodeOrganizationFramework.md:
\`\`\`
$project_name/
├── src/           # Core application logic
├── tests/         # Testing framework  
├── docs/          # Documentation
├── data/          # Data files
├── public/        # Static assets
├── scripts/       # Automation scripts
└── BestPractices/ # Knowledge transfer protocols
\`\`\`

## Documentation
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Handoff Guide](BestPractices/ProjectSpecific/HANDOFF_GUIDE.md)

## Development Standards
This project follows the Knowledge Transfer Protocol Evolution framework for:
- Professional code organization
- Comprehensive documentation
- Seamless knowledge transfer
- AI assistant integration

## Contributing
Follow the protocols in \`BestPractices/Generic/\` for all contributions.

---
**Built with Knowledge Transfer Protocol v1.0 - ensuring seamless knowledge transfer and professional development standards.**
EOF

    echo -e "${GREEN}✅ README.md created${NC}"
}

# Function to initialize git repository
setup_git() {
    echo -e "${BLUE}🔄 Setting up Git repository...${NC}"
    
    # Initialize git
    git init
    
    # Create .gitignore
    cat > ".gitignore" << EOF
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Data files (project-specific)
data/*.json
data/*.csv
!data/README.md
EOF

    # Initial commit following GitWorkflowPatterns.md
    git add .
    git commit -m "feat: initialize project with Knowledge Transfer Protocols v1.0

- Setup standard directory structure following CodeOrganizationFramework.md
- Configure package.json for $1 project type
- Add comprehensive documentation templates
- Initialize Knowledge Transfer Protocol guidelines"

    echo -e "${GREEN}✅ Git repository initialized with conventional commit${NC}"
}

# Main command handling
case "$1" in
    "init")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Project name required${NC}"
            show_help
        fi
        
        PROJECT_NAME="$2"
        PROJECT_TYPE="${3:-web-app}"
        
        echo -e "${BLUE}🚀 Initializing project: $PROJECT_NAME ($PROJECT_TYPE)${NC}"
        
        check_prerequisites
        create_project_structure "$PROJECT_NAME" "$PROJECT_TYPE"
        setup_protocols "$PROJECT_TYPE"
        setup_package_json "$PROJECT_NAME" "$PROJECT_TYPE"
        create_readme "$PROJECT_NAME" "$PROJECT_TYPE"
        setup_git "$PROJECT_TYPE"
        
        echo ""
        echo -e "${GREEN}🎉 Project '$PROJECT_NAME' initialized successfully!${NC}"
        echo -e "${YELLOW}📁 Location: $(pwd)/$PROJECT_NAME${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "  cd $PROJECT_NAME"
        echo "  npm install"
        echo "  npm run dev"
        echo ""
        echo -e "${BLUE}📚 Documentation:${NC}"
        echo "  - Review BestPractices/Generic/ for development standards"
        echo "  - Update BestPractices/ProjectSpecific/ with your domain knowledge"
        echo "  - Follow docs/DEVELOPMENT.md for workflow guidelines"
        ;;
        
    "validate")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Project directory required${NC}"
            show_help
        fi
        
        PROJECT_DIR="$2"
        echo -e "${BLUE}🔍 Validating project: $PROJECT_DIR${NC}"
        echo -e "${YELLOW}⚠️  Validation feature coming soon...${NC}"
        ;;
        
    "update")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Project directory required${NC}"
            show_help
        fi
        
        PROJECT_DIR="$2"
        echo -e "${BLUE}🔄 Updating protocols in: $PROJECT_DIR${NC}"
        echo -e "${YELLOW}⚠️  Update feature coming soon...${NC}"
        ;;
        
    "help"|"-h"|"--help"|"")
        show_help
        ;;
        
    *)
        echo -e "${RED}❌ Error: Unknown command '$1'${NC}"
        show_help
        ;;
esac
