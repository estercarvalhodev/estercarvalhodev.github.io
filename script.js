const botaoMenu = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

function fecharMenu() {
    menu.classList.remove("aberto");
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.setAttribute("aria-label", "Abrir menu");
}

botaoMenu.addEventListener("click", function () {
    const estaAberto = menu.classList.toggle("aberto");
    botaoMenu.setAttribute("aria-expanded", String(estaAberto));
    botaoMenu.setAttribute("aria-label", estaAberto ? "Fechar menu" : "Abrir menu");
});

menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", fecharMenu);
});

// marca no menu a seção que está aparecendo na tela
const linksDoMenu = document.querySelectorAll('.menu a[href^="#"]');

const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) {
            return;
        }
        linksDoMenu.forEach(function (link) {
            link.removeAttribute("aria-current");
        });
        const linkAtivo = document.querySelector('.menu a[href="#' + entrada.target.id + '"]');
        if (linkAtivo) {
            linkAtivo.setAttribute("aria-current", "true");
        }
    });
}, { rootMargin: "-45% 0px -50% 0px" });

linksDoMenu.forEach(function (link) {
    const secao = document.querySelector(link.getAttribute("href"));
    if (secao) {
        observador.observe(secao);
    }
});

document.getElementById("ano").textContent = new Date().getFullYear();
