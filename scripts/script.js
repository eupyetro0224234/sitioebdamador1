const MUSICA_URL = "https://raw.githubusercontent.com/eupyetro0224234/sitioebdamador1/refs/heads/main/images/11.mp3";

if (MUSICA_URL) {
    const VOLUME_FINAL = 0.4;
    const DURACAO_FADE = 4000;

    const audio = new Audio(MUSICA_URL);
    audio.loop = false;
    audio.preload = "none";
    audio.volume = 0;

    const eventosPrimeiroToque = ["pointerup", "click", "touchend", "keydown"];
    let iniciou = false;
    let tentando = false;
    let timerFade = null;

    function pararFade() {
        clearInterval(timerFade);
        timerFade = null;
    }

    function subirVolume() {
        pararFade();
        const inicio = Date.now();
        timerFade = setInterval(() => {
            const progresso = Math.min(1, (Date.now() - inicio) / DURACAO_FADE);
            audio.volume = VOLUME_FINAL * progresso;
            if (progresso >= 1) pararFade();
        }, 100);
    }

    function tocar() {
        audio.volume = 0;
        return audio.play().then(subirVolume);
    }

    function pausar() {
        pararFade();
        audio.pause();
    }

    function primeiroToque() {
        if (iniciou || tentando) return;
        tentando = true;
        tocar().then(() => {
            iniciou = true;
            eventosPrimeiroToque.forEach(nome =>
                document.removeEventListener(nome, primeiroToque, true));
        }).catch(() => {}).finally(() => {
            tentando = false;
        });
    }

    eventosPrimeiroToque.forEach(nome =>
        document.addEventListener(nome, primeiroToque, true));

    audio.addEventListener("ended", () => {
        audio.currentTime = 0;
        tocar().catch(() => {});
    });

    document.addEventListener("visibilitychange", () => {
        if (!iniciou) return;
        if (document.hidden) {
            pausar();
        } else {
            tocar().catch(() => {});
        }
    });

    window.addEventListener("pagehide", () => {
        if (iniciou) pausar();
    });

    window.addEventListener("pageshow", e => {
        if (e.persisted && iniciou && !document.hidden) tocar().catch(() => {});
    });
}

const links = document.querySelectorAll(".navbar a");
const navbar = document.querySelector(".navbar");
const secoes = ["informacoes", "pagamento", "galeria"]
    .map(id => document.getElementById(id));

const indicador = document.createElement("span");
indicador.className = "nav-indicator";
navbar.appendChild(indicador);

const listaLinks = Array.from(links);

function posicionarIndicador(linhaReferencia, naBase) {
    const n = secoes.length;
    const faixa = window.innerHeight * 0.25;

    let indice = 0;
    for (let i = 1; i < n; i++) {
        const topo = secoes[i].getBoundingClientRect().top;
        const parte = (linhaReferencia - topo + faixa / 2) / faixa;
        indice += Math.min(1, Math.max(0, parte));
    }
    if (naBase) indice = n - 1;

    const i = Math.min(Math.floor(indice), n - 2);
    const t = indice - i;
    const de = listaLinks[i];
    const para = listaLinks[i + 1];
    const esquerda = de.offsetLeft + (para.offsetLeft - de.offsetLeft) * t;
    const largura = de.offsetWidth + (para.offsetWidth - de.offsetWidth) * t;

    indicador.style.width = largura + "px";
    indicador.style.transform = "translateX(" + esquerda + "px)";
}

function atualizarNavegacao() {
    const alturaNavbar = navbar ? navbar.offsetHeight : 0;
    const linhaReferencia = alturaNavbar + window.innerHeight * 0.4;

    const naBase =
        window.innerHeight + (window.scrollY || document.documentElement.scrollTop) >=
        document.documentElement.scrollHeight - 2;

    let secaoAtual = secoes[0].id;
    secoes.forEach(secao => {
        if (secao.getBoundingClientRect().top <= linhaReferencia) {
            secaoAtual = secao.id;
        }
    });
    if (naBase) secaoAtual = secoes[secoes.length - 1].id;

    links.forEach(link => {
        link.classList.toggle("active", link.dataset.section === secaoAtual);
    });

    posicionarIndicador(linhaReferencia, naBase);
}

document.addEventListener("scroll", atualizarNavegacao, { passive: true, capture: true });
window.addEventListener("resize", atualizarNavegacao);
window.addEventListener("load", atualizarNavegacao);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(atualizarNavegacao);

