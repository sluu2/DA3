var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update});

function preload() {
    
    /* MUSIC AND SOUNDS*/
    game.load.audio('backgroundmusic', ['assets/audio/smugglers.ogg']);
    game.load.audio('exitmusic', ['assets/audio/desperate.ogg']);
    game.load.audio('satoru', ['assets/audio/satoru_iwata.ogg']);
    game.load.audio('mariojump', ['assets/audio/mariojump.ogg']);
    game.load.audio('ring', ['assets/audio/ring.ogg']);
    
    /* TILEMAPS */
    
    game.load.tilemap('map', 'assets/tilemaps/tutorial.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/simple_tiles.png');
    game.load.image('light', 'assets/tilemaps/lighting.png');
    
    /* HUD */
    game.load.spritesheet('menu', 'assets/hud/menu.png', 800, 600);
    game.load.image('objectiveHUD', 'assets/hud/objective.png');
    game.load.image('pauseButton', 'assets/hud/pause.png');
    
    /* PLAYER AND OBJECTS */
    game.load.spritesheet('diamond', 'assets/object/diamond.png', 36, 36);
    game.load.spritesheet('kawaiicube', 'assets/object/kawaiicube.png', 36, 36);
    game.load.spritesheet('exit', 'assets/object/exit.png', 36, 72);
    
    game.load.spritesheet('mario', 'assets/entity/mario.png', 28, 36);
}

/* MAP VARIABLES */    
var map;
var backgroundLayer;
var boundaryLayer;
var lightingLayer;
var goal;

/* HUD */
var menu;
var pauseButton;
var diamondHUD;
var objHUD;
var diamondCount;
var scoreText;

/* SOUND VARIABLES */
var music;
var vicmusic;
var exitmusic;
var jumpSound;
var ringSound;
     
/* TIMERS*/
var reboundLockT;
var reboundDelayT;

/* GRAVITY */
var pdg = 400;  //Player Default Gravity
var pwg = 15;   //Player Wall Gravity

/* GAME LOGIC TRACKER */
var lastKey;        // General Directional tracking
var reboundDir;     // Walljump  Directional tracking
var walljumpLock;   //
var reboundToggle;
var jumpToggle;     // Checks if jump key is pressed from the ground
var pushingCube;
var goalComplete = false;
var win = false;
    
/* WORLD OBJECTS */
var diamond;
var cube;
var player;

/* MOVEMENT CONTROLS */
var cursors;
var leftKey;
var rightKey;
var jumpKey;

//SPAWNING MULTIPLIER
var dim = 36;

function create() {
    /* PHASER PHIYSICS ENGINE USED A*/
    game.physics.startSystem(Phaser.Physics.Arcade);
    
    /* GAME  VISUALS*/
    game.stage.backgroundColor = "#4488AA";
    map = game.add.tilemap('map');
    map.addTilesetImage('simple_tiles','tiles');
    map.addTilesetImage('lighting', 'light');
    
    /* CREATE BASIC LAYERS AND COLLISIONS */
    boundaryLayer = map.createLayer('boundary');
    backgroundLayer = map.createLayer('background');
    boundaryLayer.resizeWorld();
    map.setCollisionBetween(0,5);
    
    /* GAME AUDIO */
    music = game.add.audio('backgroundmusic');
    vicmusic = game.add.audio('satoru');
    exitmusic = game.add.audio('exitmusic');
    music.play('', 0, .25, false, true);
    jumpSound = game.add.audio('mariojump');
    ringSound = game.add.audio('ring');
    
    /* GOAL */
    goal = game.add.sprite(43 * dim, 33 * dim, 'exit');
    goal.frame = 0;
    
    /* ADD OBJECTS TO THE GAME WORLD */
    player = game.add.sprite(3 * dim, 6 * dim, 'mario');
    //player = game.add.sprite(41 * dim, 34 * dim, 'mario');
        
    //cube = game.add.sprite(360, game.world.height - 108, 'kawaiicube');
    
    /* DIAMONDS */
    diamond = game.add.group();
    diamond.enableBody = true;
    map.createFromObjects('diamond', 8, 'diamond', 0, true, false, diamond);
    diamond.callAll('animations.add', 'animations', 'hover', [0, 1, 2, 1, 0, 3, 4, 3], 3, true);
    diamond.callAll('animations.play', 'animations', 'hover');
    diamondCount = diamond.length;
    
    
    
    lightingLayer = map.createLayer('lighting');
    
    menu = game.add.sprite(0,0, 'menu');
    menu.fixedToCamera = true;
    
    //  Enabling Physics
    game.physics.arcade.enable(player);
    game.physics.arcade.enable(goal);
    
    
    /* PLAYER SECTION */
    //Player physics
    player.body.bounce.y = 0;
    player.body.gravity.y = pdg;
    player.body.collideWorldBounds = true;
    //player.body.setSize(22, 28, 3, 8);

    //Player animations
    player.animations.add('r-run', [0, 1, 2, 3, 4, 5, 6, 7], 10, true);
    player.animations.add('l-run', [8, 9, 10, 11, 12, 13, 14, 15], 10, true);
    player.animations.add('r-stand', [16, 17], 3, true);
    player.animations.add('l-stand', [18, 19], 3, true);
    player.animations.add('r-push', [24, 25, 26, 27, 28, 29], 5, true);
    player.animations.add('l-push', [30, 31, 32, 33, 34, 35], 5, true);
    player.animations.add('victory', [38, 39], 3, true);
    /* END OF PLAYER SECTION*/
    
    /* TIMERS */
    
    /* HUD */
    //  The score
    objHUD = game.add.sprite(12, 12, 'objectiveHUD');
    diamondHUD = game.add.sprite(20, 16, 'diamond');
    scoreText = game.add.text(64, 20, 'Remaining: ' + diamondCount, { fontSize: '36px', fill: '#FFF' });
    objHUD.fixedToCamera = true;
    diamondHUD.fixedToCamera = true;
    scoreText.fixedToCamera = true;
    
    //  Directional Controls
    cursors = game.input.keyboard.createCursorKeys();
    
    // Standard Controls
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    game.camera.follow(player);
    
    /* LAYER COLLISION DEBUGGER*/
    //layer.debug = true;
    
    /* MENU AND PAUSE SECTION */
    this.game.paused = true;
    this.pauseButton = this.game.add.sprite(267, 12, 'pauseButton');
    this.pauseButton.fixedToCamera = true;
    this.pauseButton.inputEnabled = true;
    this.pauseButton.events.onInputUp.add(function () {
        this.game.paused = true;
    },this);
    this.game.input.onDown.add(function () {
        if(this.game.paused) {
            menu.kill();
            this.game.paused = false;
        }
    },this);
}

