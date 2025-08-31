#!/bin/bash

# MyLife Cinema API Keys Setup Script
# This script helps you set up all required API keys

echo "🎬 MyLife Cinema - API Keys Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for API key
prompt_for_key() {
    local service=$1
    local var_name=$2
    local description=$3
    local example=$4
    local required=$5
    
    echo -e "${BLUE}🔑 Setting up $service${NC}"
    echo -e "${YELLOW}Description:${NC} $description"
    echo -e "${YELLOW}Example format:${NC} $example"
    echo ""
    
    if [ "$required" = "true" ]; then
        echo -e "${RED}[REQUIRED]${NC} This key is required for core functionality"
    else
        echo -e "${YELLOW}[OPTIONAL]${NC} This key is optional but recommended"
    fi
    
    read -p "Enter your $service API key (press Enter to skip): " key_value
    
    if [ -n "$key_value" ]; then
        # Update the .env file
        if grep -q "^$var_name=" .env; then
            # Key exists, replace it
            sed -i.bak "s/^$var_name=.*/$var_name=$key_value/" .env && rm .env.bak
        else
            # Key doesn't exist, add it
            echo "$var_name=$key_value" >> .env
        fi
        echo -e "${GREEN}✅ $service key set successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped $service key${NC}"
    fi
    echo ""
}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
fi

echo "Let's set up your API keys step by step:"
echo ""

# 1. OpenAI (Required)
prompt_for_key "OpenAI" "OPENAI_API_KEY" "GPT-4 for story analysis and script generation" "sk-1234567890abcdef..." "true"

# 2. Runway ML (Required)  
prompt_for_key "Runway ML" "RUNWAY_API_KEY" "Primary AI video generation service" "rw_1234567890abcdef..." "true"

# 3. ElevenLabs (Required)
prompt_for_key "ElevenLabs" "ELEVENLABS_API_KEY" "AI voice synthesis for narration" "sk_1234567890abcdef..." "true"

# 4. AWS S3 (Required for file storage)
echo -e "${BLUE}🗄️  Setting up AWS S3 for file storage${NC}"
echo -e "${RED}[REQUIRED]${NC} S3 is needed to store generated videos"
echo ""
read -p "Enter your AWS Access Key ID: " aws_access_key
read -p "Enter your AWS Secret Access Key: " aws_secret_key
read -p "Enter your S3 bucket name (or press Enter for default): " s3_bucket

if [ -n "$aws_access_key" ] && [ -n "$aws_secret_key" ]; then
    sed -i.bak "s/^AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$aws_access_key/" .env && rm .env.bak
    sed -i.bak "s/^AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=$aws_secret_key/" .env && rm .env.bak
    
    if [ -n "$s3_bucket" ]; then
        sed -i.bak "s/^S3_BUCKET=.*/S3_BUCKET=$s3_bucket/" .env && rm .env.bak
    fi
    
    echo -e "${GREEN}✅ AWS S3 configured${NC}"
else
    echo -e "${YELLOW}⚠️  AWS S3 not configured - you'll need to set this up later${NC}"
fi
echo ""

# 5. Stripe (Required for payments)
echo -e "${BLUE}💳 Setting up Stripe for payments${NC}"
echo -e "${RED}[REQUIRED]${NC} Needed for subscription management"
echo ""
read -p "Enter your Stripe Secret Key (sk_test_...): " stripe_secret
read -p "Enter your Stripe Publishable Key (pk_test_...): " stripe_public

if [ -n "$stripe_secret" ] && [ -n "$stripe_public" ]; then
    sed -i.bak "s/^STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=$stripe_secret/" .env && rm .env.bak
    sed -i.bak "s/^STRIPE_PUBLISHABLE_KEY=.*/STRIPE_PUBLISHABLE_KEY=$stripe_public/" .env && rm .env.bak
    echo -e "${GREEN}✅ Stripe configured${NC}"
else
    echo -e "${YELLOW}⚠️  Stripe not configured${NC}"
fi
echo ""

# 6. Optional services
echo -e "${BLUE}🔧 Optional Services Setup${NC}"
echo "The following services are optional but enhance the experience:"
echo ""

# Pika Labs (Optional backup video service)
prompt_for_key "Pika Labs" "PIKA_API_KEY" "Backup AI video generation service" "pk_1234567890abcdef..." "false"

# Stable Video (Optional backup)
prompt_for_key "Stable Video" "STABLE_VIDEO_API_KEY" "Alternative AI video generation" "sv_1234567890abcdef..." "false"

# Mubert (Optional music)
prompt_for_key "Mubert" "MUBERT_PAT" "AI background music generation" "mubert_pat_token..." "false"

# Supabase Database (Optional - can use local PostgreSQL)
echo -e "${BLUE}🗃️  Database Setup${NC}"
echo "You can use either Supabase (hosted) or local PostgreSQL"
echo ""
read -p "Do you want to use Supabase? (y/n): " use_supabase

if [ "$use_supabase" = "y" ] || [ "$use_supabase" = "Y" ]; then
    read -p "Enter your Supabase URL: " supabase_url
    read -p "Enter your Supabase Anon Key: " supabase_anon_key
    
    if [ -n "$supabase_url" ] && [ -n "$supabase_anon_key" ]; then
        sed -i.bak "s|^SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" .env && rm .env.bak
        sed -i.bak "s/^SUPABASE_ANON_KEY=.*/SUPABASE_ANON_KEY=$supabase_anon_key/" .env && rm .env.bak
        echo -e "${GREEN}✅ Supabase configured${NC}"
    fi
else
    echo -e "${YELLOW}📝 Using local PostgreSQL (will be started with Docker)${NC}"
fi
echo ""

# Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}✅ Your .env file has been configured${NC}"
echo ""
echo "Next steps:"
echo "1. Review your .env file: nano .env"
echo "2. Start the services: docker-compose up -d"
echo "3. Check the logs: docker-compose logs -f"
echo "4. Access the app: http://localhost:3000"
echo ""

# Verify critical keys
echo "🔍 Verification:"
missing_keys=()

if ! grep -q "^OPENAI_API_KEY=sk-" .env; then
    missing_keys+=("OpenAI")
fi

if ! grep -q "^AWS_ACCESS_KEY_ID=.\+" .env; then
    missing_keys+=("AWS S3")
fi

if ! grep -q "^STRIPE_SECRET_KEY=sk_" .env; then
    missing_keys+=("Stripe")
fi

if [ ${#missing_keys[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All critical API keys are configured!${NC}"
    echo ""
    echo "🚀 Ready to launch MyLife Cinema!"
    echo "Run: docker-compose up -d"
else
    echo -e "${RED}⚠️  Missing critical keys: ${missing_keys[*]}${NC}"
    echo "Please add these keys to your .env file before starting the services."
fi

echo ""
echo "📚 Need help getting API keys? Check out our setup guide:"
echo "https://github.com/mylife-cinema/mylife-cinema/wiki/API-Keys-Setup"