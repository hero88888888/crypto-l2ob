#!/bin/bash

# L2 Orderbook Analyzer - Complete Setup Script
# This script automates the entire setup process

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
 _     ____    ___           _           _                 _    
| |   |___ \  / _ \ _ __ ___| | ___ _ __| |__   ___   ___ | | __
| |     __) || | | | '__/ _ | |/ _ | '__| '_ \ / _ \ / _ \| |/ /
| |___ / __/ | |_| | | |  __| |  __| |  | |_) | (_) | (_) |   < 
|_____|_____| \___/|_|  \___|_|\___|_|  |_.__/ \___/ \___/|_|\_\
                                                                 
            Analyzer - Professional Setup Script v1.0
EOF
echo -e "${NC}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing system dependencies..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y curl git python3 python3-pip python3-venv nodejs npm postgresql redis-server nginx
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command_exists brew; then
            print_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install python@3.11 node redis postgresql nginx
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
    
    print_success "System dependencies installed"
}

# Function to setup Python environment
setup_python() {
    print_info "Setting up Python environment..."
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    if [ -f "python_server/requirements.txt" ]; then
        pip install -r python_server/requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "Python requirements.txt not found"
    fi
    
    # Install additional monitoring tools
    pip install sentry-sdk[flask] ddtrace newrelic
}

# Function to setup Node.js environment
setup_node() {
    print_info "Setting up Node.js environment..."
    
    # Install backend dependencies
    npm install
    
    # Install frontend dependencies
    cd client
    npm install
    cd ..
    
    print_success "Node.js dependencies installed"
}

# Function to setup database
setup_database() {
    print_info "Setting up database..."
    
    echo "Choose your database option:"
    echo "1) Supabase (Recommended - Cloud hosted)"
    echo "2) Local PostgreSQL"
    echo "3) MongoDB Atlas"
    echo "4) Skip database setup"
    
    read -p "Enter choice [1-4]: " db_choice
    
    case $db_choice in
        1)
            print_info "Setting up Supabase..."
            echo "1. Go to https://supabase.com and create an account"
            echo "2. Create a new project named 'crypto-l2ob'"
            echo "3. Copy your API keys from Settings > API"
            read -p "Press Enter when ready..."
            
            read -p "Enter Supabase URL: " supabase_url
            read -p "Enter Supabase Anon Key: " supabase_anon_key
            read -p "Enter Supabase Service Key: " supabase_service_key
            
            # Update .env file
            echo "SUPABASE_URL=$supabase_url" >> .env
            echo "REACT_APP_SUPABASE_URL=$supabase_url" >> .env
            echo "REACT_APP_SUPABASE_ANON_KEY=$supabase_anon_key" >> .env
            echo "SUPABASE_SERVICE_KEY=$supabase_service_key" >> .env
            
            print_success "Supabase configured"
            ;;
        2)
            print_info "Setting up local PostgreSQL..."
            
            # Start PostgreSQL
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                brew services start postgresql
            fi
            
            # Create database
            createdb l2orderbook 2>/dev/null || true
            
            echo "DATABASE_URL=postgresql://localhost:5432/l2orderbook" >> .env
            
            print_success "Local PostgreSQL configured"
            ;;
        3)
            print_info "Setting up MongoDB Atlas..."
            echo "1. Go to https://www.mongodb.com/cloud/atlas"
            echo "2. Create a free cluster"
            echo "3. Get your connection string"
            read -p "Enter MongoDB connection string: " mongodb_uri
            
            echo "MONGODB_URI=$mongodb_uri" >> .env
            
            print_success "MongoDB Atlas configured"
            ;;
        4)
            print_warning "Skipping database setup"
            ;;
    esac
}

# Function to setup monitoring
setup_monitoring() {
    print_info "Setting up monitoring services..."
    
    echo "Setting up free monitoring with GitHub Student Pack:"
    echo ""
    
    # Sentry
    echo "📊 Sentry (Error Tracking):"
    echo "1. Go to https://sentry.io/for/students/"
    echo "2. Sign up with GitHub Student account"
    echo "3. Create a new project"
    read -p "Enter Sentry DSN (or press Enter to skip): " sentry_dsn
    if [ ! -z "$sentry_dsn" ]; then
        echo "SENTRY_DSN=$sentry_dsn" >> .env
        echo "REACT_APP_SENTRY_DSN=$sentry_dsn" >> .env
    fi
    
    echo ""
    # Datadog
    echo "📈 Datadog (Infrastructure Monitoring):"
    echo "1. Go to https://www.datadoghq.com/students/"
    echo "2. Sign up with GitHub Student account"
    read -p "Enter Datadog API Key (or press Enter to skip): " dd_api_key
    if [ ! -z "$dd_api_key" ]; then
        echo "DD_API_KEY=$dd_api_key" >> .env
    fi
    
    echo ""
    # New Relic
    echo "🎯 New Relic (Performance Monitoring):"
    echo "1. Go to https://newrelic.com/students"
    echo "2. Sign up with GitHub Student account"
    read -p "Enter New Relic License Key (or press Enter to skip): " new_relic_key
    if [ ! -z "$new_relic_key" ]; then
        echo "NEW_RELIC_LICENSE_KEY=$new_relic_key" >> .env
    fi
}

