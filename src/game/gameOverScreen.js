class GameOverScreen {
  constructor() {
    this.isVisible = false;
  }

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
  }

  draw(p) {
    if (!this.isVisible) return;

    p.push();
    p.resetMatrix();
    
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, p.width, p.height);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", p.width / 2, p.height / 2 - 50);
    
    p.textSize(24);
    p.text("Presiona R para reiniciar", p.width / 2, p.height / 2 + 20);
    
    p.pop();
  }

  handleKeyPressed(key) {
    if (this.isVisible && (key === 'r' || key === 'R')) {
      this.hide();
      return true;
    }
    return false;
  }
}

export default GameOverScreen;