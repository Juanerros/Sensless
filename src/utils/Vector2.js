export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(vector) {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }

  static magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  static add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  static subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  static multiply(vector, scalar) {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }
}