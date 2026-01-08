# Midnight Soft Theme - Usage Guide

## Overview

The Midnight Soft theme brings a Unix-inspired aesthetic to Forge with soft dark colors, floating cards, and organic depth. It's designed to be gentle on the eyes while maintaining excellent readability.

## Quick Start

### 1. Apply the Theme

```typescript
import midnightSoftTheme from '@/lib/themes/midnightSoftTheme';

// In your app initialization or theme switcher
midnightSoftTheme.apply();
```

### 2. Check if Theme is Active

```typescript
if (midnightSoftTheme.isActive()) {
  console.log('Midnight Soft theme is active');
}
```

### 3. Remove the Theme

```typescript
midnightSoftTheme.remove();
```

## Using Utility Classes

### Cards with Elevation

```tsx
// Floating card (like Unix UI)
<div className="card-float">
  <h3 className="text-heading">Beautiful Card</h3>
  <p className="text-body">Content goes here</p>
</div>

// Compact card
<div className="card-compact">
  <p>Smaller card with less padding</p>
</div>

// Hoverable card
<div className="surface surface-hover">
  <p>Lifts on hover</p>
</div>
```

### Surfaces

```tsx
// Default surface
<div className="surface p-card">
  <p>Default elevated surface</p>
</div>

// Glass effect (like Unix toolbar)
<div className="surface-glass p-card">
  <p>Frosted glass effect</p>
</div>

// Elevated surface
<div className="surface-elevated p-card-lg">
  <p>Higher elevation with more shadow</p>
</div>
```

### Buttons

```tsx
// Primary button
<button className="btn btn-primary">
  Save Changes
</button>

// Secondary button
<button className="btn btn-secondary">
  Cancel
</button>

// Ghost button
<button className="btn btn-ghost">
  Learn More
</button>

// Icon button
<button className="btn-icon">
  <Icon name="settings" />
</button>
```

### Inputs

```tsx
// Text input
<input
  type="text"
  className="input"
  placeholder="Enter text..."
/>

// Textarea
<textarea
  className="textarea"
  placeholder="Write something..."
/>
```

### Typography

```tsx
<h1 className="text-display">Display Heading</h1>
<h2 className="text-title">Page Title</h2>
<h3 className="text-heading">Section Heading</h3>
<p className="text-body">Body text with comfortable reading</p>
<p className="text-caption">Secondary information</p>
<span className="text-label">Form Label</span>
```

### Badges

```tsx
<span className="badge badge-primary">New</span>
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Failed</span>
```

### Layouts

```tsx
// Stack layout (vertical spacing)
<div className="stack stack-lg">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Inline layout (horizontal spacing)
<div className="inline inline-md">
  <button>Button 1</button>
  <button>Button 2</button>
</div>

// Grid of cards
<div className="grid-cards">
  <div className="card-float">Card 1</div>
  <div className="card-float">Card 2</div>
  <div className="card-float">Card 3</div>
</div>

// Container with max width
<div className="container-page">
  <h1>Page Content</h1>
</div>
```

### Decorative Elements

```tsx
// Dotted pattern background
<div className="pattern-dots">
  <p>Content with subtle dots</p>
</div>

// Organic gradient overlay
<div className="organic-bg">
  <h2>Content with organic shape</h2>
  <p>Notice the subtle gradient</p>
</div>

// Glow effect
<div className="card-float glow-subtle">
  <p>Card with soft glow</p>
</div>
```

## Complete Page Example

```tsx
import React from 'react';
import midnightSoftTheme from '@/lib/themes/midnightSoftTheme';

export const DashboardPage = () => {
  React.useEffect(() => {
    midnightSoftTheme.apply();
  }, []);

  return (
    <div className="container-page organic-bg pattern-dots">
      {/* Header */}
      <header className="stack stack-md mb-8">
        <h1 className="text-display">Dashboard</h1>
        <p className="text-body">Welcome back! Here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid-cards mb-8">
        <div className="card-float hover-lift">
          <p className="text-label mb-2">Total Entries</p>
          <p className="text-display">127</p>
          <span className="badge badge-success mt-4">+12 this week</span>
        </div>

        <div className="card-float hover-lift">
          <p className="text-label mb-2">AI Feedback</p>
          <p className="text-display">48</p>
          <span className="badge badge-primary mt-4">5 pending</span>
        </div>

        <div className="card-float hover-lift">
          <p className="text-label mb-2">Streak</p>
          <p className="text-display">14 days</p>
          <span className="badge badge-warning mt-4">Keep going!</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="surface-elevated p-card-lg">
        <h2 className="text-heading mb-6">Recent Activity</h2>

        <div className="stack stack-md">
          <div className="surface-glass p-card">
            <div className="inline inline-md">
              <span className="text-label">Today, 2:30 PM</span>
              <span className="badge badge-primary">Journal</span>
            </div>
            <p className="text-body mt-2">Completed guided writing exercise</p>
          </div>

          <div className="surface-glass p-card">
            <div className="inline inline-md">
              <span className="text-label">Yesterday, 9:15 AM</span>
              <span className="badge badge-success">AI Insight</span>
            </div>
            <p className="text-body mt-2">Received therapeutic feedback</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="inline inline-md mt-8">
        <button className="btn btn-primary">
          New Entry
        </button>
        <button className="btn btn-secondary">
          View All
        </button>
        <button className="btn btn-ghost">
          Settings
        </button>
      </div>
    </div>
  );
};
```

