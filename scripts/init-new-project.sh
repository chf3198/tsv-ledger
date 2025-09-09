#!/bin/bash
# init-new-project.sh - Initialize new project with Knowledge Transfer Protocols
# Usage: ./init-new-project.sh <project-name> <project-type> [domain]

set -e

PROJECT_NAME="$1"
PROJECT_TYPE="$2"
PROJECT_DOMAIN="${3:-General}"

if [ -z "$PROJECT_NAME" ] || [ -z "$PROJECT_TYPE" ]; then
    echo "Usage: $0 <project-name> <project-type> [domain]"
    echo ""
    echo "Project Types:"
    echo "  business-intelligence    - BI platforms, analytics, data processing"
    echo "  nodejs-express          - Node.js web applications and APIs"
    echo "  react-webapp            - React frontend applications"
    echo "  python-datascience      - Python ML/Data Science projects"
    echo "  general                 - Generic project setup"
    echo ""
    echo "Examples:"
    echo "  $0 property-booking nodejs-express hospitality"
    echo "  $0 sales-analytics business-intelligence retail"
    echo "  $0 customer-portal react-webapp e-commerce"
    exit 1
fi

PROTOCOLS_REPO="./KnowledgeTransferProtocols"

echo "🚀 Initializing $PROJECT_NAME with Knowledge Transfer Protocols"
echo "================================================================"
echo "Project Name: $PROJECT_NAME"
echo "Project Type: $PROJECT_TYPE"
echo "Domain: $PROJECT_DOMAIN"
echo ""

# Check if protocol repository exists
PROTOCOL_REPO="/mnt/chromeos/removable/Drive/repos/KnowledgeTransferProtocols"
if [ ! -d "$PROTOCOL_REPO" ]; then
    echo "❌ Protocol repository not found at $PROTOCOL_REPO"
    echo "Please ensure KnowledgeTransferProtocols repository is available"
    echo ""
    exit 1
fi

# Get latest protocol version
cd "$PROTOCOL_REPO"
LATEST_VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
echo "📍 Using protocol version: $LATEST_VERSION"
cd - > /dev/null

# Create project directory structure
echo "📁 Creating project directory structure..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create standard directory structure
mkdir -p {src,tests,docs,data,utils,demos,servers,scripts}
mkdir -p BestPractices/{Generic,ProjectSpecific}

echo "✅ Created standard directory structure"

