import classNames from 'classnames';
import { Vec2 } from './maths';

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

const Arrow: React.FC<ArrowProps> = props => {
  const { x1, y1, x2, y2, stroke, strokeWidth, className } = props;

  const base = new Vec2(x2 - x1, y2 - y1);
  const wing1 = base.rotate(Math.PI / 10).scaleTo(15);
  const wing2 = wing1.rotate(-Math.PI / 5);
  const corner1 = new Vec2(x2, y2).minus(wing1);
  const corner2 = new Vec2(x2, y2).minus(wing2);

  return (
    <g className={classNames(className, 'arrow')}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <path
        d={`M ${x2} ${y2}
            L ${corner1.x} ${corner1.y}
            L ${corner2.x} ${corner2.y}
            Z`}
        fill={stroke}
      />
    </g>
  );
};

export default Arrow;
