// WebSocket Service for real-time communication
// Note: This is a mock implementation that simulates WebSocket behavior
// In a real implementation, this would connect to an actual WebSocket server

export interface WebSocketMessage {
  type: 'execution:started' | 'execution:progress' | 'execution:stream' | 'execution:completed';
  executionId: string;
  data: any;
  timestamp: Date;
}

export class WebSocketService {
  private listeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.connected = true;
      console.log('WebSocket connected (simulated)');
    }, 100);
  }

  // Connect to WebSocket server (simulated)
  connect(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        resolve();
      }, 200);
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.connected = false;
    console.log('WebSocket disconnected');
  }

  // Subscribe to WebSocket messages for a specific execution
  subscribe(executionId: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.listeners.has(executionId)) {
      this.listeners.set(executionId, []);
    }
    
    this.listeners.get(executionId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(executionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Send message to WebSocket server (simulated)
  send(message: WebSocketMessage): void {
    if (!this.connected) {
      console.warn('WebSocket not connected, message not sent:', message);
      return;
    }

    // In a real implementation, this would send to the actual WebSocket server
    console.log('WebSocket message sent:', message);
  }

  // Simulate receiving a message (for testing purposes)
  simulateMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.executionId);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.connected;
  }

  // Simulate connection loss and reconnection
  simulateConnectionLoss(): void {
    this.connected = false;
    console.log('WebSocket connection lost (simulated)');
    
    // Attempt to reconnect
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().then(() => {
        console.log('WebSocket reconnected successfully');
      }).catch(() => {
        this.attemptReconnect();
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Simulate realistic streaming data for different agent types
  simulateExecutionStream(executionId: string, agentCategory: string): void {
    if (!this.connected) return;

    const streamMessages = this.getStreamMessages(agentCategory);
    let messageIndex = 0;

    const sendNextMessage = () => {
      if (messageIndex < streamMessages.length) {
        const message: WebSocketMessage = {
          type: 'execution:stream',
          executionId,
          data: {
            type: 'log',
            content: streamMessages[messageIndex],
            timestamp: new Date()
          },
          timestamp: new Date()
        };

        this.simulateMessage(message);
        messageIndex++;

        // Schedule next message with realistic delay
        setTimeout(sendNextMessage, Math.random() * 2000 + 500);
      }
    };

    // Start streaming after a short delay
    setTimeout(sendNextMessage, 1000);
  }

  private getStreamMessages(agentCategory: string): string[] {
    const messages: Record<string, string[]> = {
      'QE': [
        'Initializing test generation framework...',
        'Parsing requirements and user stories...',
        'Identifying test scenarios and edge cases...',
        'Generating Selenium WebDriver test cases...',
        'Creating API test automation scripts...',
        'Implementing data-driven test scenarios...',
        'Validating test coverage and completeness...',
        'Packaging test files for download...',
        'Test generation completed successfully!'
      ],
      'DevOps': [
        'Starting infrastructure health check...',
        'Scanning system logs and metrics...',
        'Analyzing CPU and memory utilization...',
        'Checking network connectivity and latency...',
        'Reviewing security configurations...',
        'Identifying performance bottlenecks...',
        'Generating optimization recommendations...',
        'Compiling comprehensive analysis report...',
        'Infrastructure analysis completed!'
      ],
      'Security': [
        'Initializing OWASP ZAP security scanner...',
        'Configuring vulnerability detection rules...',
        'Scanning for SQL injection vulnerabilities...',
        'Checking for XSS and CSRF vulnerabilities...',
        'Analyzing authentication and authorization...',
        'Testing for insecure direct object references...',
        'Reviewing security headers and configurations...',
        'Generating detailed security assessment...',
        'Security scan completed - vulnerabilities found!'
      ],
      'Business': [
        'Loading business data from multiple sources...',
        'Validating data quality and consistency...',
        'Applying business rules and calculations...',
        'Performing statistical analysis and modeling...',
        'Generating key performance indicators...',
        'Creating interactive visualizations...',
        'Building executive summary dashboard...',
        'Preparing downloadable business reports...',
        'Business analysis completed successfully!'
      ]
    };

    return messages[agentCategory] || [
      'Processing your request...',
      'Analyzing input data...',
      'Applying algorithms and logic...',
      'Generating results...',
      'Finalizing output...',
      'Process completed successfully!'
    ];
  }
}

// Global WebSocket service instance
export const websocketService = new WebSocketService();