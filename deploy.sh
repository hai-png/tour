#!/bin/bash
# =============================================================================
# HAI PNG Virtual Tour - Deployment Script
# =============================================================================
# Usage: ./deploy.sh [environment]
# Environments: staging, production
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="hai-tour"
BUILD_DIR="dist"
VERSION=$(date +%Y%m%d-%H%M%S)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
check_directory() {
    if [ ! -f "index.html" ] || [ ! -f "manifest.json" ] || [ ! -f "sw.js" ]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Parse arguments
ENVIRONMENT="${1:-staging}"

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "Invalid environment. Use 'staging' or 'production'"
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

log_info "Starting deployment to ${ENVIRONMENT} environment..."
log_info "Version: ${VERSION}"

# Step 1: Clean build directory
log_info "Cleaning build directory..."
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}

# Step 2: Copy project files
log_info "Copying project files..."
cp -r index.html manifest.json sw.js offline.html css/ js/ media/ floor-plan/ gallery/ ${BUILD_DIR}/

# Step 3: Copy deployment configs
log_info "Copying deployment configurations..."
cp .htaccess nginx.conf ${BUILD_DIR}/ 2>/dev/null || true

# Step 4: Validate files
log_info "Validating deployment files..."

# Check required files
REQUIRED_FILES=(
    "index.html"
    "manifest.json"
    "sw.js"
    "offline.html"
    "css/styles.css"
    "css/ui-components.css"
    "js/main.js"
    "js/PanoramaViewer.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "${BUILD_DIR}/${file}" ]; then
        log_error "Missing required file: ${file}"
        exit 1
    fi
done

# Step 5: Update service worker version
log_info "Updating service worker version..."
sed -i.bak "s/const CACHE_VERSION = 'v[0-9]*'/const CACHE_VERSION = '${VERSION}'/" ${BUILD_DIR}/sw.js
rm -f ${BUILD_DIR}/sw.js.bak

# Step 6: Add version meta to HTML
log_info "Adding version meta tag to HTML..."
sed -i.bak "s/<title>/<meta name=\"version\" content=\"${VERSION}\" \/><title>/" ${BUILD_DIR}/index.html
rm -f ${BUILD_DIR}/index.html.bak

# Step 7: Create deployment manifest
log_info "Creating deployment manifest..."
cat > ${BUILD_DIR}/deployment.json << EOF
{
  "version": "${VERSION}",
  "environment": "${ENVIRONMENT}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": {
    "html": ["index.html", "offline.html"],
    "css": ["styles.css", "ui-components.css"],
    "js": ["main.js", "PanoramaViewer.js", "UIManager.js", "HotspotManager.js", "FloorPlanManager.js", "GuidedTourManager.js", "LocationManager.js", "TranslationManager.js", "GalleryManager.js", "AudioManager.js", "CaptureViewManager.js", "PWAManager.js", "VRModeManager.js"],
    "config": ["manifest.json", "sw.js"]
  }
}
EOF

# Step 8: Generate file list with checksums
log_info "Generating file checksums..."
find ${BUILD_DIR} -type f -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" | sort | while read file; do
    if [[ "$file" != *"deployment.json"* ]]; then
        md5sum "$file" >> ${BUILD_DIR}/checksums.txt
    fi
done

# Step 9: Create deployment package (optional)
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Creating production deployment package..."
    PACKAGE_NAME="${PROJECT_NAME}-${VERSION}.tar.gz"
    tar -czf ${PACKAGE_NAME} -C ${BUILD_DIR} .
    log_success "Package created: ${PACKAGE_NAME}"
fi

# Step 10: Run tests (if available)
if [ -f "test.sh" ]; then
    log_info "Running tests..."
    ./test.sh
fi

# Step 11: Deployment summary
echo ""
log_success "Deployment preparation complete!"
echo ""
echo "============================================================================="
echo "Deployment Summary"
echo "============================================================================="
echo "Environment:     ${ENVIRONMENT}"
echo "Version:         ${VERSION}"
echo "Build Directory: ${BUILD_DIR}/"
echo "Total Files:     $(find ${BUILD_DIR} -type f | wc -l | tr -d ' ')"
echo "Total Size:      $(du -sh ${BUILD_DIR} | cut -f1)"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Next Steps:"
    echo "  1. Upload ${BUILD_DIR}/ contents to your production server"
    echo "  2. Ensure .htaccess or nginx.conf is properly configured"
    echo "  3. Clear CDN cache if applicable"
    echo "  4. Test the deployment thoroughly"
    echo ""
else
    echo "Next Steps:"
    echo "  1. Upload ${BUILD_DIR}/ contents to your staging server"
    echo "  2. Test the deployment"
    echo "  3. Run './deploy.sh production' when ready"
    echo ""
fi

# Step 12: Optional - Deploy via FTP/SFTP
read -p "Do you want to deploy via FTP/SFTP now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter FTP/SFTP host: " FTP_HOST
    read -p "Enter FTP/SFTP user: " FTP_USER
    read -p "Enter remote directory: " FTP_DIR
    
    if command -v lftp &> /dev/null; then
        log_info "Deploying via lftp..."
        lftp -c "set ftp:ssl-allow no; open -u ${FTP_USER} ${FTP_HOST}; cd ${FTP_DIR}; mirror -R ${BUILD_DIR}/ .; quit"
        log_success "FTP deployment complete!"
    elif command -v scp &> /dev/null; then
        log_info "Deploying via scp..."
        scp -r ${BUILD_DIR}/* ${FTP_USER}@${FTP_HOST}:${FTP_DIR}/
        log_success "SCP deployment complete!"
    else
        log_warning "No FTP/SFTP client found. Please upload manually."
    fi
fi

log_success "Deployment script finished!"
