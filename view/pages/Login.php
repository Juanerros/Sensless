<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../assets/css/index.css">
  <link rel="stylesheet" href="../assets/css/Login.css">
  <title>Document</title>
</head>

<?php
session_start();

if (isset($_SESSION['error']) || isset($_SESSION['msg'])) {
    $isError = isset($_SESSION['error']);
    $message = $isError ? $_SESSION['error'] : $_SESSION['msg'];
    $type = $isError ? 'error' : 'success';

    echo <<<HTML
    <div class="toast $type">
        <div class="toast-border"></div>
        <div class="toast-content">
            <p class="toast-message">$message</p>
        </div>
    </div>
    HTML;

    unset($_SESSION['error']);
    unset($_SESSION['msg']);
}
?>


<body>
  <div class="login-bg-main">
    <div class="login-container">
      <div class="login-form-section">
        <h1 class="login-title anim-title">SENSLESS</h1>
        <h2 class="login-subtitle anim-title" style="animation-delay: 0.1s">
          INICIO DE SESIÓN
        </h2>
        <form class="login-form" id="login-form" action="./../../controller/login.php" method="POST">
          <label for="username" class="anim-label" style="animation-delay: 0.2s">Username</label>
          <div class="login-input-wrapper anim-input" style="animation-delay: 0.3s">
            <img src="../assets/img/icon_pixelart-user.png" class="login-icon" />
            <input type="text" id="username" name="nombre" placeholder="name20..." autocomplete="username" require/>
          </div>

          <label for="password" class="anim-label" style="animation-delay: 0.4s">Contraseña</label>
          <div class="login-input-wrapper anim-input" style="animation-delay: 0.5s">
            <img src="../assets/img/icon_pixelart-keyhole.png" class="login-icon" />
            <input type="password" id="password" name="clave" placeholder="contraseña..." autocomplete="current-password" require/>
          </div>

          <div class="login-options anim-label" style="animation-delay: 0.6s">
            <label class="remember-label">
              <input type="checkbox" id="remember-me" />
              <span class="checkmark"></span>
              Recordarme
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>
          <div class="form-btn">
            <button type="submit" class="login-btn anim-btn" style="animation-delay: 0.7s">
              Iniciar sesión
            </button>
          </div>
        </form>
        <div class="login-bottom anim-label" style="animation-delay: 0.8s">
          <span>¿no tienes una cuenta? </span>
          <a href="./Register.php" class="login-link">Registrarse</a>
        </div>
      </div>
      <div class="login-image-section anim-img">
        <img src="../assets/img/background-login-zenith.png" alt="Zenith" />
      </div>
    </div>
  </div>

</body>

</html>