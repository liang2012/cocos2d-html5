var keys = [];
var winSize = null;

var Ship = cc.Sprite.extend({
    speed:220,
    bulletSpeed:700,
    score:0,
    HP:3,
    life:3,
    flashTime:150,
    bulletTypeValue:1,
    bulletPowerValue:1,
    shotting:false,
    throwBombing:false,
    canBeAttack:false,
    canBeControl:false,
    isThrowingBomb:false,
    zOrder:3000,
    maxBulletPowerValue:4,
    canShot:true,
    lifeUpScores:[50000, 100000, 150000, 200000, 250000, 300000],
    appearPosition:cc.ccp(160, 30),
    ctor:function () {
        //init life
        this.life = global.level + 4;
        var shipTexture = cc.TextureCache.sharedTextureCache().addImage(s_ship01);
        this.initWithTexture(shipTexture, cc.RectMake(0, 0, 90, 56));
        this.setTag(this.zOrder);

        // set frame
        var animation = cc.Animation.animation();
        animation.addFrameWithTexture(shipTexture, cc.RectMake(0, 0, 90, 56));
        animation.addFrameWithTexture(shipTexture, cc.RectMake(90, 0, 90, 56));

        // ship animate
        var action = cc.Animate.actionWithDuration(0.4, animation, true);
        this.runAction(cc.RepeatForever.actionWithAction(action));

        this.schedule(this.shoot,1/8);
    },
    update:function (dt) {
        var newX = this.getPosition().x, newY = this.getPosition().y;
        if (keys[cc.key.w] && this.getPosition().y <= winSize.height) {
            newY += dt * this.speed;
        }
        if (keys[cc.key.s] && this.getPosition().y >= 0) {
            newY -= dt * this.speed;
        }
        if (keys[cc.key.a] && this.getPosition().x >= 0) {
            newX -= dt * this.speed;
        }
        if (keys[cc.key.d] && this.getPosition().x <= winSize.width) {
            newX += dt * this.speed;
        }
        this.setPosition(cc.ccp(newX, newY));
    },
    shoot:function (dt) {
        if (this.canShot) {
            var b = new Bullet(this.bulletSpeed,"W1.png");
            this.getParent().addChild(b, b.zOrder, global.Tag.ShipBullet);
            b.setPosition(cc.ccp(this.getPosition().x, this.getPosition().y + this.getContentSize().height * 0.3));
        }
    },
    destroy:function () {
        this.getParent().removeChild(this);
    },
    throwBomb:function () {
    }
});

//bullet
var Bullet = cc.Sprite.extend({
    active:true,
    xVolocity:0,
    yVolocity:200,
    power:1,
    HP:1,
    moveType:null,
    zOrder:3000,
    parentType:global.bulletType.Ship,
    ctor:function (bulletSpeed,weaponType) {
        this.yVolocity = -bulletSpeed;
        /*var tmp = cc.TextureCache.sharedTextureCache().addImage(s_bullet);
        this.initWithTexture(tmp,cc.RectMake(0,0,15,32));*/

        cc.SpriteFrameCache.sharedSpriteFrameCache().addSpriteFramesWithFile(s_bullet_plist);
        this.initWithSpriteFrameName(weaponType);
    },
    inBounds:function () {
        var b = this.getPosition();
        return b.x >= 0 && b.x <= winSize.width && b.y >= 0 && b.y <= winSize.height;
    },
    update:function (dt) {
        var newX = this.getPositionX(), newY = this.getPositionY();
        newX -= this.xVolocity * dt;
        newY -= this.yVolocity * dt;
        this.setPosition(cc.ccp(newX, newY));
        this.active = this.active && this.inBounds();
        if (this.HP <= 0) {
            this.active = false;
        }
    },
    destroy:function () {
        this.getParent().removeChild(this);
    },
    draw:function (ctx) {
        var context = ctx || cc.renderContext;
        context.globalCompositeOperation = 'lighter';
        this._super(ctx);
    },
    hurt:function () {
        this.HP--;
    }
})