function update() {
    //game.debug.body(player);
    
    /* OBJECT COLLISION WITH GAME WORLD */ 
    game.physics.arcade.collide(player, boundaryLayer);
    game.physics.arcade.overlap(player, diamond, collectDiamond, null, this);
    game.physics.arcade.overlap(player, goal, victoryInit, null, this);
    //game.physics.arcade.collide(player, cube, pushCube, null, this);
    
    
    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;
    
    //SETS WINNING CONDITION
    if (!win) {
        if (diamondCount <= 5) {
            if (diamondCount === 0)
                goal.frame = 1;
            goalComplete = true;
            if (!exitmusic.isPlaying) {
                music.stop();
                exitmusic.play('', 0, .10, false, true);
            }           
        }
        
        if (!music.isPlaying && !goalComplete)
            music.play('', 0, .25, false, true);
        
    if ((cursors.left.isDown || leftKey.isDown)  && !walljumpLock) {
        setPlayerVelocity(-150, 0, true, false);
        lastKey = 'left';
        if (!player.body.blocked.down) {
            if (player.body.blocked.left) {
                //SLOW CHARACTER DOWN WHEN HUGGING WALL
                if (player.body.velocity.y < 0)
                    setPlayerVelocity(0, 0, false, true);
                else
                    player.body.gravity.y = pwg;
                player.frame = 21;
            }
            else {
                if (reboundDir !== 'left')
                    gravityFreezeFrame(pdg, 10);
                else
                    gravityFreezeFrame(pdg, 2);
            }
        }
        else {
            if (pushingCube || player.body.blocked.left)
                player.animations.play('l-push');
            else {
                player.animations.play('l-run');
                pushingCube = false;
            }
        }
    }
    else if ((cursors.right.isDown || rightKey.isDown) && !walljumpLock) {
        //  Move to the right
        setPlayerVelocity(150, 0, true, false);
        lastKey = 'right';
        if (!player.body.blocked.down){
            if (player.body.blocked.right) {
                //SLOW CHARACTER DOWN WHEN HUGGING WALL
                if (player.body.velocity.y < 0 && !walljumpLock)
                    setPlayerVelocity(0, 0, false, true);
                else
                    player.body.gravity.y = pwg;
                player.frame = 20;
            }
            else {
                if (reboundDir !== 'right')
                    gravityFreezeFrame(pdg, 2);
                else
                    gravityFreezeFrame(pdg, 10)
            }
        }
        else {
            if (pushingCube || player.body.blocked.right)
                player.animations.play('r-push');
            else {
                player.animations.play('r-run');
                pushingCube = false;
            }
        }
    }
    /* STATIONARY */
    else {
        pushingCube = false;
        if (lastKey === 'left') {
            if (!player.body.blocked.down)      //PLAYER IS IN THE AIR AND HAS STOPPED INPUT KEYS 
                gravityFreezeFrame(pdg, 23);
            else {
                if (cursors.down.isDown || downKey.isDown)
                    player.frame = 37;
                else
                    player.animations.play('l-stand');
            }
        }
        else {
            if (!player.body.blocked.down)
                gravityFreezeFrame(pdg, 22);
            else {
                if (cursors.down.isDown || downKey.isDown)
                    player.frame = 36;
                else
                    player.animations.play('r-stand');
            }
        }
    }
    
    /* JUMP AND WALL REBOUND SECTION */
    if (player.body.blocked.down) {
        if (cursors.up.isDown || upKey.isDown){
            setPlayerVelocity(0, -270, false, true);
            jumpToggle = true;                          // Pressing Jump Button changes toggle ON
            jumpPlay();
        }
        reboundDir = '';
        walljumpLock = false;
        reboundToggle = false;
    }
    else if ((cursors.up.isDown || upKey.isDown) && !player.body.blocked.down && !walljumpLock) { //ASSUMES PLAYER.BODY.BLOCKING.DOWN
        if (!jumpToggle && !reboundToggle) {                              // When Jump toggle is OFF, you can walljump
            if ((cursors.left.isDown || leftKey.isDown) && player.body.blocked.left) {
                reboundDir = 'left';
                setPlayerVelocity(250, -200, false, false);
                jumpPlay();
            }
            else if ((cursors.right.isDown || rightKey.isDown) && player.body.blocked.right) {
                reboundDir = 'right';
                setPlayerVelocity(-250, -200, false, false);
                jumpPlay();
            }
            reboundToggle = true;
            reboundDelayT = game.time.create(false);
            reboundDelayT.add(900, reboundDelay, this, null);
            reboundDelayT.start();
        }
        jumpToggle = true;
    }
    else if (cursors.up.onUp || upKey.onUp) {
        if (!player.body.blocked.down)
            jumpToggle = false;             // Pressing the Jump Button again changes toggle OFF 
    }
    
    // Creates a timer delay for jumping
      if (reboundDir !== '') {
            walljumpLock = true;
            reboundLockT = game.time.create(false);
            reboundLockT.add(475, initReboundDelay, this, null);
            reboundLockT.start();
    }
    
    if (walljumpLock) {
        if (reboundDir === 'right') {
            setPlayerVelocity(-150, 0, true, false);
            player.frame = 10;
            lastKey = 'left';
        }
        if (reboundDir === 'left') {
            setPlayerVelocity(150, 0, true, false);
            player.frame = 2;
            lastKey = 'right';
        }
        walljumpLock = false;
    }
        
    }
    else {
        scoreText.text = 'YOU WIN!';
        player.animations.play('victory');
        if (!vicmusic.isPlaying) {
            exitmusic.stop();
            vicmusic.play('', 0, .10, false, true);
        }
    }
}

