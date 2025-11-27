# DDTF Component Usage Guide

Quick reference for using DDTF components in your application.

---

## TestInputEditor

### Basic Usage

```tsx
import { TestInputEditor } from './components/testing';

function MyComponent() {
  const handleSave = (content: string, format: string) => {
    console.log('Saved:', { content, format });
    // Save to backend API
  };

  return (
    <TestInputEditor
      initialValue=""
      initialFormat="plain_text"
      onSave={handleSave}
    />
  );
}
```

### With Initial Data

```tsx
<TestInputEditor
  initialValue='{"prompt": "Test prompt"}'
  initialFormat="json"
  onSave={handleSave}
  onChange={(content, format) => console.log('Changed')}
/>
```

### Read-Only Mode

```tsx
<TestInputEditor
  initialValue="Read-only content"
  initialFormat="plain_text"
  readOnly={true}
/>
```

---

## Input Formats

### 1. Plain Text
Simple text prompts for straightforward testing.

```
What is the capital of France?
```

### 2. JSON
Structured data with key-value pairs.

```json
{
  "prompt": "What is the capital of France?",
  "context": "Geography quiz",
  "expectedAnswer": "Paris"
}
```

### 3. Multi-turn
Conversation arrays with role and content fields.

```json
[
  {
    "role": "user",
    "content": "Hello"
  },
  {
    "role": "assistant",
    "content": "Hi! How can I help?"
  },
  {
    "role": "user",
    "content": "What's the weather?"
  }
]
```

**Valid roles:** `user`, `assistant`, `system`

### 4. Parameterized
Text with ${variable} placeholders for dynamic testing.

```
Hello ${name}, your order ${orderId} is ready for pickup at ${location}.
```

**Parameters:**
- name: "John"
- orderId: "12345"
- location: "Store #42"

**Result:**
```
Hello John, your order 12345 is ready for pickup at Store #42.
```

---

## API Integration

### Creating a Test

```typescript
const createTest = async (content: string, format: string) => {
  const response = await fetch('/api/testing/library/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'My Test',
      description: 'Test description',
      type: 'user',
      category: 'functional',
      input_format: format,
      input_content: content,
      expected_behavior: 'Expected behavior description'
    })
  });
  
  return response.json();
};
```

### Updating a Test

```typescript
const updateTest = async (testId: string, content: string, format: string) => {
  const response = await fetch(`/api/testing/library/${testId}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_format: format,
      input_content: content
    })
  });
  
  return response.json();
};
```

### Loading a Test

```typescript
const loadTest = async (testId: string) => {
  const response = await fetch(`/api/testing/library/${testId}`);
  const data = await response.json();
  
  return {
    content: data.test.input_content,
    format: data.test.input_format
  };
};
```

---

## Validation Rules

### Plain Text
- Must not be empty
- No special validation

### JSON
- Must be valid JSON syntax
- Will show parse errors with line numbers

### Multi-turn
- Must be valid JSON array
- Each turn must have `role` and `content` fields
- Role must be one of: `user`, `assistant`, `system`

### Parameterized
- Must not be empty
- Parameters extracted from ${variable} syntax
- All parameters must have values before saving

---

## Props Reference

### TestInputEditor Props

```typescript
interface TestInputEditorProps {
  // Initial content to display
  initialValue?: string;
  
  // Initial format selection
  initialFormat?: 'plain_text' | 'json' | 'multi_turn' | 'parameterized';
  
  // Called when user clicks Save button
  onSave?: (content: string, format: string) => void;
  
  // Called whenever content or format changes
  onChange?: (content: string, format: string) => void;
  
  // Disable editing
  readOnly?: boolean;
}
```

---

## Styling

The component uses the enterprise design system from `src/styles/theme.js`.

### Custom Styling

```tsx
<TestInputEditor
  initialValue=""
  initialFormat="plain_text"
  onSave={handleSave}
  style={{ marginBottom: '2rem' }}
/>
```

### Theme Colors
- Primary: #2563eb
- Success: #10b981
- Danger: #ef4444
- Border: #e2e8f0

---

## Error Handling

### Validation Errors

The component displays validation errors automatically:

```tsx
// Invalid JSON
{
  "prompt": "Missing closing brace"

// Error shown:
⚠ Validation Errors:
• Invalid JSON: Unexpected end of JSON input
```

### Handling Save Errors

```tsx
const handleSave = async (content: string, format: string) => {
  try {
    await createTest(content, format);
    alert('Test saved successfully!');
  } catch (error) {
    alert('Failed to save test: ' + error.message);
  }
};
```

---

## Examples

### Example 1: Simple Test Creator

```tsx
import React, { useState } from 'react';
import { TestInputEditor } from './components/testing';

function TestCreator() {
  const [testName, setTestName] = useState('');
  
  const handleSave = async (content: string, format: string) => {
    const response = await fetch('/api/testing/library/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        type: 'user',
        category: 'functional',
        input_format: format,
        input_content: content
      })
    });
    
    if (response.ok) {
      alert('Test created!');
    }
  };
  
  return (
    <div>
      <input
        type="text"
        placeholder="Test name"
        value={testName}
        onChange={(e) => setTestName(e.target.value)}
      />
      <TestInputEditor
        initialFormat="plain_text"
        onSave={handleSave}
      />
    </div>
  );
}
```

### Example 2: Test Editor with Load

```tsx
import React, { useState, useEffect } from 'react';
import { TestInputEditor } from './components/testing';

function TestEditor({ testId }: { testId: string }) {
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('plain_text');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTest();
  }, [testId]);
  
  const loadTest = async () => {
    const response = await fetch(`/api/testing/library/${testId}`);
    const data = await response.json();
    setContent(data.test.input_content);
    setFormat(data.test.input_format);
    setLoading(false);
  };
  
  const handleSave = async (newContent: string, newFormat: string) => {
    await fetch(`/api/testing/library/${testId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_format: newFormat,
        input_content: newContent
      })
    });
    alert('Test updated!');
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <TestInputEditor
      initialValue={content}
      initialFormat={format}
      onSave={handleSave}
    />
  );
}
```

### Example 3: Parameterized Test with Preview

```tsx
import React from 'react';
import { TestInputEditor } from './components/testing';

function ParameterizedTestCreator() {
  const handleSave = (content: string, format: string) => {
    console.log('Template:', content);
    // Save template to backend
  };
  
  return (
    <div>
      <h2>Create Parameterized Test</h2>
      <p>Use ${'{variable}'} syntax for parameters</p>
      <TestInputEditor
        initialValue="Hello ${name}, your order ${orderId} is ready!"
        initialFormat="parameterized"
        onSave={handleSave}
      />
    </div>
  );
}
```

---

## Troubleshooting

### Component Not Rendering
- Check that you've imported from the correct path
- Verify that Card and Button components are available
- Check browser console for errors

### Validation Not Working
- Ensure content is not empty
- For JSON formats, check syntax
- For multi-turn, verify array structure
- For parameterized, ensure all parameters have values

### Save Button Disabled
- Check for validation errors
- Ensure content is not empty
- Verify all required parameters have values

---

## Best Practices

1. **Always handle errors** in onSave callback
2. **Provide initial values** when editing existing tests
3. **Use onChange** for auto-save functionality
4. **Show loading states** when fetching data
5. **Validate on backend** as well as frontend
6. **Use read-only mode** for viewing test results

---

**Last Updated:** 2024-11-21  
**Component Version:** 1.0  
**Status:** Production Ready
