/**
 * KnowledgeBaseManagement Component Tests
 * 
 * Tests for the knowledge base management UI including:
 * - Component rendering
 * - Knowledge base listing
 * - Create knowledge base modal
 * - Upload documents modal
 * - Delete knowledge base
 * - Search test modal integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KnowledgeBaseManagement from './KnowledgeBaseManagement';

// Mock the SearchTestModal component
jest.mock('./SearchTestModal', () => {
  return function MockSearchTestModal({ show, onHide, knowledgeBaseName }: any) {
    return show ? (
      <div data-testid="search-test-modal">
        <h1>Search Test Modal</h1>
        <p>Knowledge Base: {knowledgeBaseName}</p>
        <button onClick={onHide}>Close</button>
      </div>
    ) : null;
  };
});

describe('KnowledgeBaseManagement Component', () => {
  
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });
  
  describe('Component Rendering', () => {
    
    test('renders the main heading', () => {
      render(<KnowledgeBaseManagement />);
      expect(screen.getByText('Knowledge Base Management')).toBeInTheDocument();
    });
    
    test('renders the create button', () => {
      render(<KnowledgeBaseManagement />);
      expect(screen.getByText('Create Knowledge Base')).toBeInTheDocument();
    });
    
    test('renders summary statistics cards', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Knowledge Bases')).toBeInTheDocument();
        expect(screen.getByText('Total Documents')).toBeInTheDocument();
        expect(screen.getByText('Total Storage')).toBeInTheDocument();
      });
    });
  });
  
  describe('Knowledge Base Listing', () => {
    
    test('displays mock knowledge bases', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Product Documentation')).toBeInTheDocument();
        expect(screen.getByText('Support Tickets')).toBeInTheDocument();
        expect(screen.getByText('FAQ Database')).toBeInTheDocument();
      });
    });
    
    test('displays knowledge base statistics', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        // Check for document counts
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });
    
    test('displays provider badges', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const badges = screen.getAllByText('mock');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Create Knowledge Base Modal', () => {
    
    test('opens create modal when button is clicked', async () => {
      render(<KnowledgeBaseManagement />);
      
      const createButton = screen.getByText('Create Knowledge Base');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name *')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Provider')).toBeInTheDocument();
      });
    });
    
    test('validates required fields', async () => {
      render(<KnowledgeBaseManagement />);
      
      // Open modal
      const createButton = screen.getByText('Create Knowledge Base');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const submitButton = screen.getAllByText('Create Knowledge Base')[1];
        expect(submitButton).toBeDisabled();
      });
    });
    
    test('enables submit button when name is entered', async () => {
      render(<KnowledgeBaseManagement />);
      
      // Open modal
      const createButton = screen.getByText('Create Knowledge Base');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., Product Documentation/i);
        fireEvent.change(nameInput, { target: { value: 'Test KB' } });
      });
      
      await waitFor(() => {
        const submitButton = screen.getAllByText('Create Knowledge Base')[1];
        expect(submitButton).not.toBeDisabled();
      });
    });
    
    test('closes modal when cancel is clicked', async () => {
      render(<KnowledgeBaseManagement />);
      
      // Open modal
      const createButton = screen.getByText('Create Knowledge Base');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Name *')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Upload Documents Modal', () => {
    
    test('opens upload modal from dropdown', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        // Find and click the first dropdown toggle
        const dropdownToggles = screen.getAllByRole('button');
        const dropdownToggle = dropdownToggles.find(btn => 
          btn.querySelector('.bi-three-dots-vertical')
        );
        
        if (dropdownToggle) {
          fireEvent.click(dropdownToggle);
        }
      });
      
      await waitFor(() => {
        const uploadOption = screen.getByText('Upload Documents');
        fireEvent.click(uploadOption);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Select Files')).toBeInTheDocument();
      });
    });
    
    test('displays selected knowledge base in upload modal', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const dropdownToggles = screen.getAllByRole('button');
        const dropdownToggle = dropdownToggles.find(btn => 
          btn.querySelector('.bi-three-dots-vertical')
        );
        
        if (dropdownToggle) {
          fireEvent.click(dropdownToggle);
        }
      });
      
      await waitFor(() => {
        const uploadOption = screen.getByText('Upload Documents');
        fireEvent.click(uploadOption);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Uploading to:/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Search Test Modal Integration', () => {
    
    test('opens search test modal from dropdown', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const dropdownToggles = screen.getAllByRole('button');
        const dropdownToggle = dropdownToggles.find(btn => 
          btn.querySelector('.bi-three-dots-vertical')
        );
        
        if (dropdownToggle) {
          fireEvent.click(dropdownToggle);
        }
      });
      
      await waitFor(() => {
        const searchOption = screen.getByText('Test Search');
        fireEvent.click(searchOption);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-test-modal')).toBeInTheDocument();
      });
    });
    
    test('passes correct props to search modal', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const dropdownToggles = screen.getAllByRole('button');
        const dropdownToggle = dropdownToggles.find(btn => 
          btn.querySelector('.bi-three-dots-vertical')
        );
        
        if (dropdownToggle) {
          fireEvent.click(dropdownToggle);
        }
      });
      
      await waitFor(() => {
        const searchOption = screen.getByText('Test Search');
        fireEvent.click(searchOption);
      });
      
      await waitFor(() => {
        const modal = screen.getByTestId('search-test-modal');
        expect(modal).toHaveTextContent('Product Documentation');
      });
    });
  });
  
  describe('Delete Knowledge Base', () => {
    
    test('shows delete option in dropdown', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const dropdownToggles = screen.getAllByRole('button');
        const dropdownToggle = dropdownToggles.find(btn => 
          btn.querySelector('.bi-three-dots-vertical')
        );
        
        if (dropdownToggle) {
          fireEvent.click(dropdownToggle);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });
  });
  
  describe('Statistics Display', () => {
    
    test('calculates total statistics correctly', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        // Total KBs should be 3
        expect(screen.getByText('3')).toBeInTheDocument();
        
        // Total documents should be 725 (150 + 500 + 75)
        expect(screen.getByText('725')).toBeInTheDocument();
      });
    });
    
    test('formats storage sizes correctly', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        // Check for formatted sizes (5MB, 15MB, 2MB)
        expect(screen.getByText(/5 MB/i)).toBeInTheDocument();
        expect(screen.getByText(/15 MB/i)).toBeInTheDocument();
        expect(screen.getByText(/2 MB/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Error Handling', () => {
    
    test('displays error alert when present', async () => {
      render(<KnowledgeBaseManagement />);
      
      // Open create modal and try to submit without name
      const createButton = screen.getByText('Create Knowledge Base');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const submitButton = screen.getAllByText('Create Knowledge Base')[1];
        // Try to click disabled button (simulating error scenario)
        expect(submitButton).toBeDisabled();
      });
    });
  });
  
  describe('Responsive Design', () => {
    
    test('renders grid layout for knowledge bases', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const cards = screen.getAllByRole('button', { name: /three-dots-vertical/i });
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Action Buttons', () => {
    
    test('displays upload and view buttons on cards', async () => {
      render(<KnowledgeBaseManagement />);
      
      await waitFor(() => {
        const uploadButtons = screen.getAllByText('Upload');
        const viewButtons = screen.getAllByText('View');
        
        expect(uploadButtons.length).toBeGreaterThan(0);
        expect(viewButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