## Customization Page Example

```tsx
export const SettingsPage = () => {
  return (
    <div className="container-page">
      <div className="surface-elevated p-card-xl">
        <h1 className="text-title mb-2">Appearance</h1>
        <p className="text-caption mb-8">
          Customize how Forge looks and feels
        </p>

        <hr className="divider-h" />

        {/* Theme Selector */}
        <div className="stack stack-lg">
          <div>
            <label className="text-label mb-3 block">Visual Theme</label>
            <div className="grid-cards">
              <button className="card-float text-left hover-lift">
                <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-4"></div>
                <p className="text-heading">Midnight Soft</p>
                <p className="text-caption">Current theme</p>
              </button>

              <button className="card-compact text-left">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-4"></div>
                <p className="text-heading">Nordic Light</p>
                <p className="text-caption">Coming soon</p>
              </button>
            </div>
          </div>

          <hr className="divider-h" />

          {/* Color Options */}
          <div>
            <label className="text-label mb-3 block">Accent Color</label>
            <div className="inline inline-sm">
              <button className="w-12 h-12 rounded-full bg-brand-primary border-4 border-surface-active"></button>
              <button className="w-12 h-12 rounded-full bg-purple-500 border-2 border-border-default"></button>
              <button className="w-12 h-12 rounded-full bg-pink-500 border-2 border-border-default"></button>
              <button className="w-12 h-12 rounded-full bg-green-500 border-2 border-border-default"></button>
            </div>
          </div>

          <hr className="divider-h" />

          {/* Spacing */}
          <div>
            <label className="text-label mb-3 block">Interface Density</label>
            <div className="stack stack-sm">
              <label className="inline inline-md cursor-pointer">
                <input type="radio" name="density" className="mr-3" />
                <span className="text-body">Compact</span>
              </label>
              <label className="inline inline-md cursor-pointer">
                <input type="radio" name="density" defaultChecked className="mr-3" />
                <span className="text-body">Comfortable (Recommended)</span>
              </label>
              <label className="inline inline-md cursor-pointer">
                <input type="radio" name="density" className="mr-3" />
                <span className="text-body">Spacious</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="inline inline-md mt-8">
          <button className="btn btn-primary">Save Changes</button>
          <button className="btn btn-ghost">Reset to Default</button>
        </div>
      </div>
    </div>
  );
};
```

## Color Palette Reference

### Backgrounds
- `--color-background-base` - #1a1d26 (Page background)
- `--color-background-elevated` - #21242e (Sidebar, raised areas)
- `--color-background-overlay` - #282c38 (Modals, overlays)

### Surfaces
- `--color-surface-primary` - #252936 (Cards, panels)
- `--color-surface-secondary` - #2a2e3d (Buttons, inputs)
- `--color-surface-hover` - #353b4f (Hover states)

### Text
- `--color-text-primary` - #e8eaed (Main text)
- `--color-text-secondary` - #a8adb8 (Secondary text)
- `--color-text-tertiary` - #787d8a (Captions, labels)

### Brand
- `--color-brand-primary` - #8ba6ea (Primary actions)
- `--color-brand-secondary` - #a193f0 (Accents)
- `--color-brand-accent` - #e89cb4 (Highlights)

## CSS Custom Properties

You can use CSS variables directly:

```css
.my-custom-component {
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
}

.my-custom-component:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  transition: all var(--transition-normal);
}
```

## Best Practices

### 1. Use Semantic Classes
```tsx
// Good - semantic and reusable
<div className="card-float">

// Avoid - too specific
<div style={{ background: '#252936', borderRadius: '1.5rem' }}>
```

### 2. Layer Your Surfaces
```tsx
// Page background
<div className="bg-background-base">
  {/* Sidebar */}
  <aside className="bg-background-elevated">
    {/* Card inside sidebar */}
    <div className="surface">Content</div>
  </aside>
</div>
```

### 3. Use Proper Text Hierarchy
```tsx
<article>
  <h1 className="text-display">Main Title</h1>
  <h2 className="text-title">Section Title</h2>
  <p className="text-body">Body content...</p>
  <p className="text-caption">Additional info</p>
</article>
```

### 4. Add Hover States
```tsx
// Cards should lift on hover
<div className="card-float hover-lift">

// Buttons automatically have hover states
<button className="btn btn-primary">
```

### 5. Use Spacing Utilities
```tsx
// Stack vertical elements
<div className="stack stack-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Instead of manual margins
<div style={{ marginTop: '1.5rem' }}>Item 2</div>
```

## Next Steps

- Apply Midnight Soft theme to your Customizations page
- Update Journal page with floating cards
- Add organic backgrounds to landing pages
- Create themed components for consistent UX

## Resources

- [Brand Configuration](../src/brands/brand.midnight-soft.json)
- [Theme CSS](../src/styles/themes/midnight-soft.css)
- [Utility Classes](../src/styles/utilities/midnight-soft-utils.css)
- [Design System Documentation](DESIGN-SYSTEM.md)