links.forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const secao = document.getElementById(link.dataset.section);
        if (!secao) return;

        let destino = 0;
        if (secao !== secoes[0]) {
            destino = secao.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
        }
        window.scrollTo({ top: Math.max(0, destino), behavior: "smooth" });
    });
});

atualizarNavegacao();

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

let escala = 1, posX = 0, posY = 0;
const toques = new Map();
let base = null;
let moveu = false, houvePinca = false, tempoToque = 0, ultimoToque = 0;

function limitar() {
    const cw = lightbox.clientWidth, ch = lightbox.clientHeight;
    const w = lightboxImg.offsetWidth * escala;
    const h = lightboxImg.offsetHeight * escala;
    const maxX = Math.max(0, (w - cw) / 2);
    const maxY = Math.max(0, (h - ch) / 2);
    posX = Math.min(maxX, Math.max(-maxX, posX));
    posY = Math.min(maxY, Math.max(-maxY, posY));
}

function aplicar(animar) {
    limitar();
    lightboxImg.style.transition = animar ? "transform 0.2s ease" : "none";
    lightboxImg.style.transform =
        "translate(" + posX + "px, " + posY + "px) scale(" + escala + ")";
}

function centro() {
    return { x: lightbox.clientWidth / 2, y: lightbox.clientHeight / 2 };
}

function zoomEm(novaEscala, px, py, destinoX, destinoY) {
    const c = centro();
    novaEscala = Math.min(5, Math.max(1, novaEscala));
    const ptX = (px - c.x - posX) / escala;
    const ptY = (py - c.y - posY) / escala;
    escala = novaEscala;
    posX = destinoX - c.x - ptX * escala;
    posY = destinoY - c.y - ptY * escala;
    if (escala === 1) { posX = 0; posY = 0; }
}

const DURACAO_ANIM = 320;
const CURVA_ANIM = "cubic-bezier(0.22, 0.8, 0.24, 1)";
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

let origemImg = null;
let historicoAberto = false;
let fechando = false;
let timerAnim = null;

function estadoDaMiniatura(img) {
    const o = img.getBoundingClientRect();
    const w = lightboxImg.offsetWidth;
    const h = lightboxImg.offsetHeight;
    const esquerda = (lightbox.clientWidth - w) / 2;
    const topo = (lightbox.clientHeight - h) / 2;
    const nw = img.naturalWidth || o.width;
    const nh = img.naturalHeight || o.height;

    const k = Math.max(o.width, o.height * nw / nh) / w;
    const dx = (o.left + o.width / 2) - (esquerda + w / 2);
    const dy = (o.top + o.height / 2) - (topo + h / 2);
    const ix = Math.max(0, (w - o.width / k) / 2);
    const iy = Math.max(0, (h - o.height / k) / 2);

    return {
        transform: "translate(" + dx + "px, " + dy + "px) scale(" + k + ")",
        recorte: "inset(" + iy + "px " + ix + "px " + iy + "px " + ix + "px round " + (16 / k) + "px)"
    };
}

function transicaoAbrirFechar() {
    return "transform " + DURACAO_ANIM + "ms " + CURVA_ANIM +
        ", clip-path " + DURACAO_ANIM + "ms " + CURVA_ANIM;
}

function abrirFoto(img) {
    if (!lightbox.hidden) return;
    clearTimeout(timerAnim);
    origemImg = img;
    fechando = false;
    escala = 1; posX = 0; posY = 0;

    lightboxImg.style.transition = "none";
    lightboxImg.style.transform = "none";
    lightboxImg.style.clipPath = "none";
    lightboxImg.style.opacity = "0";
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";

    lightbox.classList.remove("visivel");
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");

    history.pushState({ lightbox: true }, "");
    historicoAberto = true;

    const iniciar = () => {
        if (lightbox.hidden || fechando) return;

        if (reduzMovimento.matches) {
            lightboxImg.style.opacity = "1";
            lightbox.classList.add("visivel");
            aplicar(false);
            return;
        }

        const inicio = estadoDaMiniatura(img);
        lightboxImg.style.transform = inicio.transform;
        lightboxImg.style.clipPath = inicio.recorte;
        lightboxImg.style.opacity = "1";
        img.style.visibility = "hidden";
        void lightboxImg.offsetWidth;

        lightboxImg.style.transition = transicaoAbrirFechar();
        lightbox.classList.add("visivel");
        lightboxImg.style.transform = "translate(0px, 0px) scale(1)";
        lightboxImg.style.clipPath = "inset(0px 0px 0px 0px round 0px)";

        timerAnim = setTimeout(() => {
            lightboxImg.style.clipPath = "none";
            aplicar(false);
        }, DURACAO_ANIM + 30);
    };

    lightboxImg.decode().then(iniciar, iniciar);
}

