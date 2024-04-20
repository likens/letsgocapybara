import { Cameras, GameObjects, Physics, Scene, Types } from 'phaser';

import { EventBus } from '../EventBus';

const BACKGROUND = '#41980a';

const MULTIPLIER = 1;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const CAPY_SIT = { key: "capy_sit", yoyo: true }
const CAPY_DUCK = { key: "capy_duck", yoyo: true }
const CAPY_IDLE = { key: "capy_idle", yoyo: true }
const CAPY_SIDE_WALK = { key: "capy_side_walk", yoyo: false }
const CAPY_SIDE_RUN = { key: "capy_side_run", yoyo: false }

const CAPY_SPRITES = {
    spritesheets: [CAPY_SIT, CAPY_DUCK, CAPY_IDLE, CAPY_SIDE_WALK, CAPY_SIDE_RUN],
    frameWidth: 35,
    frameHeight: 35
} 

const BUTTON_UP = "button_up";
const BUTTON_DOWN = "button_down";
const BUTTON_LEFT = "button_left";
const BUTTON_RIGHT = "button_right";

const BUTTON_SPRITES = {
    spritesheets: [BUTTON_UP, BUTTON_DOWN, BUTTON_LEFT, BUTTON_RIGHT],
    frameWidth: 19,
    frameHeight: 21
} 

export class Game extends Scene {
    title: GameObjects.Text;
    scoreValue: number = 0;
    scoreDisplay: GameObjects.Text;
    controls: Cameras.Controls.SmoothedKeyControl;
    sprite: GameObjects.Sprite;
    player: Physics.Arcade.Sprite;
    items: Physics.Arcade.Group;
    cursors: Types.Input.Keyboard.CursorKeys;
    touchUp: GameObjects.Image;
    touchDown: GameObjects.Image;
    touchLeft: GameObjects.Image;
    touchRight: GameObjects.Image;

    constructor () {
        super('Game');
    }

    preload () {

        CAPY_SPRITES.spritesheets.forEach(sheet => 
            this.load.spritesheet(sheet.key, 
                `assets/sprites/${sheet.key}.png`, 
                { frameWidth: CAPY_SPRITES.frameWidth, frameHeight: CAPY_SPRITES.frameHeight}))

        BUTTON_SPRITES.spritesheets.forEach(sheet =>
            this.load.spritesheet(sheet, 
                `assets/sprites/${sheet}.png`, 
                { frameWidth: BUTTON_SPRITES.frameWidth, frameHeight: BUTTON_SPRITES.frameHeight}))

        this.load.spritesheet('fruit', 'assets/sprites/fruit+.png', { frameWidth: 16, frameHeight: 16 });
        
    }

    create () {

        // create world
        this.createWorld();

        // create player sprite
        this.createPlayer();

        // create camera
        this.createCamera();

        // create collectibles
        this.createItems(250 * MULTIPLIER);  

        // create title/score
        this.createText();

        // create touch controls
        this.createTouchControls();

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Player movement logic
        this.movePlayer(this.cursors.left.isDown || this.touchLeft.getData("active"),
            this.cursors.right.isDown || this.touchRight.getData("active"),
            this.cursors.up.isDown || this.touchUp.getData("active"),
            this.cursors.down.isDown || this.touchDown.getData("active"))

        // Collision detection between player and items
        this.physics.overlap(this.player, this.items, this.collectItem, undefined, this);
    }
    
    changeScene () {
        // this.scene.start('Game');
    }

    createWorld() {
        this.cursors = this.input.keyboard?.createCursorKeys() as Types.Input.Keyboard.CursorKeys
        this.physics.world.setBounds(
            0, 
            0, 
            WIDTH * MULTIPLIER, 
            HEIGHT * MULTIPLIER);
        // Draw border around playable area
        const borderRect: Phaser.GameObjects.Rectangle = this.add.rectangle(
            this.physics.world.bounds.centerX,
            this.physics.world.bounds.centerY,
            this.physics.world.bounds.width,
            this.physics.world.bounds.height,
            0x000000,
            0
        );
        borderRect.setStrokeStyle(5, 0x4f3a2b);
        borderRect.setDepth(1); // Ensure border is drawn above other game elements
    }

    createPlayer() {
        this.player = this.physics.add.sprite(WIDTH / 2, HEIGHT / 2, 'capy_player');

        // create all applicable animations
        CAPY_SPRITES.spritesheets.forEach(sheet => this.createPlayerAnimation(sheet.key, sheet.yoyo));
        this.player.scale = 2;
        this.player.setCollideWorldBounds(true);
    }

    createCamera() {
        // Set up camera to follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBackgroundColor(BACKGROUND);
    }

    createPlayerAnimation(key: string, yoyo = false) {
        const animationConfig: Types.Animations.Animation = {
            frameRate: 7,
            repeat: -1,
            key: key,
            frames: this.anims.generateFrameNumbers(key),
            yoyo: yoyo,
        }
        this.anims.create(animationConfig);
    }

