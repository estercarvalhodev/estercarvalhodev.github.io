const CHAVE_TAREFAS = "foco.tarefas";
const CHAVE_CICLOS = "foco.ciclos";

const MODOS = {
    foco: { nome: "Foco", minutos: 25 },
    pausa: { nome: "Pausa", minutos: 5 },
    longa: { nome: "Pausa longa", minutos: 15 }
};

const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };
const NOME_PRIORIDADE = { alta: "Alta", media: "Média", baixa: "Baixa" };

// ---------- Utilitários ----------

function lerJSON(chave, padrao) {
    try {
        const texto = localStorage.getItem(chave);
        return texto ? JSON.parse(texto) : padrao;
    } catch (erro) {
        return padrao;
    }
}

function salvarJSON(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
        // sem localStorage (ex.: aba anônima): o app continua funcionando, só não guarda
    }
}

function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function hojeISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
}

function formatarData(iso) {
    const partes = iso.split("-");
    return partes[2] + "/" + partes[1];
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    if (texto !== undefined) {
        elemento.textContent = texto;
    }
    return elemento;
}

// ---------- Elementos da página ----------

const cartaoTimer = document.querySelector(".timer");
const anelProgresso = document.getElementById("anelProgresso");
const tempoEl = document.getElementById("tempo");
const modoNomeEl = document.getElementById("modoNome");
const btnIniciar = document.getElementById("btnIniciar");
const btnReiniciar = document.getElementById("btnReiniciar");
const tarefaAtual = document.getElementById("tarefaAtual");
const ciclosEl = document.getElementById("ciclosHoje");
const avisoTimer = document.getElementById("avisoTimer");
const botoesModo = document.querySelectorAll(".modo");

const listaEl = document.getElementById("lista");
const vazioEl = document.getElementById("vazio");
const resumoEl = document.getElementById("resumo");
const barraEl = document.getElementById("barra");
const progressoEl = document.getElementById("progresso");
const formTarefa = document.getElementById("formTarefa");
const novoTitulo = document.getElementById("novoTitulo");
const novaPrioridade = document.getElementById("novaPrioridade");
const novoPrazo = document.getElementById("novoPrazo");
const botoesFiltro = document.querySelectorAll(".filtro");
const btnLimpar = document.getElementById("limpar");

document.getElementById("dataHoje").textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
}).format(new Date());

// ---------- Tarefas ----------

let tarefas = lerJSON(CHAVE_TAREFAS, null);
let filtro = "todas";
let idParaFocar = null;

if (!Array.isArray(tarefas)) {
    tarefas = [
        { id: novoId(), titulo: "Revisar flexbox e grid", prioridade: "alta", prazo: "", feita: false, ciclos: 0 },
        { id: novoId(), titulo: "Praticar arrays em JavaScript", prioridade: "media", prazo: "", feita: false, ciclos: 0 },
        { id: novoId(), titulo: "Ler sobre acessibilidade na web", prioridade: "baixa", prazo: "", feita: false, ciclos: 0 }
    ];
    salvarTarefas();
}

function salvarTarefas() {
    salvarJSON(CHAVE_TAREFAS, tarefas);
}

function tarefasVisiveis() {
    let lista = tarefas.slice();

    if (filtro === "pendentes") {
        lista = lista.filter(function (t) { return !t.feita; });
    } else if (filtro === "feitas") {
        lista = lista.filter(function (t) { return t.feita; });
    }

    lista.sort(function (a, b) {
        if (a.feita !== b.feita) {
            return a.feita ? 1 : -1;
        }
        if (PESO_PRIORIDADE[a.prioridade] !== PESO_PRIORIDADE[b.prioridade]) {
            return PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
        }
        if (a.prazo && b.prazo) {
            return a.prazo.localeCompare(b.prazo);
        }
        if (a.prazo) {
            return -1;
        }
        if (b.prazo) {
            return 1;
        }
        return 0;
    });

    return lista;
}

