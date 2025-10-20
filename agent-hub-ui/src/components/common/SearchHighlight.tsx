import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
  highlightClassName?: string;
}

const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  searchTerm,
  className = '',
  highlightClassName = 'search-highlight'
}) => {
  if (!searchTerm) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  const highlightStyle: React.CSSProperties = {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontWeight: 600,
    padding: '1px 2px',
    borderRadius: '2px'
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
        return isMatch ? (
          <span
            key={index}
            className={highlightClassName}
            style={highlightStyle}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

export default SearchHighlight;