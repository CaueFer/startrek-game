import "./style.css";
import Phaser from "phaser";

const gameCanvas = document.getElementById("gameCanvas");
const screenWidth = gameCanvas.clientWidth;
const screenHeight = gameCanvas.clientHeight;
const sizes = {
  width: screenWidth,
  height: screenHeight,
};
const gameWindow = document.getElementById("gameWindow");

let isDashing = false;
let isInvulnerable = false;
const dashDuration = 300; // milliseconds
const dashSpeed = 100;
let dashTimeout = 500; // milliseconds
let dashTimer = 0;
let spawnInterval = 0; // milliseconds
let spawnTimer = 0;
let hasPlayerBeenHit = false;
let xpMultiplicator = 1;
let gerarAlternado = false;
let bulletsInterval = 70; // ms

const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const gamePauseDiv = document.querySelector("#gamePauseDiv");
const gameDespauseBtn = document.querySelector("#gameDespauseBtn");
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameEndBtn = document.querySelector("#gameEndBtn");
const gameRestartBtn = document.querySelector("#gameRestartBtn");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");
const gameTimeLivedSpan = document.querySelector("#gameTimeLivedSpan");
const livedTimeText = document.querySelector("#livedTimeText");
const pontoText = document.querySelector("#pontoText");
const lifeText = document.querySelector("#lifeText");
const levelProgressBar = document.querySelector("#progress-lvl-bar");

