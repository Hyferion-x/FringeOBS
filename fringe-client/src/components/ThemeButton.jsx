import React from 'react';
import { useTheme } from '../ThemeContext';

const ThemeButton = ({ style = {}, className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        ...style
      }}
    >
      <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
    </button>
  );
};

export default ThemeButton; 