import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Desktop95ScrollArea.css';

export default function Desktop95ScrollArea({ children, className = '', contentClassName = '', scrollStep = 180 }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const dragStateRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    clientHeight: 1,
    scrollHeight: 1,
    scrollTop: 0
  });

  const updateScrollMetrics = useCallback(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;

    setScrollMetrics({
      clientHeight: scrollArea.clientHeight,
      scrollHeight: scrollArea.scrollHeight,
      scrollTop: scrollArea.scrollTop
    });
  }, []);

  // Mount/Unmount effect: Register observer and resize listener once
  useEffect(() => {
    updateScrollMetrics();

    const scrollArea = scrollRef.current;
    if (!scrollArea) return undefined;

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateScrollMetrics);

    resizeObserver?.observe(scrollArea);
    window.addEventListener('resize', updateScrollMetrics);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScrollMetrics);
    };
  }, [updateScrollMetrics]);

  // Children update effect: Re-run metrics only when children render/change
  useEffect(() => {
    updateScrollMetrics();
  }, [children, updateScrollMetrics]);

  const maxScrollTop = Math.max(scrollMetrics.scrollHeight - scrollMetrics.clientHeight, 0);
  const canScroll = maxScrollTop > 1;
  const thumbHeightPercent = canScroll
    ? Math.max(12, (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * 100)
    : 100;
  const thumbTopPercent = canScroll
    ? (scrollMetrics.scrollTop / maxScrollTop) * (100 - thumbHeightPercent)
    : 0;

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (event) => {
      const scrollArea = scrollRef.current;
      const track = trackRef.current;
      const dragState = dragStateRef.current;
      if (!scrollArea || !track || !dragState) return;

      event.preventDefault();

      const trackHeight = track.clientHeight;
      const thumbHeight = (thumbHeightPercent / 100) * trackHeight;
      const availableTrack = Math.max(trackHeight - thumbHeight, 1);
      const scrollRatio = (event.clientY - dragState.startY) / availableTrack;
      scrollArea.scrollTop = Math.min(
        Math.max(dragState.startScrollTop + scrollRatio * maxScrollTop, 0),
        maxScrollTop
      );
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, maxScrollTop, thumbHeightPercent]);

  const scrollByDirection = (direction) => {
    scrollRef.current?.scrollBy({
      top: direction * scrollStep,
      behavior: 'smooth'
    });
  };

  const startThumbDrag = (event) => {
    if (!canScroll) return;

    event.preventDefault();
    dragStateRef.current = {
      startY: event.clientY,
      startScrollTop: scrollRef.current?.scrollTop || 0
    };
    setIsDragging(true);
  };

  return (
    <div className={`desktop95-scroll-area ${isDragging ? 'is-dragging' : ''} ${className}`}>
      <div
        className={`desktop95-scroll-content ${contentClassName}`}
        ref={scrollRef}
        onScroll={updateScrollMetrics}
      >
        {children}
      </div>

      <div className="desktop95-scrollbar" aria-label="Scroll controls">
        <button
          type="button"
          className="desktop95-scroll-btn"
          onClick={() => scrollByDirection(-1)}
          disabled={!canScroll || scrollMetrics.scrollTop <= 0}
          aria-label="Scroll up"
        >
          <span aria-hidden="true">▲</span>
        </button>
        <div className="desktop95-scroll-track" ref={trackRef} aria-hidden="true">
          <div
            className={`desktop95-scroll-thumb ${canScroll ? '' : 'is-disabled'}`}
            onPointerDown={startThumbDrag}
            style={{
              height: `${thumbHeightPercent}%`,
              top: `${thumbTopPercent}%`
            }}
          />
        </div>
        <button
          type="button"
          className="desktop95-scroll-btn"
          onClick={() => scrollByDirection(1)}
          disabled={!canScroll || scrollMetrics.scrollTop >= maxScrollTop - 1}
          aria-label="Scroll down"
        >
          <span aria-hidden="true">▼</span>
        </button>
      </div>
    </div>
  );
}
