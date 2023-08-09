class Circle {
    constructor(pos, r, color) {
        this.pos = pos;
        this.v = new Vector2D(0, 0);
        this.r = r;
        this.color = color;
        this.outlineColor = "black";
    };
    get m() {
        return Math.pow(this.r, 3);
    };
    clone() {
        let copyCircle = new Circle(this.pos.clone(), this.r, this.color);
        copyCircle.v = this.v.clone();
        return copyCircle;
    }
}
