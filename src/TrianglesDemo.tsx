import React from 'react';
import SimpleEditor from './SimpleEditor';
import Arrow from './Arrow';
import { useCanvasRenderingContext2D } from './hooks';
import { range } from './tools';
import { Vec2, Vec3, Mat2 } from './maths';
import './TrianglesDemo.css';

const WIDTH = 640;
const HEIGHT = 480;
const PX_SIZE = 10;
const PX_WIDTH = WIDTH / PX_SIZE;
const PX_HEIGHT = HEIGHT / PX_SIZE;
const PX_PER_MARKER = 10;
const SVG_OVERLAY_OFFSET = 10;

const TrianglesDemo: React.FC<{}> = () => {
  const [verticesText, setVerticesText] = React.useState(`10, 10, 10, #770055
40, 23, 0, #ff00ff
5, 34, 5, #aa0099
3, 22, 0, #ffff00
55, 5, 15, #996600
15, 45, 10, #aa8800`);
  const [trisText, setTrisText] = React.useState(`1, 2, 3
4, 5, 6`);
  const [context, canvasRef] = useCanvasRenderingContext2D({ alpha: false });

  const repaint = React.useCallback(
    (verticesText: string, trisText: string) => {
      const model = constructModel(verticesText, trisText);
      if (model && context !== undefined) {
        const img = context.getImageData(0, 0, WIDTH, HEIGHT);
        renderModel(model, img);
        context.putImageData(img, 0, 0);
      }
    },
    [context],
  );

  React.useEffect(() => {
    repaint(verticesText, trisText);
  }, [verticesText, trisText, repaint]);

  function handleVerticesTextChange(text: string) {
    setVerticesText(text);
    repaint(text, trisText);
  }

  function handleTrisTextChange(text: string) {
    setTrisText(text);
    repaint(verticesText, text);
  }

  return (
    <div className="triangles-demo">
      <div className="canvas-container">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>
        <SvgOverlay />
      </div>

      <div className="editors">
        <SimpleEditor
          className="vertex-editor"
          placeholder={'Enter vertices here, e.g.\n1.0, 2.0, 1.5, #ff0000'}
          value={verticesText}
          onChange={handleVerticesTextChange}
        />
        <SimpleEditor
          className="face-editor"
          placeholder={'Enter faces here, e.g.\n1, 6, 5'}
          value={trisText}
          onChange={handleTrisTextChange}
        />
      </div>
    </div>
  );
};

function clearContext(img: ImageData, color: Color) {
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = color[0];
    img.data[i + 1] = color[1];
    img.data[i + 2] = color[2];
    img.data[i + 3] = 255;
  }
}

function renderModel(model: Model, img: ImageData) {
  clearContext(img, [250, 250, 250]);
  const zBuf = new Uint8ClampedArray(PX_WIDTH * PX_HEIGHT);
  zBuf.fill(255);
  model.vertices.forEach(v => drawPx(v, img, zBuf));
  model.tris.forEach(tri => renderTri(tri, model.vertices, img, zBuf));
}

function renderTri(
  tri: Tri,
  vertices: Vertex[],
  img: ImageData,
  zBuf: Uint8ClampedArray,
) {
  if (tri.some(v => v < 1 || v > vertices.length)) {
    // Some vertex out of bounds
    return;
  }
  const [a, b, c] = tri.map(vI => vertices[vI - 1]);

  const minX = Math.min(a.x, b.x, c.x, 0);
  const minY = Math.min(a.y, b.y, c.y, 0);

  const maxX = Math.max(a.x, b.x, c.x, PX_WIDTH);
  const maxY = Math.max(a.y, b.y, c.y, PX_HEIGHT);

  // New basis vectors
  const u = new Vec2(b.x - a.x, b.y - a.y);
  const v = new Vec2(c.x - a.x, c.y - a.y);

  const trans = new Mat2(u.x, v.x, u.y, v.y).leftInv();

  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      const relToA = new Vec2(x - a.x, y - a.y);
      const baryCoords = trans.timesVec(relToA);
      const fA = 1 - baryCoords.x - baryCoords.y;
      const fB = baryCoords.x;
      const fC = baryCoords.y;

      if (fA < 0 || fB < 0 || fC < 0 || fA >= 1 || fB >= 1 || fC >= 1) {
        continue;
      }

      const z = fA * a.z + fB * b.z + fC * c.z;
      const color = Vec3.fromArray(a.color)
        .scale(fA)
        .plus(Vec3.fromArray(b.color).scale(fB))
        .plus(Vec3.fromArray(c.color).scale(fC))
        .toArray();
      drawPx({ x, y, z, color }, img, zBuf);
    }
  }
}

