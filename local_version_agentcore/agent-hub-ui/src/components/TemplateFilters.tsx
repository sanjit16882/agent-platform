import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Badge, Button, Accordion, ButtonGroup } from 'react-bootstrap';
import { TemplateFilters as ITemplateFilters } from '../services/templateService';

interface TemplateFiltersProps {
  onFilterChange: (filters: ITemplateFilters) => void;
  categoryStats: Array<{ category: string; count: number; filteredCount?: number }>;
  currentFilters?: ITemplateFilters; // Pass current filters from parent
}

const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  onFilterChange,
  categoryStats,
  currentFilters = {}
}) => {
  const [filters, setFilters] = useState<ITemplateFilters>(currentFilters);
  const initialLoad = useRef(true);
  const prevFiltersRef = useRef<ITemplateFilters>({});

  // Sync with parent's current filters when component remounts
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Call onFilterChange whenever filters change (skip initial empty state)
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      prevFiltersRef.current = filters;
      return; // Skip initial call
    }
    
    // Check if filters actually changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    
    if (filtersChanged) {
      onFilterChange(filters);
      prevFiltersRef.current = filters;
    }
  }, [filters]);

  const updateFilters = (newFilters: Partial<ITemplateFilters>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      return updatedFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : value !== undefined
    );
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prevFilters => {
      const currentCategories = prevFilters.category || [];
      let newCategories;
      if (checked) {
        // Add the category if checked
        newCategories = [...currentCategories, category];
      } else {
        // Remove the category if unchecked
        newCategories = currentCategories.filter(c => c !== category);
      }
      
      const updatedFilters = { 
        ...prevFilters, 
        category: newCategories.length > 0 ? newCategories : undefined 
      };
      
      return updatedFilters;
    });
  };

  const handleComplexityChange = (complexity: string, checked: boolean) => {
    setFilters(prevFilters => {
      const currentComplexity = prevFilters.complexity || [];
      let newComplexity;
      if (checked) {
        // Add the complexity if checked
        newComplexity = [...currentComplexity, complexity];
      } else {
        // Remove the complexity if unchecked
        newComplexity = currentComplexity.filter(c => c !== complexity);
      }
      
      const updatedFilters = { 
        ...prevFilters, 
        complexity: newComplexity.length > 0 ? newComplexity : undefined 
      };
      
      // Call onFilterChange with setTimeout to avoid render cycle issues
      setTimeout(() => onFilterChange(updatedFilters), 0);
      return updatedFilters;
    });
  };

  const handleTechnologyChange = (technology: string, checked: boolean) => {
    setFilters(prevFilters => {
      const currentTechnologies = prevFilters.technologies || [];
      let newTechnologies;
      if (checked) {
        // Add the technology if checked
        newTechnologies = [...currentTechnologies, technology];
      } else {
        // Remove the technology if unchecked
        newTechnologies = currentTechnologies.filter(t => t !== technology);
      }
      
      const updatedFilters = { 
        ...prevFilters, 
        technologies: newTechnologies.length > 0 ? newTechnologies : undefined 
      };
      
      // Call onFilterChange with setTimeout to avoid render cycle issues
      setTimeout(() => onFilterChange(updatedFilters), 0);
      return updatedFilters;
    });
  };

  const handleApprovalStatusChange = (status: string, checked: boolean) => {
    setFilters(prevFilters => {
      const currentStatuses = prevFilters.approvalStatus || [];
      let newStatuses;
      if (checked) {
        // Add the status if checked
        newStatuses = [...currentStatuses, status];
      } else {
        // Remove the status if unchecked
        newStatuses = currentStatuses.filter(s => s !== status);
      }
      
      const updatedFilters = { 
        ...prevFilters, 
        approvalStatus: newStatuses.length > 0 ? newStatuses : undefined 
      };
      
      // Call onFilterChange with setTimeout to avoid render cycle issues
      setTimeout(() => onFilterChange(updatedFilters), 0);
      return updatedFilters;
    });
  };

  const handleComplianceStatusChange = (status: string, checked: boolean) => {
    setFilters(prevFilters => {
      const currentStatuses = prevFilters.complianceStatus || [];
      let newStatuses;
      if (checked) {
        // Add the status if checked
        newStatuses = [...currentStatuses, status];
      } else {
        // Remove the status if unchecked
        newStatuses = currentStatuses.filter(s => s !== status);
      }
      
      const updatedFilters = { 
        ...prevFilters, 
        complianceStatus: newStatuses.length > 0 ? newStatuses : undefined 
      };
      
      // Call onFilterChange with setTimeout to avoid render cycle issues
      setTimeout(() => onFilterChange(updatedFilters), 0);
      return updatedFilters;
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'QE': 'QE',
      'DevOps': 'OPS',
      'Security': 'SEC',
      'Business': 'BIZ'
    };
    return icons[category as keyof typeof icons] || 'GEN';
  };

  const popularTechnologies = [
    'Playwright', 'Selenium', 'Cypress', 'TypeScript', 'Python', 'Docker',
    'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform', 'AWS', 'React'
  ];

  return (
    <Card className="sticky-top" style={{ top: '20px' }}>
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Filters</h6>
          {hasActiveFilters() && (
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
          {/* Category Filter */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              Categories
              {filters.category && filters.category.length > 0 && (
                <Badge bg="primary" className="ms-2">
                  {filters.category.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              {categoryStats.map(({ category, count, filteredCount }) => (
                <Form.Check
                  key={category}
                  type="checkbox"
                  id={`category-${category}`}
                  label={
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span>
                        {getCategoryIcon(category)} {category}
                      </span>
                      <Badge bg="light" text="dark" className="small">
                        {filteredCount !== undefined && filteredCount !== count 
                          ? `${filteredCount}/${count}` 
                          : count}
                      </Badge>
                    </div>
                  }
                  checked={filters.category?.includes(category) || false}
                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Governance Filter */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Governance
              {((filters.approvalStatus?.length || 0) + (filters.complianceStatus?.length || 0)) > 0 && (
                <Badge bg="info" className="ms-2">
                  {(filters.approvalStatus?.length || 0) + (filters.complianceStatus?.length || 0)}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <small className="text-muted fw-bold">Approval Status</small>
                {['Approved', 'Pending', 'Draft', 'Rejected'].map(status => (
                  <Form.Check
                    key={status}
                    type="checkbox"
                    id={`approval-${status}`}
                    label={status}
                    checked={filters.approvalStatus?.includes(status) || false}
                    onChange={(e) => handleApprovalStatusChange(status, e.target.checked)}
                    className="mb-1"
                  />
                ))}
              </div>
              
              <div>
                <small className="text-muted fw-bold">Compliance Status</small>
                {['Compliant', 'Under-Review', 'Non-Compliant'].map(status => (
                  <Form.Check
                    key={status}
                    type="checkbox"
                    id={`compliance-${status}`}
                    label={status === 'Under-Review' ? 'Under Review' : status}
                    checked={filters.complianceStatus?.includes(status) || false}
                    onChange={(e) => handleComplianceStatusChange(status, e.target.checked)}
                    className="mb-1"
                  />
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Complexity Filter */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              Complexity
              {filters.complexity && filters.complexity.length > 0 && (
                <Badge bg="warning" className="ms-2">
                  {filters.complexity.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              {['Beginner', 'Intermediate', 'Advanced'].map(complexity => (
                <Form.Check
                  key={complexity}
                  type="checkbox"
                  id={`complexity-${complexity}`}
                  label={
                    <span>
                      {complexity}
                    </span>
                  }
                  checked={filters.complexity?.includes(complexity) || false}
                  onChange={(e) => handleComplexityChange(complexity, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Technology Filter */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>
              Technologies
              {filters.technologies && filters.technologies.length > 0 && (
                <Badge bg="success" className="ms-2">
                  {filters.technologies.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <small className="text-muted">Popular Technologies</small>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {popularTechnologies.slice(0, 8).map(tech => (
                    <Badge
                      key={tech}
                      bg={filters.technologies?.includes(tech) ? 'primary' : 'light'}
                      text={filters.technologies?.includes(tech) ? 'white' : 'dark'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTechnologyChange(tech, !filters.technologies?.includes(tech))}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="mb-2">
                <small className="text-muted">All Technologies</small>
              </div>
              {popularTechnologies.map(tech => (
                <Form.Check
                  key={tech}
                  type="checkbox"
                  id={`tech-${tech}`}
                  label={tech}
                  checked={filters.technologies?.includes(tech) || false}
                  onChange={(e) => handleTechnologyChange(tech, e.target.checked)}
                  className="mb-1 small"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Rating and Usage Filter */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>
              Quality & Usage
            </Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <Form.Label className="small text-muted">Minimum Rating</Form.Label>
                <Form.Range
                  min={0}
                  max={5}
                  step={0.5}
                  value={filters.minRating || 0}
                  onChange={(e) => updateFilters({ 
                    minRating: parseFloat(e.target.value) || undefined 
                  })}
                />
                <div className="d-flex justify-content-between">
                  <small>0 stars</small>
                  <small className="fw-bold">
                    {filters.minRating ? `${filters.minRating}+ stars` : 'Any'}
                  </small>
                  <small>5 stars</small>
                </div>
              </div>
              
              <div>
                <Form.Label className="small text-muted">Max Setup Time (minutes)</Form.Label>
                <Form.Range
                  min={5}
                  max={60}
                  step={5}
                  value={filters.maxSetupTime || 60}
                  onChange={(e) => updateFilters({ 
                    maxSetupTime: parseInt(e.target.value) || undefined 
                  })}
                />
                <div className="d-flex justify-content-between">
                  <small>5 min</small>
                  <small className="fw-bold">
                    {filters.maxSetupTime ? `≤${filters.maxSetupTime} min` : '≤60 min'}
                  </small>
                  <small>60 min</small>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
      
      {/* Quick Filter Presets */}
      <Card.Footer className="bg-light">
        <small className="text-muted d-block mb-2">Quick Filters</small>
        <div className="d-grid gap-1">
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => updateFilters({
              approvalStatus: ['Approved'],
              complianceStatus: ['Compliant'],
              minRating: 4.0
            })}
          >
            Production Ready
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => updateFilters({
              complexity: ['Beginner'],
              maxSetupTime: 15
            })}
          >
            Quick Start
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => updateFilters({
              category: ['Security'],
              complianceStatus: ['Compliant']
            })}
          >
            Security Focus
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default TemplateFilters;