class GameOverScreen {
  constructor() {
    this.isVisible = false;
    
    // Variable para cargar el logo
    this.logoImage = null;
    this.logoLoaded = false;
  }

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
  }

  draw(p) {
    if (!this.isVisible) return;

    // Cargar logo si no está cargado (solo una vez)
    if (!this.logoImage && !this.logoLoaded) {
      this.logoLoaded = true;
      p.loadImage('sprites/interfas/logo.png', (img) => {
        this.logoImage = img;
        console.log('Logo cargado exitosamente');
      }, () => {
        console.error('Error al cargar el logo');
        this.logoLoaded = false;
      });
    }

    // Fondo semitransparente
    p.push();
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
    p.pop();

    // Usar dimensiones de p5 para centrado correcto
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Dibujar logo centrado (si ya está cargado)
    p.push();
    p.imageMode(p.CENTER);
    const logoWidth = 500;
    const logoHeight = this.logoImage && this.logoImage.height && this.logoImage.width
      ? (this.logoImage.height / this.logoImage.width) * logoWidth
      : logoWidth;
    if (this.logoImage) {
      p.image(this.logoImage, centerX, centerY - 80, logoWidth, logoHeight);
    } else {
      // Fallback mientras carga
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text('Cargando...', centerX, centerY - 80);
    }
    p.pop();

    // Dibujar botones centrados debajo del logo
    const buttonWidth = 300;
    const buttonHeight = 60;

    const buttonYRestart = centerY + 100;
    const buttonYSave = centerY + 180;

    // Botón Reiniciar
    p.push();
    p.fill(100, 100, 100);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(centerX, buttonYRestart, buttonWidth, buttonHeight);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text('REINICIAR', centerX, buttonYRestart);
    p.pop();

    // Botón Guardar puntuación
    p.push();
    p.fill(100, 100, 100);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(centerX, buttonYSave, buttonWidth, buttonHeight);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text('Guardar puntuación', centerX, buttonYSave);
    p.pop();
  }

  handleKeyPressed(key) {
    if (this.isVisible && (key === 'r' || key === 'R')) {
      this.hide();
      return true;
    }
    return false;
  }

  handleMousePressed(p) {
    if (!this.isVisible) return null;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonYRestart = centerY + 100;
    const buttonYSave = centerY + 180;

    const mx = p.mouseX;
    const my = p.mouseY;

    // Área del botón Reiniciar
    const restartHit = (
      mx >= centerX - buttonWidth / 2 && mx <= centerX + buttonWidth / 2 &&
      my >= buttonYRestart - buttonHeight / 2 && my <= buttonYRestart + buttonHeight / 2
    );

    if (restartHit) {
      this.hide();
      return 'restart';
    }

    // Área del botón Guardar puntuación
    const saveHit = (
      mx >= centerX - buttonWidth / 2 && mx <= centerX + buttonWidth / 2 &&
      my >= buttonYSave - buttonHeight / 2 && my <= buttonYSave + buttonHeight / 2
    );

    if (saveHit) {
      return 'save';
    }

    return null;
  }
}

export default GameOverScreen;