import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Spinner, ProgressBar } from 'react-bootstrap';
import { analyticsService, AgentPerformance } from '../services/analyticsService';

interface AgentPerformanceTableProps {
  refreshTrigger?: number;
}

const AgentPerformanceTable: React.FC<AgentPerformanceTableProps> = ({ refreshTrigger = 0 }) => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof AgentPerformance>('totalExecutions');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadAgentPerformance();
  }, [refreshTrigger]);

  const loadAgentPerformance = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAgentPerformance();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agent performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof AgentPerformance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: keyof AgentPerformance): string => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const filteredAndSortedAgents = agents
    .filter(agent => {
      const matchesCategory = filterCategory === 'all' || agent.category === filterCategory;
      const matchesSearch = agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getCategoryBadgeVariant = (category: string): string => {
    switch (category) {
      case 'QE': return 'primary';
      case 'DevOps': return 'info';
      case 'Security': return 'danger';
      case 'Business': return 'warning';
      default: return 'secondary';
    }
  };

  const getSuccessRateBadgeVariant = (rate: number): string => {
    if (rate >= 95) return 'success';
    if (rate >= 90) return 'warning';
    return 'danger';
  };

  const getTrendIcon = (direction: string, percentage: number): React.ReactElement => {
    const color = direction === 'up' ? 'success' : direction === 'down' ? 'danger' : 'secondary';
    const icon = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
    
    return (
      <Badge bg={color} className="small">
        {icon} {percentage.toFixed(1)}%
      </Badge>
    );
  };

  const getPopularityBar = (score: number): React.ReactElement => {
    const variant = score >= 90 ? 'success' : score >= 70 ? 'warning' : 'danger';
    return (
      <div>
        <ProgressBar 
          now={score} 
          variant={variant} 
          style={{ height: '8px' }}
          className="mb-1"
        />
        <small className="text-muted">{score}/100</small>
      </div>
    );
  };

  const categories = ['all', ...Array.from(new Set(agents.map(a => a.category)))];

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5>🏆 Agent Performance</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading agent performance data...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🏆 Agent Performance</h5>
        <Badge bg="info">{filteredAndSortedAgents.length} agents</Badge>
      </Card.Header>
      
      <Card.Body>
        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-6">
            <InputGroup size="sm">
              <InputGroup.Text>🔍</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="col-md-6">
            <Form.Select
              size="sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('agentName')}
                >
                  Agent {getSortIcon('agentName')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('totalExecutions')}
                >
                  Executions {getSortIcon('totalExecutions')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('successRate')}
                >
                  Success Rate {getSortIcon('successRate')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('averageExecutionTime')}
                >
                  Avg Time {getSortIcon('averageExecutionTime')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('userRating')}
                >
                  Rating {getSortIcon('userRating')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('totalCostSavings')}
                >
                  Cost Savings {getSortIcon('totalCostSavings')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('popularityScore')}
                >
                  Popularity {getSortIcon('popularityScore')}
                </th>
                <th>Trend</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAgents.map((agent, index) => (
                <tr key={agent.agentId}>
                  <td>
                    <div>
                      <div className="fw-bold">{agent.agentName}</div>
                      <Badge 
                        bg={getCategoryBadgeVariant(agent.category)} 
                        className="small"
                      >
                        {agent.category}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <span className="fw-bold">{formatNumber(agent.totalExecutions)}</span>
                  </td>
                  <td>
                    <Badge bg={getSuccessRateBadgeVariant(agent.successRate)}>
                      {agent.successRate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td>{formatTime(agent.averageExecutionTime)}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-1">⭐</span>
                      <span className="fw-bold">{agent.userRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-success fw-bold">
                      {formatCurrency(agent.totalCostSavings)}
                    </span>
                  </td>
                  <td style={{ minWidth: '120px' }}>
                    {getPopularityBar(agent.popularityScore)}
                  </td>
                  <td>
                    {getTrendIcon(agent.trendDirection, agent.trendPercentage)}
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatTimeAgo(agent.lastUsed)}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {filteredAndSortedAgents.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No agents match your current filters.</p>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AgentPerformanceTable;