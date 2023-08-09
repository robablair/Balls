var canvas = document.querySelector('canvas');
var circles = [];
var mirrorCircles = [];
var newCircle = null;
//var selectedColor = "#999999";
var selectedColor = "#bb3366";
var altColor = "#06a4fa";
var maxRadius;
var minRadius;
var frames = 0;
var fpsTimer = null;
var canvasSize = new Vector2D(0, 0);
var camera;
var minimapCamera;

//control variables
let boundariesEnabled = false;
let gravityEnabled = false;
let mirroringEnabled = false;
let trackCenterEnabled = false;
let collisionsEnabled = true;
let paused = false;
let centerCircle = null;
let panning = false;
let trackingOffset = new Vector2D(0, 0);

//dependencies
let circleCollider;
let circleDrawer;
let gravityProcessor;

function getRandom(min, max){
    Math.random() * (max - min) + min;
}

function createCircles(num) {
    const speed = 0.0006;
    for (let i = 0; i < num; i++) {
        const maxAttempts = 100;
        var attempts = 0;
        var circle;
        do {
            const radius = getRandom(minRadius, maxRadius);
            const pos = new Vector2D(getRandom(radius, canvasSize.x), getRandom(radius, canvasSize.y));
            circle = new Circle(pos, radius, pos.x > 0.5 * canvasSize.x ? selectedColor : altColor);
            attempts += 1;
        } while (attempts < maxAttempts && circleCollider.getCollisions(circles).length !== 0);
        circle.v = new Vector2D(getRandom(-1, 1), getRandom(-1, 1)).scaleV(canvasSize).scale(speed);
        circles.push(circle);
    }
}

var ctx = canvas.getContext('2d');