# Function to setup deployment
setup_deployment() {
    print_info "Setting up deployment..."
    
    echo "Choose deployment option:"
    echo "1) DigitalOcean (Recommended - $200 free credits)"
    echo "2) Heroku ($13/month free for 24 months)"
    echo "3) Netlify + Railway"
    echo "4) Docker (Local)"
    echo "5) Skip deployment setup"
    
    read -p "Enter choice [1-5]: " deploy_choice
    
    case $deploy_choice in
        1)
            print_info "Setting up DigitalOcean..."
            echo "1. Go to https://www.digitalocean.com/github-students"
            echo "2. Sign up with GitHub Student account"
            echo "3. Create an API token"
            read -p "Enter DigitalOcean Access Token: " do_token
            echo "DIGITALOCEAN_ACCESS_TOKEN=$do_token" >> .env
            
            # Install doctl
            if ! command_exists doctl; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    brew install doctl
                else
                    snap install doctl || wget https://github.com/digitalocean/doctl/releases/download/v1.92.0/doctl-1.92.0-linux-amd64.tar.gz
                fi
            fi
            
            print_success "DigitalOcean configured"
            ;;
        2)
            print_info "Setting up Heroku..."
            
            # Install Heroku CLI
            if ! command_exists heroku; then
                curl https://cli-assets.heroku.com/install.sh | sh
            fi
            
            heroku login
            heroku create l2-orderbook-backend
            heroku create l2-orderbook-frontend
            
            print_success "Heroku configured"
            ;;
        3)
            print_info "Setting up Netlify + Railway..."
            
            # Install Netlify CLI
            npm install -g netlify-cli
            
            echo "1. Go to https://railway.app"
            echo "2. Connect your GitHub repository"
            echo "3. Deploy the backend"
            
            print_success "Netlify + Railway configured"
            ;;
        4)
            print_info "Setting up Docker..."
            
            # Check if Docker is installed
            if ! command_exists docker; then
                print_error "Docker is not installed. Please install Docker Desktop first."
                exit 1
            fi
            
            # Build and run with Docker Compose
            docker-compose up -d
            
            print_success "Docker containers started"
            ;;
        5)
            print_warning "Skipping deployment setup"
            ;;
    esac
}

# Function to setup GitHub Actions
setup_github_actions() {
    print_info "Setting up GitHub Actions..."
    
    # Create .github/workflows directory if it doesn't exist
    mkdir -p .github/workflows
    
    # Check if CI/CD workflow exists
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        print_success "GitHub Actions workflow already exists"
    else
        print_warning "GitHub Actions workflow not found"
    fi
    
    # Set up secrets
    echo ""
    echo "Add these secrets to your GitHub repository:"
    echo "Settings > Secrets and variables > Actions > New repository secret"
    echo ""
    echo "Required secrets:"
    echo "- CODECOV_TOKEN"
    echo "- SENTRY_AUTH_TOKEN"
    echo "- DIGITALOCEAN_ACCESS_TOKEN (or HEROKU_API_KEY)"
    echo "- NETLIFY_AUTH_TOKEN"
    echo "- SLACK_WEBHOOK (optional)"
    echo ""
    read -p "Press Enter when secrets are added..."
}

# Function to generate app icons
generate_icons() {
    print_info "Generating app icons..."
    
    if [ -f "generate_icons.py" ]; then
        python3 generate_icons.py
        print_success "App icons generated"
    else
        print_warning "Icon generator script not found"
    fi
}

# Function to run tests
run_tests() {
    print_info "Running tests..."
    
    # Python tests
    cd python_server
    pytest tests/ --cov=. --cov-report=html || true
    cd ..
    
    # Frontend tests
    cd client
    npm test -- --coverage --watchAll=false || true
    cd ..
    
    print_success "Tests completed"
}

# Function to start the application
start_application() {
    print_info "Starting the application..."
    
    echo "Choose start method:"
    echo "1) Development mode"
    echo "2) Production mode (Docker)"
    echo "3) Skip starting"
    
    read -p "Enter choice [1-3]: " start_choice
    
    case $start_choice in
        1)
            # Start in development mode
            ./start_python.sh &
            print_success "Application started in development mode"
            echo "Frontend: http://localhost:3000"
            echo "Backend: http://localhost:3001"
            ;;
        2)
            # Start with Docker
            docker-compose up -d
            print_success "Application started with Docker"
            echo "Application: http://localhost"
            ;;
        3)
            print_info "Start manually with: ./start_python.sh"
            ;;
    esac
}

# Main setup flow
main() {
    print_info "Starting L2 Orderbook Analyzer setup..."
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists git; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    if ! command_exists node; then
        print_warning "Node.js is not installed"
        install_dependencies
    fi
    
    # Create .env file from example
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from template"
        else
            touch .env
            print_warning "Created empty .env file"
        fi
    fi
    
    # Run setup steps
    setup_python
    setup_node
    setup_database
    setup_monitoring
    setup_deployment
    setup_github_actions
    generate_icons
    
    # Optional: Run tests
    read -p "Do you want to run tests? (y/n): " run_tests_choice
    if [ "$run_tests_choice" = "y" ]; then
        run_tests
    fi
    
    # Start application
    start_application
    
    print_success "Setup completed successfully! 🎉"
    echo ""
    echo "📚 Next steps:"
    echo "1. Review the MASTER_SETUP_GUIDE.md for detailed instructions"
    echo "2. Configure remaining services in .env file"
    echo "3. Set up your domain and SSL certificate"
    echo "4. Deploy to production when ready"
    echo ""
    echo "📧 Support: Check GitHub Issues or Discord community"
    echo "🌟 Don't forget to star the repository!"
}

# Run main function
main
