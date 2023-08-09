class MirroredCircleDrawer extends CircleDrawer{
    constructor(drawContext){
        super(drawContext);
    }
    mirroredPositions(circle, camera) {
        var positions = [];
        positions.push(new Vector2D(circle.pos.x + camera.viewSize.x, circle.pos.y));
        positions.push(new Vector2D(circle.pos.x, circle.pos.y - camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - camera.viewSize.x, circle.pos.y));
        positions.push(new Vector2D(circle.pos.x, circle.pos.y + camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x + camera.viewSize.x, circle.pos.y + camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x + camera.viewSize.x, circle.pos.y - camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - camera.viewSize.x, circle.pos.y + camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - camera.viewSize.x, circle.pos.y - camera.viewSize.y));
        var visibleMirPositions = positions.filter(p => {
            return (p.x - circle.r <= camera.bottomRight.x && p.x + circle.r >= camera.bottomLeft.x) &&
                (p.y - circle.r <= camera.topLeft.y && p.y + circle.r >= camera.bottomLeft.y);
        });
        return visibleMirPositions;
    }
    draw(circle, camera){
        super.draw(circle, camera);
        let mirrorPos = this.mirroredPositions(circle, camera);
        mirrorPos.forEach(mir => super.draw(new Circle(mir, circle.r, circle.color), camera));
    }
}