// Export Service for generating professional reports in multiple formats

export interface ReportData {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  metadata: ExecutionMetadata;
  styling: ReportStyling;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'code' | 'table' | 'chart' | 'list';
  content: any;
  description?: string;
}

export interface ExecutionMetadata {
  executionId: string;
  agentName: string;
  agentCategory: string;
  executedBy: string;
  executedAt: Date;
  executionTime: number;
  version: string;
  parameters?: Record<string, any>;
}

export interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  includeLogo: boolean;
  includeWatermark: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
  description?: string;
}

export interface DocumentData {
  title: string;
  content: string;
  metadata: ExecutionMetadata;
  sections: ReportSection[];
}

export class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Generate PDF report (simulated - would use jsPDF in real implementation)
  async generatePDF(data: ReportData): Promise<Blob> {
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create a mock PDF content
    const pdfContent = this.createPDFContent(data);
    
    // In a real implementation, this would use jsPDF:
    // const doc = new jsPDF();
    // doc.text(data.title, 20, 20);
    // return doc.output('blob');

    // For demo purposes, create a text file that simulates PDF content
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return blob;
  }

  // Generate Excel report (simulated - would use SheetJS in real implementation)
  async generateExcel(data: TableData): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Create CSV content as Excel simulation
    const csvContent = this.createExcelContent(data);
    
    // In a real implementation, this would use SheetJS:
    // const wb = XLSX.utils.book_new();
    // const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    // XLSX.utils.book_append_sheet(wb, ws, "Report");
    // return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    return blob;
  }

  // Generate Word document (simulated - would use docx library in real implementation)
  async generateWord(data: DocumentData): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1800));

    const docContent = this.createWordContent(data);
    
    // In a real implementation, this would use docx:
    // const doc = new Document({
    //   sections: [{
    //     properties: {},
    //     children: [
    //       new Paragraph({
    //         children: [new TextRun({ text: data.title, bold: true, size: 28 })]
    //       })
    //     ]
    //   }]
    // });
    // return Packer.toBlob(doc);

    const blob = new Blob([docContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    return blob;
  }

  // Format code with syntax highlighting for export
  formatCodeForExport(code: string, language: string): string {
    // Remove HTML tags and return clean code
    return code
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  // Create downloadable file
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Generate comprehensive report from execution result
  async generateExecutionReport(
    executionResult: any, 
    format: 'pdf' | 'excel' | 'word',
    agentName: string,
    agentCategory: string
  ): Promise<void> {
    const timestamp = new Date();
    const filename = `${agentName.replace(/\s+/g, '-').toLowerCase()}-report-${timestamp.toISOString().split('T')[0]}.${format}`;

    const metadata: ExecutionMetadata = {
      executionId: executionResult.execution_id || 'demo-execution',
      agentName,
      agentCategory,
      executedBy: 'Demo User',
      executedAt: timestamp,
      executionTime: 3.2,
      version: '1.0.0'
    };

    const styling: ReportStyling = {
      primaryColor: '#0d6efd',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      includeLogo: true,
      includeWatermark: false
    };

    try {
      let blob: Blob;

      switch (format) {
        case 'pdf':
          const reportData: ReportData = {
            title: `${agentName} - Execution Report`,
            subtitle: `Generated on ${timestamp.toLocaleDateString()}`,
            sections: this.createReportSections(executionResult, agentCategory),
            metadata,
            styling
          };
          blob = await this.generatePDF(reportData);
          break;

        case 'excel':
          const tableData: TableData = this.createTableData(executionResult, agentCategory);
          blob = await this.generateExcel(tableData);
          break;

        case 'word':
          const documentData: DocumentData = {
            title: `${agentName} - Execution Report`,
            content: this.createDocumentContent(executionResult, agentCategory),
            metadata,
            sections: this.createReportSections(executionResult, agentCategory)
          };
          blob = await this.generateWord(documentData);
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      this.downloadFile(blob, filename);
      
      // Show success notification
      this.showExportNotification(format, filename);

    } catch (error) {
      console.error('Export failed:', error);
      this.showErrorNotification(format);
    }
  }

  // Private helper methods
  private createPDFContent(data: ReportData): string {
    return `
AGENT HUB - EXECUTION REPORT
============================

Title: ${data.title}
${data.subtitle ? `Subtitle: ${data.subtitle}` : ''}

Generated: ${data.metadata.executedAt.toLocaleString()}
Execution ID: ${data.metadata.executionId}
Agent: ${data.metadata.agentName} (${data.metadata.agentCategory})
Executed by: ${data.metadata.executedBy}
Execution Time: ${data.metadata.executionTime}s

REPORT SECTIONS
===============

${data.sections.map(section => `
${section.title.toUpperCase()}
${'-'.repeat(section.title.length)}

${this.formatSectionContent(section)}

`).join('')}

---
This report was generated by Agent Hub v${data.metadata.version}
For more information, visit: https://agenthub.example.com
    `.trim();
  }

  private createExcelContent(data: TableData): string {
    const csvRows = [
      data.headers.join(','),
      ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    
    return [
      `"${data.title || 'Agent Hub Report'}"`,
      `"Generated: ${new Date().toLocaleString()}"`,
      '',
      ...csvRows
    ].join('\n');
  }

  private createWordContent(data: DocumentData): string {
    return `
${data.title}

Generated: ${data.metadata.executedAt.toLocaleString()}
Execution ID: ${data.metadata.executionId}
Agent: ${data.metadata.agentName} (${data.metadata.agentCategory})

${data.content}

${data.sections.map(section => `
${section.title}
${this.formatSectionContent(section)}
`).join('\n')}

---
Generated by Agent Hub v${data.metadata.version}
    `.trim();
  }

  private createReportSections(executionResult: any, agentCategory: string): ReportSection[] {
    const sections: ReportSection[] = [
      {
        id: 'summary',
        title: 'Executive Summary',
        type: 'text',
        content: this.createExecutiveSummary(executionResult, agentCategory)
      }
    ];

    // Add category-specific sections
    if (executionResult.results) {
      if (executionResult.results.automation_files) {
        sections.push({
          id: 'code',
          title: 'Generated Code Files',
          type: 'code',
          content: executionResult.results.automation_files
        });
      }

      if (executionResult.results.performance_analysis) {
        sections.push({
          id: 'performance',
          title: 'Performance Analysis',
          type: 'table',
          content: executionResult.results.performance_analysis
        });
      }

      if (executionResult.results.recommendations) {
        sections.push({
          id: 'recommendations',
          title: 'Recommendations',
          type: 'list',
          content: executionResult.results.recommendations
        });
      }
    }

    return sections;
  }

  private createTableData(executionResult: any, agentCategory: string): TableData {
    // Create a summary table based on the execution results
    const headers = ['Metric', 'Value', 'Description'];
    const rows: string[][] = [];

    if (executionResult.results?.summary) {
      const summary = executionResult.results.summary;
      Object.entries(summary).forEach(([key, value]) => {
        rows.push([
          key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          String(value),
          this.getMetricDescription(key)
        ]);
      });
    }

    return {
      title: `${agentCategory} Agent Execution Results`,
      description: `Detailed metrics from execution ${executionResult.execution_id}`,
      headers,
      rows
    };
  }

  private createDocumentContent(executionResult: any, agentCategory: string): string {
    return `
This report contains the detailed results from the ${agentCategory} agent execution.

Key Highlights:
- Execution completed successfully
- Generated comprehensive results
- All quality checks passed
- Ready for implementation

For detailed technical information, please refer to the sections below.
    `.trim();
  }

  private createExecutiveSummary(executionResult: any, agentCategory: string): string {
    return `
The ${agentCategory} agent execution completed successfully, generating comprehensive results that meet all specified requirements. 

Key outcomes include automated code generation, performance optimization recommendations, and detailed analysis reports. The execution demonstrates significant value in terms of time savings and quality improvements.

This report provides detailed insights into the execution process, generated artifacts, and recommended next steps for implementation.
    `.trim();
  }

  private formatSectionContent(section: ReportSection): string {
    switch (section.type) {
      case 'text':
        return section.content;
      case 'code':
        return Array.isArray(section.content) 
          ? section.content.map((file: any) => `File: ${file.title}\n${file.code_preview || file.content || ''}`).join('\n\n')
          : section.content;
      case 'list':
        return Array.isArray(section.content)
          ? section.content.map((item: any, index: number) => `${index + 1}. ${typeof item === 'string' ? item : item.title || item.description || JSON.stringify(item)}`).join('\n')
          : section.content;
      case 'table':
        return JSON.stringify(section.content, null, 2);
      default:
        return String(section.content);
    }
  }

  private getMetricDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'total_test_files': 'Number of test files generated',
      'automation_framework': 'Testing framework used',
      'execution_time_estimate': 'Estimated time to complete',
      'code_coverage': 'Percentage of code covered by tests',
      'critical_issues': 'Number of critical issues found',
      'warnings': 'Number of warnings identified',
      'security_score': 'Overall security assessment score',
      'infrastructure_health_score': 'Infrastructure health rating'
    };
    return descriptions[key] || 'Execution metric';
  }

  private showExportNotification(format: string, filename: string): void {
    // In a real app, this would show a toast notification
    alert(`✅ ${format.toUpperCase()} Export Successful!\n\nFile: ${filename}\n\nThe report has been downloaded to your device.`);
  }

  private showErrorNotification(format: string): void {
    alert(`❌ ${format.toUpperCase()} Export Failed!\n\nPlease try again or contact support if the issue persists.`);
  }
}

// Global export service instance
export const exportService = ExportService.getInstance();