function criarItem(tarefa) {
    const item = criarElemento("li", "tarefa" + (tarefa.feita ? " tarefa--feita" : ""));
    item.dataset.id = tarefa.id;

    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.className = "tarefa__check";
    caixa.checked = tarefa.feita;
    caixa.setAttribute("aria-label", (tarefa.feita ? "Reabrir: " : "Concluir: ") + tarefa.titulo);
    caixa.addEventListener("change", function () {
        tarefa.feita = caixa.checked;
        idParaFocar = tarefa.id;
        salvarTarefas();
        renderizar();
    });

    const info = criarElemento("div", "tarefa__info");
    info.appendChild(criarElemento("span", "tarefa__titulo", tarefa.titulo));

    const meta = criarElemento("div", "tarefa__meta");
    meta.appendChild(criarElemento("span", "pill pill--" + tarefa.prioridade, NOME_PRIORIDADE[tarefa.prioridade]));

    if (tarefa.prazo) {
        const atrasada = !tarefa.feita && tarefa.prazo < hojeISO();
        const textoPrazo = (atrasada ? "Atrasada · " : "Prazo ") + formatarData(tarefa.prazo);
        meta.appendChild(criarElemento("span", "prazo" + (atrasada ? " prazo--atrasado" : ""), textoPrazo));
    }

    if (tarefa.ciclos > 0) {
        meta.appendChild(criarElemento("span", "ciclos-tarefa", tarefa.ciclos + (tarefa.ciclos === 1 ? " ciclo" : " ciclos")));
    }
    info.appendChild(meta);

    const apagar = criarElemento("button", "apagar", "×");
    apagar.type = "button";
    apagar.setAttribute("aria-label", "Apagar tarefa: " + tarefa.titulo);
    apagar.addEventListener("click", function () {
        tarefas = tarefas.filter(function (t) { return t.id !== tarefa.id; });
        salvarTarefas();
        renderizar();
    });

    item.append(caixa, info, apagar);
    return item;
}

function atualizarSeletorDeTarefa() {
    const escolhida = tarefaAtual.value;
    tarefaAtual.replaceChildren(new Option("Sem tarefa específica", ""));

    tarefas.filter(function (t) { return !t.feita; }).forEach(function (t) {
        tarefaAtual.add(new Option(t.titulo, t.id));
    });

    const aindaExiste = Array.from(tarefaAtual.options).some(function (o) { return o.value === escolhida; });
    tarefaAtual.value = aindaExiste ? escolhida : "";
}

function renderizar() {
    const visiveis = tarefasVisiveis();
    listaEl.replaceChildren();
    visiveis.forEach(function (t) {
        listaEl.appendChild(criarItem(t));
    });
    vazioEl.hidden = visiveis.length > 0;

    const total = tarefas.length;
    const feitas = tarefas.filter(function (t) { return t.feita; }).length;
    const percentual = total === 0 ? 0 : Math.round((feitas / total) * 100);

    resumoEl.textContent = total === 0 ? "Sem tarefas" : feitas + " de " + total + " concluídas";
    barraEl.style.width = percentual + "%";
    progressoEl.setAttribute("aria-valuenow", String(percentual));
    btnLimpar.disabled = feitas === 0;
    btnLimpar.hidden = feitas === 0;

    atualizarSeletorDeTarefa();

    if (idParaFocar) {
        const caixa = document.querySelector('li[data-id="' + idParaFocar + '"] .tarefa__check');
        if (caixa) {
            caixa.focus();
        }
        idParaFocar = null;
    }
}

formTarefa.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const titulo = novoTitulo.value.trim();

    if (titulo === "") {
        novoTitulo.focus();
        return;
    }

    tarefas.push({
        id: novoId(),
        titulo: titulo,
        prioridade: novaPrioridade.value,
        prazo: novoPrazo.value,
        feita: false,
        ciclos: 0
    });

    salvarTarefas();
    formTarefa.reset();
    renderizar();
    novoTitulo.focus();
});

botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
        filtro = botao.dataset.filtro;
        botoesFiltro.forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === botao));
        });
        renderizar();
    });
});

