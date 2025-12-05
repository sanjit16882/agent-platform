/**
 * Icon Service - Centralized Brand Icon Management
 * Provides real brand logos for external services and tools
 */

import { IconType } from 'react-icons';
import { SiPostgresql, SiMongodb, SiRedis, SiMysql } from 'react-icons/si';

export interface BrandIcon {
  name: string;
  displayName: string;
  component: IconType;
  color: string;  // Official brand color
  category: string;
}

/**
 * Vector Database Icons
 * Using official brand colors and logos
 */
export const vectorDBIcons: Record<string, BrandIcon> = {
  pinecone: {
    name: 'pinecone',
    displayName: 'Pinecone',
    component: SiPostgresql, // Placeholder - will use custom SVG
    color: '#000000',
    category: 'vector-db'
  },
  weaviate: {
    name: 'weaviate',
    displayName: 'Weaviate',
    component: SiPostgresql, // Placeholder
    color: '#00C853',
    category: 'vector-db'
  },
  milvus: {
    name: 'milvus',
    displayName: 'Milvus',
    component: SiPostgresql, // Placeholder
    color: '#00A1EA',
    category: 'vector-db'
  },
  qdrant: {
    name: 'qdrant',
    displayName: 'Qdrant',
    component: SiPostgresql, // Placeholder
    color: '#DC244C',
    category: 'vector-db'
  },
  chromadb: {
    name: 'chromadb',
    displayName: 'ChromaDB',
    component: SiPostgresql, // Placeholder
    color: '#FF6B6B',
    category: 'vector-db'
  },
  chroma: {
    name: 'chroma',
    displayName: 'ChromaDB',
    component: SiPostgresql, // Placeholder
    color: '#FF6B6B',
    category: 'vector-db'
  },
  opensearch: {
    name: 'opensearch',
    displayName: 'OpenSearch',
    component: SiPostgresql, // Placeholder
    color: '#005EB8',
    category: 'vector-db'
  },
  postgresql: {
    name: 'postgresql',
    displayName: 'PostgreSQL',
    component: SiPostgresql,
    color: '#336791',
    category: 'database'
  },
  pgvector: {
    name: 'pgvector',
    displayName: 'PostgreSQL (pgvector)',
    component: SiPostgresql,
    color: '#336791',
    category: 'vector-db'
  }
};

/**
 * Database Icons
 */
export const databaseIcons: Record<string, BrandIcon> = {
  postgresql: {
    name: 'postgresql',
    displayName: 'PostgreSQL',
    component: SiPostgresql,
    color: '#336791',
    category: 'database'
  },
  mongodb: {
    name: 'mongodb',
    displayName: 'MongoDB',
    component: SiMongodb,
    color: '#47A248',
    category: 'database'
  },
  redis: {
    name: 'redis',
    displayName: 'Redis',
    component: SiRedis,
    color: '#DC382D',
    category: 'database'
  },
  mysql: {
    name: 'mysql',
    displayName: 'MySQL',
    component: SiMysql,
    color: '#4479A1',
    category: 'database'
  }
};

/**
 * All brand icons combined
 */
export const brandIcons: Record<string, BrandIcon> = {
  ...vectorDBIcons,
  ...databaseIcons
};

/**
 * Get brand icon by name
 */
export const getBrandIcon = (name: string): BrandIcon | null => {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '');
  return brandIcons[normalizedName] || null;
};

/**
 * Get brand icons by category
 */
export const getBrandIconsByCategory = (category: string): BrandIcon[] => {
  return Object.values(brandIcons).filter(icon => icon.category === category);
};

/**
 * Get all vector DB icons
 */
export const getVectorDBIcons = (): BrandIcon[] => {
  return getBrandIconsByCategory('vector-db');
};

/**
 * Get all database icons
 */
export const getDatabaseIcons = (): BrandIcon[] => {
  return getBrandIconsByCategory('database');
};
