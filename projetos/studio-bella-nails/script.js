const WHATSAPP = "5521999999999"; // troque pelo número real: 55 + DDD + número, sem espaços

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

// ---------- Seletor de cor ----------

const botoesCor = document.querySelectorAll(".cor");
const nomeDaCor = document.getElementById("corNome");
const seletorCor = document.getElementById("cor");

function escolherCor(botao) {
    document.documentElement.style.setProperty("--unha", botao.dataset.hex);
    nomeDaCor.textContent = botao.dataset.nome;
    seletorCor.value = botao.dataset.nome;
    botoesCor.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === botao));
    });
}

botoesCor.forEach(function (botao) {
    seletorCor.add(new Option(botao.dataset.nome, botao.dataset.nome));
    botao.addEventListener("click", function () {
        escolherCor(botao);
    });
});

seletorCor.addEventListener("change", function () {
    const botao = Array.from(botoesCor).find(function (b) {
        return b.dataset.nome === seletorCor.value;
    });
    if (botao) {
        escolherCor(botao);
    }
});

escolherCor(botoesCor[0]);

// ---------- Agendamento pelo WhatsApp ----------

const formulario = document.getElementById("formAgendar");
const campoData = document.getElementById("data");
const avisoStatus = document.getElementById("status");

function dataLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return data.getFullYear() + "-" + mes + "-" + dia;
}

campoData.min = dataLocal(new Date());

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const campos = formulario.querySelectorAll("input[required], select[required]");
    let primeiroInvalido = null;

    campos.forEach(function (campo) {
        const vazio = campo.value.trim() === "";
        campo.classList.toggle("invalido", vazio);
        if (vazio && !primeiroInvalido) {
            primeiroInvalido = campo;
        }
    });

    if (primeiroInvalido) {
        avisoStatus.textContent = "Preencha os campos destacados para continuar.";
        primeiroInvalido.focus();
        return;
    }

    const partes = campoData.value.split("-");
    const dataBonita = partes[2] + "/" + partes[1] + "/" + partes[0];
    const observacoes = document.getElementById("obs").value.trim();

    let mensagem = "Olá! Sou " + document.getElementById("nome").value.trim() +
        " e gostaria de agendar:\n" +
        "Serviço: " + document.getElementById("servico").value + "\n" +
        "Cor: " + seletorCor.value + "\n" +
        "Data: " + dataBonita + " às " + document.getElementById("horario").value;

    if (observacoes) {
        mensagem += "\nObservações: " + observacoes;
    }

    avisoStatus.textContent = "Abrindo o WhatsApp com a sua mensagem pronta...";
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(mensagem), "_blank", "noopener");
});

formulario.addEventListener("input", function (evento) {
    evento.target.classList.remove("invalido");
});
