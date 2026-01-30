/* =========================================================
   JÄGER HUNT - RETRO ARCADE GAME WITH DIFFICULTY
   ========================================================= */

class JagerHunt {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Game state
    this.gameState = 'menu'; // menu, playing, paused, gameover
    this.score = 0;
    this.hiScore = parseInt(localStorage.getItem('jagerHuntHiScore')) || 0;
    this.lives = 3;
    this.wave = 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.difficulty = 'normal';
    
    // Entities
    this.animals = [];
    this.bullets = [];
    this.particles = [];
    this.items = []; // падающие предметы
    this.notifications = []; // уведомления о предметах
    
    // Item spawn settings
    this.itemSpawnTimer = 0;
    this.itemSpawnDelay = 8000; // каждые 8 секунд
    
    // Active effects
    this.activeEffects = {
      fastShoot: 0,
      doublePoints: 0,
      slowdown: 0,
      chaos: 0
    };
    
    // Drunk mode
    this.drunkMode = this.calculateDrunkMode();
    
    // Spawn settings
    this.spawnTimer = 0;
    this.spawnDelay = 1500;
    this.maxAnimals = 8;
    this.baseSpeed = 1.5;
    this.spawnCount = { min: 1, max: 1 };
    
    // Animation
    this.lastTime = 0;
    this.animationId = null;
    
    // Colors (Game Boy green)
    this.colors = {
      bg: '#0f380f',
      dark: '#0f380f',
      mid: '#306230',
      light: '#8bac0f',
      bright: '#9bbc0f'
    };
    
    // Sober days bonus
    this.soberBonus = this.calculateSoberBonus();
    
