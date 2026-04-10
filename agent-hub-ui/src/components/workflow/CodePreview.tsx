/**
 * Code Preview Component
 * Displays syntax highlighted code with copy functionality
 */

import React, { useState } from 'react';
import { Button, Alert } from 'react-bootstrap';

interface CodePreviewProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ 
  code, 
  language = 'javascript', 
  showLineNumbers = true,
  maxHeight = '300px'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="position-relative">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-secondary">{language}</span>
          <span className="text-muted small">{lines.length} lines</span>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </Button>
      </div>
      
      {copied && (
        <Alert variant="success" className="py-1 px-2 small mb-2">
          Code copied to clipboard!
        </Alert>
      )}
      
      <div 
        className="bg-dark text-light p-3 rounded position-relative"
        style={{ 
          maxHeight, 
          overflow: 'auto',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}
      >
        <pre className="mb-0">
          {showLineNumbers ? (
            <code>
              {lines.map((line, index) => (
                <div key={index} className="d-flex">
                  <span 
                    className="text-muted me-3 user-select-none" 
                    style={{ minWidth: '2em', textAlign: 'right' }}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-grow-1">{line || ' '}</span>
                </div>
              ))}
            </code>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