function drawFutureMotion(circle){
    let copyCamera = camera.clone();
    let copyCircles = [];
    let copyNewCircle = circle.clone();
    copyCircles.push(copyNewCircle);
    let copyCenterCircle
    circles.forEach(c => {
        copyCircles.push(c.clone());
        if (c == centerCircle)
            copyCenterCircle = copyCircles[copyCircles.length - 1];
    });
    let futurePositions = [];
    for (let i = 0; i < 1000; i++) {
        move(copyCircles, copyCenterCircle, copyCamera);
        futurePositions.push({
            pos: copyNewCircle.pos.clone(),
            cam: copyCamera.clone()
        });
    }
    let relFuturePositions = futurePositions.map(x => toScreenCoords(x.pos, x.cam));
    ctx.beginPath();
    ctx.moveTo(relFuturePositions[0].x, relFuturePositions[0].y);
    relFuturePositions.slice(1).forEach(p => {
        ctx.lineTo(p.x, p.y);
        ctx.moveTo(p.x, p.y);
    });
    ctx.lineWidth = "1";
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.transform(0.19, 0, 0, 0.19, canvasSize.x * 0.8, canvasSize.y * 0.8);
    ctx.beginPath();
    ctx.moveTo(toScreenCoords(futurePositions[0], minimapCamera).x, toScreenCoords(futurePositions[0], minimapCamera).y);
    futurePositions.slice(1).forEach(x => {
        let p = toScreenCoords(x.pos, minimapCamera);
        ctx.lineTo(p.x, p.y);
        ctx.moveTo(p.x, p.y);
    });
    ctx.lineWidth = "2";
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawMinimap(){
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "#ffffff";
    ctx.rect(canvasSize.x * 0.8, canvasSize.y * 0.8, canvasSize.x * 0.19, canvasSize.y * 0.19);
    ctx.stroke();
    ctx.beginPath();
    ctx.globalAlpha = 0;
    ctx.fillStyle = "#222222";
    ctx.fillRect(canvasSize.x * 0.8, canvasSize.y * 0.8, canvasSize.x * 0.19, canvasSize.y * 0.19)
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.transform(0.19, 0, 0, 0.19, canvasSize.x * 0.8, canvasSize.y * 0.8);
    circles.forEach(c => {
        circleDrawer.draw(c, minimapCamera);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles.forEach(x => circleDrawer.draw(x, camera));
    if (newCircle != null){
        let newCircleSpace = newCircle.clone();
        newCircleSpace.v = toSpaceVel(newCircleSpace.v, camera);
        newCircleSpace.pos = toSpaceCoords(newCircleSpace.pos, camera);
        newCircleSpace.r = newCircleSpace.r * (camera.viewSize.x / canvasSize.x);
        circleDrawer.draw(newCircleSpace, camera);
        if (gravityEnabled)
            drawFutureMotion(newCircleSpace);
    }
    drawMinimap();
    ctx.beginPath();
    ctx.lineWidth = "6";
    ctx.strokeStyle = "#2f3d4c";
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.stroke();
}

function bounceOffBoundaries(circle) {
    let relVel = camera.vel.subtract(circle.v);
    if ((circle.pos.x - circle.r <= camera.topLeft.x && relVel.x > 0) ||
        (circle.pos.x + circle.r >= camera.bottomRight.x && relVel.x < 0)) {
        circle.v = new Vector2D(2 * camera.vel.x - circle.v.x, circle.v.y);
    }
    if ((circle.pos.y - circle.r <= camera.bottomRight.y && relVel.y > 0) ||
        (circle.pos.y + circle.r >= camera.topLeft.y && relVel.y < 0)) {
        circle.v = new Vector2D(circle.v.x, 2 * camera.vel.y - circle.v.y);
    }
}

function reflectToOtherSide(circle){
    if (circle.pos.x <= camera.bottomLeft.x || circle.pos.x >= camera.bottomRight.x) {
        circle.pos.x = ((circle.pos.x - camera.bottomLeft.x + camera.viewSize.x) % camera.viewSize.x) + camera.bottomLeft.x;
    }
    if (circle.pos.y <= camera.bottomLeft.y || circle.pos.y >= camera.topLeft.y) {
        circle.pos.y = ((circle.pos.y - camera.bottomLeft.y + camera.viewSize.y) % camera.viewSize.y) + camera.bottomLeft.y;
    }
}

function getCenterOfMass(circles){
    let totalMass = circles.reduce((total, c) => total + c.m, 0)
    let weightedPos = circles.map(c => c.pos.scale(c.m / totalMass));
    return weightedPos.reduce((total, p) => total.add(p), new Vector2D(0, 0));
}

function getTrackingCenter(circles, centerCircle, offset){
    let center;
    if (centerCircle != null)
        center = centerCircle.pos;
    else
        center = getCenterOfMass(circles);
    return center.add(offset);
}

function move(circles, centerCircle, camera) {
    if (collisionsEnabled)
        circleCollider.computeCollisions(circles);
    if (gravityEnabled)
        gravityProcessor.computeGravity(circles);
    circles.forEach(function (c) {
        if (boundariesEnabled)
            bounceOffBoundaries(c);
        if (mirroringEnabled)
            reflectToOtherSide(c);
        c.pos = c.pos.add(c.v);
    });
    if (trackCenterEnabled){
        let center = getTrackingCenter(circles, centerCircle, trackingOffset);
        camera.vel = center.subtract(camera.pos);
    }
    camera.pos = camera.pos.add(camera.vel);
}

function scaleMinimap(){
    minimapCamera.pos = getTrackingCenter(circles, null, new Vector2D(0, 0));
    let allCircles = circles;
    if (newCircle != null)
        allCircles = allCircles.concat(newCircle);
    if (allCircles.length > 0){
        let maxX = Math.max(...allCircles.map(c => c.pos.x + c.r), camera.pos.x);
        let maxY = Math.max(...allCircles.map(c => c.pos.y + c.r), camera.pos.y);
        let minX = Math.min(...allCircles.map(c => c.pos.x - c.r), camera.pos.x);
        let minY = Math.min(...allCircles.map(c => c.pos.y - c.r), camera.pos.y);
        let rx = (maxX - minX) / minimapCamera.viewSize.x;
        let ry = (maxY - minY) / minimapCamera.viewSize.y;
        let maxS = Math.max(rx, ry);
        minimapCamera.viewSize = minimapCamera.viewSize.scale(maxS * 1.5);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!paused && circles.length > 0){
        move(circles, centerCircle, camera);
        scaleMinimap();
    }
    updateCanvas();
}

function setupCanvas() {
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    let newCanvasSize = new Vector2D(canvas.width, canvas.height);
    if (camera == null){
        camera = new Camera();
        camera.pos = newCanvasSize.clone();
        camera.viewSize = newCanvasSize.scale(1);
    }
    if (minimapCamera == null){
        minimapCamera = new Camera();
    }
    minimapCamera.viewSize = newCanvasSize.scale(10);
    minimapCamera.pos = new Vector2D(0, 0);
    canvasSize = newCanvasSize;
}

function setupDependencies(){
    if (mirroringEnabled){
        circleCollider = new MirroredCircleCollider(camera);
        circleDrawer = new MirroredCircleDrawer(ctx);
    }
    else{
        circleCollider = new CircleCollider();
        circleDrawer = new CircleDrawer(ctx);
    }
    gravityProcessor = new GravityProcessor();
}

function init() {
    setupCanvas();
    setupDependencies()
    createCircles(0);
    updateCanvas();
    animate();
}

window.addEventListener('resize', setupCanvas);

var startTouch = new Vector2D(0, 0);
var dragTouch = new Vector2D(0, 0);
var cameraStart = new Vector2D(0, 0);
var trackingOffsetStart = new Vector2D(0, 0);

var loopDir = 1;
var loopTimer;

function loopNewCircleSize() {
    const radiusStep = 0.005 * maxRadius;
    if (newCircle.r - radiusStep < minRadius ||
        newCircle.r + radiusStep > maxRadius) {
        loopDir *= -1;
    }
    newCircle.r += radiusStep * loopDir;
}

function toSpaceCoords(screenCoords, camera){
    let x = screenCoords.x * (camera.viewSize.x / canvasSize.x) + camera.bottomLeft.x;
    let y = (canvasSize.y - screenCoords.y) * (camera.viewSize.y / canvasSize.y) + camera.bottomLeft.y;
    return new Vector2D(x, y);
}

function toSpaceVel(screenVel, camera){
    let x = screenVel.x * (camera.viewSize.x / canvasSize.x) + camera.vel.x;
    let y = -screenVel.y * (camera.viewSize.y / canvasSize.y) + camera.vel.y;
    return new Vector2D(x, y);
}

function toScreenCoords(spaceCoords, camera){
    let x = (spaceCoords.x - camera.bottomLeft.x) * (canvasSize.x / camera.viewSize.x);
    let y = canvasSize.y - (spaceCoords.y - camera.bottomLeft.y) * (canvasSize.y / camera.viewSize.y);;
    return new Vector2D(x, y);
}

canvas.addEventListener('mousemove', function (e) {
    e.preventDefault();
    dragTouch.x = e.clientX;
    dragTouch.y = e.clientY;
    if (newCircle != null){
        newCircle.v = new Vector2D(startTouch.x - dragTouch.x, startTouch.y - dragTouch.y).scale(0.05);
    }
    if (panning){
        let pan = toSpaceCoords(dragTouch, camera).subtract(toSpaceCoords(startTouch, camera));
        if (trackCenterEnabled){
            trackingOffset = trackingOffsetStart.subtract(pan);
            camera.pos = getTrackingCenter(circles, centerCircle, trackingOffset);
        }
        else
        {
            camera.pos = cameraStart.subtract(pan);
        }
    }
});

function getMouseAction(mouseEvent){
    startTouch.x = mouseEvent.clientX;
    startTouch.y = mouseEvent.clientY;
    let spaceCoords = toSpaceCoords(startTouch, camera);
    let hitCircles = circleCollider.hit(circles, spaceCoords);
    if (hitCircles.length > 0){
        if (centerCircle == hitCircles[0]){
            centerCircle.outlineColor = "black";
            centerCircle = null;
            camera.vel = new Vector2D(0, 0);
        }
        else{
            if (centerCircle != null)
                centerCircle.outlineColor = "black";
            centerCircle = hitCircles[0];
            centerCircle.outlineColor = "white";
            if (trackCenterEnabled){
                trackingOffset = new Vector2D(0, 0);
                camera.pos = centerCircle.pos.clone();
            }
        }
    }
    else{
        dragTouch = startTouch.clone();
        maxRadius = 0.1 * Math.max(canvasSize.x, canvasSize.y);
        minRadius = 0.001 * Math.max(canvasSize.x, canvasSize.y);
        newCircle = new Circle(new Vector2D(startTouch.x, startTouch.y), 0.8 * (maxRadius - minRadius), '#648fae');
        loopDir = 1;
        loopTimer = setInterval(loopNewCircleSize, 10);
    }
}

canvas.addEventListener('mousedown', function (e) {
    e.preventDefault();
    if (e.which == 1) {
        getMouseAction(e);
    }
    else if (e.which == 2){
        panning = true;
        startTouch.x = e.clientX;
        startTouch.y = e.clientY;
        cameraStart = camera.pos.clone();
        trackingOffsetStart = trackingOffset.clone();
    }
});

canvas.addEventListener('mouseup', function (e) {
    e.preventDefault();
    if (e.which == 1 && newCircle != null) {
        clearInterval(loopTimer);
        loopTimer = null;
        newCircle.v = toSpaceVel(newCircle.v, camera);
        newCircle.pos = toSpaceCoords(newCircle.pos, camera);
        newCircle.r = newCircle.r * (camera.viewSize.x / canvasSize.x);
        newCircle.color = selectedColor;
        circles.push(newCircle);
        newCircle = null;
    }
    else if (e.which == 2){
        panning = false;
    }
});

window.addEventListener("keydown", function (e){
    if (e.key == "b"){
        boundariesEnabled = !boundariesEnabled;
    }
    if (e.key == "m"){
        mirroringEnabled = !mirroringEnabled;
    }
    if (e.key == "g"){
        gravityEnabled = !gravityEnabled;
    }
    if (e.key == "t"){
        trackCenterEnabled = !trackCenterEnabled;
        if (trackCenterEnabled){
            trackingOffset = new Vector2D(0, 0);
            let center = getTrackingCenter(circles, centerCircle, trackingOffset);
            camera.pos = center;
        }
        else{
            camera.vel = new Vector2D(0, 0);
        }
    }
    if (e.key == "p"){
        paused = !paused;
    }
    if (e.key == "z"){
        circles.pop();
    }
    if (e.key == "s" && newCircle != null) {        
        if (loopTimer != null){
            clearInterval(loopTimer);
            loopTimer = null;
        }
        else if (newCircle != null){
            loopTimer = setInterval(loopNewCircleSize, 10);
        }
    }
    if (e.key == "c"){
        collisionsEnabled = !collisionsEnabled;
    }
    setupDependencies()
});

canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    let pivotStart = toSpaceCoords(new Vector2D(e.clientX, e.clientY), camera);
    if (e.deltaY > 1){
        camera.viewSize = camera.viewSize.scale(1.1);
        let pivotShifted = toSpaceCoords(new Vector2D(e.clientX, e.clientY), camera);
        let dist = pivotStart.subtract(pivotShifted);
        camera.pos = camera.pos.add(dist);
    }
    else{
        camera.viewSize = camera.viewSize.scale(1 / 1.1);
        let pivotShifted = toSpaceCoords(new Vector2D(e.clientX, e.clientY), camera);
        let dist = pivotStart.subtract(pivotShifted);
        camera.pos = camera.pos.add(dist);
    }
});
