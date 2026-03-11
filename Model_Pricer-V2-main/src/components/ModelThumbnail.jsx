/**
 * ModelThumbnail — Small cached preview image of a 3D model file.
 *
 * Usage:
 *   <ModelThumbnail file={stlFile} size={64} />
 *
 * The component is lazy — it only starts generating when it becomes visible
 * in the viewport (via IntersectionObserver). Generated thumbnails are
 * cached in IndexedDB so subsequent renders are instant.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getOrGenerateThumbnail, generateFileHash } from '@/lib/thumbnailGenerator';

/* ── States ─────────────────────────────────────────────────────────────── */
const STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  DONE: 'done',
  ERROR: 'error',
};

/* ── Styles (inline, Forge-aligned) ─────────────────────────────────────── */
const styles = {
  wrapper: (size) => ({
    width: size,
    height: size,
    borderRadius: 'var(--forge-radius-md, 6px)',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    background: 'var(--forge-bg-elevated, #1e1e2e)',
    border: '1px solid var(--forge-border-default, #2a2a3e)',
  }),
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  center: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid var(--forge-border-default, #2a2a3e)',
    borderTopColor: '#00D4AA',
    borderRadius: '50%',
    animation: 'mp-thumb-spin 0.6s linear infinite',
  },
  fallbackIcon: {
    color: 'var(--forge-text-muted, #7A8291)',
    opacity: 0.6,
  },
};

/* ── Inject keyframes once ──────────────────────────────────────────────── */
let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const sheet = document.createElement('style');
  sheet.textContent = `@keyframes mp-thumb-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(sheet);
}

/* ── Fallback SVG icon (cube) ───────────────────────────────────────────── */
function CubeIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={styles.fallbackIcon}
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */

const ModelThumbnail = React.memo(function ModelThumbnail({
  file,
  size = 64,
  className = '',
}) {
  const [state, setState] = useState(STATE.IDLE);
  const [src, setSrc] = useState(null);
  const containerRef = useRef(null);
  const visibleRef = useRef(false);
  const fileHashRef = useRef('');

  injectKeyframes();

  // Track visibility via IntersectionObserver (lazy generation)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // Fallback: treat as visible immediately
      visibleRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visibleRef.current = true;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }, // start 100px before entering viewport
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Generate thumbnail when file changes and element is (or becomes) visible
  const generate = useCallback(async (targetFile, hash) => {
    setState(STATE.LOADING);
    try {
      const dataUrl = await getOrGenerateThumbnail(targetFile, {
        width: Math.min(size * 2, 256), // render at 2x for sharpness, cap at 256
        height: Math.min(size * 2, 256),
      });
      // Only apply if file hasn't changed in the meantime
      if (fileHashRef.current === hash) {
        setSrc(dataUrl);
        setState(STATE.DONE);
      }
    } catch {
      if (fileHashRef.current === hash) {
        setState(STATE.ERROR);
      }
    }
  }, [size]);

  useEffect(() => {
    if (!file) {
      setState(STATE.IDLE);
      setSrc(null);
      return;
    }

    const hash = generateFileHash(file);
    fileHashRef.current = hash;

    // Wait for visibility before generating
    function tryGenerate() {
      if (visibleRef.current) {
        generate(file, hash);
      } else {
        // Poll briefly — the observer will flip the flag
        const timer = setTimeout(tryGenerate, 150);
        return timer;
      }
    }

    const timer = tryGenerate();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [file, generate]);

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div
      ref={containerRef}
      className={className}
      style={styles.wrapper(size)}
      role="img"
      aria-label={file ? `3D model thumbnail: ${file.name}` : '3D model thumbnail'}
    >
      {state === STATE.DONE && src ? (
        <img src={src} alt="" style={styles.img} draggable={false} />
      ) : state === STATE.LOADING ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
        </div>
      ) : (
        <div style={styles.center}>
          <CubeIcon size={Math.max(16, Math.round(size * 0.4))} />
        </div>
      )}
    </div>
  );
});

export default ModelThumbnail;
