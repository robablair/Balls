class MirroredCircleCollider extends CircleCollider{
    constructor (camera){
        super();
        this.camera = camera;
    }
    mirroredPositions(circle) {
        var positions = [];
        positions.push(new Vector2D(circle.pos.x + this.camera.viewSize.x, circle.pos.y));
        positions.push(new Vector2D(circle.pos.x, circle.pos.y - this.camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - this.camera.viewSize.x, circle.pos.y));
        positions.push(new Vector2D(circle.pos.x, circle.pos.y + this.camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x + this.camera.viewSize.x, circle.pos.y + this.camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x + this.camera.viewSize.x, circle.pos.y - this.camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - this.camera.viewSize.x, circle.pos.y + this.camera.viewSize.y));
        positions.push(new Vector2D(circle.pos.x - this.camera.viewSize.x, circle.pos.y - this.camera.viewSize.y));
        var visibleMirPositions = positions.filter(p => {
            return (p.x - circle.r <= this.camera.bottomRight.x && p.x + circle.r >= this.camera.bottomLeft.x) &&
                (p.y - circle.r <= this.camera.topLeft.y && p.y + circle.r >= this.camera.bottomLeft.y);
        });
        return visibleMirPositions;
    }
    computeCollisions(circles){
        circles.forEach((c, i) => {
            let otherCircles = circles.slice(i + 1)
            otherCircles.forEach(o => {
                let mirrorPos1 = this.mirroredPositions(c);
                let mirrorPos2 = this.mirroredPositions(o);
                mirrorPos1.concat(c.pos).forEach(m1 => {
                    mirrorPos2.concat(o.pos).forEach(m2 => {
                        let dist = Math.sqrt(Math.pow(m2.x - m1.x, 2) + Math.pow(m2.y - m1.y, 2));
                        if (dist < o.r + c.r){
                            this.computeCollision({
                                circle: c,
                                pos: m1
                            },
                            {
                                circle: o,
                                pos: m2
                            });
                        }
                    });
                });
            });
        });
    }
    hit(circles, point){
        let hitCircles = circles.filter(c => {
            let pos = this.mirroredPositions(c)
            pos.push(c.pos);
            let hitPos = pos.filter(p => {
                if (point.x > p.x - c.r && point.x < p.x + c.r){
                    if (point.y > p.y - c.r && point.y < p.y + c.r){
                        return true;
                    }
                }
                return false;
            });
            return hitPos.length > 0
        });
        return hitCircles;
    }
}