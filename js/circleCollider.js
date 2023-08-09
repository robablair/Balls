class CircleCollider{
    computeCollisions(circles){
        circles.forEach((c, i) => {
            let otherCircles = circles.slice(i + 1)
            otherCircles.forEach(o => {
                let dist = Math.sqrt(Math.pow(o.pos.x - c.pos.x, 2) + Math.pow(o.pos.y - c.pos.y, 2));
                if (dist < o.r + c.r) {
                    this.computeCollision({
                        circle: c,
                        pos: c.pos
                    }, {
                        circle: o,
                        pos: o.pos
                    });
                }
            });
        });
    };
    computeCollision(circle1Pos, circle2Pos) {
        const o1 = circle1Pos.circle;
        const o2 = circle2Pos.circle;
        const dx = circle2Pos.pos.x - circle1Pos.pos.x;
        const dy = circle2Pos.pos.y - circle1Pos.pos.y;
        const dvx = o2.v.x - o1.v.x;
        const dvy = o2.v.y - o1.v.y;
        if (dx * dvx + dy * dvy < 0) {
            const hyp = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            const sTheta = dy / hyp;
            const cTheta = dx / hyp;
            var o2Vxc = o2.v.x * cTheta + o2.v.y * sTheta;
            const o2Vyc = -o2.v.x * sTheta + o2.v.y * cTheta;
            var o1Vxc = o1.v.x * cTheta + o1.v.y * sTheta;
            const o1Vyc = -o1.v.x * sTheta + o1.v.y * cTheta;
            //for momentum
            const combV = (o1Vxc * o1.m + o2Vxc * o2.m) / (o1.m + o2.m);
            o1Vxc = 0.95 * (combV - o1Vxc) + combV;
            o2Vxc = 0.95 * (combV - o2Vxc) + combV;
            //
            o2.v.x = o2Vxc * cTheta - o2Vyc * sTheta;
            o2.v.y = o2Vxc * sTheta + o2Vyc * cTheta;
            o1.v.x = o1Vxc * cTheta - o1Vyc * sTheta;
            o1.v.y = o1Vxc * sTheta + o1Vyc * cTheta;
        }
    };
    hit(circles, point){
        let hitCircles = circles.filter(c => {
            if (point.x > c.pos.x - c.r && point.x < c.pos.x + c.r){
                if (point.y > c.pos.y - c.r && point.y < c.pos.y + c.r){
                    return true;
                }
            }
            return false;
        });
        return hitCircles;
    };
}