/**
 * SearchTestModal Component Tests
 * 
 * Tests for search testing functionality including:
 * - Search configuration
 * - Search execution
 * - Results display
 * - Performance metrics
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchTestModal from './SearchTestModal';

describe('SearchTestModal Component', () => {
  
  const mockProps = {
    show: true,
    onHide: jest.fn(),
    knowledgeBaseId: 'kb-1',
    knowledgeBaseName: 'Test Knowledge Base'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Component Rendering', () => {
    
    test('renders when show is true', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('Test Search')).toBeInTheDocument();
    });
    
    test('does not render when show is false', () => {
      render(<SearchTestModal {...mockProps} show={false} />);
      expect(screen.queryByText('Test Search')).not.toBeInTheDocument();
    });
    
    test('displays knowledge base name', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('Test Knowledge Base')).toBeInTheDocument();
    });
  });
  
  describe('Search Configuration', () => {
    
    test('renders search query input', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByPlaceholderText('Enter your search query...')).toBeInTheDocument();
    });
    
    test('allows typing in search query', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });
      
      expect(queryInput).toHaveValue('test query');
    });
    
    test('renders Top K slider', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText(/Top K Results:/i)).toBeInTheDocument();
    });
    
    test('renders minimum similarity slider', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText(/Minimum Similarity:/i)).toBeInTheDocument();
    });
    
    test('displays default Top K value', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    test('displays default minimum similarity value', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('0.70')).toBeInTheDocument();
    });
    
    test('updates Top K value when slider is moved', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '10' } });
      
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    
    test('updates minimum similarity when slider is moved', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const slider = screen.getAllByRole('slider')[1];
      fireEvent.change(slider, { target: { value: '0.85' } });
      
      expect(screen.getByText('0.85')).toBeInTheDocument();
    });
  });
  
  describe('Search Button', () => {
    
    test('renders search button', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
    
    test('search button is disabled when query is empty', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const searchButton = screen.getByText('Search').closest('button');
      expect(searchButton).toBeDisabled();
    });
    
    test('search button is enabled when query is entered', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      expect(searchButton).not.toBeDisabled();
    });
    
    test('executes search when button is clicked', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      });
    });
    
    test('executes search when Enter key is pressed', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });
      fireEvent.keyPress(queryInput, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      });
    });
  });
  
  describe('Reset Button', () => {
    
    test('renders reset button', () => {
      render(<SearchTestModal {...mockProps} />);
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });
    
    test('resets form when clicked', () => {
      render(<SearchTestModal {...mockProps} />);
      
      // Enter values
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });
      
      // Click reset
      const resetButton = screen.getByText('Reset').closest('button');
      if (resetButton) {
        fireEvent.click(resetButton);
      }
      
      // Check values are reset
      expect(queryInput).toHaveValue('');
    });
  });
  
  describe('Search Results', () => {
    
    test('displays search results after search completes', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'getting started' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays result count', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/result.*found/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays similarity scores', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Similarity')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays document titles in results', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'getting started' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started Guide')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays document content snippets', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/comprehensive guide/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  describe('No Results State', () => {
    
    test('displays no results message when no matches found', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      // Set high similarity threshold
      const similaritySlider = screen.getAllByRole('slider')[1];
      fireEvent.change(similaritySlider, { target: { value: '0.99' } });
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('No Results Found')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('suggests lowering similarity threshold', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const similaritySlider = screen.getAllByRole('slider')[1];
      fireEvent.change(similaritySlider, { target: { value: '0.99' } });
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Try lowering the minimum similarity/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  describe('Performance Metrics', () => {
    
    test('displays search latency', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays performance metrics section', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays average similarity', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Average Similarity:')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  describe('Modal Controls', () => {
    
    test('calls onHide when close button is clicked', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const closeButton = screen.getByText('Close').closest('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      expect(mockProps.onHide).toHaveBeenCalled();
    });
    
    test('calls onHide when X button is clicked', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.className.includes('btn-close'));
      
      if (xButton) {
        fireEvent.click(xButton);
        expect(mockProps.onHide).toHaveBeenCalled();
      }
    });
  });
  
  describe('Result Badges', () => {
    
    test('displays file type badges in results', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('MARKDOWN')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    test('displays result ranking', async () => {
      render(<SearchTestModal {...mockProps} />);
      
      const queryInput = screen.getByPlaceholderText('Enter your search query...');
      fireEvent.change(queryInput, { target: { value: 'test' } });
      
      const searchButton = screen.getByText('Search').closest('button');
      if (searchButton) {
        fireEvent.click(searchButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  describe('Accessibility', () => {
    
    test('has accessible form controls', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThan(0);
    });
    
    test('has accessible sliders', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBe(2);
    });
    
    test('has accessible buttons', () => {
      render(<SearchTestModal {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
