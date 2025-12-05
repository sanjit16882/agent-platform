import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import { ExecutionProgress } from '../services/progressService';

interface ExecutionTimerProps {
  execution: ExecutionProgress;
  compact?: boolean;
}

const ExecutionTimer: React.FC<ExecutionTimerProps> = ({ execution, compact = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getElapsedTime = (): number => {
    const endTime = execution.status === 'completed' || execution.status === 'failed' 
      ? (execution.steps.find(s => s.endTime)?.endTime || currentTime)
      : currentTime;
    
    return Math.floor((endTime.getTime() - execution.startTime.getTime()) / 1000);
  };

  const getRemainingTime = (): number | null => {
    if (execution.status !== 'running' || !execution.estimatedCompletion) {
      return null;
    }

    const remaining = Math.floor((execution.estimatedCompletion.getTime() - currentTime.getTime()) / 1000);
    return Math.max(0, remaining);
  };

  const getTimerVariant = () => {
    if (execution.status === 'completed') return 'success';
    if (execution.status === 'failed') return 'danger';
    
    const remaining = getRemainingTime();
    if (remaining !== null && remaining < 30) return 'warning';
    
    return 'primary';
  };

  const getTimerIcon = () => {
    if (execution.status === 'completed') return '✅';
    if (execution.status === 'failed') return '❌';
    return '⏱️';
  };

  if (compact) {
    return (
      <div className="text-end">
        <div className="small text-muted">
          {getTimerIcon()} {formatTime(getElapsedTime())}
        </div>
        {getRemainingTime() !== null && (
          <div className="small text-primary">
            ~{formatTime(getRemainingTime()!)} left
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-end">
      <Badge bg={getTimerVariant()} className="mb-1">
        {getTimerIcon()} Elapsed: {formatTime(getElapsedTime())}
      </Badge>
      
      {getRemainingTime() !== null && (
        <Badge bg="outline-secondary" className="text-muted">
          Est. Remaining: {formatTime(getRemainingTime()!)}
        </Badge>
      )}
      
      {execution.status === 'completed' && (
        <small className="text-success mt-1">
          Completed at {execution.startTime.toLocaleTimeString()}
        </small>
      )}
      
      {execution.status === 'failed' && (
        <small className="text-danger mt-1">
          Failed after {formatTime(getElapsedTime())}
        </small>
      )}

      {execution.status === 'running' && execution.estimatedCompletion && (
        <small className="text-muted mt-1">
          ETA: {execution.estimatedCompletion.toLocaleTimeString()}
        </small>
      )}
    </div>
  );
};

export default ExecutionTimer;