function fecharComAnimacao() {
    if (lightbox.hidden || fechando) return;
    fechando = true;
    historicoAberto = false;
    toques.clear();
    base = null;
    clearTimeout(timerAnim);

    const img = origemImg;

    const terminar = () => {
        lightbox.hidden = true;
        lightbox.classList.remove("visivel");
        document.body.classList.remove("lightbox-open");
        lightboxImg.removeAttribute("src");
        lightboxImg.style.opacity = "";
        lightboxImg.style.clipPath = "none";
        if (img) img.style.visibility = "";
        fechando = false;
    };

    if (reduzMovimento.matches || !img) {
        terminar();
        return;
    }

    const fim = estadoDaMiniatura(img);
    lightboxImg.style.transition = "none";
    lightboxImg.style.clipPath = "inset(0px 0px 0px 0px round 0px)";
    void lightboxImg.offsetWidth;

    lightboxImg.style.transition = transicaoAbrirFechar();
    lightbox.classList.remove("visivel");
    lightboxImg.style.transform = fim.transform;
    lightboxImg.style.clipPath = fim.recorte;

    timerAnim = setTimeout(terminar, DURACAO_ANIM + 30);
}

function fecharFoto() {
    if (lightbox.hidden || fechando) return;
    if (historicoAberto) {
        history.back();
        setTimeout(() => {
            if (!lightbox.hidden && !fechando) fecharComAnimacao();
        }, 600);
        return;
    }
    fecharComAnimacao();
}

window.addEventListener("popstate", () => {
    if (!lightbox.hidden) fecharComAnimacao();
    else historicoAberto = false;
});

function distancia(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function meio(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

function novaBase() {
    const pts = Array.from(toques.values());
    if (pts.length >= 2) {
        const m = meio(pts[0], pts[1]);
        base = { tipo: "pinca", dist: distancia(pts[0], pts[1]), escala, mx: m.x, my: m.y, px: posX, py: posY };
    } else if (pts.length === 1) {
        base = { tipo: "arrasta", x: pts[0].x, y: pts[0].y, px: posX, py: posY };
    } else {
        base = null;
    }
}

document.querySelectorAll(".gallery img").forEach(img => {
    img.addEventListener("click", () => abrirFoto(img));
});

lightboxClose.addEventListener("click", fecharFoto);
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !lightbox.hidden) fecharFoto();
});

lightbox.addEventListener("pointerdown", e => {
    if (e.target.closest(".lightbox-close")) return;
    lightbox.setPointerCapture(e.pointerId);
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size === 1) { moveu = false; houvePinca = false; tempoToque = Date.now(); }
    if (toques.size >= 2) houvePinca = true;
    novaBase();
});

lightbox.addEventListener("pointermove", e => {
    if (!toques.has(e.pointerId) || !base) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(toques.values());

    if (base.tipo === "pinca" && pts.length >= 2) {
        const m = meio(pts[0], pts[1]);
        const nova = base.escala * (distancia(pts[0], pts[1]) / base.dist);

        escala = base.escala; posX = base.px; posY = base.py;
        zoomEm(nova, base.mx, base.my, m.x, m.y);
        moveu = true;
        aplicar(false);
    } else if (base.tipo === "arrasta" && pts.length === 1) {
        const dx = pts[0].x - base.x, dy = pts[0].y - base.y;
        if (Math.hypot(dx, dy) > 8) moveu = true;
        if (escala > 1) {
            posX = base.px + dx;
            posY = base.py + dy;
            aplicar(false);
        }
    }
});

