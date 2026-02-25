import React, { useEffect, useRef } from 'react';

/**
 * Renders post body HTML and replaces broken images (e.g. 404 on ephemeral hosting)
 * with a friendly fallback instead of the browser's broken-image icon.
 */
const PostBody = ({ html, className }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !html) return;

    const imgs = el.querySelectorAll('img');
    imgs.forEach((img) => {
      const onError = () => {
        if (!img.parentNode) return;
        const fallback = document.createElement('span');
        fallback.className = 'post-image-unavailable';
        fallback.setAttribute('aria-label', 'Image no longer available');
        fallback.textContent = 'Image no longer available';
        img.parentNode.replaceChild(fallback, img);
      };
      img.addEventListener('error', onError);
    });
  }, [html]);

  if (!html) return null;
  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default PostBody;