const baseSpeed = 300;

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.playerLevel = 0;
    this.playerXp = 0;
    this.playerSpeed = baseSpeed + 300;
    this.cursor;
    this.target;
    this.enemy;
    this.enemyLvl2;
    this.enemyLife = 1;
    this.enemyLvl2Life = 3;
    this.enemies;
    this.enemiesLvl2;
    this.upgradeWeapon1;
    this.bullets;
    this.bulletsQnt = 1;
    this.shootTimer = 0;
    this.shootInterval = 450; // ms
    this.bgImg;
    this.points = 0;
    this.textScore;
    this.textTime;
    this.timedEvent;
    this.starterTimer = 0;
    this.livedTime;
    this.particulaSpace;
    this.particulaEnemyDeath;
    this.particulaEnemyDeathArray = [];
    this.rastro;
    this.rastroEmitter;
    this.cameraPrevX = 0;
    this.cameraPrevY = 0;

    // SONGS
    this.bgMusic;
    this.menuMusic;
  }

  preload() {
    this.load.image("bg", "/assets/images/background.svg");
    this.load.image("player", "/assets/sprites/player.png");
    this.load.image("rastro", "/assets/sprites/rastro.png");
    this.load.image("enemy", "/assets/sprites/enemys/enemy-circle.png");
    this.load.image(
      "enemylvl2",
      "/assets/sprites/enemys/enemy-circle-lvl2.png"
    );
    this.load.image(
      "item-weaponupgrade",
      "/assets/sprites/items/weaponupgrade-1.png"
    );
    // AUDIOS
    this.load.audio("levelUp", "/assets/sounds/level-up.mp3");
    this.load.audio("tiro", "/assets/sounds/laser.mp3");
    this.load.audio("enemyDeathSong", "/assets/sounds/enemy-death.mp3");

    // MUSICAS
    this.load.audio("startSong", "/assets/sounds/gameStart-song.mp3");
    this.load.audio("bgMusic", "/assets/sounds/bgMusic.mp3");
    this.load.audio("menuMusic", "/assets/sounds/menu-song.mp3");
  }

  create() {
    this.scene.pause("scene-game");

    // CREATE SONG CONFIGS
    this.menuMusic = this.sound.add("menuMusic");
    this.menuMusic.play();

    this.bgMusic = this.sound.add("bgMusic");
    this.startSong = this.sound.add("startSong");

    this.shootSong = this.sound.add("tiro");
    this.levelUpSong = this.sound.add("levelUp");
    this.enemyDeathSong = this.sound.add("enemyDeathSong", { volume: 1 });

    // BACKGROUND CONFIGS =====================
    this.bgImg = this.add.image(0, 0, "bg").setOrigin(0, 0);
    this.bgImg.setScale(1);
    const offsetX = -this.bgImg.width / 2;
    const offsetY = -this.bgImg.height / 2;
    this.bgImg.setX(offsetX);
    this.bgImg.setY(offsetY);

    const numHorizontal = Math.ceil(
      this.sys.game.config.width / this.bgImg.width
    );
    const numVertical = Math.ceil(
      this.sys.game.config.height / this.bgImg.height
    );

    for (let i = 0; i < numHorizontal; i++) {
      for (let j = 0; j < numVertical; j++) {
        this.add
          .image(i * this.bgImg.width, j * this.bgImg.height, "bg")
          .setOrigin(0, 0);
      }
    }

    // UI CONFIGS

    // PARTICLES CONFIGS
    const cameraWidth = this.cameras.main.width;
    const cameraHeight = this.cameras.main.height;
    this.rastroEmitter = this.add.particles(0, 0, "player", {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 1 },
      scale: { start: 0.2, end: 0 },
      lifespan: 100,
      blendMode: "SOFT_LIGHT",
      alpha: { start: 0.1, end: 0 },
    });

    this.particulaSpace = this.add.particles(0, 0, "rastro", {
      speed: { min: 400, max: 1000 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 },
      lifespan: 5000,
      blendMode: "SOFT_LIGHT",
      emitZone: {
        type: "random",
        source: new Phaser.Geom.Rectangle(
          -200,
          -200,
          screenWidth + 800,
          screenHeight + 800
        ),
      },
      frequency: 200,
      maxParticles: 50,
      alpha: { start: 0.5, end: 0 },
    });

    this.particulaSpaceLines = this.add.particles(0, 0, "rastroLongo", {
      speed: { min: 200, max: 1500 },
      angle: { min: 135, max: 135 },
      rotate: { start: 135, end: 135 },
      scale: { start: 0.1, end: 0.1 },
      lifespan: 3000,
      blendMode: "SOFT_LIGHT",
      emitZone: {
        type: "random",
        source: new Phaser.Geom.Rectangle(
          -cameraWidth,
          -cameraHeight,
          cameraWidth * 2,
          cameraHeight * 2
        ),
      },
      frequency: 50,
      alpha: { start: 0.7, end: 0.3 },
    });

    // ITEMS CONFIGS ================
    this.items = this.physics.add.group();

    // BULLETS
    this.bullets = this.physics.add.group();

    // ENEMIS
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 20; i++) {
      const enemy = this.enemies.create(0, 0, "enemy");
      enemy.setScale(0.5);
      enemy.vida =  this.enemyLife;
      enemy.isUsed = false;
      enemy.disableBody(true, true);
    }

    this.enemiesLvl2 = this.physics.add.group();
    for (let i = 0; i < 15; i++) {
      const enemy = this.enemiesLvl2.create(0, 0, "enemylvl2");
      enemy.setScale(0.5);
      enemy.vida = this.enemyLvl2Life;
      enemy.isUsed = false;
      enemy.disableBody(true, true);
    }

    this.physics.add.collider(this.enemies);
    this.physics.add.collider(this.enemiesLvl2);

    // PLAYER CONFIGS =====================
    const playerInitialX = this.sys.game.config.width / 2;
    const playerInitialY = this.sys.game.config.height / 2;

    this.player = this.physics.add
      .image(playerInitialX, playerInitialY, "player")
      .setOrigin(0, 0);
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true);
    this.player.setSize(this.player.width, this.player.height).setOffset(0, 0);
    this.player.setScale(0.5);
    this.player.vida = 10;

    this.cursor = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.cameras.main.setZoom(3);
    this.cameras.main.scrollX = playerInitialX - this.cameras.main.width / 2;
    this.cameras.main.scrollY = playerInitialY - this.cameras.main.height / 2;

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.rastroEmitter.startFollow(
      this.player,
      this.player.width / 4, // POSICAO INICIAL X
      this.player.height / 4, // POSICAO INICIAL y
      true // SEGUIR A ROTATION
    );

    this.particulaSpace.startFollow(
      this.player,
      this.player.width / 4, // POSICAO INICIAL X
      this.player.height / 4, // POSICAO INICIAL y
      true // SEGUIR A ROTATION
    );

    this.particulaSpaceLines.startFollow(
      this.player,
      this.player.width / 4, // POSICAO INICIAL X
      this.player.height / 4, // POSICAO INICIAL y
      true // SEGUIR A ROTATION
    );

    // ATALHOS DE UI
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.pause();
      this.bgMusic.pause();
      gamePauseDiv.classList.remove("d-none");
    });

    // INPUTS
    this.input.on("pointerdown", (pointer) => {
      if (
        pointer.leftButtonDown() &&
        this.time.now > this.shootTimer + this.shootInterval
      ) {
        this.shootTimer = this.time.now;
        const worldPoint = this.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );

        const playerCenterX = this.player.x + this.player.displayWidth / 2;
        const playerCenterY = this.player.y + this.player.displayHeight / 2;

        // Vetor de direção entre o jogador e o mouse
        const directionX = worldPoint.x - playerCenterX;
        const directionY = worldPoint.y - playerCenterY;

        // Normalizando o vetor de direção
        const length = Math.sqrt(
          directionX * directionX + directionY * directionY
        );
        const normalizedDirectionX = directionX / length;
        const normalizedDirectionY = directionY / length;

        for (let i = 0; i < this.bulletsQnt; i++) {
          this.shootSong.play();
          setTimeout(() => {
            const bullet = this.bullets.create(
              playerCenterX,
              playerCenterY,
              "player"
            );
            bullet.setOrigin(0.5);
            bullet.setScale(0.2);

            const bulletSpeed = 1000;
            bullet.setVelocity(
              normalizedDirectionX * bulletSpeed,
              normalizedDirectionY * bulletSpeed
            );

            this.physics.add.overlap(
              this.enemies,
              bullet,
              this.enemyHit,
              null,
              this
            );

            this.physics.add.overlap(
              this.enemiesLvl2,
              bullet,
              this.enemyHitLvl2,
              null,
              this
            );
          }, i * bulletsInterval);
        }
      }
    });

    this.physics.add.overlap(
      this.items,
      this.player,
      (player, item) => this.collectXpUpgrade(item),
      null,
      this
    );

    gameStartBtn.disabled = false;
  }

  update() {
    this.events.on("contextlost", function () {
      gameStartBtn.disabled = true;
    });

    this.events.on("contextrestored", function () {
      gameStartBtn.disabled = false;
    });

    this.livedTime = Math.floor((this.time.now - this.starterTimer) / 1000);

    livedTimeText.innerText = `Tempo vivo: ${this.livedTime} seg`;
    pontoText.innerText = `Pontos: ${this.points}`;
    lifeText.innerText = "❤️".repeat(this.player.vida);

    // MOVIMENTACAO PERSONAGEM ============================
    const { left, right, up, down } = this.cursor;


    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if ( right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }

    if (up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    } else {
      this.player.setVelocityY(0);
    }

    const diagonalSpeed = Math.sqrt(Math.pow(Math.abs(this.playerSpeed), 2) / 2);
    if (left.isDown && up.isDown) {
      this.player.setVelocity(-diagonalSpeed, -diagonalSpeed);
    } else if (left.isDown && down.isDown) {
      this.player.setVelocity(-diagonalSpeed, diagonalSpeed);
    } else if (right.isDown && up.isDown) {
      this.player.setVelocity(diagonalSpeed, -diagonalSpeed);
    } else if (right.isDown && down.isDown) {
      this.player.setVelocity(diagonalSpeed, diagonalSpeed);
    }

    // DASH CONFIGS
    if (
      this.cursor.dash.isDown &&
      !isDashing &&
      this.time.now > dashTimer + dashTimeout
    ) {
      isDashing = true;
      dashTimer = this.time.now;

      const currentVelocityX = this.player.body.velocity.x;
      const currentVelocityY = this.player.body.velocity.y;

      if (currentVelocityX !== 0) {
        this.player.setAccelerationX(currentVelocityX * dashSpeed);
      }
      if (currentVelocityY !== 0) {
        this.player.setAccelerationY(currentVelocityY * dashSpeed);
      }

      setTimeout(() => {
        isDashing = false;
        setTimeout(() => {
          isInvulnerable = false;
        }, 300);

        this.player.setAccelerationX(0);
        this.player.setAccelerationY(0);
      }, dashDuration);
    }
    // RESPAWN ENEMIES CONFIGS
    spawnInterval = 1500; // ms
    if (this.points < 25) {
      if (this.time.now > spawnTimer + spawnInterval) {
        spawnTimer = this.time.now;

        const numEnemies = 2;
        this.generateEnemyWave(numEnemies, false);
      }
    } else if (this.points >= 25 && this.points < 60) {
      if (this.time.now > spawnTimer + spawnInterval) {
        spawnTimer = this.time.now;

        const numEnemies = 3;
        this.generateEnemyWave(numEnemies, false);
      }
    } else if (
      this.points >= 60 &&
      (this.points < 85 || this.playerLevel === 0)
    ) {
      if (this.time.now > spawnTimer + spawnInterval) {
        spawnTimer = this.time.now;

        const numEnemiesLvl2 = 1;
        this.generateEnemyWaveLvl2(numEnemiesLvl2, false);
      }
    } else if (
      this.points >= 85 &&
      this.playerLevel >= 1 &&
      this.points < 175
    ) {
      if (this.time.now > spawnTimer + spawnInterval) {
        spawnTimer = this.time.now;

        if (!gerarAlternado) {
          const numEnemies = 2;
          this.generateEnemyWave(numEnemies, true);

          gerarAlternado = false;
        } else {
          gerarAlternado = true;
        }

        const numEnemiesLvl2 = 2;
        this.generateEnemyWaveLvl2(numEnemiesLvl2, false);
      }
    } else {
      if (this.time.now > spawnTimer + spawnInterval) {
        spawnTimer = this.time.now;

        if (!gerarAlternado) {
          const numEnemies = 2;
          this.generateEnemyWave(numEnemies, true);

          gerarAlternado = false;
        } else {
          gerarAlternado = true;
        }

        const numEnemiesLvl2 = 3;
        this.generateEnemyWaveLvl2(numEnemiesLvl2, false);
      }
    }

    // RASTRO CONFIGS
    if (
      this.player.body.velocity.x !== 0 ||
      this.player.body.velocity.y !== 0
    ) {
      this.rastroEmitter.setFrequency(0);
    } else {
      this.rastroEmitter.setFrequency(5, 15);
    }

    // ENEMY RASTREAMENTO
    const playerX = this.player.x;
    const playerY = this.player.y;

    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.isUsed) {
        const directionX = playerX - enemy.x;
        const directionY = playerY - enemy.y;

        const length = Math.sqrt(
          directionX * directionX + directionY * directionY
        );
        const normalizedDirectionX = directionX / length;
        const normalizedDirectionY = directionY / length;

        const enemySpeed = 500;

        enemy.setVelocity(
          normalizedDirectionX * enemySpeed,
          normalizedDirectionY * enemySpeed
        );
      }
    });

    this.enemiesLvl2.getChildren().forEach((enemy) => {
      if (enemy.isUsed) {
        const directionX = playerX - enemy.x;
        const directionY = playerY - enemy.y;

        const length = Math.sqrt(
          directionX * directionX + directionY * directionY
        );
        const normalizedDirectionX = directionX / length;
        const normalizedDirectionY = directionY / length;

        const enemySpeed = 450;

        enemy.setVelocity(
          normalizedDirectionX * enemySpeed,
          normalizedDirectionY * enemySpeed
        );
      }
    });

    this.items.getChildren().forEach((item) => {
      const directionX = playerX - item.x;
      const directionY = playerY - item.y;

      const length = Math.sqrt(
        directionX * directionX + directionY * directionY
      );
      const normalizedDirectionX = directionX / length;
      const normalizedDirectionY = directionY / length;

      const itemSpeed = 800;

      item.setVelocity(
        normalizedDirectionX * itemSpeed,
        normalizedDirectionY * itemSpeed
      );
    });

    // SISTEMA LEVEIS ====================================================
    const levelTotalXp = 500 * xpMultiplicator;
    if (this.playerXp >= levelTotalXp) {
      // xpMultiplicator inicia com 1
      this.levelUp();

      this.playerXp = 0;
      xpMultiplicator *= 1.77;
    }

    const porcentXp = (this.playerXp / levelTotalXp) * 100;
    levelProgressBar.style.width = porcentXp + "%";
  }

  generateEnemyWave(numEnemies, generateGroup) {
    let angle, spawnDistance;

    if (generateGroup) {
      angle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
      spawnDistance = Phaser.Math.RND.realInRange(
        screenWidth,
        Math.max(screenWidth, screenHeight)
      );
    }

    for (let i = 0; i < numEnemies; i++) {
      if (!generateGroup) {
        angle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
        spawnDistance = Phaser.Math.RND.realInRange(
          screenWidth,
          Math.max(screenWidth, screenHeight)
        );
      }

      const spawnX = this.player.x + Math.cos(angle) * (spawnDistance + i * 50);
      const spawnY = this.player.y + Math.sin(angle) * (spawnDistance + i * 50);

      const enemies = this.enemies.getChildren();
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isUsed) {
          enemy.isUsed = true;
          enemy.enableBody(true, spawnX, spawnY, true, true);
          break;
        }
      }
    }
  }

  generateEnemyWaveLvl2(numEnemies, generateGroup) {
    let angle, spawnDistance;

    if (generateGroup) {
      angle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
      spawnDistance = Phaser.Math.RND.realInRange(
        screenWidth,
        Math.max(screenWidth, screenHeight)
      );
    }

    for (let i = 0; i < numEnemies; i++) {
      if (!generateGroup) {
        angle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
        spawnDistance = Phaser.Math.RND.realInRange(
          screenWidth,
          Math.max(screenWidth, screenHeight)
        );
      }

      const spawnX = this.player.x + Math.cos(angle) * (spawnDistance + i * 50);
      const spawnY = this.player.y + Math.sin(angle) * (spawnDistance + i * 50);

      const enemies = this.enemiesLvl2.getChildren();
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isUsed) {
          enemy.isUsed = true;
          enemy.enableBody(true, spawnX, spawnY, true, true);
          break;
        }
      }
    }
  }

  enemyDeath(enemy) {
    enemy.disableBody(true, true);
    enemy.isUsed = false;
    enemy.vida = this.enemyLife;

    this.enemyDeathSong.play();
    this.points++;
  }

  enemyDeathLvl2(enemy) {
    enemy.disableBody(true, true);
    enemy.isUsed = false;
    enemy.vida = this.enemyLvl2Life;

    for(let i=0; i < 50; i++){
      const sprite = this.physics.add.sprite(enemy.x, enemy.y, "enemy");
      sprite.setScale(0.1);
      sprite.blendMode = Phaser.BlendModes.SOFT_LIGHT;
      sprite.alpha = 1; 
      const randomSpeed = Phaser.Math.Between(25, 250);
      const randomAngle = Phaser.Math.Between(0, 360);
      sprite.setVelocity(
        randomSpeed * Math.cos(randomAngle),
        randomSpeed * Math.sin(randomAngle)
      );
      
      setTimeout(() =>{
        this.items.add(sprite);
      }, 700)
    }

    this.enemyDeathSong.play();
    this.points++;
  }

  enemyHit(bullet, enemy) {
    bullet.destroy();

    enemy.vida--;
    if (enemy.vida <= 0) {
      this.enemyDeath(enemy);
    }
  }

  enemyHitLvl2(bullet, enemy) {
    bullet.destroy();

    enemy.vida--;
    if (enemy.vida <= 0) {
      this.enemyDeathLvl2(enemy);
    }
  }

  enemyHitPlayer(enemy) {
    if (enemy) {
      if (!isInvulnerable) {
        if (!hasPlayerBeenHit) {
          enemy.destroy();

          this.player.vida--;
          hasPlayerBeenHit = true;

          if (this.player.vida <= 0) {
            this.gameOver();
          }
          setTimeout(() => {
            hasPlayerBeenHit = false;
          }, 500);
        }
      }
    }
  }

  collectXpUpgrade(item) {
    item.destroy();

    this.upgradeXp(1); // xp qntd
  }

  upgradeXp(value) {
    this.playerXp += value;
  }

  levelUp() {

    this.playerLevel++;
    this.levelUpSong.play();

    if (this.playerLevel === 1) {
      this.bulletsQnt = 2;
      this.shootInterval = 250; // ms
    } else if (this.playerLevel === 2) {
      this.bulletsQnt = 3;
      this.shootInterval = 450; // ms
    } else if (this.playerLevel === 3) {
      this.bulletsQnt = 3;
      this.shootInterval = 250; // ms
    } else {
      this.bulletsQnt = 1;
    }

    console.log(this.playerLevel, this.bulletsQnt);
  }

  playGame() {
    this.starterTimer = this.time.now;
    this.shootTimer = this.time.now;
    this.scene.resume("scene-game");

    this.menuMusic.stop();
    this.bgMusic.play({ volume: 0.6, loop: true });
    this.startSong.play({ volume: 0.7 });

    this.playerLevel = 0;
    this.playerXp = 0;
    levelProgressBar.style.width = 0 + "%";
  }

  gameOver() {
    gameEndScoreSpan.textContent = `Pontos: ${this.points}`;
    gameTimeLivedSpan.textContent = `Tempo: ${this.livedTime.toString()} seg`;
    gameEndDiv.style.display = "flex";

    this.resetGame();
  }

  resetGame() {
    this.points = 0;
    this.livedTime = 0;
    this.playerLevel = 0;
    this.playerXp = 0;
    this.bgMusic.stop();

    this.scene.restart();
  }
}

