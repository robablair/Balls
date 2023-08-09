class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other){
        return new Vector2D(this.x + other.x, this.y + other.y);
    }
    scale(scalar){
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    scaleV(vector){
        return new Vector2D(this.x * vector.x, this.y * vector.y);
    }
    invScaleV(vector){
        return new Vector2D(this.x / vector.x, this.y / vector.y);
    }
    subtract(other){
        return this.add(other.scale(-1));
    }
    dot(other){
        return this.x * other.x + this.y * other.y;
    }
    clone(){
        return new Vector2D(this.x, this.y);
    }
}