    createItems(num: number) {
        this.items = this.physics.add.group();
        // Generate 20 random items
        for (var i = 0; i < num; i++) {
            var x = Phaser.Math.Between(0, WIDTH);
            var y = Phaser.Math.Between(0, HEIGHT);
            // var item = this.items.create(x, y, 'orange');
            const item: Phaser.Physics.Arcade.Sprite = this.items.create(x, y, 'fruit');
            const frameIndex: number = Phaser.Math.Between(0, item.texture.frameTotal - 1);
            item.setFrame(frameIndex);
            item.setScale(1.5);
            item.setDisplaySize(32, 32); // Adjust size of the item sprite
            item.setCollideWorldBounds(true); // Ensure item stays within the world boundaries
            item.setData('points', 1); // Set a random point value for the item
        }
    }
    
    collectItem(_player: any, item: any) {
        // Update score
        this.scoreValue += item.getData('points');
        this.scoreDisplay.setText('Score: ' + this.scoreValue);
        // Remove the collected item
        item.destroy();
    }

    createText() {
        this.title = 
            this.add.text(
                16, 16, 
                'Let\'s Go, Capybara!', 
                {
                    fontFamily: 'Arial Black', 
                    fontSize: 32, 
                    color: '#d78244', // capyfur
                    stroke: '#000000', 
                    strokeThickness: 8,
                    align: 'center'
                }
            ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        // Display score
        this.scoreDisplay = 
            this.add.text(
                WIDTH - 16, 16, 
                'Score: 0', 
                { 
                    fontFamily: 'Arial Black', 
                    fontSize: 32,
                    color: '#fff',
                    stroke: '#000000',
                    strokeThickness: 8,
                    align: 'center'
                }
            ).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    }

    createTouchControls() {
        
        this.touchUp = 
            this.add.image(WIDTH / 2, HEIGHT - 140, 'button_up')
            .setScrollFactor(0).setInteractive().setScale(2).setDepth(100);
        this.touchDown = 
            this.add.image(WIDTH / 2, HEIGHT - 60, 'button_down')
            .setScrollFactor(0).setInteractive().setScale(2).setDepth(100);
        this.touchLeft = 
            this.add.image(WIDTH / 2 - 40, HEIGHT - 100, 'button_left')
            .setScrollFactor(0).setInteractive().setScale(2).setDepth(100);
        this.touchRight = 
            this.add.image(WIDTH / 2 + 40, HEIGHT - 100, 'button_right')
            .setScrollFactor(0).setInteractive().setScale(2).setDepth(100);

        this.touchUp.on('pointerdown', () => this.movePlayerTouch('up'));
        this.touchUp.on('pointerup', () => this.movePlayerTouch());
        this.touchDown.on('pointerdown', () => this.movePlayerTouch('down'));
        this.touchDown.on('pointerup', () => this.movePlayerTouch());
        this.touchLeft.on('pointerdown', () => this.movePlayerTouch('left'));
        this.touchLeft.on('pointerup', () => this.movePlayerTouch());
        this.touchRight.on('pointerdown', () => this.movePlayerTouch('right'));
        this.touchRight.on('pointerup', () => this.movePlayerTouch());

        const borderRect: Phaser.GameObjects.Rectangle = this.add.rectangle(
            WIDTH / 2,
            HEIGHT - 100,
            150,
            150,
            0x000000,
            .7
        );
        borderRect.setStrokeStyle(5, 0x000000);
        borderRect.setDepth(1); 
        borderRect.setScrollFactor(0);

    }

    movePlayerTouch(direction?: string) {
        switch(direction) {
            case 'up':
                this.touchUp.setData("active", true);
                break;
            case 'down':
                this.touchDown.setData("active", true);
                break;
            case 'right':
                this.touchRight.setData("active", true);
                break;
            case 'left':
                this.touchLeft.setData("active", true);
                break;
            default:
                this.touchUp.setData("active", false);
                this.touchDown.setData("active", false);
                this.touchRight.setData("active", false);
                this.touchLeft.setData("active", false);
                break;
        }
    }

    movePlayer(left: boolean, right: boolean, up: boolean, down: boolean) {
        const velocity = 240;
        let animation = 'idle';
        const run = false;
        let flip = this.player.flipX;

        if (left) {
            this.player.setVelocityX(-velocity);
            animation = run ? 'side_run' : 'side_walk';
            flip = false;
            this.touchLeft.setFrame(1);
        } else if (right) {
            this.player.setVelocityX(velocity);
            animation = run ? 'side_run' : 'side_walk';
            flip = true;
            this.touchRight.setFrame(1);
        } else {
            this.player.setVelocityX(0);
            this.touchRight.setFrame(0);
            this.touchLeft.setFrame(0);
        }

        if (up) {
            this.player.setVelocityY(-velocity);
            animation = run ? 'side_run' : 'side_walk';
            this.touchUp.setFrame(1);
            if (left) {
                flip = false;
                this.touchLeft.setFrame(1);
            } else if (right) {
                flip = true;
                this.touchRight.setFrame(1);
            }
        } else if (down) {
            this.player.setVelocityY(velocity);
            animation = run ? 'side_run' : 'side_walk';
            this.touchDown.setFrame(1);
            if (left) {
                flip = false;
                this.touchLeft.setFrame(1);
            } else if (right) {
                flip = true;
                this.touchRight.setFrame(1);
            }
        } else {
            this.player.setVelocityY(0);
            this.touchUp.setFrame(0);
            this.touchDown.setFrame(0);
        }

        this.player.anims.play(`capy_${animation}`, true);
        this.player.setFlipX(flip);
    }

}
