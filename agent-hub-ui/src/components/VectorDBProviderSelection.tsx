/**
 * VectorDBProviderSelection
 * 
 * Main component for selecting Vector DB providers
 * Shows approved providers (ready to use) and marketplace providers (requires approval)
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { Icon } from './Icon';
import { VectorDBProvider } from '../types/vectorDB';
import api from '../utils/apiClient';

interface VectorDBProviderSelectionProps {
  onSelectProvider: (provider: VectorDBProvider) => void;
  onRequestAccess: (provider: VectorDBProvider) => void;
}

const VectorDBProviderSelection: React.FC<VectorDBProviderSelectionProps> = ({
  onSelectProvider,
  onRequestAccess
}) => {
  const [approvedProviders, setApprovedProviders] = useState<VectorDBProvider[]>([]);
  const [marketplaceProviders, setMarketplaceProviders] = useState<VectorDBProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProviders();
    fetchSavedConfigs();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/vector-db/providers');
      const data = await response.json();
      
      if (data.success) {
        setApprovedProviders(data.data.approved);
        setMarketplaceProviders(data.data.marketplace);
      } else {
        setError('Failed to load providers');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedConfigs = async () => {
    try {
      const response = await api.get('/api/v1/vector-db/configs');
      const data = await response.json();
      
      if (data.success) {
        const configuredIds = new Set<string>(
          data.data.map((config: any) => config.providerId as string)
        );
        setConfiguredProviders(configuredIds);
        console.log(`✅ Loaded ${configuredIds.size} saved Vector DB configurations`);
      }
    } catch (err: any) {
      console.error('Failed to load saved configurations:', err);
    }
  };

  const getCategoryBadge = (category: string) => {
    return <Badge bg="secondary">{category}</Badge>;
  };

  const getPricingBadge = (pricing?: VectorDBProvider['pricing']) => {
    if (!pricing) return null;
    
    if (pricing.model === 'free') {
      return <Badge bg="secondary">Free</Badge>;
    } else if (pricing.model === 'subscription') {
      return <Badge bg="secondary">${pricing.estimatedMonthlyCost}/mo</Badge>;
    } else {
      return <Badge bg="secondary">Usage-based</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading Vector DB providers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Providers</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchProviders}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="vector-db-provider-selection">
      {/* Approved Providers Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-3">
          <h4 className="mb-0">✅ Approved Providers</h4>
        </div>

        <Row>
          {approvedProviders.map(provider => (
            <Col key={provider.id} md={4} className="mb-3">
              <Card className="h-100 provider-card" style={{ cursor: 'pointer' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">
                        <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
                          {provider.icon}
                        </span>
                        {provider.name}
                        {configuredProviders.has(provider.id) && (
                          <Badge bg="light" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                            ✓ Configured
                          </Badge>
                        )}
                      </h5>
                    </div>
                  </div>

                  <p className="text-muted small mb-3">
                    {provider.description}
                  </p>

                  <div className="mb-3">
                    <small className="text-muted">
                      {getPricingBadge(provider.pricing)?.props.children} • Max {(provider.capabilities.maxDocuments / 1000000).toFixed(0)}M docs
                    </small>
                  </div>

                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      onClick={() => onSelectProvider(provider)}
                    >
                      Configure
                    </Button>
                    {provider.documentation?.setupGuide && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => window.open(provider.documentation?.setupGuide, '_blank')}
                      >
                        📚 Documentation
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Marketplace Providers Section */}
      <div>
        <div className="d-flex align-items-center mb-3">
          <h4 className="mb-0">🔒 Marketplace</h4>
        </div>

        <Row>
          {marketplaceProviders.map(provider => (
            <Col key={provider.id} md={4} className="mb-3">
              <Card className="h-100 provider-card marketplace-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">
                        <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
                          {provider.icon}
                        </span>
                        {provider.name}
                      </h5>
                    </div>
                  </div>

                  <p className="text-muted small mb-3">
                    {provider.description}
                  </p>

                  <div className="mb-3">
                    <small className="text-muted">
                      {getPricingBadge(provider.pricing)?.props.children} • Max {(provider.capabilities.maxDocuments / 1000000).toFixed(0)}M docs
                    </small>
                  </div>

                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => onRequestAccess(provider)}
                    >
                      🔒 Request Access
                    </Button>
                    {provider.documentation?.setupGuide && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => window.open(provider.documentation?.setupGuide, '_blank')}
                      >
                        📚 Documentation
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <style>{`
        .provider-card {
          transition: all 0.2s ease;
          border: 2px solid #e5e7eb;
        }
        
        .provider-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }
        
        .marketplace-card {
          border-color: #fbbf24;
          background: linear-gradient(to bottom, #fffbeb 0%, #ffffff 100%);
        }
        
        .marketplace-card:hover {
          border-color: #f59e0b;
        }
      `}</style>
    </div>
  );
};

export default VectorDBProviderSelection;
