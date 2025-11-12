#!/usr/bin/env node

/**
 * Simple script to create a basic icon for the VS Code extension
 * This creates a 128x128 PNG icon with AgentHub branding
 */

const fs = require('fs');

// Create SVG icon content
const svgIcon = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#007ACC" stroke="#005A9E" stroke-width="2"/>
  
  <!-- Robot/Agent icon -->
  <g transform="translate(32, 28)">
    <!-- Head -->
    <rect x="16" y="8" width="32" height="24" rx="4" fill="white"/>
    
    <!-- Eyes -->
    <circle cx="24" cy="16" r="3" fill="#007ACC"/>
    <circle cx="40" cy="16" r="3" fill="#007ACC"/>
    
    <!-- Body -->
    <rect x="12" y="32" width="40" height="32" rx="6" fill="white"/>
    
    <!-- Arms -->
    <rect x="4" y="36" width="8" height="16" rx="4" fill="white"/>
    <rect x="52" y="36" width="8" height="16" rx="4" fill="white"/>
    
    <!-- Legs -->
    <rect x="20" y="64" width="8" height="16" rx="4" fill="white"/>
    <rect x="36" y="64" width="8" height="16" rx="4" fill="white"/>
    
    <!-- Chest panel -->
    <rect x="20" y="40" width="24" height="16" rx="2" fill="#007ACC"/>
    
    <!-- Code symbols in chest -->
    <text x="32" y="50" font-family="monospace" font-size="8" fill="white" text-anchor="middle">&lt;/&gt;</text>
  </g>
  
  <!-- AgentHub text -->
  <text x="64" y="110" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">AgentHub</text>
</svg>
`;

// Write SVG file
fs.writeFileSync('icon.svg', svgIcon.trim());

console.log('✅ Created icon.svg');
console.log('📝 To convert to PNG (128x128), use an online converter or:');
console.log('   - Install Inkscape: inkscape icon.svg --export-png=icon.png --export-width=128 --export-height=128');
console.log('   - Or use online converter: https://convertio.co/svg-png/');
console.log('   - Or use any graphics editor to open SVG and export as 128x128 PNG');