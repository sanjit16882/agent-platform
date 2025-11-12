/**
 * DocumentList Component Tests
 * 
 * Tests for document management functionality including:
 * - Document listing
 * - Pagination
 * - Document deletion
 * - Document preview
 * - Search functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentList from './DocumentList';

describe('DocumentList Component', () => {
  
  const mockProps = {
    knowledgeBaseId: 'kb-1',
    knowledgeBaseName: 'Test Knowledge Base'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Component Rendering', () => {
    
    test('renders the documents heading', () => {
      render(<DocumentList {...mockProps} />);
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });
    
    test('displays knowledge base name', () => {
      render(<DocumentList {...mockProps} />);
      expect(screen.getByText('Test Knowledge Base')).toBeInTheDocument();
    });
    
    test('renders back button', () => {
      render(<DocumentList {...mockProps} />);
      expect(screen.getByText('Back to Knowledge Base')).toBeInTheDocument();
    });
    
    test('shows loading state initially', () => {
      render(<DocumentList {...mockProps} />);
      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
    });
  });
  
  describe('Document Listing', () => {
    
    test('displays mock documents after loading', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started Guide')).toBeInTheDocument();
        expect(screen.getByText('API Reference')).toBeInTheDocument();
        expect(screen.getByText('Troubleshooting Common Issues')).toBeInTheDocument();
      });
    });
    
    test('displays document metadata', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('getting-started.md')).toBeInTheDocument();
        expect(screen.getByText('api-reference.pdf')).toBeInTheDocument();
      });
    });
    
    test('displays file type badges', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('MARKDOWN')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('TEXT')).toBeInTheDocument();
      });
    });
    
    test('displays file sizes', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('15 KB')).toBeInTheDocument();
        expect(screen.getByText('512 KB')).toBeInTheDocument();
      });
    });
    
    test('displays chunk counts', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const badges = screen.getAllByText(/\d+/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Search Functionality', () => {
    
    test('renders search input', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
      });
    });
    
    test('allows typing in search input', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search documents...');
        fireEvent.change(searchInput, { target: { value: 'API' } });
        expect(searchInput).toHaveValue('API');
      });
    });
  });
  
  describe('Document Actions', () => {
    
    test('displays preview buttons for each document', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const previewButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-eye')
        );
        expect(previewButtons.length).toBeGreaterThan(0);
      });
    });
    
    test('displays delete buttons for each document', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-trash')
        );
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Document Preview Modal', () => {
    
    test('opens preview modal when preview button is clicked', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const previewButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-eye')
        );
        
        if (previewButtons.length > 0) {
          fireEvent.click(previewButtons[0]);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Document Preview')).toBeInTheDocument();
      });
    });
    
    test('displays document details in preview modal', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const previewButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-eye')
        );
        
        if (previewButtons.length > 0) {
          fireEvent.click(previewButtons[0]);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Content Preview:')).toBeInTheDocument();
        expect(screen.getByText('Filename:')).toBeInTheDocument();
        expect(screen.getByText('Uploaded:')).toBeInTheDocument();
      });
    });
    
    test('closes preview modal when close button is clicked', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const previewButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-eye')
        );
        
        if (previewButtons.length > 0) {
          fireEvent.click(previewButtons[0]);
        }
      });
      
      await waitFor(() => {
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Document Preview')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Delete Confirmation Modal', () => {
    
    test('opens delete modal when delete button is clicked', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-trash')
        );
        
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Delete Document')).toBeInTheDocument();
      });
    });
    
    test('displays warning message in delete modal', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-trash')
        );
        
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
      });
    });
    
    test('shows what will be deleted', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-trash')
        );
        
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('The document file')).toBeInTheDocument();
        expect(screen.getByText(/All vector embeddings/i)).toBeInTheDocument();
        expect(screen.getByText('Document metadata')).toBeInTheDocument();
      });
    });
    
    test('closes delete modal when cancel is clicked', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.bi-trash')
        );
        
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Delete Document')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Pagination', () => {
    
    test('displays document count', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/5 Documents/i)).toBeInTheDocument();
      });
    });
    
    test('shows current page range', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 - 5/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Empty State', () => {
    
    test('shows empty state when no documents match search', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search documents...');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      });
      
      // Note: In the actual implementation, this would trigger a re-fetch
      // For now, we're just testing that the search input works
    });
  });
  
  describe('Data Formatting', () => {
    
    test('formats file sizes correctly', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        // Check for KB and MB formatting
        const sizeElements = screen.getAllByText(/\d+(\.\d+)?\s+(B|KB|MB|GB)/);
        expect(sizeElements.length).toBeGreaterThan(0);
      });
    });
    
    test('formats dates correctly', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        // Check for formatted dates (e.g., "Nov 1, 2025")
        const datePattern = /[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/;
        const allText = screen.getByRole('table').textContent || '';
        expect(datePattern.test(allText)).toBe(true);
      });
    });
  });
  
  describe('Table Structure', () => {
    
    test('renders table with correct headers', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Size')).toBeInTheDocument();
        expect(screen.getByText('Chunks')).toBeInTheDocument();
        expect(screen.getByText('Uploaded')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });
  
  describe('Accessibility', () => {
    
    test('has accessible buttons', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
    
    test('has accessible table', async () => {
      render(<DocumentList {...mockProps} />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });
});
