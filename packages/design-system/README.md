# 🎨 @nucel.cloud/design-system

A modern, comprehensive React design system built on top of shadcn/ui components with custom Kibo UI components. This package provides a complete set of accessible, theme-aware UI components for building beautiful and consistent user interfaces.

## ✨ Features

- **50+ Pre-built Components**: From basic buttons to complex data visualization
- **Dark Mode Support**: Built-in theme switching with next-themes
- **Accessibility First**: All components follow WCAG guidelines
- **TypeScript Ready**: Full type safety and IntelliSense support
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Mobile Responsive**: Components adapt beautifully to all screen sizes
- **Advanced Components**: Rich text editor, Kanban boards, Gantt charts, and more

## 📦 Installation

Since this is a private workspace package, it's already linked in your monorepo. If you need to use it in a new app within the monorepo:

```json
{
  "dependencies": {
    "@nucel.cloud/design-system": "workspace:*"
  }
}
```

## 🚀 Quick Start

### 1. Wrap Your App

The design system requires a provider wrapper for themes, authentication, and tooltips:

```tsx
import { DesignSystemProvider } from '@nucel.cloud/design-system';

export default function App({ children }) {
  return (
    <DesignSystemProvider
      defaultTheme="system"
      privacyUrl="/privacy"
      termsUrl="/terms"
      helpUrl="/help"
    >
      {children}
    </DesignSystemProvider>
  );
}
```

### 2. Import and Use Components

```tsx
import { Button } from '@nucel.cloud/design-system/components/ui/button';
import { Card } from '@nucel.cloud/design-system/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <Button variant="default">Click me!</Button>
    </Card>
  );
}
```

## 📚 Component Library

### Core UI Components

#### Layout & Navigation
- **Sidebar** - Collapsible navigation sidebar
- **Navigation Menu** - Accessible dropdown navigation
- **Breadcrumb** - Page hierarchy navigation
- **Tabs** - Tabbed content organization

#### Forms & Inputs
- **Form** - Complete form solution with react-hook-form
- **Input** - Text input with validation states
- **Select** - Accessible dropdown select
- **Checkbox** - Single and group checkboxes
- **Radio Group** - Radio button groups
- **Switch** - Toggle switches
- **Slider** - Range input slider
- **Textarea** - Multi-line text input
- **Input OTP** - One-time password input

#### Buttons & Actions
- **Button** - Multiple variants (default, outline, ghost, destructive)
- **Toggle** - Toggle button states
- **Toggle Group** - Group of toggle buttons

#### Feedback & Overlays
- **Alert** - Info/warning/error messages
- **Alert Dialog** - Confirmation dialogs
- **Dialog** - Modal dialogs
- **Sheet** - Slide-out panels
- **Drawer** - Mobile-friendly slide panels
- **Popover** - Floating content containers
- **Tooltip** - Hover tooltips
- **Toast** (via Sonner) - Toast notifications

#### Data Display
- **Table** - Data tables with sorting
- **Card** - Content containers
- **Badge** - Status indicators
- **Avatar** - User avatars
- **Progress** - Progress bars
- **Chart** - Data visualization (via Recharts)

#### Advanced Components
- **Command** - Command palette (⌘K menu)
- **Calendar** - Date picker calendar
- **Carousel** - Image/content carousel
- **Resizable** - Resizable panels
- **Scroll Area** - Custom scrollbars

### Kibo UI Components

Special advanced components for complex use cases:

#### 📝 Rich Text Editor
```tsx
import { Editor } from '@nucel.cloud/design-system/components/ui/kibo-ui/editor';

<Editor
  content={content}
  onUpdate={({ editor }) => setContent(editor.getHTML())}
  placeholder="Start typing..."
/>
```

Features:
- Full formatting toolbar
- Code blocks with syntax highlighting
- Tables, lists, and task lists
- Subscript/superscript support
- Character counting
- Slash commands

#### 📋 Kanban Board
```tsx
import { Kanban } from '@nucel.cloud/design-system/components/ui/kibo-ui/kanban';

<Kanban
  columns={columns}
  items={items}
  onDragEnd={handleDragEnd}
/>
```

#### 📊 Gantt Chart
```tsx
import { Gantt } from '@nucel.cloud/design-system/components/ui/kibo-ui/gantt';

<Gantt
  tasks={tasks}
  onTaskUpdate={handleTaskUpdate}
/>
```

#### 📢 Announcement Banner
```tsx
import { Announcement } from '@nucel.cloud/design-system/components/ui/kibo-ui/announcement';

<Announcement
  title="New Feature!"
  description="Check out our latest updates"
  variant="info"
/>
```

#### 🏷️ Tag Management
```tsx
import { Tags } from '@nucel.cloud/design-system/components/ui/kibo-ui/tags';

<Tags
  tags={tags}
  onAdd={handleAddTag}
  onRemove={handleRemoveTag}
/>
```

#### 📋 Advanced List
```tsx
import { List } from '@nucel.cloud/design-system/components/ui/kibo-ui/list';

<List
  items={items}
  renderItem={(item) => <ListItem {...item} />}
  sortable
  searchable
/>
```

## 🎨 Theming

### CSS Variables

The design system uses CSS custom properties for theming. You can customize colors by overriding these variables:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --success: oklch(50.8% 0.118 165.612);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
```

### Dark Mode

Dark mode is automatically handled by the ThemeProvider. Toggle it programmatically:

```tsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

## 🛠️ Utilities

### cn() - Class Name Merger
Merge Tailwind classes with proper precedence:

```tsx
import { cn } from '@nucel.cloud/design-system/lib/utils';

<div className={cn('p-4 bg-white', isDark && 'bg-black', className)} />
```

### handleError() - Error Toast Handler
Display errors as toast notifications:

```tsx
import { handleError } from '@nucel.cloud/design-system/lib/utils';

try {
  await saveData();
} catch (error) {
  handleError(error); // Shows toast with error message
}
```

### useIsMobile() - Mobile Detection Hook
Detect mobile viewport:

```tsx
import { useIsMobile } from '@nucel.cloud/design-system/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## 🏗️ Architecture

The design system follows a modular architecture:

```
design-system/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── kibo-ui/      # Advanced custom components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── providers/        # Context providers
└── styles/           # Global styles and tokens
```

### Component Patterns

All components follow consistent patterns:
- **Forwardable refs** for DOM access
- **Composable APIs** with sub-components
- **Controlled & uncontrolled** modes
- **Accessible by default** with ARIA support
- **Theme-aware** with automatic dark mode

## 🔧 Development

### Adding New Components

1. Create component file in `components/ui/`
2. Export from barrel file
3. Add Storybook story (if applicable)
4. Document usage in README

### Styling Guidelines

- Use Tailwind utilities first
- Use `cn()` for conditional classes
- Follow existing component patterns
- Ensure dark mode compatibility
- Test on mobile viewports

## 📖 Best Practices

### Performance
- Import only what you need
- Use dynamic imports for heavy components
- Leverage React.memo for expensive renders

### Accessibility
- Always include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain focus management

### TypeScript
- Export component prop types
- Use generic types where applicable
- Avoid `any` types

## 🤝 Contributing

When contributing to the design system:

1. Follow existing component patterns
2. Ensure full TypeScript coverage
3. Add proper documentation
4. Test across themes and viewports
5. Consider accessibility implications

## 📄 License

This is a private package within the monorepo.