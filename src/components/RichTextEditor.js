import React, { useState, useEffect } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder, maxLength, rows = 12 }) => {
  const [charCount, setCharCount] = useState(0);
  const textareaRef = React.useRef(null);

  useEffect(() => {
    // Update character count when value changes
    const text = value || '';
    setCharCount(text.length);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Enforce maxLength if provided
    if (maxLength && newValue.length > maxLength) {
      return; // Don't update if exceeds max length
    }
    
    onChange(newValue);
  };

  return (
    <div className="rich-text-editor-container">
      <textarea
        ref={textareaRef}
        className="rich-text-editor-textarea"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder || 'Write your content here...'}
        maxLength={maxLength}
        rows={rows}
      />
      {maxLength && (
        <div className="rich-text-editor-footer">
          <span className="char-count">
            {charCount}/{maxLength} characters
          </span>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;

