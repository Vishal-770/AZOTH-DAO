import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', as: Component = 'span' }) => {
  return (
    <Component 
      className={`glitch-wrapper relative inline-block ${className}`}
    >
      <span 
        className="glitch relative z-10 block" 
        data-text={text}
      >
        {text}
      </span>
    </Component>
  );
};

export default GlitchText;