const config = {
  type: Phaser.WEBGL,
  width: screenWidth * 5,
  height: screenHeight * 5,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

// EVENTS
gameEndBtn.addEventListener("click", () => {
  game.scene.getScene("scene-game").gameOver();

  gamePauseDiv.classList.add("d-none");
});

gameStartBtn.addEventListener("click", () => {
  gameStartDiv.style.display = "none";
  game.scene.getScene("scene-game").playGame();
});

gameDespauseBtn.addEventListener("click", () => {
  gamePauseDiv.classList.add("d-none");

  game.scene.resume("scene-game");
  game.scene.getScene("scene-game").bgMusic.resume();
});

gameRestartBtn.addEventListener("click", () => {
  gameEndDiv.style.display = "none";

  game.scene.getScene("scene-game").playGame();
});

function getDate() {
  const span = document.getElementById("yearSpan");
  const date = new Date();
  const year = date.getFullYear();

  span.innerText = year;
}
getDate();

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    if (gameWindow.requestFullscreen) {
      gameWindow.requestFullscreen();
    } else if (gameWindow.mozRequestFullScreen) {
      /* Firefox */
      gameWindow.mozRequestFullScreen();
    } else if (gameWindow.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      gameWindow.webkitRequestFullscreen();
    } else if (gameWindow.msRequestFullscreen) {
      /* IE/Edge */
      gameWindow.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari & Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }
  }
});

const volumeInput = document.getElementById("volumeInput");
volumeInput.addEventListener("input", function () {
  const newVolume = volumeInput.value / 100;
  document
    .querySelectorAll("video, audio, embed, object")
    .forEach((element) => (element.volume = newVolume));

  //game.scene.getScene("scene-game").bgMusic.volume = newVolume;
  game.scene.getScene("scene-game").sound.setVolume(newVolume);
});