var Explosion = cc.Sprite.extend({
    ctor:function (x, y) {
        cc.SpriteFrameCache.sharedSpriteFrameCache().addSpriteFramesWithFile(s_explosion_plist);
        var pFrame = cc.SpriteFrameCache.sharedSpriteFrameCache().spriteFrameByName("explosion_01.png");
        this.initWithSpriteFrame(pFrame);

        var animFrames = [];
        var str = "";
        for (var i = 1; i < 35; i++) {
            str = "explosion_" + (i < 10 ? ("0" + i) : i) + ".png";
            var frame = cc.SpriteFrameCache.sharedSpriteFrameCache().spriteFrameByName(str);
            animFrames.push(frame);
        }
        var animation = cc.Animation.animationWithFrames(animFrames, 0.04);

        this.setPosition(cc.ccp(x, y));
        this.runAction(cc.Sequence.actions(
            cc.Animate.actionWithAnimation(animation, false),
            cc.CallFunc.actionWithTarget(this,this.destroy)
        ));
    },
    update:function () {

    },
    draw:function (ctx) {
        var context = ctx || cc.renderContext;
        context.globalCompositeOperation = 'lighter';
        this._super(ctx);
    },
    destroy:function(){
        this.getParent().removeChild(this);
    }
});

var Enemy = cc.Sprite.extend({
    active:true,
    speed:200,
    bulletSpeed:-200,
    HP:15,
    bulletPowerValue:1,
    moveType:null,
    scoreValue:200,
    canBeAttack:true,
    zOrder:1000,
    delayTime:0.7 + 1.5 * Math.random(),
    canBeOverlapedToAttackPlane:true,
    ctor:function (arg) {
        this.HP = arg.HP;
        this.moveType = arg.moveType;
        this.scoreValue = arg.scoreValue;
        cc.SpriteFrameCache.sharedSpriteFrameCache().addSpriteFramesWithFile(s_Enemy_plist, s_Enemy);
        this.initWithSpriteFrameName(arg.textureName);
        this.setScale(0.5);
        this.schedule(this.shoot,this.delayTime)
    },
    _timeTick :0,
    update:function (dt) {
        if (this.HP <= 0) {
            this.active = false;
        }
        this._timeTick += dt;
        if(this._timeTick > 0.1){
            this._timeTick = 0;
            if(this._hurtColorLife > 0){
                this._hurtColorLife --;
            }
            if(this._hurtColorLife == 1){
                this.setColor(new cc.Color3B(255,255,255));
            }
        }
    },
    destroy:function () {
        this.getParent().addChild(new Explosion(this.getPosition().x, this.getPosition().y));
        this.getParent().removeChild(this);
    },
    shoot:function(){
        var b = new Bullet(this.bulletSpeed,"W2.png");
        this.getParent().addChild(b, b.zOrder, global.Tag.EnemyBullet);
        b.setPosition(cc.ccp(this.getPosition().x, this.getPosition().y - this.getContentSize().height * 0.2));
    },
    _hurtColorLife:0,
    hurt:function () {
        this._hurtColorLife = 2;
        this.HP--;
        this.setColor(cc.RED());
    }
});

