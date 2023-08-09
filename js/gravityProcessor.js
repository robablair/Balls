class GravityProcessor {
    constructor() {
        this.gConst = 0.01;
    }
    computeGravity(circles) {
        circles.forEach(c => {
            let otherCircles = circles.filter(x => x != c);
            otherCircles.forEach(o => {
                const dx = o.pos.x - c.pos.x;
                const dy = o.pos.y - c.pos.y;
                const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                const drv = this.gConst * o.m / Math.pow(dist, 2);
                const sTheta = dy / dist;
                const cTheta = dx / dist;
                c.v.x += drv * cTheta;
                c.v.y += drv * sTheta;
            });
        });
    }
}