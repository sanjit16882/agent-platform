/**
 * DDTF Dimension Chart Component
 * Displays DDTF dimensions in a visual chart format
 */

import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { DDTFDimension } from '../../types/workflow';

interface DDTFDimensionChartProps {
  dimensions: DDTFDimension[];
}

export const DDTFDimensionChart: React.FC<DDTFDimensionChartProps> = ({ dimensions }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  };

  return (
    <Card className="h-100">
      <Card.Header>
        <h6 className="mb-0">📊 DDTF Dimensions</h6>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          {dimensions.map((dimension) => (
            <div key={dimension.name} className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <span>{getScoreIcon(dimension.score)}</span>
                  <strong className="small">{dimension.name}</strong>
                  <Badge bg={getScoreColor(dimension.score)} className="small">
                    {dimension.score}/100
                  </Badge>
                </div>
                <span className="text-muted small">
                  {dimension.passed}/{dimension.total}
                </span>
              </div>
              <ProgressBar 
                now={dimension.score} 
                variant={getScoreColor(dimension.score)}
                className="mb-1"
                style={{ height: '8px' }}
              />
              <div className="text-muted small">
                Weight: {(dimension.weight * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="border-top pt-3">
          <div className="row text-center">
            <div className="col-4">
              <div className="h6 text-success">
                {dimensions.filter(d => d.score >= 90).length}
              </div>
              <div className="text-muted small">Excellent</div>
            </div>
            <div className="col-4">
              <div className="h6 text-warning">
                {dimensions.filter(d => d.score >= 70 && d.score < 90).length}
              </div>
              <div className="text-muted small">Good</div>
            </div>
            <div className="col-4">
              <div className="h6 text-danger">
                {dimensions.filter(d => d.score < 70).length}
              </div>
              <div className="text-muted small">Needs Work</div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
