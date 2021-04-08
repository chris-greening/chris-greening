var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

var presets = {
    speed: 0.2,
    maxRockSpeed: 4.5,
    rockCount: Math.round((vw/200) + (vh/300)),
    gameStart: false
};

function initialize() {
    Rocks.add(presets.rockCount);
    setTimeout(function () { Ship.make(); }, 1800);
    Score.update();
}

function onKeyUp(event) {
    if (event.key == 'space') {
        Ship.fire();
        if (!presets.gameStart) {
            presets.gameStart = true;
        }
    }
}

function onFrame() {
    Bullets.move();
    Rocks.iterateExplosions();
    Ship.checkCollisions();
    if (Key.isDown('left')) {
        Ship.turnLeft();
        if (!presets.gameStart) {
            presets.gameStart = true;
        }
    }
    if (Key.isDown('right')) {
        Ship.turnRight();
        if (!presets.gameStart) {
            presets.gameStart = true;
        }
    }
    if (Key.isDown('up')) {
        Ship.thrust();
        if (!presets.gameStart) {
            presets.gameStart = true;
        }
    if (Key.isDown("n")) {

    }
    } else {
        Ship.coast();
    }
    Ship.move();
}


project.currentStyle.strokeColor = 'white';

var Game = {
    roundDelay: false,
    over: function () {
        document.getElementById('gameover').style.display = 'block';
    },
    newRound: function () {
        Game.roundDelay = false;
        Rocks.add(presets.rockCount);
    },
};

var assets = {
    destroyedShip: new function () {
        var group = new Group(
            new Path([-10, -8], [10, 0]),
            new Path([10, 0], [-10, 8])
            // new Path([-8, 4], [-8, -4])
        );
        group.visible = false;
        return group;
    },
    explosion: new function () {
        var explosionPath = new Path.Circle(new Point(), 1);
        if (nightMode) {
            explosionPathColor = "white";
        } else {
            explosionPathColor = "black";
        }
        explosionPath.fillColor = explosionPathColor;
        explosionPath.strokeColor = null;
        return new SymbolDefinition(explosionPath);
    }
};

var Ship = new function () {
    var path = new Path([-7, -15], [0, 2], [7, -15]);
    path.strokeWidth = 2.5;
    path.strokeColor = "white";
    // path.fillColor = "black";
    // path.closed = true;
    var integerOverflow = false;
    var thrust = new Path([-4, -9], [0, -18], [4, -9]);
    var group = new Group(path, thrust);
    group.opacity = 0;
    // group.position = view.bounds.center;
    var v = getStartPosition();
    group.position = new Point(v.x, v.y);
    return {
        item: group,

        angle: 90,

        vector: new Point({
            angle: 0.2,
            length: 0
        }),

        make: function () {
            this.item.opacity = 1;
        },

        turnLeft: function () {
            group.rotate(-3);
            this.angle -= 3;
        },

        turnRight: function () {
            group.rotate(3);
            this.angle += 3;
        },

        thrust: function () {
            thrust.visible = true;
            this.vector += new Point({
                angle: this.angle,
                length: presets.speed
            });
            if (this.vector.length > 8) {
                this.vector.length = 8;
            }
        },

        stop: function () {
            this.vector.length = 0;
        },

        fire: function () {
            if (!this.dying)
                Bullets.fire(this.item.position, this.angle);
        },

        coast: function () {
            thrust.visible = false;
            this.vector *= .992;
        },

        move: function () {
            group.position += this.vector;
            keepInView(group);
        },

        moveTo: function (position) {
            group.position = position;
            keepInView(group);
        },

        destroy: function () {
            this.destroyedShip = assets.destroyedShip.clone();
            this.destroyedShip.position = this.item.position;
            this.destroyedShip.visible = true;
            this.item.visible = false;
            this.stop();
            this.item.position = view.center;
            // var v = getStartPosition();
            this.item.position = new Point(v.x, v.y);
            this.dying = true;
        },

        destroyed: function () {
            this.item.visible = true;
            this.stop();
            // var v = getStartPosition();
            // this.item.position = new Point(v.x, v.y);
            this.item.position = view.center;
            this.item.angle = 90;
            this.dying = false;
            this.destroyedShip.visible = false;
        },

        checkCollisions: function () {
            var crashRock;

            // move rocks and do a hit-test
            // between bounding rect of rocks and ship
            for (var i = 0; i < Rocks.children.length; i++) {
                var rock = Rocks.children[i];
                rock.position += rock.vector;
                if (rock.bounds.intersects(this.item.bounds))
                    crashRock = rock;
                keepInView(rock);
            }

            if (this.dying) {
                var children = this.destroyedShip.children;
                children[0].position.x++;
                children[1].position.x--;
                children[0].rotate(1);
                children[1].rotate(-1);
                this.destroyedShip.opacity *= 0.98;

                // don't update anything else if the ship is already dead.
                return;
            }


            // if bounding rect collision, do a line intersection test
            if (crashRock) {
                var tempRock = crashRock.symbol.definition.clone();
                tempRock.transform(crashRock.matrix);
                tempRock.remove();
                var intersections = this.item.firstChild.getIntersections(tempRock);
                if (intersections.length > 0 && presets.gameStart) {
                    Ship.destroy();
                    setTimeout(function () { Ship.destroyed(); }, 1200);
                }
            }
        }
    };
};

