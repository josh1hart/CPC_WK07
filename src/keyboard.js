export class KeyboardService {
  constructor() {
    this.keys = []; // initialise array to hold which key is pressed
  }

  update() {}

  isKeydown(keyCode) {
    //this will be called from within the avatar to test whether we need to update it's movement. It could also be called from other game objects in a more complex scene
    return this.keys[keyCode]; //return the boolean value contained within the keys array at the particular code's index
  }
}