    this.setupEventListeners();
    this.updateUI();
    this.loadHighscores();
    this.showDifficultySelect(); // Показываем выбор сложности сразу
  }
  
  // Настройки сложности
  getDifficultySettings(difficulty) {
    const settings = {
      easy: {
        spawnDelay: 2000,
        maxAnimals: 6,
        baseSpeed: 1.2,
        speedMultiplier: 0.1,
        spawnCount: { min: 1, max: 1, chance: 0.2 },
        waveThreshold: 120,
        animalWeights: [80, 50, 30, 8, 3]
      },
      normal: {
        spawnDelay: 1200,
        maxAnimals: 10,
        baseSpeed: 1.8,
        speedMultiplier: 0.18,
        spawnCount: { min: 1, max: 2, chance: 0.4 },
        waveThreshold: 100,
        animalWeights: [60, 40, 35, 15, 5]
      },
      hardcore: {
        spawnDelay: 500,
        maxAnimals: 20,
        baseSpeed: 2.5,
        speedMultiplier: 0.3,
        spawnCount: { min: 2, max: 4, chance: 0.7 },
        waveThreshold: 70,
        animalWeights: [70, 50, 40, 25, 10]
      }
    };
    
    return settings[difficulty];
  }
  
  showDifficultySelect() {
    console.log('Showing difficulty select');
    document.getElementById('difficultySelect').classList.remove('hidden');
    document.getElementById('gameControls').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    // Очищаем canvas
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Показываем drunk mode статус на canvas
    this.drawDrunkModeStatus();
    
    // Сбрасываем название
    document.querySelector('.arcade-title').textContent = '🦌 JÄGER HUNT';
  }
  
  drawDrunkModeStatus() {
    const ctx = this.ctx;
    const dm = this.drunkMode;
    
    // Добавляем тень для лучшей читаемости
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = this.colors.bright;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DRUNK MODE', this.canvas.width / 2, 40);
    
    ctx.font = '12px monospace';
    ctx.fillText(`🌲 Трезвых: ${dm.soberDays}  🍺 Пьяных: ${dm.drinkDays}`, this.canvas.width / 2, 60);
    
    // Сброс тени для бара
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Индикатор режима
    const barWidth = 200;
    const barHeight = 22;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 80;
    
    // Фон бара (темнее)
    ctx.fillStyle = '#0a2014';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Заполнение (зеленое для трезвых, желтое для пьяных)
    const fillWidth = barWidth * dm.level;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, this.colors.bright);
    gradient.addColorStop(1, '#c9a44c');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    // Рамка (толще и ярче)
    ctx.strokeStyle = this.colors.bright;
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Текст статуса с тенью
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.font = 'bold 12px monospace';
    if (dm.level < 0.3) {
      ctx.fillStyle = this.colors.bright;
      ctx.fillText('✨ Больше плюшек!', this.canvas.width / 2, barY + barHeight + 22);
    } else if (dm.level > 0.7) {
      ctx.fillStyle = '#c9a44c';
      ctx.fillText('💀 Больше проблем!', this.canvas.width / 2, barY + barHeight + 22);
      ctx.font = 'bold 11px monospace';
      ctx.fillText('+ размытие экрана', this.canvas.width / 2, barY + barHeight + 38);
    } else {
      ctx.fillStyle = this.colors.light;
      ctx.fillText('⚖️ Сбалансировано', this.canvas.width / 2, barY + barHeight + 22);
    }
    
    // Информация о предметах
    ctx.font = '11px monospace';
    ctx.fillStyle = this.colors.bright;
    ctx.textAlign = 'left';
    ctx.fillText('💡 Ловите падающие предметы!', 25, 165);
    
    ctx.fillStyle = this.colors.light;
    ctx.fillText('✅ Плюшки: 🍀⚡💊', 25, 182);
    ctx.fillText('❌ Проблемы: 🍺😵🌪️', 25, 198);
    
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = this.colors.bright;
    ctx.fillText(`📊 Хорошие: ${Math.round(dm.goodItemChance * 100)}%`, 25, 218);
    ctx.fillText(`📊 Плохие: ${Math.round(dm.badItemChance * 100)}%`, 25, 235);
    
    // Сброс тени
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  showGameControls() {
    console.log('Showing game controls');
    document.getElementById('difficultySelect').classList.add('hidden');
    document.getElementById('gameControls').classList.remove('hidden');
    document.getElementById('gameStart').classList.remove('hidden');
    document.getElementById('gamePause').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
  }
  
  setDifficulty(difficulty) {
    console.log('Setting difficulty:', difficulty);
    this.difficulty = difficulty;
    const settings = this.getDifficultySettings(difficulty);
    
    this.spawnDelay = settings.spawnDelay;
    this.maxAnimals = settings.maxAnimals;
    this.baseSpeed = settings.baseSpeed;
    this.speedMultiplier = settings.speedMultiplier;
    this.spawnCount = settings.spawnCount;
    this.waveThreshold = settings.waveThreshold;
    this.animalWeights = settings.animalWeights;
    
    // Обновляем название с иконкой сложности
    const difficultyIcons = { easy: '😌', normal: '😐', hardcore: '💀' };
    document.querySelector('.arcade-title').textContent = 
      `🦌 JÄGER HUNT ${difficultyIcons[difficulty]}`;
    
    // Показываем кнопку START
    this.showGameControls();
  }
  
  calculateSoberBonus() {
    const today = new Date();
    let soberDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasDrink = data.some(e => e.date === dateStr);
      if (hasDrink) break;
      soberDays++;
    }
    
    return Math.min(soberDays * 0.05, 0.5);
  }
  
  calculateDrunkMode() {
    const today = new Date();
    let drinkDays = 0;
    let soberDays = 0;
    
    // Считаем последние 30 дней
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasDrink = data.some(e => e.date === dateStr);
      if (hasDrink) {
        drinkDays++;
      } else {
        soberDays++;
      }
    }
    
    // Режим зависит от соотношения
    const drinkRatio = drinkDays / 30;
    
    return {
      level: drinkRatio, // 0-1, где 0 = все трезвые, 1 = все пьяные
      drinkDays: drinkDays,
      soberDays: soberDays,
      goodItemChance: Math.max(0.3, 0.7 - drinkRatio * 0.6), // 30-70%
      badItemChance: Math.min(0.7, 0.3 + drinkRatio * 0.6), // 30-70%
      screenEffects: drinkRatio > 0.5 // эффекты включаются если больше половины дней пьяных
    };
  }
  
  setupEventListeners() {
    // Canvas click для стрельбы
    this.canvas.addEventListener('click', (e) => {
      if (this.gameState === 'playing') {
        this.shoot(e);
      }
    });
    
    // Кнопки выбора сложности
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        this.setDifficulty(difficulty);
      });
    });
    
    // Кнопки управления
    document.getElementById('gameStart').addEventListener('click', () => {
      console.log('Start clicked');
      this.startGame();
    });
    
    document.getElementById('gamePause').addEventListener('click', () => {
      this.togglePause();
    });
    
    document.getElementById('gameRetry').addEventListener('click', () => {
      console.log('Retry clicked');
      this.resetGame();
    });
  }
  
  resetGame() {
    // Полный сброс игры
    this.gameState = 'menu';
    
    // Останавливаем анимацию
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Очищаем всё
    this.animals = [];
    this.bullets = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.combo = 1;
    this.comboTimer = 0;
    
    // Возвращаемся к выбору сложности
    this.showDifficultySelect();
  }
  
  startGame() {
    console.log('Starting game with difficulty:', this.difficulty);
    this.gameState = 'playing';
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.animals = [];
    this.bullets = [];
    this.particles = [];
    this.items = [];
    this.itemSpawnTimer = 0;
    
    // Сброс эффектов
    this.activeEffects = {
      fastShoot: 0,
      doublePoints: 0,
      slowdown: 0,
      chaos: 0
    };
    
    // Пересчитываем drunk mode
    this.drunkMode = this.calculateDrunkMode();
    
    // Применяем настройки выбранной сложности
    const settings = this.getDifficultySettings(this.difficulty);
    this.spawnDelay = settings.spawnDelay;
    this.maxAnimals = settings.maxAnimals;
    
    // Скрываем START, показываем PAUSE
    document.getElementById('gameStart').classList.add('hidden');
    document.getElementById('gamePause').classList.remove('hidden');
    
    this.updateUI();
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      document.getElementById('gamePause').textContent = '▶ RESUME';
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      document.getElementById('gamePause').textContent = '⏸ PAUSE';
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }
  
  gameLoop(currentTime = 0) {
    if (this.gameState !== 'playing') return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.draw();
    
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  update(deltaTime) {
    // Update active effects timers
    Object.keys(this.activeEffects).forEach(effect => {
      if (this.activeEffects[effect] > 0) {
        this.activeEffects[effect] -= deltaTime;
      }
    });
    
    // Spawn items
    this.itemSpawnTimer += deltaTime;
    if (this.itemSpawnTimer >= this.itemSpawnDelay) {
      this.spawnItem();
      this.itemSpawnTimer = 0;
    }
    
    // Spawn animals
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnDelay && this.animals.length < this.maxAnimals) {
      let spawnCount;
      if (Math.random() < this.spawnCount.chance) {
        spawnCount = Math.floor(Math.random() * (this.spawnCount.max - this.spawnCount.min + 1)) + this.spawnCount.min;
      } else {
        spawnCount = 1;
      }
      
      for (let i = 0; i < spawnCount; i++) {
        setTimeout(() => {
          if (this.animals.length < this.maxAnimals) {
            this.spawnAnimal();
          }
        }, i * 150);
      }
      this.spawnTimer = 0;
    }
    
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }
    
    // Update items
    this.items.forEach((item, index) => {
      item.y += item.speed * (deltaTime / 16);
      item.rotation += deltaTime / 100;
      
      // Check if player catches item (at bottom of screen)
      if (item.y > this.canvas.height - 60) {
        this.catchItem(item);
        this.items.splice(index, 1);
      } else if (item.y > this.canvas.height) {
        this.items.splice(index, 1);
      }
    });
    
    // Update animals (with chaos effect)
    this.animals.forEach((animal, index) => {
      const speedModifier = this.activeEffects.slowdown > 0 ? 0.5 : 1;
      animal.x += animal.speedX * speedModifier * (deltaTime / 16);
      
      // Chaos effect - хаотичное движение
      if (this.activeEffects.chaos > 0) {
        animal.y += Math.sin(animal.x * 0.1 + this.lastTime * 0.01) * 0.5;
      }
      
      animal.frame += deltaTime / 200;
      
      if (animal.x > this.canvas.width + 50) {
        this.animals.splice(index, 1);
        this.loseLife();
      }
    });
    
    // Update bullets
    this.bullets.forEach((bullet, index) => {
      bullet.y -= bullet.speed * (deltaTime / 16);
      if (bullet.y < -10) {
        this.bullets.splice(index, 1);
      }
    });
    
    // Update particles
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(index, 1);
      }
    });
    
    this.checkCollisions();
  }
  
  spawnAnimal() {
    const types = ['deer', 'deer', 'deer', 'boar', 'golden'];
    const weights = this.animalWeights;
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let type = 'deer';
    
    for (let i = 0; i < types.length; i++) {
      if (random < weights[i]) {
        type = types[i];
        break;
      }
      random -= weights[i];
    }
    
    const speedMultiplier = 1 + (this.wave - 1) * this.speedMultiplier;
    
    const animal = {
      type: type,
      x: -50,
      y: 30 + Math.random() * (this.canvas.height - 100),
      width: type === 'boar' ? 32 : 28,
      height: 24,
      speedX: (this.baseSpeed + Math.random() * 1) * speedMultiplier,
      frame: 0,
      hits: type === 'boar' ? 2 : 1,
      points: type === 'golden' ? 50 : type === 'boar' ? 20 : 10
    };
    
    this.animals.push(animal);
  }
  
  spawnItem() {
    const goodItems = [
      { type: 'clover', icon: '🍀', name: 'Клевер', effect: 'good' },
      { type: 'lightning', icon: '⚡', name: 'Молния', effect: 'good' },
      { type: 'pill', icon: '💊', name: 'Лекарство', effect: 'good' }
    ];
    
    const badItems = [
      { type: 'beer', icon: '🍺', name: 'Пиво', effect: 'bad' },
      { type: 'hangover', icon: '😵', name: 'Похмелье', effect: 'bad' },
      { type: 'chaos', icon: '🌪️', name: 'Вихрь', effect: 'bad' }
    ];
    
    // Drunk mode влияет на шанс хороших/плохих предметов
    const isGoodItem = Math.random() < this.drunkMode.goodItemChance;
    const itemPool = isGoodItem ? goodItems : badItems;
    const itemData = itemPool[Math.floor(Math.random() * itemPool.length)];
    
    const item = {
      ...itemData,
      x: 30 + Math.random() * (this.canvas.width - 60),
      y: -20,
      speed: 1.5,
      rotation: 0,
      size: 20,
      revealed: false // игрок не знает что это до поимки
    };
    
    this.items.push(item);
  }
  
  catchItem(item) {
    // Показываем что это за предмет
    item.revealed = true;
    
    // Создаём эффект частиц
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      this.particles.push({
        x: item.x + item.size / 2,
        y: item.y + item.size / 2,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 600,
        size: 3
      });
    }
    
    // Применяем эффект предмета
    switch(item.type) {
      case 'clover': // Удача - х2 очки на 10 сек
        this.activeEffects.doublePoints = 10000;
        this.combo = Math.max(this.combo, 2);
        this.showItemNotification('🍀 Удача! x2 очки', 'good');
        break;
        
      case 'lightning': // Быстрая стрельба на 8 сек
        this.activeEffects.fastShoot = 8000;
        this.showItemNotification('⚡ Быстрая стрельба!', 'good');
        break;
        
      case 'pill': // +1 жизнь
        this.lives = Math.min(this.lives + 1, 5);
        this.updateUI();
        this.showItemNotification('💊 +1 жизнь', 'good');
        break;
        
      case 'beer': // -1 жизнь
        this.loseLife();
        this.showItemNotification('🍺 Ох... -1 жизнь', 'bad');
        break;
        
      case 'hangover': // Замедление на 6 сек
        this.activeEffects.slowdown = 6000;
        this.showItemNotification('😵 Похмелье... Всё медленно', 'bad');
        break;
        
      case 'chaos': // Хаотичное движение на 8 сек
        this.activeEffects.chaos = 8000;
        this.showItemNotification('🌪️ Вихрь! Хаос!', 'bad');
        break;
    }
    
    if (window.Telegram && window.Telegram.WebApp) {
      const haptic = item.effect === 'good' ? 'success' : 'warning';
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(haptic);
    }
  }
  
  showItemNotification(text, type) {
    // Простое уведомление в центре экрана
    const notification = {
      text: text,
      type: type,
      life: 2000,
      y: this.canvas.height / 2
    };
    
    if (!this.notifications) {
      this.notifications = [];
    }
    
    this.notifications.push(notification);
    
    // Убираем через 2 секунды
    setTimeout(() => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 2000);
  }
  
  shoot(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    this.bullets.push({
      x: x,
      y: y,
      speed: 8,
      radius: 3
    });
    
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 2,
        life: 300,
        size: 2
      });
    }
  }
  
  checkCollisions() {
    this.bullets.forEach((bullet, bIndex) => {
      this.animals.forEach((animal, aIndex) => {
        if (bullet.x > animal.x && 
            bullet.x < animal.x + animal.width &&
            bullet.y > animal.y && 
            bullet.y < animal.y + animal.height) {
          
          this.bullets.splice(bIndex, 1);
          animal.hits--;
          
          if (animal.hits <= 0) {
            // Базовые очки с комбо
            let points = animal.points * this.combo;
            
            // Эффект двойных очков от предмета
            if (this.activeEffects.doublePoints > 0) {
              points *= 2;
            }
            
            this.score += points;
            
            if (animal.type === 'golden') {
              this.combo = 2;
              this.comboTimer = 10000;
            }
            
            this.createExplosion(animal.x + animal.width/2, animal.y + animal.height/2);
            this.animals.splice(aIndex, 1);
            
            if (this.score > this.wave * this.waveThreshold) {
              this.wave++;
              
              if (this.difficulty === 'easy') {
                this.spawnDelay = Math.max(1500, this.spawnDelay - 100);
              } else if (this.difficulty === 'normal') {
                this.spawnDelay = Math.max(800, this.spawnDelay - 100);
                this.maxAnimals = Math.min(15, this.maxAnimals + 1);
              } else {
                this.spawnDelay = Math.max(300, this.spawnDelay - 50);
                this.maxAnimals = Math.min(25, this.maxAnimals + 2);
              }
            }
            
            if (window.Telegram && window.Telegram.WebApp) {
              window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            }
          }
          
          this.updateUI();
        }
      });
    });
  }
  
  createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 500,
        size: 3
      });
    }
  }
  
  loseLife() {
    this.lives--;
    
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    
    this.updateUI();
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  gameOver() {
    this.gameState = 'gameover';
    
    if (this.score > this.hiScore) {
      this.hiScore = this.score;
      localStorage.setItem('jagerHuntHiScore', this.hiScore);
    }
    
    this.saveScore();
    
    document.getElementById('finalScore').textContent = this.score;
    
    const soberDays = Math.floor(this.soberBonus / 0.05);
    if (soberDays > 0) {
      document.getElementById('soberBonus').textContent = 
        `🌲 ${soberDays} трезвых дней: +${Math.floor(this.soberBonus * 100)}% меткость`;
    }
    
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('gamePause').classList.add('hidden');
    
    this.loadHighscores();
  }
  
  saveScore() {
    const scores = JSON.parse(localStorage.getItem('jagerHuntScores')) || [];
    scores.push({
      score: this.score,
      wave: this.wave,
      date: new Date().toISOString().split('T')[0],
      difficulty: this.difficulty,
      soberBonus: this.soberBonus
    });
    
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('jagerHuntScores', JSON.stringify(scores.slice(0, 10)));
  }
  
  loadHighscores() {
    const scores = JSON.parse(localStorage.getItem('jagerHuntScores')) || [];
    const list = document.getElementById('highscoresList');
    
    if (scores.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #7fd3a6; padding: 10px;">Ещё нет рекордов</div>';
      return;
    }
    
    const diffIcons = { easy: '😌', normal: '😐', hardcore: '💀' };
    
    list.innerHTML = scores.slice(0, 5).map((s, i) => `
      <div class="highscore-item ${i === 0 ? 'top-score' : ''}">
        <span>${i + 1}. ${diffIcons[s.difficulty] || '😐'} WAVE ${s.wave}</span>
        <span>${s.score} PTS</span>
      </div>
    `).join('');
  }
  
  updateUI() {
    document.getElementById('gameScore').textContent = this.score;
    document.getElementById('gameHiScore').textContent = this.hiScore;
    document.getElementById('gameLives').textContent = '❤️'.repeat(this.lives);
    document.getElementById('gameWave').textContent = this.wave;
  }
  
  draw() {
    const ctx = this.ctx;
    
    // Drunk mode screen effects
    if (this.drunkMode.screenEffects && this.gameState === 'playing') {
      ctx.save();
      // Легкое размытие и покачивание
      const wobble = Math.sin(this.lastTime * 0.002) * 2;
      ctx.translate(wobble, 0);
    }
    
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawForest();
    this.animals.forEach(animal => this.drawAnimal(animal));
    
    // Рисуем падающие предметы
    this.items.forEach(item => this.drawItem(item));
    
    ctx.fillStyle = this.colors.bright;
    this.bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.fillStyle = this.colors.light;
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 500;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // Тень для всего текста
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Активные эффекты
    let effectY = 70;
    if (this.activeEffects.doublePoints > 0) {
      ctx.fillStyle = this.colors.bright;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      const timeLeft = Math.ceil(this.activeEffects.doublePoints / 1000);
      ctx.fillText(`🍀 x2 POINTS ${timeLeft}s`, this.canvas.width / 2, effectY);
      effectY += 18;
    }
    
    if (this.activeEffects.fastShoot > 0) {
      ctx.fillStyle = this.colors.bright;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      const timeLeft = Math.ceil(this.activeEffects.fastShoot / 1000);
      ctx.fillText(`⚡ FAST ${timeLeft}s`, this.canvas.width / 2, effectY);
      effectY += 18;
    }
    
    if (this.activeEffects.slowdown > 0) {
      ctx.fillStyle = '#e8a84c';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      const timeLeft = Math.ceil(this.activeEffects.slowdown / 1000);
      ctx.fillText(`😵 SLOW ${timeLeft}s`, this.canvas.width / 2, effectY);
      effectY += 18;
    }
    
    if (this.activeEffects.chaos > 0) {
      ctx.fillStyle = '#e8a84c';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      const timeLeft = Math.ceil(this.activeEffects.chaos / 1000);
      ctx.fillText(`🌪️ CHAOS ${timeLeft}s`, this.canvas.width / 2, effectY);
    }
    
    // Комбо
    if (this.combo > 1) {
      ctx.fillStyle = this.colors.bright;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`x${this.combo} COMBO!`, this.canvas.width / 2, 30);
      
      const timeLeft = Math.ceil(this.comboTimer / 1000);
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${timeLeft}s`, this.canvas.width / 2, 50);
    }
    
    // Уведомления о предметах
    if (this.notifications) {
      this.notifications.forEach(notif => {
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        const alpha = Math.min(1, notif.life / 500);
        ctx.globalAlpha = alpha;
        
        // Увеличенная тень для уведомлений
        ctx.shadowBlur = 8;
        
        if (notif.type === 'good') {
          ctx.fillStyle = this.colors.bright;
        } else {
          ctx.fillStyle = '#e8a84c';
        }
        
        ctx.fillText(notif.text, this.canvas.width / 2, notif.y - 20);
        
        notif.life -= 16;
        notif.y -= 0.5;
      });
      ctx.globalAlpha = 1;
    }
    
    // Сброс тени
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    if (this.drunkMode.screenEffects && this.gameState === 'playing') {
      ctx.restore();
    }
  }
  
  drawForest() {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.dark;
    
    for (let i = 0; i < 10; i++) {
      const x = i * 35 + (this.lastTime / 30) % 35;
      this.drawTree(x - 35, this.canvas.height - 50);
    }
  }
  
  drawTree(x, y) {
    const ctx = this.ctx;
    
    ctx.fillStyle = this.colors.mid;
    ctx.fillRect(x + 3, y, 4, 12);
    
    ctx.fillStyle = this.colors.light;
    ctx.fillRect(x, y - 4, 10, 3);
    ctx.fillRect(x + 1, y - 7, 8, 3);
    ctx.fillRect(x + 2, y - 10, 6, 3);
  }
  
  drawAnimal(animal) {
    const ctx = this.ctx;
    const frame = Math.floor(animal.frame) % 2;
    
    if (animal.type === 'golden') {
      ctx.fillStyle = '#c9a44c';
    } else if (animal.type === 'boar') {
      ctx.fillStyle = this.colors.mid;
    } else {
      ctx.fillStyle = this.colors.light;
    }
    
    const x = animal.x;
    const y = animal.y;
    
    if (animal.type === 'boar') {
      ctx.fillRect(x, y + 8, 24, 12);
      ctx.fillRect(x + 20, y + 6, 6, 4);
      ctx.fillRect(x + frame * 2, y + 20, 4, 6);
      ctx.fillRect(x + 12 + frame * 2, y + 20, 4, 6);
    } else {
      ctx.fillRect(x, y + 6, 20, 10);
      ctx.fillRect(x + 16, y + 4, 6, 6);
      ctx.fillRect(x + 18, y, 2, 4);
      ctx.fillRect(x + 22, y, 2, 4);
      ctx.fillRect(x + frame * 2, y + 16, 3, 6);
      ctx.fillRect(x + 10 + frame * 2, y + 16, 3, 6);
      ctx.fillRect(x - 2, y + 8, 3, 3);
    }
    
    if (animal.type === 'boar' && animal.hits > 1) {
      ctx.fillStyle = this.colors.bright;
      for (let i = 0; i < animal.hits; i++) {
        ctx.fillRect(x + i * 5, y - 4, 3, 2);
      }
    }
  }
  
  drawItem(item) {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
    ctx.rotate(item.rotation);
    
    // Рисуем предмет как загадочный ящик (пока не пойман)
    ctx.font = `${item.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Таинственный ящик
    ctx.fillText('❓', 0, 0);
    
    // Добавляем свечение для эффекта
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = item.effect === 'good' ? this.colors.bright : '#c9a44c';
    ctx.fillRect(-item.size/2 - 2, -item.size/2 - 2, item.size + 4, item.size + 4);
    ctx.globalAlpha = 1;
    
    ctx.restore();
  }
}

let jagerHunt = null;

const originalOpenTab = window.openTab;
window.openTab = function(id, btn) {
  originalOpenTab(id, btn);
  
  if (id === 'game' && !jagerHunt) {
    jagerHunt = new JagerHunt();
  }
};
