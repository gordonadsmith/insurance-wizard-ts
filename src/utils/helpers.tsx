import React from 'react';

export const FormatText: React.FC<{ text: string | null }> = ({ text }) => {
  if (!text) return null;
  const htmlContent = text.replace(/\r?\n/g, '<br />');
  return (
    <div 
      className="formatted-text-content"
      style={{ 
        lineHeight: '1.6', 
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        cursor: 'text',
        width: '100%' 
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};

export const cleanHTML = (html: string | undefined | null): string => {
  if (!html) return '';
  return html.replace(/&nbsp;/g, ' ');
};

export const extractVariables = (template: string | undefined): string[] => {
  if (!template) return [];
  const regex = /\{([^}]+)\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  return matches;
};

export const fillTemplate = (template: string | undefined, values: Record<string, string>): string => {
  if (!template) return '';
  let filled = template;
  Object.keys(values).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    filled = filled.replace(regex, values[key] || `{${key}}`);
  });
  return filled;
};
