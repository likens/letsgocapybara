import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene {

    constructor () {
        super('MainMenu');
    }

    preload () {
    }

    create () {

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        
    }
    
    changeScene () {

        this.scene.start('Game');
    }

}
