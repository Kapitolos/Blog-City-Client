import React, { useState, useEffect, useRef } from 'react';
import './RichTextEditor.css';
import { API_BASE_URL } from '../config.js';

const RichTextEditor = ({ value, onChange, placeholder, maxLength, rows = 12 }) => {
  const [charCount, setCharCount] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showBandcampDialog, setShowBandcampDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [bandcampUrl, setBandcampUrl] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const insertAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value || '';
    const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
    
    // Check maxLength
    if (maxLength && newValue.length > maxLength) {
      return; // Don't insert if it would exceed max length
    }
    
    onChange(newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = `${API_BASE_URL}${data.url}`;
      const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0;" />`;
      
      insertAtCursor(imageHtml);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleYouTubeEmbed = () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    // Convert YouTube URL to embed format
    let embedUrl = '';
    
    // Handle different YouTube URL formats
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (youtubeUrl.includes('youtu.be/')) {
      const videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (youtubeUrl.includes('youtube.com/embed/')) {
      embedUrl = youtubeUrl;
    }

    if (!embedUrl) {
      alert('Invalid YouTube URL. Please use a valid YouTube video URL.');
      return;
    }

    const iframeHtml = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%; border-radius: 4px; margin: 1rem 0;"></iframe>`;
    
    insertAtCursor(iframeHtml);
    setShowYouTubeDialog(false);
    setYoutubeUrl('');
  };

  const handleBandcampEmbed = () => {
    if (!bandcampUrl.trim()) {
      alert('Please enter a Bandcamp embed URL or iframe code');
      return;
    }

    let embedUrl = '';
    let albumName = '';
    let albumLink = '';
    
    // Check if user pasted full iframe code - preserve it to maintain exact attributes
    const fullIframeMatch = bandcampUrl.match(/<iframe([^>]*)>(.*?)<\/iframe>/is);
    
    if (fullIframeMatch) {
      // User pasted full iframe code - sanitize but preserve structure and all attributes
      const iframeAttributes = fullIframeMatch[1];
      const iframeContent = fullIframeMatch[2] || '';
      
      // Validate it's a Bandcamp iframe
      const srcMatch = iframeAttributes.match(/src=["']([^"']+)["']/i);
      if (!srcMatch || !srcMatch[1].includes('bandcamp.com')) {
        alert('Invalid Bandcamp iframe. Please paste a valid Bandcamp embed code.');
        return;
      }
      
      // Clean attributes but preserve important ones like height, width, style
      let cleanAttrs = iframeAttributes
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
        .replace(/javascript:/gi, ''); // Remove javascript: URLs
      
      // Ensure width is responsive (update or add to style)
      if (cleanAttrs.includes('style=')) {
        cleanAttrs = cleanAttrs.replace(/style=["']([^"']*)["']/i, (m, style) => {
          // Update width to 100% if present, or add it
          let updatedStyle = style.replace(/width:\s*[^;]+/gi, 'width: 100%');
          if (!updatedStyle.includes('width:')) {
            updatedStyle = 'width: 100%; ' + updatedStyle;
          }
          return `style="${updatedStyle}"`;
        });
      } else {
        cleanAttrs += ' style="width: 100%;"';
      }
      
      // Ensure seamless attribute is present
      if (!cleanAttrs.includes('seamless')) {
        cleanAttrs += ' seamless';
      }
      
      // Use the iframe as-is (sanitized) - this preserves the exact height from Bandcamp
      const iframeHtml = `<iframe${cleanAttrs}>${iframeContent}</iframe>`;
      insertAtCursor(iframeHtml);
      setShowBandcampDialog(false);
      setBandcampUrl('');
      return;
    }
    
    // If not full iframe, try to extract URL
    if (bandcampUrl.includes('bandcamp.com/EmbeddedPlayer/')) {
      // Just the embed URL
      embedUrl = bandcampUrl.trim();
      
      // Try to extract album info from URL for fallback link
      const albumMatch = embedUrl.match(/album=(\d+)/);
      if (albumMatch) {
        // We can't get the full link from just the embed URL, but we'll use a generic fallback
        albumLink = 'https://bandcamp.com';
        albumName = 'Bandcamp Album';
      }
    } else {
      // Try to extract from regular Bandcamp URL
      const bandcampMatch = bandcampUrl.match(/https?:\/\/([^/]+\.bandcamp\.com)\/(album|track)\/([^/?]+)/);
      
      if (bandcampMatch) {
        const [, domain, type, name] = bandcampMatch;
        alert('Please use the embed URL from Bandcamp. Click "Share / Embed" on the Bandcamp page and copy the embed URL or iframe code.');
        return;
      } else {
        alert('Invalid Bandcamp URL. Please paste the embed URL or full iframe code from Bandcamp\'s "Share / Embed" feature.');
        return;
      }
    }

    if (!embedUrl) {
      alert('Could not extract embed URL. Please paste the embed URL or full iframe code from Bandcamp.');
      return;
    }

    // Create Bandcamp iframe with proper attributes
    // First, check if height is already in the pasted iframe code (preserve it)
    let height = null;
    const existingHeightMatch = bandcampUrl.match(/height:\s*(\d+)px/i);
    if (existingHeightMatch) {
      // Use the height from the pasted iframe code
      height = existingHeightMatch[1] + 'px';
    } else {
      // Extract height from URL size parameter if present
      const heightMatch = embedUrl.match(/size=(\w+)/);
      if (heightMatch) {
        const size = heightMatch[1].toLowerCase();
        if (size === 'large') {
          height = '472px'; // Large size for albums
        } else if (size === 'medium') {
          height = '350px'; // Medium size - this was missing!
        } else {
          height = '120px'; // Small size (default)
        }
      } else {
        height = '120px'; // Default
      }
    }
    
    // Build iframe with fallback link
    const fallbackLink = albumLink && albumName 
      ? `<a href="${albumLink}">${albumName}</a>`
      : '<a href="https://bandcamp.com">Bandcamp</a>';
    
    const iframeHtml = `<iframe style="border: 0; width: 100%; height: ${height};" src="${embedUrl}" seamless>${fallbackLink}</iframe>`;
    
    // Insert the iframe HTML
    insertAtCursor(iframeHtml);
    setShowBandcampDialog(false);
    setBandcampUrl('');
  };

  return (
    <div className="rich-text-editor-container">
      <div className="rich-text-editor-toolbar">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          title="Upload image"
        >
          {isUploadingImage ? '⏳ Uploading...' : '🖼️ Insert Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setShowYouTubeDialog(true)}
          title="Embed YouTube video"
        >
          ▶️ Embed YouTube
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setShowBandcampDialog(true)}
          title="Embed Bandcamp music"
        >
          🎵 Embed Bandcamp
        </button>
      </div>

      {showYouTubeDialog && (
        <div className="youtube-dialog-overlay" onClick={() => setShowYouTubeDialog(false)}>
          <div className="youtube-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="youtube-dialog-header">
              <h3>Embed YouTube Video</h3>
              <button
                type="button"
                className="youtube-dialog-close"
                onClick={() => {
                  setShowYouTubeDialog(false);
                  setYoutubeUrl('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="youtube-dialog-content">
              <p>Paste a YouTube video URL:</p>
              <input
                type="text"
                className="youtube-url-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleYouTubeEmbed();
                  }
                }}
              />
              <div className="youtube-dialog-actions">
                <button
                  type="button"
                  className="youtube-dialog-btn primary"
                  onClick={handleYouTubeEmbed}
                >
                  Embed Video
                </button>
                <button
                  type="button"
                  className="youtube-dialog-btn"
                  onClick={() => {
                    setShowYouTubeDialog(false);
                    setYoutubeUrl('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBandcampDialog && (
        <div className="youtube-dialog-overlay" onClick={() => setShowBandcampDialog(false)}>
          <div className="youtube-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="youtube-dialog-header">
              <h3>Embed Bandcamp Music</h3>
              <button
                type="button"
                className="youtube-dialog-close"
                onClick={() => {
                  setShowBandcampDialog(false);
                  setBandcampUrl('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="youtube-dialog-content">
              <p>Paste Bandcamp embed code or URL:</p>
              <p style={{ fontSize: '0.85rem', color: '#6a6a6a', marginTop: '0.5rem', marginBottom: '1rem' }}>
                Tip: On Bandcamp, click "Share / Embed" and copy the iframe code or embed URL
              </p>
              <textarea
                className="youtube-url-input"
                placeholder="Paste iframe code or embed URL here..."
                value={bandcampUrl}
                rows={3}
                style={{ resize: 'vertical' }}
                onChange={(e) => setBandcampUrl(e.target.value)}
              />
              <div className="youtube-dialog-actions">
                <button
                  type="button"
                  className="youtube-dialog-btn primary"
                  onClick={handleBandcampEmbed}
                >
                  Embed Music
                </button>
                <button
                  type="button"
                  className="youtube-dialog-btn"
                  onClick={() => {
                    setShowBandcampDialog(false);
                    setBandcampUrl('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="rich-text-editor-textarea"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder || 'Write your content here... You can insert images and YouTube videos using the toolbar buttons above.'}
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