var Bullets = new function () {
    var group = new Group();
    var children = group.children;

    function checkHits(bullet) {
        for (var r = 0; r < Rocks.children.length; r++) {
            var rock = Rocks.children[r];
            if (rock.bounds.contains(bullet.position)) {
                Score.update(rock.shapeType);
                Rocks.explode(rock);
                if (rock.shapeType < Rocks.TYPE_SMALL) {
                    for (var j = 0; j < 2; j++) {
                        Rocks.add(1, rock.shapeType + 4, rock.position);
                    }
                }
                rock.remove();
                bullet.remove();
            }
        }
    }

    return {
        fire: function (position, angle) {
            // We can only fire 5 bullets at a time:
            if (children.length == 5)
                return;
            var vector = new Point({
                angle: angle,
                length: 10
            });
            if (nightMode) {
                var bulletColor = "white";
                var bulletWidth = "white";
            } else {
                var bulletColor = "black";
                var bulletWidth = "black";
            }
            var bullet = new Path.Circle({
                center: position + vector,
                radius: 2.0,
                parent: group,
                fillColor: bulletColor,
                strokeWidth: bulletWidth,
                strokeWidth: 0,
                data: {
                    vector: vector,
                    timeToDie: 60
                }
            });
        },
        move: function () {
            for (var i = 0; i < children.length; i++) {
                var bullet = children[i];
                bullet.data.timeToDie--;
                if (bullet.data.timeToDie < 1) {
                    bullet.remove();
                } else {
                    bullet.position += bullet.data.vector;
                    checkHits(bullet);
                    keepInView(bullet);
                }
            }
        }
    };
};

