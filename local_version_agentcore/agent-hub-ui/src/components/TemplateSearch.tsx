import React, { useState, useEffect, useRef } from 'react';
import { InputGroup, Form, Button, Dropdown, Badge } from 'react-bootstrap';
import { templateService } from '../services/templateService';

interface TemplateSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({
  onSearch,
  placeholder = "Search templates..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Popular search terms and suggestions
  const popularSearches = [
    'Selenium automation',
    'API testing',
    'Security scanning',
    'CI/CD pipeline',
    'Performance testing',
    'Docker deployment',
    'Kubernetes monitoring',
    'Business analytics',
    'Compliance checking',
    'Test automation'
  ];

  const searchCategories = [
    { name: 'QE & Testing', icon: 'QE', terms: ['selenium', 'cypress', 'playwright', 'api testing', 'performance'] },
    { name: 'DevOps', icon: 'OPS', terms: ['docker', 'kubernetes', 'terraform', 'jenkins', 'monitoring'] },
    { name: 'Security', icon: 'SEC', terms: ['vulnerability', 'compliance', 'scanning', 'owasp', 'security'] },
    { name: 'Business', icon: 'BIZ', terms: ['analytics', 'reporting', 'dashboard', 'data', 'insights'] }
  ];

  useEffect(() => {
    // Debounce search to avoid too many API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
        generateSuggestions(searchTerm);
      } else {
        onSearch('');
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    setIsLoading(true);
    try {
      onSearch(term);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (term: string) => {
    const lowerTerm = term.toLowerCase();
    const matchingSuggestions = popularSearches
      .filter(suggestion => 
        suggestion.toLowerCase().includes(lowerTerm) && 
        suggestion.toLowerCase() !== lowerTerm
      )
      .slice(0, 5);

    // Add category-based suggestions
    searchCategories.forEach(category => {
      category.terms.forEach(categoryTerm => {
        if (categoryTerm.includes(lowerTerm) && !matchingSuggestions.includes(categoryTerm)) {
          matchingSuggestions.push(`${categoryTerm} (${category.name})`);
        }
      });
    });

    setSuggestions(matchingSuggestions.slice(0, 8));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Remove category suffix if present
    const cleanSuggestion = suggestion.replace(/ \([^)]+\)$/, '');
    setSearchTerm(cleanSuggestion);
    setShowSuggestions(false);
    onSearch(cleanSuggestion);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    onSearch('');
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (searchTerm.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="position-relative">
      <InputGroup>
        <InputGroup.Text>
          {isLoading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Searching...</span>
            </div>
          ) : (
            <span>Search</span>
          )}
        </InputGroup.Text>
        
        <Form.Control
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="border-start-0"
        />
        
        {searchTerm && (
          <Button
            variant="outline-secondary"
            onClick={handleClearSearch}
            className="border-start-0"
          >
            ✕
          </Button>
        )}
        
        <Dropdown show={showSuggestions && (suggestions.length > 0 || searchTerm.length === 0)}>
          <Dropdown.Menu 
            className="w-100 mt-1 shadow-lg border-0"
            style={{ 
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1050,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {searchTerm.length === 0 ? (
              // Show popular searches when no search term
              <>
                <Dropdown.Header className="d-flex align-items-center">
                  <span className="me-2">🔥</span>
                  Popular Searches
                </Dropdown.Header>
                {popularSearches.slice(0, 6).map((search, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="d-flex align-items-center"
                  >
                    <span className="me-2">→</span>
                    {search}
                  </Dropdown.Item>
                ))}
                
                <Dropdown.Divider />
                
                <Dropdown.Header className="d-flex align-items-center">
                  <span className="me-2">📂</span>
                  Browse by Category
                </Dropdown.Header>
                {searchCategories.map((category, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => handleSuggestionClick(category.terms[0])}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <span>
                      <span className="me-2">{category.icon}</span>
                      {category.name}
                    </span>
                    <Badge bg="light" text="dark" className="small">
                      {category.terms.length} terms
                    </Badge>
                  </Dropdown.Item>
                ))}
              </>
            ) : suggestions.length > 0 ? (
              // Show search suggestions
              <>
                <Dropdown.Header className="d-flex align-items-center">
                  <span className="me-2">•</span>
                  Suggestions for "{searchTerm}"
                </Dropdown.Header>
                {suggestions.map((suggestion, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="d-flex align-items-center"
                  >
                    <span className="me-2">→</span>
                    <span dangerouslySetInnerHTML={{
                      __html: suggestion.replace(
                        new RegExp(`(${searchTerm})`, 'gi'),
                        '<strong>$1</strong>'
                      )
                    }} />
                  </Dropdown.Item>
                ))}
                
                <Dropdown.Divider />
                
                <Dropdown.Item
                  onClick={() => {
                    onSearch(searchTerm);
                    setShowSuggestions(false);
                  }}
                  className="d-flex align-items-center text-primary"
                >
                  <span className="me-2">→</span>
                  Search for "{searchTerm}"
                </Dropdown.Item>
              </>
            ) : (
              // No suggestions found
              <Dropdown.Item disabled className="text-muted">
                <span className="me-2">🤔</span>
                No suggestions found
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </InputGroup>

      {/* Search Tips */}
      {searchTerm.length === 0 && (
        <div className="mt-2">
          <small className="text-muted">
            Try searching for: "selenium", "api testing", "security scan", or "ci/cd"
          </small>
        </div>
      )}

      {/* Search Results Summary */}
      {searchTerm.length > 0 && (
        <div className="mt-2 d-flex align-items-center justify-content-between">
          <small className="text-muted">
            Searching for: <strong>"{searchTerm}"</strong>
          </small>
          <div className="d-flex gap-1">
            <Badge 
              bg="light" 
              text="dark" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSuggestionClick('selenium ' + searchTerm)}
            >
              + Selenium
            </Badge>
            <Badge 
              bg="light" 
              text="dark" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSuggestionClick('api ' + searchTerm)}
            >
              + API
            </Badge>
            <Badge 
              bg="light" 
              text="dark" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSuggestionClick('security ' + searchTerm)}
            >
              + Security
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSearch;