import React, { useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder, maxLength, rows = 12 }) => {
  const quillRef = useRef(null);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    let editorElement = null;
    let handleEditorFocus = null;
    let handleEditorBlur = null;
    
    // Delay to ensure ReactQuill has fully rendered
    const timer = setTimeout(() => {
      if (quillRef.current) {
        try {
          // Check if ReactQuill has created its DOM structure
          const reactQuillElement = quillRef.current;
          console.log('ReactQuill ref:', reactQuillElement);
          console.log('ReactQuill DOM:', reactQuillElement?.editingArea || reactQuillElement);
          
          const quill = quillRef.current.getEditor();
          console.log('Quill instance:', quill);
          console.log('Quill root:', quill?.root);
          
          if (quill && quill.root) {
            quill.root.setAttribute('data-placeholder', placeholder || 'Write your content here...');
            
            // Ensure the editor is editable
            quill.enable(true);
            
            // Make sure the editor container is clickable and interactive
            editorElement = quill.root;
            if (editorElement) {
              editorElement.style.cursor = 'text';
              editorElement.style.minHeight = '300px';
              editorElement.style.display = 'block';
              editorElement.style.visibility = 'visible';
              editorElement.style.pointerEvents = 'auto';
              editorElement.style.userSelect = 'text';
              editorElement.setAttribute('contenteditable', 'true');
              
              // Ensure the editor can receive focus
              editorElement.setAttribute('tabindex', '0');
            }
            
            // Find toolbar - ReactQuill structure: .ql-toolbar is a sibling of .ql-container
            // Search from the editor root up to find the ReactQuill wrapper
            let toolbar = null;
            
            // Method 1: Search from container parent (most common structure)
            const container = quill.root.closest('.ql-container');
            if (container && container.parentElement) {
              toolbar = container.parentElement.querySelector('.ql-toolbar');
            }
            
            // Method 2: Search from ReactQuill component's DOM node
            if (!toolbar && quillRef.current) {
              const reactQuillNode = quillRef.current.getEditingArea?.() || 
                                     quillRef.current.editingArea ||
                                     (quillRef.current.quill?.container?.parentElement);
              if (reactQuillNode) {
                toolbar = reactQuillNode.querySelector('.ql-toolbar');
              }
            }
            
            // Method 3: Search in the rich-text-editor wrapper
            if (!toolbar) {
              const wrapper = document.querySelector('.rich-text-editor-wrapper');
              if (wrapper) {
                toolbar = wrapper.querySelector('.ql-toolbar');
              }
            }
            
            // Method 4: Search in any quill container
            if (!toolbar) {
              const quillElement = document.querySelector('.quill');
              if (quillElement) {
                toolbar = quillElement.querySelector('.ql-toolbar');
              }
            }
            
            // Method 5: Global search (last resort)
            if (!toolbar) {
              toolbar = document.querySelector('.ql-toolbar');
            }
            
            if (toolbar && toolbar.classList.contains('ql-toolbar')) {
              toolbar.style.display = 'flex';
              toolbar.style.visibility = 'visible';
              toolbar.style.opacity = '1';
              toolbar.style.zIndex = '10';
              toolbar.style.minHeight = '42px';
              toolbar.style.pointerEvents = 'auto';
              toolbar.style.position = 'relative';
              console.log('Toolbar found and made visible');
            } else {
              console.warn('Toolbar not found in DOM. ReactQuill structure:', {
                container: container?.className,
                parent: container?.parentElement?.className,
                hasQuill: !!quill,
                hasRoot: !!quill.root
              });
            }
            
            // Ensure the container is also interactive
            if (container) {
              container.style.pointerEvents = 'auto';
              container.style.cursor = 'text';
            }
            
            // Add focus and blur event listeners
            if (editorElement) {
              handleEditorFocus = () => {
                setIsFocused(true);
                quill.enable(true);
              };
              handleEditorBlur = () => {
                setIsFocused(false);
              };
              
              editorElement.addEventListener('focus', handleEditorFocus);
              editorElement.addEventListener('blur', handleEditorBlur);
            }
          }
        } catch (err) {
          console.error('Error initializing Quill editor:', err);
        }
      } else {
        console.warn('quillRef.current is null after timeout');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (editorElement && handleEditorFocus && handleEditorBlur) {
        editorElement.removeEventListener('focus', handleEditorFocus);
        editorElement.removeEventListener('blur', handleEditorBlur);
      }
    };
  }, [placeholder]);

  useEffect(() => {
    // Update character count when value changes
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const text = quill.getText();
      setCharCount(text.length);
    }
  }, [value]);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('http://localhost:3001/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        
        // Insert image into editor
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', `http://localhost:3001${data.url}`);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  const handleChange = (content, delta, source, editor) => {
    // Get plain text length for character count
    const text = editor.getText();
    const textLength = text.length;
    setCharCount(textLength);
    
    // Always call onChange to allow typing, but parent can handle validation
    // The maxLength check is handled in the parent component
    onChange(content);
  };

  const handleContainerClick = (e) => {
    // If clicking on the container but not the editor, focus the editor
    if (quillRef.current && e.target.classList.contains('rich-text-editor-container')) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        quill.enable(true);
        quill.focus();
      }
    }
  };

  // Fallback if ReactQuill fails to load
  if (!ReactQuill) {
    return (
      <div className="rich-text-editor-container">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '15px',
            border: '1px solid #e5e5e5',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '16px',
            lineHeight: '1.6'
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="rich-text-editor-container" 
      onClick={handleContainerClick}
      style={{ 
        display: 'block', 
        visibility: 'visible', 
        width: '100%', 
        minHeight: '400px',
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 0,
        pointerEvents: 'auto'
      }}
    >
      {ReactQuill ? (
        <>
          <div className="rich-text-editor-wrapper">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value || ''}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              readOnly={false}
            />
          </div>
          {maxLength && (
            <div className="rich-text-editor-footer">
              <span className="char-count">
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          padding: '15px', 
          border: '2px solid #dc2626', 
          borderRadius: '4px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          minHeight: '300px'
        }}>
          <p><strong>Error:</strong> Rich text editor failed to load. Using fallback textarea.</p>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '15px',
              border: '1px solid #e5e5e5',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '16px',
              lineHeight: '1.6',
              marginTop: '10px'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;

