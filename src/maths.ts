export class Vec2 {
  constructor(public x: number, public y: number) {}

  plus(rhs: Vec2): Vec2 {
    return new Vec2(this.x + rhs.x, this.y + rhs.y);
  }

  minus(rhs: Vec2): Vec2 {
    return new Vec2(this.x - rhs.x, this.y - rhs.y);
  }

  scale(f: number): Vec2 {
    return new Vec2(f * this.x, f * this.y);
  }

  scaleTo(len: number): Vec2 {
    const currentLen = this.len();
    if (currentLen === 0) {
      return this;
    }

    const f = len / currentLen;
    return this.scale(f);
  }

  rotate(theta: number): Vec2 {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return new Mat2(cos, sin, -sin, cos).timesVec(this);
  }

  len(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

export class Mat2 {
  // | a  c |
  // | b  d |
  // prettier-ignore
  constructor(
    public a: number, public b: number,
    public c: number, public d: number,
  ) {}

  timesVec(rhs: Vec2): Vec2 {
    const { a, b, c, d } = this;
    const { x, y } = rhs;
    return new Vec2(a * x + c * y, b * x + d * y);
  }

  leftInv(): Mat2 {
    const { a, b, c, d } = this;
    const det = a * d - b * c;
    return new Mat2(d, -c, -b, a).scale(1 / det);
  }

  scale(f: number): Mat2 {
    const { a, b, c, d } = this;
    return new Mat2(f * a, f * b, f * c, f * d);
  }
}
