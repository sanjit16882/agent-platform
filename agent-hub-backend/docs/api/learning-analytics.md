# Learning Analytics System

## Overview

The Learning Analytics System tracks user interactions with agents and provides insights into learning patterns, acceptance rates, and user engagement.

## Features

### Real-Time Tracking
- **Interaction Tracking**: Automatically tracks every agent execution
- **Feedback Collection**: Captures user feedback (positive/negative/neutral)
- **User Profiles**: Maintains individual learning profiles for each user
- **Intent Analysis**: Tracks which intents users are most interested in

### Analytics Dashboard
- **Platform Metrics**: Total users, active users, interaction counts
- **Acceptance Rates**: Percentage of suggestions accepted by users
- **Learning Velocity**: Average interactions per user per week
- **Top Intents**: Most popular user intents
- **Suggestion Performance**: Feedback scores by suggestion type
- **AI-Generated Insights**: Automatic recommendations based on data

### User Profiles
Each user has a profile that tracks:
- Interaction count and history
- Acceptance rate
- Learning progress (0-100%)
- Exploration level (how diverse their agent usage is)
- Confidence threshold (for suggestion filtering)
- Personalized recommendations

## Data Storage

All learning data is stored in JSON files under `data/learning/`:
- `interactions.json` - All user interactions (max 10,000)
- `feedback.json` - User feedback entries (max 5,000)
- `user-profiles.json` - Individual user profiles
- `ab-tests.json` - A/B testing results (future feature)

## API Endpoints

### Get Analytics
```
GET /api/intelligence/learning-analytics
```
Returns platform-wide learning analytics.

### Get User Profile
```
GET /api/intelligence/learning/profile/:userId
```
Returns learning profile for a specific user.

### Track Interaction
```
POST /api/intelligence/learning/track-interaction
Body: {
  userId: string,
  agentId: string,
  agentName: string,
  intent: string,
  query: string,
  accepted: boolean,
  success: boolean,
  executionTime: number
}
```

### Track Feedback
```
POST /api/intelligence/learning/track-feedback
Body: {
  userId: string,
  agentId: string,
  type: 'positive' | 'negative' | 'neutral',
  rating: number (1-5),
  category: string,
  comment: string
}
```

### Optimize Profile
```
POST /api/intelligence/learning/optimize
Body: {
  userId: string,
  optimizationType: 'confidence_threshold' | 'exploration_level' | 'full_optimization'
}
```

### Export Data
```
GET /api/intelligence/learning/export
```
Exports all learning data for analysis.

## Automatic Tracking

The system automatically tracks interactions when:
1. An agent is executed via `/api/v1/agents/:agentId/execute`
2. A query is analyzed via `/api/intelligence/analyze-query-dynamic`

No additional code is needed in the frontend - tracking happens automatically!

## Seeding Sample Data

To generate sample learning data for testing:

```bash
node seed-learning-data.js
```

This creates 150 sample interactions across 5 users with realistic patterns.

## Insights Generation

The system automatically generates insights based on:
- **Acceptance Rate**: High (>75%), Medium (50-75%), Low (<50%)
- **User Engagement**: Active user percentage
- **Feedback Rate**: Percentage of interactions with feedback
- **Learning Velocity**: Interactions per user per week

## Future Enhancements

- [ ] A/B testing framework for suggestion algorithms
- [ ] Machine learning model training from feedback
- [ ] Predictive analytics for user behavior
- [ ] Real-time dashboard updates via WebSocket
- [ ] Export to CSV/Excel formats
- [ ] Integration with external analytics platforms
- [ ] Anomaly detection for unusual patterns
- [ ] Cohort analysis and segmentation

## Privacy & Security

- User IDs are anonymized in exports
- Data retention: 10,000 interactions, 5,000 feedback entries
- No PII is stored in learning data
- All data is stored locally in JSON files