function soltou(e) {
    if (!toques.has(e.pointerId)) return;
    const eraUnico = toques.size === 1;
    toques.delete(e.pointerId);

    if (eraUnico && !moveu && !houvePinca && Date.now() - tempoToque < 300) {
        if (e.target === lightbox) {
            fecharFoto();
            return;
        }
        if (e.target === lightboxImg) {
            const agora = Date.now();
            if (agora - ultimoToque < 300) {

                if (escala > 1) { escala = 1; posX = 0; posY = 0; }
                else zoomEm(2.5, e.clientX, e.clientY, e.clientX, e.clientY);
                aplicar(true);
                ultimoToque = 0;
            } else {
                ultimoToque = agora;
            }
        }
    }

    if (escala <= 1.02) { escala = 1; posX = 0; posY = 0; aplicar(true); }
    novaBase();
}
lightbox.addEventListener("pointerup", soltou);
lightbox.addEventListener("pointercancel", soltou);

lightbox.addEventListener("wheel", e => {
    e.preventDefault();
    zoomEm(escala * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY, e.clientX, e.clientY);
    aplicar(false);
}, { passive: false });

["gesturestart", "gesturechange"].forEach(nome => {
    document.addEventListener(nome, e => {
        if (!lightbox.hidden) e.preventDefault();
    });
});

const botaoPix = document.getElementById("pix-key");
const chavePix = botaoPix.dataset.key;
const falhaPix = document.getElementById("pix-fail");

const avisoPix = document.createElement("div");
avisoPix.className = "pix-toast";
avisoPix.setAttribute("role", "status");
avisoPix.setAttribute("aria-live", "polite");
avisoPix.textContent = "Pix copiado!";
document.body.appendChild(avisoPix);

let timerPix;

function mostrarAvisoPix(mensagem, sucesso = true) {
    clearTimeout(timerPix);
    avisoPix.textContent = mensagem;
    avisoPix.classList.toggle("erro", !sucesso);
    avisoPix.classList.add("visivel");

    timerPix = setTimeout(() => {
        avisoPix.classList.remove("visivel");
    }, 2400);
}

function copiarComTextarea(texto) {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "0";
    campo.style.left = "-9999px";
    campo.style.fontSize = "16px";
    document.body.appendChild(campo);

    campo.focus();
    campo.select();
    campo.setSelectionRange(0, campo.value.length);

    let copiou = false;
    try {
        copiou = document.execCommand("copy");
    } catch (erro) {
        copiou = false;
    }

    campo.remove();
    return copiou;
}

async function copiarPix() {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(chavePix);
        } else if (!copiarComTextarea(chavePix)) {
            throw new Error("Não foi possível copiar");
        }

        falhaPix.hidden = true;
        botaoPix.classList.add("copied");
        mostrarAvisoPix("Pix copiado!");
        setTimeout(() => botaoPix.classList.remove("copied"), 900);
    } catch (erro) {
        const copiou = copiarComTextarea(chavePix);

        if (copiou) {
            falhaPix.hidden = true;
            botaoPix.classList.add("copied");
            mostrarAvisoPix("Pix copiado!");
            setTimeout(() => botaoPix.classList.remove("copied"), 900);
        } else {
            falhaPix.hidden = false;
            mostrarAvisoPix("Não foi possível copiar o Pix", false);
        }
    }
}

botaoPix.addEventListener("click", copiarPix);

const videosGaleria = Array.from(document.querySelectorAll(".gallery-video"));

function tocarVideo(video) {
    if (document.hidden || !video.paused) return;
    const tentativa = video.play();
    if (tentativa && tentativa.catch) tentativa.catch(() => {});
}

function tocarTodosVideos() {
    videosGaleria.forEach(tocarVideo);
}

const observadorVideos = "IntersectionObserver" in window
    ? new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) tocarVideo(entrada.target);
        });
    }, { threshold: 0.1 })
    : null;

videosGaleria.forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.controls = false;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.addEventListener("pause", () => {
        if (!video.ended) tocarVideo(video);
    });
    ["loadeddata", "canplay", "stalled", "suspend", "waiting"].forEach(nome =>
        video.addEventListener(nome, () => tocarVideo(video)));
    video.addEventListener("ended", () => {
        video.currentTime = 0;
        tocarVideo(video);
    });
    video.addEventListener("contextmenu", e => e.preventDefault());

    if (observadorVideos) observadorVideos.observe(video);
    tocarVideo(video);
});

document.addEventListener("visibilitychange", tocarTodosVideos);
window.addEventListener("pageshow", tocarTodosVideos);
window.addEventListener("load", tocarTodosVideos);
["pointerup", "touchend", "click", "scroll"].forEach(nome =>
    document.addEventListener(nome, tocarTodosVideos, { passive: true, capture: true }));
