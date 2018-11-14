module.exports = class Player{
    // name
    // lifes
    // bullets
    constructor(name, id){
        this.id = id; //Socket id
        this.name = name;
        this.bullets = 0;
        this.lifes = 3;
    }

    // reload(){
    //     this.bullets++;
    // }

    // getDamage(dmg){
    //     this.lifes -= dmg;
    // }

    // shoot(){
    //     if(this.bullets > 0) this.bullets -= 1;
    // }

    // get isDead(){
    //     if(this.lifes <= 0) return true;
    //     return false;
    // }

    // get canShoot(){
    //     if(this.bullets > 0) return true;
    //     return false;
    // }
}