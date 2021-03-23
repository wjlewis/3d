import React from 'react';

export interface UseMousePos {
  onChange: (x: number, y: number) => any;
  onUp: () => any;
}

export function useMousePos({
  onChange,
  onUp,
}: UseMousePos): React.RefObject<any> {
  const ref: React.RefObject<any> = React.useRef(null);
  const [bounds, setBounds] = React.useState({ left: 0, top: 0 });

  React.useEffect(() => {
    function recomputeBounds() {
      if (ref.current !== null) {
        const { left, top } = ref.current.getBoundingClientRect();
        setBounds({ left, top });
      }
    }

    recomputeBounds();

    window.addEventListener('resize', recomputeBounds);
    return () => window.removeEventListener('resize', recomputeBounds);
  }, [ref, setBounds]);

  React.useEffect(() => {
    function handleMove(e: MouseEvent) {
      const { left, top } = bounds;
      const { clientX, clientY } = e;

      onChange(clientX - left, clientY - top);
    }

    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [bounds, onChange]);

  React.useEffect(() => {
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, [onUp]);

  return ref;
}