// function setPlayerVelocity (int, int, boolean, boolean)
function setPlayerVelocity(xspeed, yspeed, hMove, vMove) {
    if (hMove)
        player.body.velocity.x = xspeed;
    else if (vMove)
        player.body.velocity.y = yspeed;
    else {
        player.body.velocity.x = xspeed;
        player.body.velocity.y = yspeed;
    }
}

// function gravityFreezeFrame (changeGravity, freezeFrame)
function gravityFreezeFrame(newGravity, freezeFrame) {
    player.body.gravity.y = newGravity;
    player.animations.stop();
    player.frame = freezeFrame;
}

// Play jump sound when the jump button is pressed
function jumpPlay(){
    jumpSound.play('', 0, 0.35, false, true);   
}

// Delay the player from moving against the direction of the walljump
function initReboundDelay(){
    reboundDir = '';
    walljumpLock = false;
    reboundLockT.destroy();
}

// Delay the player from consecutively walljumping
function reboundDelay() {
    reboundToggle = false;
    reboundDelayT.destroy();
}
    
function collectDiamond(player, diamond) {
    diamondCount = diamondCount - 1;
    diamond.kill();
    if (diamondCount === 0) {
        ringSound.play('', 0, 0.35, false, true); 
        diamondHUD.kill();
        scoreText.text = 'REACH THE EXIT';
        scoreText.cameraOffset.x = 24;
        scoreText.cameraOffset.y = 20;
    }
    else {
        ringSound.play('', 0, 0.35, false, true);   
        scoreText.text = 'Remaining: ' + diamondCount;
    }
}

function victoryInit(player, goal){
    if (diamondCount === 0){
        lightingLayer.kill();
        win = true;
    }
}
/*    
function pushCube(player, cube) {
    game.stage.backgroundColor = '#992d2d'
    secCount += 1;
    scoreText.text = 'Colliding: ' + secCount;
    pushingCube = true;
    cube.kill();
}
*/