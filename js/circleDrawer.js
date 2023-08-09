class CircleDrawer{
    constructor (drawContext){
        this.drawContext = drawContext;
    }
    draw(circle, camera){
        let scale = new Vector2D(this.drawContext.canvas.width / camera.viewSize.x, this.drawContext.canvas.height / camera.viewSize.y);
        let relPos = circle.pos.subtract(camera.bottomLeft).scaleV(scale);
        relPos = new Vector2D(relPos.x, this.drawContext.canvas.height - relPos.y);
        let drawing = {
            x : Math.round(relPos.x),
            y : Math.round(relPos.y),
            r : Math.round(circle.r * scale.x)
        };
        if ((drawing.x - drawing.r > this.drawContext.canvas.width || drawing.x + drawing.r > 0) &&
         (drawing.y - drawing.r > this.drawContext.canvas.height || drawing.y + drawing.r > 0)){
            this.drawContext.beginPath();
            this.drawContext.arc(Math.round(relPos.x), Math.round(relPos.y), Math.round(circle.r * scale.x), 0, 2 * Math.PI);
            this.drawContext.strokeStyle = circle.outlineColor;
            this.drawContext.stroke();
            this.drawContext.fillStyle = circle.color;
            this.drawContext.fill();
        }
    };
}