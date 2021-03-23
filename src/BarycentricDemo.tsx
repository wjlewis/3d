import React from 'react';
import Arrow from './Arrow';
import { useMousePos } from './hooks';
import { Vec2, Mat2 } from './maths';
import { Action } from './action';
import './BarycentricDemo.css';

const WIDTH = 966;
const HEIGHT = 600;

enum DragSubject {
  Origin = 'Origin',
  Tri1 = 'Tri1',
  Tri2 = 'Tri2',
  Tri3 = 'Tri3',
  Pt = 'Pt',
}

const BarycentricDemo: React.FC<{}> = () => {
  const ref = useMousePos({
    onChange: (x, y) => dispatch(moveMouse(x, y)),
    onUp: () => dispatch(stopDrag()),
  });
  const [state, dispatch] = React.useReducer(reducer, initState);

  const { origin, tri1, tri2, tri3, pt } = state;

  function toScreenSpace(pt: Vec2): Vec2 {
    return new Vec2(origin.x + pt.x, origin.y - pt.y);
  }

  // Transform triangle points and `pt` into our (svg) "screen" space
  const [t1, t2, t3, p] = [tri1, tri2, tri3, pt].map(toScreenSpace);

  const u = t2.minus(t1);
  const v = t3.minus(t1);
  const changeOfBasis = new Mat2(u.x, v.x, u.y, v.y).leftInv();
  const baryCoords = changeOfBasis.timesVec(p.minus(t1));

  // Additional points for indicating the position of `pt` in terms of
  // its barycentric coordinates
  const uStart = t1;
  const uEnd = t1.plus(t2.minus(t1).scale(baryCoords.x));
  const vStart = uEnd;
  const vEnd = vStart.plus(t3.minus(t1).scale(baryCoords.y));

  // Contributions from each of the triangle's corners
  const f1 = (1 - baryCoords.x - baryCoords.y).toPrecision(2);
  const f2 = baryCoords.x.toPrecision(2);
  const f3 = baryCoords.y.toPrecision(2);

  return (
    <div className="barycentric-demo">
      <div style={{ position: 'relative' }}>
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        >
          {/* Origin */}
          <Arrow
            x1={origin.x}
            y1={origin.y}
            x2={origin.x + 60}
            y2={origin.y}
            className="gray-2"
          />
          <Arrow
            x1={origin.x}
            y1={origin.y}
            x2={origin.x}
            y2={origin.y - 60}
            className="gray-2"
          />
          <circle
            className="moveable gray-2"
            cx={origin.x}
            cy={origin.y}
            r="6"
            onMouseDown={() => dispatch(startDrag(DragSubject.Origin))}
          />

          {/* Triangle */}
          <path
            d={`M ${t1.x} ${t1.y}
              L ${t2.x} ${t2.y}
              L ${t3.x} ${t3.y}
              Z`}
            stroke="#ddd"
            fill="#ddd5"
          />

          {/* Coordinates w.r.t. triangle's "base point" (`tri1`) */}
          <Arrow x1={t1.x} y1={t1.y} x2={p.x} y2={t1.y} stroke="#ddd" />
          <Arrow x1={p.x} y1={t1.y} x2={p.x} y2={p.y} stroke="#ddd" />

          {/* Barycentric Info */}
          <Arrow
            x1={uStart.x}
            y1={uStart.y}
            x2={uEnd.x}
            y2={uEnd.y}
            className="yellow"
          />
          <Arrow
            x1={vStart.x}
            y1={vStart.y}
            x2={vEnd.x}
            y2={vEnd.y}
            className="red"
          />

          {/* Triangle handles */}
          <circle
            className="moveable green"
            cx={t1.x}
            cy={t1.y}
            r="6"
            onMouseDown={() => dispatch(startDrag(DragSubject.Tri1))}
          />
          <circle
            className="moveable yellow"
            cx={t2.x}
            cy={t2.y}
            r="6"
            onMouseDown={() => dispatch(startDrag(DragSubject.Tri2))}
          />
          <circle
            className="moveable red"
            cx={t3.x}
            cy={t3.y}
            r="6"
            onMouseDown={() => dispatch(startDrag(DragSubject.Tri3))}
          />

          {/* Free Point */}
          <circle
            className="moveable blue"
            cx={p.x}
            cy={p.y}
            r="6"
            onMouseDown={() => dispatch(startDrag(DragSubject.Pt))}
          />
        </svg>

        <div style={{ position: 'absolute', left: p.x + 5, top: p.y + 3 }}>
          <span className="gray-1">(</span>
          <span className="green">{f1}</span>
          <span className="gray-1">,</span>
          <span className="yellow">{f2}</span>
          <span className="gray-1">,</span>
          <span className="red">{f3}</span>
          <span className="gray-1">)</span>
        </div>
      </div>

      <div className="instructions">
        All points (e.g. <div className="dot green"></div>,
        <div className="dot yellow"></div>) can be dragged with the cursor. The
        ordered triple shows contributions from each of the triangle's corners
        at the location of the blue point (<div className="dot blue"></div>).
      </div>
    </div>
  );
};

interface State {
  // Relative to svg element
  origin: Vec2;

  // Relative to origin
  tri1: Vec2;
  tri2: Vec2;
  tri3: Vec2;
  pt: Vec2;

  drag: DragSubject | null;
}

const initState: State = {
  origin: new Vec2(140, 500),
  tri1: new Vec2(160, 140),
  tri2: new Vec2(280, 400),
  tri3: new Vec2(500, 200),
  pt: new Vec2(340, 270),
  drag: null,
};

function moveMouse(x: number, y: number): Action {
  return {
    type: 'MOVE_MOUSE',
    payload: new Vec2(x, y),
  };
}

function stopDrag(): Action {
  return {
    type: 'STOP_DRAG',
  };
}

function startDrag(drag: DragSubject): Action {
  return {
    type: 'START_DRAG',
    payload: drag,
  };
}

function fromScreenSpace(origin: Vec2, pt: Vec2): Vec2 {
  return new Vec2(pt.x - origin.x, origin.y - pt.y);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MOVE_MOUSE':
      if (!state.drag) {
        return state;
      } else {
        const key: string = dragSubjectToKey(state.drag);
        if (key === 'origin') {
          return { ...state, [key]: action.payload };
        } else {
          return {
            ...state,
            [key]: fromScreenSpace(state.origin, action.payload),
          };
        }
      }
    case 'START_DRAG':
      return {
        ...state,
        drag: action.payload,
      };
    case 'STOP_DRAG':
      return {
        ...state,
        drag: null,
      };
    default:
      return state;
  }
}

function dragSubjectToKey(drag: DragSubject): keyof State {
  switch (drag) {
    case DragSubject.Origin:
      return 'origin';
    case DragSubject.Pt:
      return 'pt';
    case DragSubject.Tri1:
      return 'tri1';
    case DragSubject.Tri2:
      return 'tri2';
    case DragSubject.Tri3:
      return 'tri3';
  }
}

export default BarycentricDemo;
