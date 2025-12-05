# Icon System Usage Examples

## Basic Usage

```tsx
import { Icon } from '../components/Icon';

// Basic icon with default size (medium)
<Icon name="agentHub" />

// Icon with custom size
<Icon name="agent" size="large" />
<Icon name="dashboard" size={32} />

// Icon with color
<Icon name="success" color="success" />
<Icon name="warning" color="#fd7e14" />

// Icon with custom styling
<Icon 
  name="analytics" 
  size="large" 
  color="primary" 
  className="me-2"
  aria-label="Analytics dashboard"
/>
```

## Common Replacements

### Navbar Brand
```tsx
// Before: ⚡ AgentHub
// After:
<Icon name="agentHub" size="large" color="primary" /> AgentHub
```

### Agent Cards
```tsx
// Before: 🤖 Agent Name
// After:
<Icon name="agent" size="medium" color="info" /> Agent Name
```

### Dashboard Sections
```tsx
// Before: 🏠 Dashboard
// After:
<Icon name="dashboard" size="medium" /> Dashboard

// Before: 📊 Analytics
// After:
<Icon name="analytics" size="medium" /> Analytics
```

## Available Icons

- `agentHub` - Main brand icon (replaces ⚡)
- `agent` - Agent representation (replaces 🤖)
- `dashboard` - Dashboard/home (replaces 🏠)
- `upload` - Upload functionality (replaces 🚀)
- `enterprise` - Enterprise features (replaces 🔌)
- `security` - Security features (replaces 🔒)
- `analytics` - Analytics/charts (replaces 📊)
- `activity` - Activity indicators
- `success` - Success states
- `time` - Time/clock indicators
- `target` - Goals/targets
- `award` - Achievements

## Size Presets

- `small`: 16px
- `medium`: 20px (default)
- `large`: 24px
- `xlarge`: 32px

## Color Presets

- `primary`: #0066cc
- `success`: #28a745
- `warning`: #fd7e14
- `danger`: #dc3545
- `info`: #17a2b8
- `dark`: #343a40
- `muted`: #6c757d