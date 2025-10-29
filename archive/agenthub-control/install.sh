#!/bin/bash
# Install AgentHub Control Tool

echo "🚀 Installing AgentHub Control Tool..."

# Make executable
chmod +x agenthub

# Install to system PATH
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    INSTALL_DIR="$HOME/bin"
    mkdir -p "$INSTALL_DIR"
    cp agenthub "$INSTALL_DIR/agenthub"
    
    echo "✅ Installed to $INSTALL_DIR"
    echo "📋 Add $INSTALL_DIR to your PATH if not already added"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    INSTALL_DIR="/usr/local/bin"
    sudo cp agenthub "$INSTALL_DIR/agenthub"
    echo "✅ Installed to $INSTALL_DIR"
    
else
    # Linux
    INSTALL_DIR="/usr/local/bin"
    sudo cp agenthub "$INSTALL_DIR/agenthub"
    echo "✅ Installed to $INSTALL_DIR"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install boto3 requests

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Set up AgentHub: agenthub config"
echo "3. Start your instance: agenthub start"
echo ""
echo "💡 Usage examples:"
echo "   agenthub start        # Start for 30 minutes"
echo "   agenthub start 60     # Start for 60 minutes"
echo "   agenthub stop         # Stop immediately"
echo "   agenthub status       # Check status"