var Rocks = new function () {
    var group = new Group();
    var shapes = [
        new Path(
            [-23, -40.5], [0, -30.5], [24, -40.5], [45, -21.5], [25, -12.5],
            [46, 9.5], [22, 38.5], [-10, 30.5], [-22, 40.5], [-46, 18.5],
            [-33, 0.5], [-44, -21.5], [-23, -40.5]),
        new Path(
            [-45, -9.5], [-12, -40.5], [24, -40.5], [46, -11.5], [45, 10.5],
            [24, 40.5], [0, 40.5], [0, 10.5], [-23, 38.5], [-46, 9.5], [-25, 0.5],
            [-45, -9.5]),
        new Path([-21.5, -39.5], [11.5, -39.5], [45.5, -20.5],
            [45.5, -8.5], [9.5, 0.5], [44.5, 21.5], [22.5, 39.5], [9.5, 31.5],
            [-20.5, 39.5], [-45.5, 10.5], [-45.5, -20.5], [-11.5, -21.5],
            [-21.5, -39.5]),
        new Path(
            [-22.5, -40.5], [-0.5, -19.5], [23.5, -39.5], [44.5, -21.5],
            [33.5, 0.5], [46.5, 19.5], [13.5, 40.5], [-22.5, 39.5], [-46.5, 18.5],
            [-46.5, -18.5], [-22.5, -40.5])
    ];
    for (var i = 0; i < 4; i++) {
        shapes[i].fillColor = "black";
        shapes[i].strokeWidth = 1.5;
    }

    // medium rocks
    for (var i = 4; i < 8; i++) {
        shapes[i] = shapes[i - 4].clone();
        shapes[i].scale(0.5);
    }

    // small rocks
    for (var i = 8; i < 12; i++) {
        shapes[i] = shapes[i - 4].clone();
        shapes[i].scale(0.4);
    }

    var rockSymbols = [];
    for (var i = 0; i < shapes.length; i++) {
        rockSymbols[i] = new SymbolDefinition(shapes[i]);
    }

    var explosions = new Group();

    return {
        shapes: shapes,
        children: group.children,
        make: function (type, pos) {
            var randomRock = type + Math.floor(4 * Math.random());
            var rock = rockSymbols[randomRock].place();
            rock.position = pos ? pos : Point.random() * view.size;
            rock.vector = new Point({
                angle: 360 * Math.random(),
                length: presets.maxRockSpeed * Math.random() + 0.1
            });
            rock.shapeType = type;
            rock.fillColor = "black";
            return rock;
        },
        add: function (amount, type, position) {
            for (var i = 0; i < amount; i++) {
                var rock = this.make(type || this.TYPE_BIG, position);
                group.addChild(rock);
            }
        },
        explode: function (rock) {
            var boomRock = rock.symbol.definition.clone();
            boomRock.position = rock.position;
            for (var i = 0; i < boomRock.segments.length; i++) {
                var segmentPoint = boomRock.segments[i].point;
                var placed = assets.explosion.place(segmentPoint);
                placed.vector = (placed.position - rock.position) * 0.1;
                explosions.addChild(placed);
            }
            boomRock.remove();
        },
        iterateExplosions: function () {
            for (var i = 0; i < explosions.children.length; i++) {
                var explosion = explosions.children[i];
                explosion.vector.length *= .7;
                explosion.position += explosion.vector;
                explosion.opacity = explosion.vector.length;
                if (explosion.vector.length < 0.05) {
                    explosion.remove();
                    // if no more rocks, wait a second and start a new round
                    if (this.children.length < 1 && !Game.roundDelay) {
                        Game.roundDelay = true;
                        presets.rockCount += 2;
                        setTimeout(Game.newRound, 1000);
                    }
                }
            }
        },
        TYPE_BIG: 0,
        TYPE_MEDIUM: 4,
        TYPE_SMALL: 8
    };
};

var Score = new function () {
    var numberGroup = new Group(
        new Path([0, 0], [20, 0], [20, 27], [0, 27], [0, 0]),
        new Path([10, 0], [10, 27]),
        new Path([0, 0], [20, 0], [20, 14], [0, 14], [0, 27], [20, 27]),
        new Path([0, 0], [20, 0], [20, 14], [0, 14], [20, 14], [20, 27], [0, 27]),
        new Path([0, 0], [0, 14], [20, 14], [20, 0], [20, 27]),
        new Path([20, 0], [0, 0], [0, 14], [20, 14], [20, 27], [0, 27]),
        new Path([20, 0], [0, 0], [0, 27], [20, 27], [20, 14], [0, 14]),
        new Path([0, 0], [20, 0], [0, 27]),
        new Path([0, 0], [20, 0], [20, 27], [0, 27], [0, 0], [0, 14], [20, 14]),
        new Path([20, 14], [0, 14], [0, 0], [20, 0], [20, 27])
    );
    numberGroup.visible = false;
    var scoreDisplay = new Group();
    var score = 0;
    return {
        update: function (type) {
            if (type == Rocks.TYPE_BIG) score += 400;
            if (type == Rocks.TYPE_MEDIUM) score += 1000;
            if (type == Rocks.TYPE_SMALL) score += 2000;
            if (score >= 65535) {
                score = 0;
                Ship.integerOverflow = true;
            }
            scoreDisplay.removeChildren();

            var scoreString = score + '';
            for (var i = 0; i < scoreString.length; i++) {
                var n = parseInt(scoreString[i], 10);
                scoreDisplay.addChild(numberGroup.children[n].clone());
                scoreDisplay.lastChild.position = [22 + i * 24, 22];
                // if (nightMode) {
                //     scoreDisplay.strokeColor = "white";
                // } else {
                //     scoreDisplay.strokeColor = "black";
                // }
            }
        },

        // updateColor: function () {
        //     if (nightMode) {
        //         scoreDisplay.strokeColor = "white";
        //     } else {
        //         scoreDisplay.strokeColor = "black";
        //     }
        // }
    };
};