btnLimpar.addEventListener("click", function () {
    tarefas = tarefas.filter(function (t) { return !t.feita; });
    salvarTarefas();
    renderizar();
});

// ---------- Timer Pomodoro ----------

const CIRCUNFERENCIA = 2 * Math.PI * 90;
anelProgresso.style.strokeDasharray = String(CIRCUNFERENCIA);

let modo = "foco";
let restante = MODOS.foco.minutos * 60;
let fim = null;
let intervalo = null;
let audio = null;

function lerCiclosHoje() {
    const guardado = lerJSON(CHAVE_CICLOS, null);
    return guardado && guardado.data === hojeISO() ? guardado.n : 0;
}

let ciclosHoje = lerCiclosHoje();
ciclosEl.textContent = String(ciclosHoje);

function duracaoTotal() {
    return MODOS[modo].minutos * 60;
}

function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return String(minutos).padStart(2, "0") + ":" + String(resto).padStart(2, "0");
}

function atualizarTela() {
    tempoEl.textContent = formatarTempo(restante);
    anelProgresso.style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - restante / duracaoTotal()));
    document.title = (intervalo ? formatarTempo(restante) + " · " : "") + "Foco | Organizador de estudos";
}

function criarAudio() {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    return Contexto ? new Contexto() : null;
}

function tocarSom() {
    if (!audio) {
        return;
    }
    const agora = audio.currentTime;
    const oscilador = audio.createOscillator();
    const ganho = audio.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(0.25, agora + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.6);

    oscilador.connect(ganho);
    ganho.connect(audio.destination);
    oscilador.start(agora);
    oscilador.stop(agora + 0.65);
}

function parar() {
    clearInterval(intervalo);
    intervalo = null;
}

function trocarModo(novoModo) {
    parar();
    modo = novoModo;
    restante = duracaoTotal();
    cartaoTimer.dataset.modo = modo;
    modoNomeEl.textContent = MODOS[modo].nome;
    btnIniciar.textContent = "Iniciar";
    botoesModo.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.modo === modo));
    });
    atualizarTela();
}

function iniciar() {
    if (intervalo) {
        return;
    }
    audio = audio || criarAudio();
    fim = Date.now() + restante * 1000;
    intervalo = setInterval(tique, 250);
    btnIniciar.textContent = "Pausar";
    avisoTimer.textContent = "";
}

function pausar() {
    parar();
    btnIniciar.textContent = "Continuar";
    atualizarTela();
}

function tique() {
    restante = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
    atualizarTela();
    if (restante === 0) {
        concluirCiclo();
    }
}

function concluirCiclo() {
    parar();
    tocarSom();

    if (modo === "foco") {
        ciclosHoje += 1;
        salvarJSON(CHAVE_CICLOS, { data: hojeISO(), n: ciclosHoje });
        ciclosEl.textContent = String(ciclosHoje);

        const tarefa = tarefas.find(function (t) { return t.id === tarefaAtual.value; });
        if (tarefa) {
            tarefa.ciclos = (tarefa.ciclos || 0) + 1;
            salvarTarefas();
            renderizar();
        }

        const pausaLonga = ciclosHoje % 4 === 0;
        trocarModo(pausaLonga ? "longa" : "pausa");
        avisoTimer.textContent = "Ciclo concluído! Hora de uma pausa" + (pausaLonga ? " longa." : ".");
    } else {
        trocarModo("foco");
        avisoTimer.textContent = "Pausa terminada. Vamos de novo?";
    }
}

btnIniciar.addEventListener("click", function () {
    if (intervalo) {
        pausar();
    } else {
        iniciar();
    }
});

btnReiniciar.addEventListener("click", function () {
    trocarModo(modo);
    avisoTimer.textContent = "";
});

botoesModo.forEach(function (botao) {
    botao.addEventListener("click", function () {
        trocarModo(botao.dataset.modo);
        avisoTimer.textContent = "";
    });
});

renderizar();
atualizarTela();
