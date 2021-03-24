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

export function useCanvasRenderingContext2D(
  options?: CanvasRenderingContext2DSettings,
): [CanvasRenderingContext2D | undefined, React.RefObject<HTMLCanvasElement>] {
  const canvasRef: React.RefObject<HTMLCanvasElement> = React.useRef(null);
  const [context, setContext] = React.useState<CanvasRenderingContext2D>();

  React.useEffect(() => {
    if (canvasRef.current !== null) {
      setContext(
        canvasRef.current.getContext('2d', options) as CanvasRenderingContext2D,
      );
    }
  }, [options]);

  return [context, canvasRef];
}

export function useReducer<St, A>(
  reducer: React.Reducer<St, A>,
  initState: St,
  ...middlewares: Middleware<St, A>[]
): [St, React.Dispatch<A>] {
  let [state, dispatch] = React.useReducer(reducer, initState);

  // Snarfed from the Redux guide
  middlewares = [...middlewares];
  middlewares.reverse();
  middlewares.forEach(middleware => {
    dispatch = middleware(state, dispatch);
  });

  return [state, dispatch];
}

export interface Middleware<St, A> {
  (state: St, next: React.Dispatch<A>): React.Dispatch<A>;
}
