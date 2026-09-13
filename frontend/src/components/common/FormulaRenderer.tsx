import React from 'react';
import katex from 'katex';

interface FormulaRendererProps {
  content: string;
  className?: string;
}

export const FormulaRenderer: React.FC<FormulaRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by inline math ($...$) and block math ($$...$$)
  const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g);

  return (
    <span className={`leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <code key={index} className="text-amber-400 font-mono">{part}</code>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <code key={index} className="text-amber-400 font-mono">{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
