<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../assets/css/Menu.css">
<title>Menu del Juego</title>
</head>
<body>

<!-- Loader inicial -->
<div id="loader">
  <div class="spinner"></div>
  <div class="loading-text">Cargando...</div>
</div>

<!-- Fondo GIF -->
<img src="../assets/img/bg_menu.png" class="background-gif">

<!-- Título con GIF -->
<div class="title">
  <img src="../assets/img/logo_animado.gif" alt="Game Title GIF">
</div>

<!-- Menú -->
<div class="menu-container">
  <div class="menu-items">
    <a id="btnJugar">Jugar</a>
    <a id="btnControles">Controles</a>
    <a id="btnSalir">Salir</a>
  </div>
</div>

<!-- Modal Controles -->
<div id="modalControles" class="modal">
  <div class="modal-content">
    <span class="close">&times;</span>
    <h2>Controles del Juego</h2>
    <div class="controls-list">
      <div class="control-item"><span class="key">A / D</span> Mover horizontalmente</div>
      <div class="control-item"><span class="key">W / Espacio</span> Saltar</div>
        <div class="control-item"><span class="key">Clic izquierdo</span>para disparar </div>
      <div class="control-item"><span class="key">E</span> Ataque base</div>
      <div class="control-item"><span class="key">R</span> Ataque de fuego</div>
      <div class="control-item"><span class="key">T</span> Ataque de agua</div>
      <div class="control-item"><span class="key">Y</span> Ataque de tierra</div>
    </div>
  </div>
</div>


<script>
// Loader inicial al cargar la página
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 800);
  }, 2000);
});

// Función para mostrar loader y redirigir
function showLoaderAndRedirect(url) {
  const loader = document.getElementById("loader");
  loader.style.display = "flex";
  loader.style.opacity = "1";
  setTimeout(() => {
    window.location.href = url;
  }, 1500);
}

// Botones Jugar / Salir
document.getElementById("btnJugar").addEventListener("click", () => {
  showLoaderAndRedirect("../dist/index.html");
});

document.getElementById("btnSalir").addEventListener("click", () => {
  showLoaderAndRedirect("../../index.php");
});

// Modal de controles
const modal = document.getElementById("modalControles");
const btnControles = document.getElementById("btnControles");
const spanClose = document.querySelector(".modal .close");

// Abrir modal
btnControles.onclick = () => {
  modal.style.display = "flex";
}

// Cerrar modal con X
spanClose.onclick = () => {
  modal.style.display = "none";
}

// Cerrar modal haciendo click fuera
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
</script>

</body>
</html>
