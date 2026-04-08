#!/bin/bash

# ============================================================
# Multi-Brand GitHub Pages Deployment Script
# ============================================================
# This script prepares and deploys the virtual tour with
# support for multiple real estate developer brands
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${GREEN}Multi-Brand Tour Player Deployer${NC}                  ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}✗ Error: Not a git repository${NC}"
    exit 1
fi

# Get list of brands
BRANDS=()
if [ -d "_brands" ]; then
    for brand_dir in _brands/*/; do
        brand=$(basename "$brand_dir")
        BRANDS+=("$brand")
    done
fi

if [ ${#BRANDS[@]} -eq 0 ]; then
    echo -e "${RED}✗ Error: No brands found in _brands directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found ${#BRANDS[@]} brands:${NC}"
for brand in "${BRANDS[@]}"; do
    echo -e "  • ${YELLOW}$brand${NC}"
done
echo ""

# Ask for deployment method
echo -e "${BLUE}Select deployment method:${NC}"
echo "1) Query parameter (recommended for static hosting)"
echo "2) Subdirectory method (requires .htaccess or server config)"
echo "3) Single brand only"
read -p "Enter choice (1-3): " deploy_method

case $deploy_method in
    1)
        echo -e "\n${GREEN}✓ Query parameter method selected${NC}"
        echo "No file duplication needed!"
        echo ""
        echo "Usage:"
        for brand in "${BRANDS[@]}"; do
            echo "  https://username.github.io/repo/?brand=$brand"
        done
        ;;
    2)
        echo -e "\n${GREEN}✓ Subdirectory method selected${NC}"
        echo "Creating brand subdirectories..."
        
        for brand in "${BRANDS[@]}"; do
            echo -e "  • Creating ${YELLOW}$brand/${NC}..."
            
            # Create directory
            mkdir -p "$brand"
            
            # Copy core files
            cp index.html "$brand/" 2>/dev/null || echo -e "    ${RED}✗ Missing index.html${NC}"
            cp -r js "$brand/" 2>/dev/null || true
            cp -r css "$brand/" 2>/dev/null || true
            
            # Copy brand assets
            if [ -d "_brands/$brand" ]; then
                mkdir -p "$brand/_brands/$brand"
                cp _brands/$brand/* "$brand/_brands/$brand/" 2>/dev/null || true
            fi
            
            echo -e "    ${GREEN}✓ Done${NC}"
        done
        
        echo ""
        echo -e "${YELLOW}Note: You'll need server rewrites for clean URLs${NC}"
        echo "Add this to .htaccess:"
        echo ""
        echo "RewriteEngine On"
        
        # Build rewrite rule
        brand_pattern=$(IFS='|'; echo "${BRANDS[*]}")
        echo "RewriteRule ^($brand_pattern)/\$ /index.html [L]"
        ;;
    3)
        echo -e "\n${GREEN}✓ Single brand deployment${NC}"
        echo "Available brands:"
        for i in "${!BRANDS[@]}"; do
            echo "$((i+1))) ${BRANDS[$i]}"
        done
        
        read -p "Select brand (1-${#BRANDS[@]}): " brand_choice
        
        if [ "$brand_choice" -ge 1 ] && [ "$brand_choice" -le ${#BRANDS[@]} ]; then
            selected_brand="${BRANDS[$((brand_choice-1))]}"
            echo -e "\n${GREEN}✓ Selected: $selected_brand${NC}"
            echo ""
            echo "This will set $selected_brand as the default brand."
            echo "Copy _brands/$selected_brand/brand-config.json to root as default-config.json"
            
            if [ -f "_brands/$selected_brand/brand-config.json" ]; then
                cp "_brands/$selected_brand/brand-config.json" default-config.json
                echo -e "${GREEN}✓ Created default-config.json${NC}"
            fi
        else
            echo -e "${RED}✗ Invalid selection${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}✗ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""

# Ask if user wants to commit and push
read -p "Commit and push changes? (y/n): " push_changes

if [ "$push_changes" = "y" ] || [ "$push_changes" = "Y" ]; then
    echo ""
    echo -e "${BLUE}Committing changes...${NC}"
    
    # Stage files
    git add .
    
    # Show status
    git status --short
    
    echo ""
    read -p "Enter commit message: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update multi-brand deployment"
    fi
    
    git commit -m "$commit_msg"
    
    echo ""
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
        echo -e "${RED}✗ Push failed. Check your remote configuration.${NC}"
        exit 1
    }
    
    echo ""
    echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Go to GitHub → Settings → Pages"
    echo "2. Set source to 'main' branch"
    echo "3. Your site will be available at:"
    echo "   https://username.github.io/repository/"
    echo ""
    
    # Show test URLs
    echo -e "${BLUE}Test URLs:${NC}"
    if [ "$deploy_method" = "3" ] && [ -n "$selected_brand" ]; then
        echo "  Main: https://username.github.io/repository/"
        echo "  Brand switcher: https://username.github.io/repository/brand-switcher.html"
    else
        for brand in "${BRANDS[@]}"; do
            echo "  $brand: https://username.github.io/repository/?brand=$brand"
        done
    fi
    echo "  Brand switcher: https://username.github.io/repository/brand-switcher.html"
else
    echo ""
    echo -e "${YELLOW}Changes not committed. To deploy later:${NC}"
    echo "  git add ."
    echo "  git commit -m 'Deploy multi-brand tour player'"
    echo "  git push origin main"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BLUE}Deployment Complete! 🎉${NC}                              ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  • See BRAND-GUIDE.md for detailed instructions"
echo "  • Test brands using brand-switcher.html"
echo ""
