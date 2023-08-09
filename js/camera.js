class Camera {
    constructor() {
        this.pos = new Vector2D(0, 0);
        this.vel = new Vector2D(0, 0);
        this.viewSize = new Vector2D(0, 0);
    }
    get bottomLeft(){
        let half = this.viewSize.scale(0.5);
        return this.pos.subtract(half);
    }
    get bottomRight(){
        return new Vector2D(this.bottomLeft.x + this.viewSize.x, this.bottomLeft.y);
    }
    get topLeft(){
        return new Vector2D(this.bottomLeft.x, this.bottomLeft.y + this.viewSize.y);
    }
    get topRight(){
        return new Vector2D(this.topLeft.x + this.viewSize.x, this.topLeft.y);
    }
    clone() {  
        let copy = new Camera();
        copy.pos = this.pos.clone();
        copy.vel = this.vel.clone();
        copy.viewSize = this.viewSize.clone();
        return copy;
    }
}