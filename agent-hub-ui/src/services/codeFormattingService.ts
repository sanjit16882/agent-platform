// Code Formatting Service for professional code display and beautification

export interface CodeFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  description?: string;
  size: number;
}

export interface FormattingOptions {
  indentSize: number;
  useTabs: boolean;
  maxLineLength: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
}

export class CodeFormattingService {
  private static instance: CodeFormattingService;

  static getInstance(): CodeFormattingService {
    if (!CodeFormattingService.instance) {
      CodeFormattingService.instance = new CodeFormattingService();
    }
    return CodeFormattingService.instance;
  }

  // Format code based on language
  formatCode(code: string, language: string, options: Partial<FormattingOptions> = {}): string {
    const defaultOptions: FormattingOptions = {
      indentSize: 2,
      useTabs: false,
      maxLineLength: 100,
      insertFinalNewline: true,
      trimTrailingWhitespace: true,
      ...options
    };

    let formatted = code;

    // Trim trailing whitespace
    if (defaultOptions.trimTrailingWhitespace) {
      formatted = formatted.replace(/[ \t]+$/gm, '');
    }

    // Format based on language
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        formatted = this.formatJavaScript(formatted, defaultOptions);
        break;
      case 'python':
        formatted = this.formatPython(formatted, defaultOptions);
        break;
      case 'java':
        formatted = this.formatJava(formatted, defaultOptions);
        break;
      case 'sql':
        formatted = this.formatSQL(formatted, defaultOptions);
        break;
      case 'html':
        formatted = this.formatHTML(formatted, defaultOptions);
        break;
      case 'css':
        formatted = this.formatCSS(formatted, defaultOptions);
        break;
      case 'json':
        formatted = this.formatJSON(formatted, defaultOptions);
        break;
      case 'yaml':
        formatted = this.formatYAML(formatted, defaultOptions);
        break;
      default:
        formatted = this.formatGeneric(formatted, defaultOptions);
    }

    // Insert final newline
    if (defaultOptions.insertFinalNewline && !formatted.endsWith('\n')) {
      formatted += '\n';
    }

    return formatted;
  }

  // Detect language from filename or content
  detectLanguage(filename: string, content: string): string {
    // First try by file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'sql': 'sql',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
      'tf': 'terraform',
      'php': 'php',
      'cpp': 'cpp',
      'c': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'xml': 'xml'
    };

    if (extension && extensionMap[extension]) {
      return extensionMap[extension];
    }

    // Fallback to content-based detection
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('import ') && contentLower.includes('from ')) return 'javascript';
    if (contentLower.includes('def ') && contentLower.includes(':')) return 'python';
    if (contentLower.includes('public class') || contentLower.includes('import java')) return 'java';
    if (contentLower.includes('select') && contentLower.includes('from')) return 'sql';
    if (contentLower.includes('<html') || contentLower.includes('<!doctype')) return 'html';
    if (contentLower.includes('{') && contentLower.includes('color:')) return 'css';
    if (contentLower.includes('apiversion:') || contentLower.includes('kind:')) return 'yaml';
    
    return 'text';
  }

  // Get file size in bytes
  getFileSize(content: string): number {
    return new Blob([content]).size;
  }

  // Create CodeFile object from content
  createCodeFile(filename: string, content: string, description?: string): CodeFile {
    const language = this.detectLanguage(filename, content);
    const formattedContent = this.formatCode(content, language);
    
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename,
      language,
      content: formattedContent,
      description,
      size: this.getFileSize(formattedContent)
    };
  }

  // Private formatting methods for different languages
  private formatJavaScript(code: string, options: FormattingOptions): string {
    const lines = code.split('\n');
    let indentLevel = 0;
    const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);

    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')
          || trimmed.includes('} else') || trimmed.includes('} catch') || trimmed.includes('} finally')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = indent.repeat(indentLevel) + trimmed;

      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')
          || trimmed.includes('if (') || trimmed.includes('for (') || trimmed.includes('while (')
          || trimmed.includes('function') || trimmed.includes('=>')) {
        indentLevel++;
      }

      return indentedLine;
    }).join('\n');
  }

  private formatPython(code: string, options: FormattingOptions): string {
    const lines = code.split('\n');
    let indentLevel = 0;
    const indent = ' '.repeat(4); // Python standard is 4 spaces

    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease indent for dedent keywords
      if (trimmed.startsWith('except') || trimmed.startsWith('elif') || trimmed.startsWith('else') 
          || trimmed.startsWith('finally')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = indent.repeat(indentLevel) + trimmed;

      // Increase indent after colon
      if (trimmed.endsWith(':')) {
        indentLevel++;
      }

      return indentedLine;
    }).join('\n');
  }

  private formatJava(code: string, options: FormattingOptions): string {
    return this.formatJavaScript(code, options); // Similar structure
  }

  private formatSQL(code: string, options: FormattingOptions): string {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
                     'GROUP BY', 'ORDER BY', 'HAVING', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    
    let formatted = code.toUpperCase();
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    return formatted.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  private formatHTML(code: string, options: FormattingOptions): string {
    const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
    let indentLevel = 0;
    let formatted = '';
    
    // Simple HTML formatting
    const tags = code.match(/<[^>]+>/g) || [];
    const parts = code.split(/<[^>]+>/);
    
    for (let i = 0; i < Math.max(tags.length, parts.length); i++) {
      if (parts[i]) {
        const content = parts[i].trim();
        if (content) {
          formatted += indent.repeat(indentLevel) + content + '\n';
        }
      }
      
      if (tags[i]) {
        const tag = tags[i];
        if (tag.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        formatted += indent.repeat(indentLevel) + tag + '\n';
        
        if (!tag.startsWith('</') && !tag.endsWith('/>')) {
          indentLevel++;
        }
      }
    }
    
    return formatted;
  }

  private formatCSS(code: string, options: FormattingOptions): string {
    const indent = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
    
    return code
      .replace(/\{/g, ' {\n')
      .replace(/\}/g, '\n}\n')
      .replace(/;/g, ';\n')
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        if (trimmed.includes('{') || trimmed.includes('}')) {
          return trimmed;
        } else {
          return indent + trimmed;
        }
      })
      .join('\n');
  }

  private formatJSON(code: string, options: FormattingOptions): string {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, options.indentSize);
    } catch {
      return code; // Return original if invalid JSON
    }
  }

  private formatYAML(code: string, options: FormattingOptions): string {
    // Basic YAML formatting - maintain structure
    return code.split('\n')
      .map(line => line.trimRight())
      .join('\n');
  }

  private formatGeneric(code: string, options: FormattingOptions): string {
    // Basic formatting for unknown languages
    return code.split('\n')
      .map(line => line.trimRight())
      .join('\n');
  }
}

// Global code formatting service instance
export const codeFormattingService = CodeFormattingService.getInstance();