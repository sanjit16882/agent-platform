import React, { useState } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  code,
  language = 'javascript',
  title,
  showLineNumbers = true,
  maxHeight = '400px',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  // Language detection based on code content
  const detectLanguage = (codeContent: string): string => {
    const content = codeContent.toLowerCase();
    
    if (content.includes('import ') && content.includes('from ')) return 'javascript';
    if (content.includes('def ') && content.includes(':')) return 'python';
    if (content.includes('public class') || content.includes('import java')) return 'java';
    if (content.includes('<?php') || content.includes('$')) return 'php';
    if (content.includes('#include') || content.includes('int main')) return 'cpp';
    if (content.includes('SELECT') || content.includes('FROM')) return 'sql';
    if (content.includes('<html') || content.includes('<div')) return 'html';
    if (content.includes('{') && content.includes('color:')) return 'css';
    if (content.includes('terraform') || content.includes('resource ')) return 'terraform';
    if (content.includes('apiVersion:') || content.includes('kind:')) return 'yaml';
    if (content.includes('describe(') || content.includes('it(')) return 'javascript';
    if (content.includes('#!/bin/bash') || content.includes('echo ')) return 'bash';
    
    return language;
  };

  const detectedLanguage = detectLanguage(code);

  // Simple syntax highlighting using CSS classes
  const highlightCode = (codeContent: string, lang: string): string => {
    let highlighted = codeContent;

    switch (lang) {
      case 'javascript':
      case 'typescript':
        highlighted = highlighted
          .replace(/(import|export|from|const|let|var|function|class|extends|return|if|else|for|while|try|catch|async|await)/g, '<span class="keyword">$1</span>')
          .replace(/(true|false|null|undefined)/g, '<span class="boolean">$1</span>')
          .replace(/('.*?'|".*?")/g, '<span class="string">$1</span>')
          .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
          .replace(/(\d+)/g, '<span class="number">$1</span>');
        break;
        
      case 'python':
        highlighted = highlighted
          .replace(/(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|pass|break|continue)/g, '<span class="keyword">$1</span>')
          .replace(/(True|False|None)/g, '<span class="boolean">$1</span>')
          .replace(/('.*?'|".*?")/g, '<span class="string">$1</span>')
          .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
          .replace(/(\d+)/g, '<span class="number">$1</span>');
        break;
        
      case 'java':
        highlighted = highlighted
          .replace(/(public|private|protected|static|final|class|interface|extends|implements|import|package|return|if|else|for|while|try|catch|new)/g, '<span class="keyword">$1</span>')
          .replace(/(true|false|null)/g, '<span class="boolean">$1</span>')
          .replace(/(".*?")/g, '<span class="string">$1</span>')
          .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
          .replace(/(\d+)/g, '<span class="number">$1</span>');
        break;
        
      case 'sql':
        highlighted = highlighted
          .replace(/(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|ON|GROUP BY|ORDER BY|HAVING|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|DATABASE|INDEX)/gi, '<span class="keyword">$1</span>')
          .replace(/('.*?')/g, '<span class="string">$1</span>')
          .replace(/(--.*$)/gm, '<span class="comment">$1</span>')
          .replace(/(\d+)/g, '<span class="number">$1</span>');
        break;
        
      case 'html':
        highlighted = highlighted
          .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="tag">$1</span>')
          .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>');
        break;
        
      case 'css':
        highlighted = highlighted
          .replace(/([.#]?[a-zA-Z-]+)\s*{/g, '<span class="selector">$1</span> {')
          .replace(/(color|background|margin|padding|font-size|width|height|display|position|border):/g, '<span class="property">$1</span>:')
          .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;')
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
        break;
        
      case 'bash':
        highlighted = highlighted
          .replace(/(echo|cd|ls|mkdir|rm|cp|mv|grep|find|chmod|chown|sudo|apt|yum|npm|yarn|git)/g, '<span class="keyword">$1</span>')
          .replace(/('.*?'|".*?")/g, '<span class="string">$1</span>')
          .replace(/(#.*$)/gm, '<span class="comment">$1</span>');
        break;
        
      case 'yaml':
        highlighted = highlighted
          .replace(/^(\s*[a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm, '<span class="property">$1</span>:')
          .replace(/:\s*([^#\n]+)/g, ': <span class="value">$1</span>')
          .replace(/(#.*$)/gm, '<span class="comment">$1</span>');
        break;
    }

    return highlighted;
  };

  const getLanguageIcon = (lang: string): string => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      php: '🐘',
      cpp: '⚙️',
      sql: '🗃️',
      html: '🌐',
      css: '🎨',
      bash: '💻',
      yaml: '📄',
      terraform: '🏗️'
    };
    return icons[lang] || '📝';
  };

  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: 'warning',
      typescript: 'primary',
      python: 'success',
      java: 'danger',
      php: 'info',
      cpp: 'secondary',
      sql: 'dark',
      html: 'warning',
      css: 'info',
      bash: 'dark',
      yaml: 'secondary',
      terraform: 'primary'
    };
    return colors[lang] || 'secondary';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatCode = (codeContent: string): string => {
    // Basic code formatting
    let formatted = codeContent;
    
    // Add proper indentation for JavaScript/TypeScript
    if (detectedLanguage === 'javascript' || detectedLanguage === 'typescript') {
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2;
      
      formatted = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.includes('}')) indentLevel = Math.max(0, indentLevel - 1);
        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
        if (trimmed.includes('{')) indentLevel++;
        return indentedLine;
      }).join('\n');
    }
    
    return formatted;
  };

  const formattedCode = formatCode(code);
  const highlightedCode = highlightCode(formattedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;'), detectedLanguage);
  const lines = formattedCode.split('\n');

  return (
    <Card className={`code-highlighter ${className}`}>
      {title && (
        <Card.Header className="d-flex justify-content-between align-items-center bg-dark text-white">
          <div className="d-flex align-items-center">
            <span className="me-2">{getLanguageIcon(detectedLanguage)}</span>
            <span className="fw-bold">{title}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={getLanguageColor(detectedLanguage)}>
              {detectedLanguage.toUpperCase()}
            </Badge>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleCopy}
              className="d-flex align-items-center"
            >
              {copied ? '✅' : '📋'} {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </Card.Header>
      )}
      
      <Card.Body className="p-0">
        <div 
          className="code-container"
          style={{ 
            maxHeight, 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          <div className="d-flex">
            {showLineNumbers && (
              <div 
                className="line-numbers"
                style={{
                  backgroundColor: '#e9ecef',
                  color: '#6c757d',
                  padding: '1rem 0.5rem',
                  textAlign: 'right',
                  minWidth: '50px',
                  borderRight: '1px solid #dee2e6',
                  userSelect: 'none'
                }}
              >
                {lines.map((_, index) => (
                  <div key={index} style={{ height: '21px' }}>
                    {index + 1}
                  </div>
                ))}
              </div>
            )}
            
            <div 
              className="code-content"
              style={{ 
                padding: '1rem',
                flex: 1,
                whiteSpace: 'pre',
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </div>
        </div>
      </Card.Body>
      
      {copied && (
        <Alert variant="success" className="mb-0 rounded-0">
          <small>✅ Code copied to clipboard!</small>
        </Alert>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .code-highlighter .keyword {
            color: #0066cc;
            font-weight: bold;
          }
          .code-highlighter .string {
            color: #009900;
          }
          .code-highlighter .comment {
            color: #999999;
            font-style: italic;
          }
          .code-highlighter .number {
            color: #ff6600;
          }
          .code-highlighter .boolean {
            color: #cc0066;
            font-weight: bold;
          }
          .code-highlighter .tag {
            color: #0066cc;
          }
          .code-highlighter .selector {
            color: #cc0066;
            font-weight: bold;
          }
          .code-highlighter .property {
            color: #0066cc;
          }
          .code-highlighter .value {
            color: #009900;
          }
        `
      }} />
    </Card>
  );
};

export default CodeHighlighter;