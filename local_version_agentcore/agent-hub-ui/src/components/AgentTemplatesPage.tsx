import React from 'react';
import { useNavigate } from 'react-router-dom';
import AgentTemplateSelector from './AgentTemplateSelector';

const AgentTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTemplate = (template: any) => {
    // Navigate to agent builder with template data in state
    navigate('/agent-builder', { 
      state: { selectedTemplate: template }
    });
  };

  return <AgentTemplateSelector onSelectTemplate={handleSelectTemplate} />;
};

export default AgentTemplatesPage;