var GameLayer = cc.Layer.extend({
    _time:null,
    _ship:null,
    _backSky:null,
    _backSkyHeight:0,
    _backSkyRe:null,
    _backTileMap:null,
    _backTileMapHeight:0,
    _backTileMapRe:null,
    _levelManager:null,
    lbScore : null,
    screenRect:null,
    init:function () {
        var bRet = false;
        if (this._super()) {
            winSize = cc.Director.sharedDirector().getWinSize();
            this._levelManager = new LevelManager(this);
            this.initBackground();
            this.screenRect = new cc.Rect(0,0,winSize.width,winSize.height);

            // score
            this.lbScore = cc.LabelTTF.labelWithString("Time: 00:00", cc.SizeMake(winSize.width / 2, 50), cc.TextAlignmentRight, "Marker Felt", 16);
            this.addChild(this.lbScore, 1, 3);
            this.lbScore.setPosition(cc.ccp(winSize.width - 100, winSize.height - 45));

            this.schedule(this.timeCounter,1);

            // ship life
            var shipTexture = cc.TextureCache.sharedTextureCache().addImage(s_ship01);
            var life = cc.Sprite.spriteWithTexture(shipTexture, cc.RectMake(0, 0, 90, 56));
            life.setScale(0.5);
            life.setAnchorPoint(cc.ccp(0, 1));
            life.setPosition(cc.ccp(10, 460));
            this.addChild(life, 1, 5);

            // ship Life count
            var lbLife = cc.LabelTTF.labelWithString("3", "Arial", 20);
            lbLife.setAnchorPoint(cc.ccp(0, 1));
            this.addChild(lbLife, 100, 6);
            lbLife.setPosition(cc.ccp(50, 450));

            //create enemy
            for (var i in Level1.Enemy) {
                var tmpSet = Level1.Enemy[i];
                var tmpEmy = new Enemy(EnemyType[tmpSet.type]);
                var pos = cc.ccp(80 + (winSize.width - 160) * Math.random(), winSize.height);

                var offset, tmpAction;
                switch (tmpEmy.moveType) {
                    case global.moveType.Attack:
                        offset = cc.ccp(0, 120 + 200 * Math.random());
                        break;
                    case global.moveType.Vertical:
                        offset = cc.ccp(0, -winSize.height - tmpEmy.getContentSize().height);
                        tmpAction = cc.MoveBy.actionWithDuration(4, offset);
                        break;
                    case global.moveType.Horizontal:
                        offset = cc.ccp(0, -100 - 200 * Math.random());
                        var a0 = cc.MoveBy.actionWithDuration(0.5, offset);
                        var a1 = cc.MoveBy.actionWithDuration(1, cc.ccp(-50 - 100 * Math.random(), 0));
                        var a2 = cc.DelayTime.actionWithDuration(1);
                        var a3 = cc.MoveBy.actionWithDuration(1, cc.ccp(100 + 100 * Math.random(), 0));
                        var onComplete = cc.CallFunc.actionWithTarget(tmpEmy, function (pSender) {
                            pSender.runAction(cc.RepeatForever.actionWithAction(
                                cc.Sequence.actions(a2, a3.copy(), a2, a3.copy().reverse())
                            ));
                        });
                        tmpAction = cc.Sequence.actions(a0, a1, onComplete);
                        break;
                    case global.moveType.Overlap:
                        var newX = (tmpEmy.getPosition().x <= winSize.width / 2) ? 320 : -320;
                        tmpAction = cc.MoveBy.actionWithDuration(4, cc.ccp(newX, -320));
                        break;
                }

                tmpEmy.setPosition(cc.ccp(80 + (winSize.width - 160) * Math.random(), winSize.height));
                this.addChild(tmpEmy, tmpEmy.zOrder, global.Tag.Enemy);
                tmpEmy.runAction(tmpAction);
            }

            // ship
            this._ship = new Ship();
            this._ship.setPosition(this._ship.appearPosition);
            this.addChild(this._ship);

            // accept touch now!
            this.setIsTouchEnabled(true);

            //accept keypad
            this.setIsKeypadEnabled(true);

            // schedule
            this.schedule(this.update);
            this.schedule(this.checkEnemyIsInBound,5);
            bRet = true;
        }
        return bRet;
    },
    timeCounter:function(){
        this._time ++;

        var minute = 0|(this._time / 60);
        var second = this._time % 60;
        minute = minute > 9?minute : "0" + minute;
        second = second > 9 ? second : "0" + second;
        var curTime = minute + ":" + second;
        this.lbScore.setString("Time: " + curTime);
        this._levelManager.loadLevelResource(this._time);
    },
    initBackground:function () {
        // bg
        this._backSky = cc.Sprite.spriteWithFile(s_bg01);
        this._backSky.setAnchorPoint(cc.PointZero());
        this._backSkyHeight = this._backSky.getContentSize().height;
        this.addChild(this._backSky, -10);

        //tilemap
        this._backTileMap = cc.TMXTiledMap.tiledMapWithTMXFile(s_level01);
        this.addChild(this._backTileMap, -9);
        this._backTileMapHeight = this._backTileMap.getMapSize().height * this._backTileMap.getTileSize().height;

        this._backSkyHeight -= 48;
        this._backTileMapHeight -= 200;
        this._backSky.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -48)));
        this._backTileMap.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -200)));

        this.schedule(this.movingBackground, 3);
    },

    _isBackSkyReload:false,
    _isBackTileReload:false,
    movingBackground:function () {
        this._backSky.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -48)));
        this._backTileMap.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -200)));
        this._backSkyHeight -= 48;
        this._backTileMapHeight -= 200;

        if (this._backSkyHeight <= winSize.height) {
            if (!this._isBackSkyReload) {
                this._backSkyRe = cc.Sprite.spriteWithFile(s_bg01);
                this._backSkyRe.setAnchorPoint(cc.PointZero());
                this.addChild(this._backSkyRe, -10);
                this._backSkyRe.setPosition(new cc.Point(0, winSize.height));
                this._isBackSkyReload = true;
            }
            this._backSkyRe.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -48)));
        }
        if (this._backSkyHeight <= 0) {
            this._backSkyHeight = this._backSky.getContentSize().height;
            this.removeChild(this._backSky);
            this._backSky = this._backSkyRe;
            this._backSkyRe = null;
            this._isBackSkyReload = false;
        }

        if (this._backTileMapHeight <= winSize.height) {
            if (!this._isBackTileReload) {
                this._backTileMapRe = cc.TMXTiledMap.tiledMapWithTMXFile(s_level01);
                this.addChild(this._backTileMapRe, -9);
                this._backTileMapRe.setPosition(new cc.Point(0, winSize.height));
                this._isBackTileReload = true;
            }
            this._backTileMapRe.runAction(cc.MoveBy.actionWithDuration(3, new cc.Point(0, -200)));
        }
        if (this._backTileMapHeight <= 0) {
            this._backTileMapHeight = this._backTileMapRe.getMapSize().height * this._backTileMapRe.getTileSize().height;
            this.removeChild(this._backTileMap);
            this._backTileMap = this._backTileMapRe;
            this._backTileMapRe = null;
            this._isBackTileReload = false;
        }
    },
    checkEnemyIsInBound:function(){
        var layerChildren = this.getChildren();
        for(var i = 0; i<layerChildren.length;i++){
            var selChild = layerChildren[i];
            if (selChild.getTag() == global.Tag.Enemy) {
                var childRect = selChild.boundingBoxToWorld();
                if(!cc.Rect.CCRectIntersectsRect(this.screenRect,childRect)){
                    this.removeChild(selChild,true);
                }
            }
        }
    },
    ccTouchesEnded:function (pTouches, pEvent) {
        if (pTouches.length <= 0)
            return;

        var touch = pTouches[0];
        var location = touch.locationInView(touch.view());
        //this._ship.runAction(cc.MoveTo.actionWithDuration(1.0, cc.ccp(location.x, location.y)));
    },
    keyDown:function (e) {
        keys[e] = true;
    },
    keyUp:function (e) {
        keys[e] = false;
    },
    update:function (dt) {
        var pChild, bulletChild, emyChild;
        //check collide
        for (var i in this.getChildren()) {
            bulletChild = this.getChildren()[i];
            if (bulletChild.getTag() == global.Tag.ShipBullet) {
                for (var j in this.getChildren()) {
                    emyChild = this.getChildren()[j];
                    if (emyChild.getTag() == global.Tag.Enemy) {
                        if (this.collide(bulletChild, emyChild)) {
                            emyChild.hurt();
                            bulletChild.hurt();
                        }
                    }
                }
            }
        }


        //remove child
        for (var i in this.getChildren()) {
            pChild = this.getChildren()[i];
            if (pChild) {
                pChild.update(dt);
                if ((pChild.getTag() == global.Tag.ShipBullet) || (pChild.getTag() == global.Tag.Enemy) || (pChild.getTag() == global.Tag.EnemyBullet)) {
                    if (pChild && !pChild.active) {
                        pChild.destroy();
                    }
                }
            }
        }


    },
    shoot:function (dt) {
        //enemy shoot
        var pChild;
        for (var i in this.getChildren()){
            pChild = this.getChildren()[i];
             if(pChild && pChild.getTag() ==global.Tag.Enemy ){
                 pChild.shoot();
             }
        }
    },
    collide:function (a, b) {
        return a.getPosition().x - a.getContentSize().width * a.getAnchorPoint().x < b.getPosition().x - b.getContentSize().width * b.getAnchorPoint().x + b.getContentSize().width &&
            a.getPosition().x - a.getContentSize().width * a.getAnchorPoint().x + a.getContentSize().width > b.getPosition().x - b.getContentSize().width * b.getAnchorPoint().x &&
            a.getPosition().y  - a.getContentSize().height * a.getAnchorPoint().y < b.getPosition().y + b.getContentSize().height &&
            a.getPosition().y  - a.getContentSize().height * a.getAnchorPoint().y + a.getContentSize().height > b.getPosition().y - b.getContentSize().height * b.getAnchorPoint().y;
    }

});

GameLayer.node = function () {
    var sg = new GameLayer();
    if (sg && sg.init()) {
        return sg;
    }
    return null;
};

GameLayer.scene = function () {
    var scene = cc.Scene.node();
    var layer = GameLayer.node();
    scene.addChild(layer);
    return scene;
};