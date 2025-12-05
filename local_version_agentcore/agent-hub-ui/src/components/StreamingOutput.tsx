import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { ExecutionProgress, StreamData } from '../services/progressService';

interface StreamingOutputProps {
  execution: ExecutionProgress;
  maxHeight?: string;
  showTimestamps?: boolean;
  autoScroll?: boolean;
}

const StreamingOutput: React.FC<StreamingOutputProps> = ({ 
  execution, 
  maxHeight = '400px',
  showTimestamps = true,
  autoScroll = true
}) => {
  const [displayedLogs, setDisplayedLogs] = useState<StreamData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (autoScroll && scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLogs, autoScroll, isPaused]);

  // Handle typing effect for streaming logs
  useEffect(() => {
    if (isPaused || currentTypingIndex >= execution.logs.length) {
      setIsTyping(false);
      return;
    }

    const currentLog = execution.logs[currentTypingIndex];
    const isNewLog = currentTypingIndex >= displayedLogs.length;

    if (isNewLog) {
      // Start typing a new log entry
      setIsTyping(true);
      setCurrentCharIndex(0);
      
      // Add empty log entry to start typing into
      setDisplayedLogs(prev => [...prev, { ...currentLog, content: '' }]);
    }

    const targetContent = currentLog.content;
    const currentContent = displayedLogs[currentTypingIndex]?.content || '';

    if (currentCharIndex < targetContent.length) {
      const typingSpeed = getTypingSpeed(currentLog.type);
      
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => {
          const updated = [...prev];
          if (updated[currentTypingIndex]) {
            updated[currentTypingIndex] = {
              ...updated[currentTypingIndex],
              content: targetContent.substring(0, currentCharIndex + 1)
            };
          }
          return updated;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else {
      // Finished typing current log, move to next
      setTimeout(() => {
        setCurrentTypingIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 200);
    }
  }, [execution.logs, currentTypingIndex, currentCharIndex, displayedLogs, isPaused]);

  const getTypingSpeed = (type: StreamData['type']): number => {
    switch (type) {
      case 'error':
        return 30; // Slower for errors
      case 'result':
        return 20; // Faster for results
      default:
        return 25; // Normal speed for logs
    }
  };

  const getLogIcon = (type: StreamData['type']): string => {
    switch (type) {
      case 'error':
        return '❌';
      case 'result':
        return '✅';
      default:
        return '📝';
    }
  };

  const getLogVariant = (type: StreamData['type']): string => {
    switch (type) {
      case 'error':
        return 'danger';
      case 'result':
        return 'success';
      default:
        return 'info';
    }
  };

  const getLogTextClass = (type: StreamData['type']): string => {
    switch (type) {
      case 'error':
        return 'text-danger';
      case 'result':
        return 'text-success';
      default:
        return 'text-dark';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleScrollPause = () => {
    setIsPaused(!isPaused);
  };

  const clearLogs = () => {
    setDisplayedLogs([]);
    setCurrentTypingIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(false);
  };

  const copyLogs = () => {
    const logText = displayedLogs
      .map(log => `[${formatTimestamp(log.timestamp)}] ${log.content}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="me-2">📊</span>
          <span>Live Execution Log</span>
          {isTyping && (
            <div className="spinner-border spinner-border-sm ms-2" role="status">
              <span className="visually-hidden">Streaming...</span>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={handleScrollPause}
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </Button>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={copyLogs}
            title="Copy logs to clipboard"
          >
            📋
          </Button>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={clearLogs}
            title="Clear logs"
          >
            🗑️
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div 
          ref={scrollRef}
          className="p-3 font-monospace small"
          style={{ 
            maxHeight, 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            lineHeight: '1.4'
          }}
        >
          {displayedLogs.length === 0 ? (
            <div className="text-muted text-center py-4">
              <div className="mb-2">🔄</div>
              <div>Waiting for execution to start...</div>
            </div>
          ) : (
            displayedLogs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-2 p-2 rounded ${log.type === 'error' ? 'bg-danger bg-opacity-10' : 
                  log.type === 'result' ? 'bg-success bg-opacity-10' : 'bg-white'}`}
              >
                <div className="d-flex align-items-start">
                  <Badge 
                    bg={getLogVariant(log.type)} 
                    className="me-2 mt-1"
                    style={{ fontSize: '0.7rem' }}
                  >
                    {getLogIcon(log.type)}
                  </Badge>
                  
                  <div className="flex-grow-1">
                    {showTimestamps && (
                      <span className="text-muted me-2">
                        [{formatTimestamp(log.timestamp)}]
                      </span>
                    )}
                    <span className={getLogTextClass(log.type)}>
                      {log.content}
                      {isTyping && index === currentTypingIndex && (
                        <span className="text-primary">|</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Show typing indicator for current step */}
          {execution.status === 'running' && execution.currentStep < execution.steps.length && (
            <div className="text-muted text-center py-2 border-top">
              <small>
                🔄 {execution.steps[execution.currentStep]?.name}...
              </small>
            </div>
          )}
        </div>
      </Card.Body>
      
      <Card.Footer className="bg-light border-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {displayedLogs.length} log entries
            {execution.logs.length > displayedLogs.length && (
              <span className="text-primary ms-1">
                (+{execution.logs.length - displayedLogs.length} pending)
              </span>
            )}
          </small>
          <div className="d-flex align-items-center">
            {isPaused && (
              <Badge bg="warning" className="me-2">
                Paused
              </Badge>
            )}
            <small className="text-muted">
              Status: <span className={`fw-bold ${
                execution.status === 'completed' ? 'text-success' :
                execution.status === 'failed' ? 'text-danger' :
                'text-primary'
              }`}>
                {execution.status.toUpperCase()}
              </span>
            </small>
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default StreamingOutput;