function drawPx(px: Vertex, img: ImageData, zBuf: Uint8ClampedArray) {
  const pxX = Math.floor(px.x);
  const pxY = Math.floor(px.y);
  const loc = pxY * PX_WIDTH + pxX;

  // If this pixel is further than a previously-painted pixel, don't paint it
  if (zBuf[loc] <= px.z) {
    return;
  }

  zBuf[loc] = px.z;
  for (let y = pxY * PX_SIZE; y < pxY * PX_SIZE + PX_SIZE; y++) {
    for (let x = pxX * PX_SIZE; x < pxX * PX_SIZE + PX_SIZE; x++) {
      const base = 4 * (y * WIDTH + x);
      img.data[base] = px.color[0];
      img.data[base + 1] = px.color[1];
      img.data[base + 2] = px.color[2];
      img.data[base + 3] = 255;
    }
  }
}

function constructModel(verticesText: string, trisText: string): Model {
  const vertexLines = nonemptyLines(verticesText);
  const vertices = vertexLines
    .map(toVertex)
    .filter(v => v !== undefined) as Vertex[];

  const triLines = nonemptyLines(trisText);
  const tris = triLines.map(toTri).filter(t => t !== undefined) as Tri[];

  return { vertices, tris };
}

function toVertex(line: string): Vertex | undefined {
  const parts = line.split(',').map(p => p.trim());
  if (parts.length !== 4) {
    return;
  }

  const [x, y, z, c] = parts;
  const color = toColor(c);

  if (color === undefined) {
    return;
  }

  return {
    x: Number(x),
    y: Number(y),
    z: Math.floor(Number(z)),
    color,
  };
}

function toColor(text: string): Color | undefined {
  const hex = '\\d|[a-f]|[A-F]';
  const pat = new RegExp(
    `^#(?<r>(${hex})(${hex}))(?<g>(${hex})(${hex}))(?<b>(${hex})(${hex}))$`,
  );

  const match = pat.exec(text);
  if (!match) {
    return;
  }

  const { r, g, b } = match.groups as any;
  return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
}

function toTri(line: string): Tri | undefined {
  const parts = line.split(',').map(p => p.trim());
  if (parts.length !== 3) {
    return;
  }

  const [v1, v2, v3] = parts;
  return [Number(v1), Number(v2), Number(v3)];
}

function nonemptyLines(text: string) {
  return text
    .split(/\r\n|\r|\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

interface Model {
  vertices: Vertex[];
  tris: Tri[];
}

interface Vertex {
  x: number;
  y: number;
  z: number;
  color: Color;
}

// R, G, B
type Color = [number, number, number];

// V1, V2, V3
type Tri = [number, number, number];

const SvgOverlay: React.FC<{}> = () => {
  return (
    <svg
      width={WIDTH + 2 * SVG_OVERLAY_OFFSET}
      height={HEIGHT + 2 * SVG_OVERLAY_OFFSET}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${WIDTH + 2 * SVG_OVERLAY_OFFSET} ${
        HEIGHT + 2 * SVG_OVERLAY_OFFSET
      }`}
      style={{
        position: 'absolute',
        left: `-${SVG_OVERLAY_OFFSET}px`,
        top: `-${SVG_OVERLAY_OFFSET}px`,
      }}
    >
      <Arrow
        x1={SVG_OVERLAY_OFFSET}
        y1={SVG_OVERLAY_OFFSET}
        x2={SVG_OVERLAY_OFFSET + PX_PER_MARKER * PX_SIZE}
        y2={SVG_OVERLAY_OFFSET}
        className="blue"
      />
      <Arrow
        x1={SVG_OVERLAY_OFFSET}
        y1={SVG_OVERLAY_OFFSET}
        x2={SVG_OVERLAY_OFFSET}
        y2={SVG_OVERLAY_OFFSET + PX_PER_MARKER * PX_SIZE}
        className="blue"
      />
      {range(0, WIDTH / PX_SIZE / PX_PER_MARKER).map(xPx => (
        <line
          key={xPx}
          x1={SVG_OVERLAY_OFFSET + xPx * PX_PER_MARKER * PX_SIZE}
          y1={SVG_OVERLAY_OFFSET / 2}
          x2={SVG_OVERLAY_OFFSET + xPx * PX_PER_MARKER * PX_SIZE}
          y2={SVG_OVERLAY_OFFSET}
          className="blue"
        />
      ))}
      {range(0, HEIGHT / PX_SIZE / PX_PER_MARKER).map(xPx => (
        <line
          key={xPx}
          x1={SVG_OVERLAY_OFFSET / 2}
          y1={SVG_OVERLAY_OFFSET + xPx * PX_PER_MARKER * PX_SIZE}
          x2={SVG_OVERLAY_OFFSET}
          y2={SVG_OVERLAY_OFFSET + xPx * PX_PER_MARKER * PX_SIZE}
          className="blue"
        />
      ))}
    </svg>
  );
};

export default TrianglesDemo;