# Copy Generic protocols
echo "📋 Installing Generic protocols..."
cp -r "$PROTOCOL_REPO/Core/v$LATEST_VERSION/Generic"/* BestPractices/Generic/ 2>/dev/null || {
    # Fallback to latest available version
    LATEST_GENERIC=$(find "$PROTOCOL_REPO/Core" -name "Generic" -type d | sort -V | tail -1)
    cp -r "$LATEST_GENERIC"/* BestPractices/Generic/
}

# Copy project type template
echo "📄 Installing project template..."
case "$PROJECT_TYPE" in
    "business-intelligence")
        if [ -f "$PROTOCOL_REPO/Core/v$LATEST_VERSION/Templates/BusinessIntelligenceTemplate.md" ]; then
            cp "$PROTOCOL_REPO/Core/v$LATEST_VERSION/Templates/BusinessIntelligenceTemplate.md" BestPractices/ProjectSpecific/ProjectTemplate.md
        fi
        ;;
    "nodejs-express")
        if [ -f "$PROTOCOL_REPO/Core/v$LATEST_VERSION/Templates/NodeJSExpressTemplate.md" ]; then
            cp "$PROTOCOL_REPO/Core/v$LATEST_VERSION/Templates/NodeJSExpressTemplate.md" BestPractices/ProjectSpecific/ProjectTemplate.md
        fi
        ;;
    *)
        echo "⚠️  Template for $PROJECT_TYPE not found, using generic template"
        ;;
esac

# Create protocol tracking files
echo "$LATEST_VERSION" > BestPractices/.protocol-version
echo "$PROJECT_NAME" > BestPractices/.source-project
echo "# $PROJECT_NAME Protocol Customizations" > BestPractices/.customizations

# Create basic project files
echo "📝 Creating basic project files..."

# Create package.json for Node.js projects
if [[ "$PROJECT_TYPE" == *"nodejs"* ]] || [[ "$PROJECT_TYPE" == *"express"* ]]; then
    cat > package.json << EOF
{
  "name": "$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')",
  "version": "1.0.0",
  "description": "$PROJECT_NAME - A project using Knowledge Transfer Protocols v$LATEST_VERSION",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ tests/",
    "format": "prettier --write src/ tests/",
    "validate-protocols": "./scripts/validate-protocols.sh",
    "sync-protocols": "./scripts/sync-protocols.sh"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "nodemon": "^3.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "keywords": ["knowledge-transfer-protocols", "$PROJECT_DOMAIN", "$PROJECT_TYPE"],
  "author": "$(git config user.name || echo 'Your Name')",
  "license": "MIT"
}
EOF
fi

# Create README.md
cat > README.md << EOF
# $PROJECT_NAME

> A $PROJECT_TYPE project using Knowledge Transfer Protocols v$LATEST_VERSION

## Overview

$PROJECT_NAME is a $PROJECT_DOMAIN-focused $PROJECT_TYPE project built using the Knowledge Transfer Protocols framework. This ensures consistent code organization, comprehensive documentation, and seamless knowledge transfer.

## Quick Start

\`\`\`bash
# Install dependencies (for Node.js projects)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Validate protocols
npm run validate-protocols
\`\`\`

## Project Structure

\`\`\`
$PROJECT_NAME/
├── src/                    # Core business logic
├── tests/                  # Test suites
├── docs/                   # Documentation
├── data/                   # Data files and schemas
├── utils/                  # Utility functions
├── demos/                  # Demo and example code
├── servers/                # Server configurations
├── scripts/                # Automation scripts
├── BestPractices/          # Knowledge transfer protocols
│   ├── Generic/           # Framework-agnostic patterns
│   └── ProjectSpecific/   # Project-specific documentation
└── README.md
\`\`\`

## Knowledge Transfer Protocols

This project implements the Knowledge Transfer Protocols v$LATEST_VERSION, ensuring:

- ✅ **Professional Organization**: Clean, scalable directory structure
- ✅ **Comprehensive Documentation**: Business and technical knowledge capture
- ✅ **Seamless Handoffs**: <2 days onboarding time
- ✅ **Quality Assurance**: Automated validation and testing
- ✅ **Continuous Improvement**: Protocol evolution and updates

## Development

### Getting Started
1. Review \`BestPractices/ProjectSpecific/ProjectTemplate.md\`
2. Customize templates for your specific domain
3. Implement core functionality in \`src/\`
4. Add tests in \`tests/\`
5. Document business logic and architecture

### Protocol Management
- **Sync Updates**: \`npm run sync-protocols\` - Get latest protocol improvements
- **Validate Implementation**: \`npm run validate-protocols\` - Check compliance
- **Contribute Back**: Submit improvements to the protocol repository

## Documentation

- **Business Domain**: \`BestPractices/ProjectSpecific/BusinessDomainKnowledge.md\`
- **Technical Architecture**: \`BestPractices/ProjectSpecific/TechnicalArchitecture.md\`
- **API Documentation**: \`BestPractices/ProjectSpecific/API_DOCUMENTATION.md\`
- **Handoff Guide**: \`BestPractices/ProjectSpecific/HANDOFF_GUIDE.md\`

## Contributing

This project follows the Knowledge Transfer Protocols framework. Please:

1. Follow established patterns and conventions
2. Update documentation with any changes
3. Run validation before committing
4. Consider contributing improvements to the protocol repository

## License

MIT - See LICENSE file for details

---

**Built with Knowledge Transfer Protocols v$LATEST_VERSION - Ensuring excellence through standardization**
EOF

# Create basic documentation templates
echo "📚 Creating documentation templates..."

cat > BestPractices/ProjectSpecific/BusinessDomainKnowledge.md << EOF
# $PROJECT_NAME - Business Domain Knowledge

## Business Context

### Company/Organization Overview
- **Industry**: $PROJECT_DOMAIN
- **Business Model**: [Describe how the business generates value]
- **Key Markets**: [Geographic or demographic focus]
- **Competitive Advantages**: [What sets this apart]

### Project Purpose
- **Primary Goals**: [What this project aims to achieve]
- **Success Metrics**: [How success will be measured]
- **Stakeholders**: [Who will use and benefit from this]

## Domain-Specific Knowledge

### Industry Terminology
- [Add relevant terms and definitions]

### Business Rules
- [Document key business logic and constraints]

### Workflows
- [Describe important business processes]

### Decision-Making Criteria
- [How business decisions are made]

## Performance Metrics

### Key Performance Indicators (KPIs)
- [List important metrics to track]

### Success Criteria
- [Define what constitutes success]

### Monitoring and Reporting
- [How performance will be tracked]

---

*This document captures the essential business knowledge for $PROJECT_NAME. Update as the business context evolves.*
EOF

cat > BestPractices/ProjectSpecific/TechnicalArchitecture.md << EOF
# $PROJECT_NAME - Technical Architecture

## System Overview

### Technology Stack
- **Project Type**: $PROJECT_TYPE
- **Primary Technologies**: [List main technologies]
- **Dependencies**: [Key libraries and frameworks]
- **Development Tools**: [Build tools, testing frameworks, etc.]

### Architecture Pattern
- [Describe the overall architectural approach]

## System Components

### Core Components
- [List and describe main system components]

### Data Layer
- [Database design, data models, storage strategy]

### Business Logic
- [Core business logic implementation]

### API Layer
- [API design, endpoints, authentication]

### User Interface
- [Frontend architecture, user experience design]

## Development Environment

### Local Setup
1. [Step-by-step setup instructions]
2. [Dependencies and prerequisites]
3. [Configuration requirements]

### Testing Strategy
- **Unit Tests**: [Approach and tools]
- **Integration Tests**: [Testing strategy]
- **Coverage Requirements**: [Minimum coverage expectations]

## Deployment and Operations

### Deployment Strategy
- [How the application is deployed]

### Monitoring and Logging
- [Performance monitoring, error tracking]

### Security Considerations
- [Security measures and best practices]

---

*This document provides technical implementation details for $PROJECT_NAME. Keep updated with architectural changes.*
EOF

# Initialize Git repository
echo "🔄 Initializing Git repository..."
git init
git add .
git commit -m "feat: initialize $PROJECT_NAME with Knowledge Transfer Protocols v$LATEST_VERSION

- Created standard directory structure following protocols
- Installed Generic protocols v$LATEST_VERSION
- Added $PROJECT_TYPE project template
- Created basic documentation templates
- Configured protocol tracking and synchronization

Project Details:
- Name: $PROJECT_NAME
- Type: $PROJECT_TYPE  
- Domain: $PROJECT_DOMAIN
- Protocol Version: v$LATEST_VERSION

Ready for development with standardized patterns and documentation."

# Create protocol registry entry
echo "📋 Creating protocol registry entry..."
cd "$PROTOCOL_REPO"

cat > Registry/Projects/$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').yml << EOF
# $PROJECT_NAME - Knowledge Transfer Protocol Registry Entry
# Initialized: $(date +%Y-%m-%d)
# Status: Active Development

project:
  name: "$PROJECT_NAME"
  type: "$PROJECT_TYPE"
  domain: "$PROJECT_DOMAIN"
  protocol_version: "$LATEST_VERSION"
  established: "$(date +%Y-%m-%d)"
  repository: "$(pwd)/../$PROJECT_NAME"
  
protocol_usage:
  code_organization: "$LATEST_VERSION"
  documentation: "$LATEST_VERSION"
  git_workflow: "$LATEST_VERSION"
  knowledge_transfer: "$LATEST_VERSION"
  
initialization_status:
  directory_structure: "Complete"
  generic_protocols: "Installed"
  project_template: "$([ -f "../$PROJECT_NAME/BestPractices/ProjectSpecific/ProjectTemplate.md" ] && echo 'Installed' || echo 'Manual setup required')"
  documentation_templates: "Created"
  git_repository: "Initialized"
  
next_steps:
  - "Customize business domain knowledge"
  - "Implement core functionality"
  - "Add comprehensive tests"
  - "Complete technical architecture documentation"
  - "Run protocol validation"
  
contact_info:
  primary_maintainer: "$(git config user.name || echo 'TBD')"
  last_updated: "$(date +%Y-%m-%d)"

validation:
  protocol_completeness: false  # Will be true after validation passes
  documentation_quality: "Initial"
  framework_usability: "Setup"
  ready_for_development: true
EOF

git add Registry/Projects/
git commit -m "feat: register $PROJECT_NAME in protocol registry

- Added project registry entry for tracking
- Recorded initialization status and protocol version
- Set up for protocol evolution participation

Project ready for development and protocol contributions."

cd - > /dev/null

echo ""
echo "🎉 Project Initialization Complete!"
echo "=================================="
echo "Project: $PROJECT_NAME"
echo "Location: $(pwd)"
echo "Protocol Version: v$LATEST_VERSION"
echo ""
echo "📋 Next Steps:"
echo "1. Customize BestPractices/ProjectSpecific/BusinessDomainKnowledge.md"
echo "2. Update BestPractices/ProjectSpecific/TechnicalArchitecture.md"
echo "3. Implement core functionality in src/"
echo "4. Add tests in tests/"
echo "5. Run 'npm run validate-protocols' (for Node.js projects)"
echo ""
echo "📚 Key Files:"
echo "• README.md - Project overview and quick start"
echo "• BestPractices/ - Knowledge transfer protocols"
echo "• package.json - Project configuration (Node.js projects)"
echo ""
echo "🔄 Protocol Management:"
echo "• Sync updates: ./scripts/sync-protocols.sh"
echo "• Validate: ./scripts/validate-protocols.sh"
echo "• Registry: Automatically registered in protocol repository"
echo ""
echo "✨ Your project is ready for excellence through standardized patterns!"
