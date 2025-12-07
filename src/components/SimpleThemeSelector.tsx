import React from 'react';
import { useTheme } from '@/lib/themes/simple-themes';

export const SimpleThemeSelector: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };

  // Use current theme styles for the selector itself
  const selectStyle = {
    backgroundColor: theme.styles.secondaryBg,
    color: theme.styles.primaryText,
    border: `1px solid ${theme.styles.primaryBorder}`,
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
  };

  const selectHoverStyle = {
    ...selectStyle,
    backgroundColor: theme.styles.elevatedBg,
  };

  return (
    <div>
      <label 
        style={{ 
          color: theme.styles.secondaryText, 
          fontSize: '14px',
          marginBottom: '8px',
          display: 'block'
        }}
      >
        Theme
      </label>
      <select
        value={theme.id}
        onChange={handleThemeChange}
        style={selectStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.styles.elevatedBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.styles.secondaryBg;
        }}
      >
        {availableThemes.map((themeOption) => (
          <option 
            key={themeOption.id} 
            value={themeOption.id}
            style={{
              backgroundColor: theme.styles.secondaryBg,
              color: theme.styles.primaryText,
            }}
          >
            {themeOption.name}
          </option>
        ))}
      </select>
      <p style={{ 
        color: theme.styles.tertiaryText, 
        fontSize: '12px', 
        marginTop: '4px' 
      }}>
        {theme.description}
      </p>
    </div>
  );
};