initialize();

// Stop left and right keyboard events from propagating.
function onKeyDown(event) {
    if (event.key == 'left' || event.key == 'right') {
        return false;
    }
}

function keepInView(item) {
    var position = item.position;
    var itemBounds = item.bounds;
    var bounds = view.bounds;

    if (itemBounds.left > bounds.width) {
        position.x = -item.bounds.width;
    }

    if (position.x < -itemBounds.width) {
        position.x = bounds.width;
    }

    if (itemBounds.top > view.size.height) {
        position.y = -itemBounds.height;
    }

    if (position.y < -itemBounds.height) {
        position.y = bounds.height + itemBounds.height / 2;
    }
}

function getStartPosition() {
    var v = document.getElementById("ship-position")
    var rect = v.getBoundingClientRect()
    return {
        x: (rect.right + rect.left) / 2 - 2,
        y: (rect.top + rect.bottom) / 2
    }
}

var count = 150;

// Create a symbol, which we will use to place instances of later:
var Star = new Path.Circle({
    center: new Point(0, 0),
    radius: 3,
    fillColor: 'white',
    strokeColor: 'black'
});

var symbol = new SymbolDefinition(Star);

// Place the instances of the symbol:
for (var i = 0; i < count; i++) {
    // The center position is a random point in the view:
    var center = Point.random() * view.size;
    var placed = symbol.place(center);
    var scale = (i + 1) / count;
    placed.scale(scale);
    placed.data.vector = new Point({
        angle: Math.random() * 360,
        length: scale * Math.random() / 5
    });
    placed.sendToBack();
}

var vector = new Point({
    angle: 45,
    length: 0
});

var nightModeButton = document.getElementById('nightmode');
var nightMode = true;

nightModeButton.onclick = function () {
    var body = document.getElementsByTagName("body")[0];
    // var container = document.querySelector(".container .box .title h1");
    var h1 = document.getElementsByTagName("h1")[0];
    var p = document.getElementsByTagName("p");
    var button = document.getElementsByTagName("i")[0];
    // var span = document.getElementsByTagName("span")[0];
    if (nightMode) {
        body.classList.remove("darkmode");
        body.classList.add("lightmode");
        h1.style.color = "black";
        button.style.color = "black";
        for (var i=0; i < p.length; i++) {
            p[i].style.color = "black";
        }
        Ship.item.strokeColor = "black";
        Score.updateColor();
    } else {
        body.classList.add("darkmode");
        body.classList.remove("lightmode");
        h1.classList.remove("lightmode");
        h1.style.color = "white";
        button.style.color = "white";
        for (var i=0; i < p.length; i++) {
            p[i].style.color = "white";
        }
        Ship.item.strokeColor = "white";
        Score.updateColor();
    }
    nightMode = !nightMode
}

// var mouseVector = vector.clone();

// function onMouseMove(event) {
//     mouseVector = view.center - event.point;
// }

// The onFrame function is called up to 60 times a second:
// function onFrame(event) {
//     vector = vector + (mouseVector - vector) / 30;

//     // Run through the active layer's children list and change
//     // the position of the placed symbols:
//     for (var i = 0; i < count; i++) {
//         var item = project.activeLayer.children[i];
//         var size = item.bounds.size;
//         var length = vector.length / 10 * size.width / 10;
//         item.position += vector.normalize(length) + item.data.vector;
//         keepInView(item);
//     }
// }