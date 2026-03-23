const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu, mais aujourd'hui, je suis enveloppé d'or ou d'aluminium. Que suis-je ?", a: ['oeuf', 'un oeuf', 'oeufs', 'œuf'], lives: Infinity },
    2: { type: 'free', diff: 'Facile', q: "Pour trouver le gros butin, déchiffrez ce code secret : 3 - 8 - 15 - 3 - 15 - 12 - 1 - 20 (Chaque chiffre correspond à sa place dans l'alphabet)", a: ['chocolat', 'le chocolat'], lives: Infinity },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['illimite', 'illimité', 'ilimite', 'ilimité'], lives: Infinity },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chasse au tresor', 'chasse au trésor'], lives: Infinity },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Mon tout est une personne de ta famille. Qui suis-je ?", a: ['ton tonton', 'tonton'], lives: 3 },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'envelope'], lives: 3 },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents, mais ne mange pas ?", a: ['un peigne', 'peigne'], lives: 3 },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou'], lives: 3 },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['la lumiere', 'lumiere'], lives: 3 },
    10: { type: 'free', diff: 'Normal', q: "Vous participez à une course cycliste. Si vous doublez le deuxième, vous devenez...", a: ['2eme', 'deuxieme', 'second'], lives: 3 },
    11: { type: 'qcm', diff: 'Difficile', q: "Un nénuphar double de surface chaque jour. Il met 30 jours pour occuper l'ensemble du lac. Combien de temps mettront deux nénuphars pour occuper ensemble toute la surface ?", options: ['29 jours', '15 jours', '22 jours'], a: '29 jours', lives: 2 },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot dans un puits de 12m grimpe de 3m le jour et glisse de 2m la nuit. Combien de jours pour sortir ?", options: ['10 jours', '11 jours', '12 jours'], a: '10 jours', lives: 2 }
};

let gameState = JSON.parse(localStorage.getItem('easterGameProgress')) || {
    unlocked: [], activated: [], failed: [], currentLives: {}, finalCode: [0, 0, 0, 0]
};

let currentStation = null;
let html5QrScanner = null;

window.onload = () => {
    renderBoard();
    const urlId = new URLSearchParams(window.location.search).get('id');
    if (urlId) activateBorne(parseInt(urlId));
};

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    const isOver = (gameState.unlocked.length + gameState.failed.length >= 12);

    if (isOver) {
        enableFinalHunt();
        return;
    }

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        const status = gameState.unlocked.includes(i) ? 'unlocked' : (gameState.failed.includes(i) ? 'failed' : (gameState.activated.includes(i) ? 'active' : 'locked'));
        div.className = `station station-${i} ${status}`;
        div.innerText = gameState.unlocked.includes(i) ? '' : i;
        div.onclick = () => openStation(i);
        board.appendChild(div);
    }
}

// SCANNER
function startScanner() {
    document.getElementById('stop-scan').style.display = 'block';
    html5QrScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrScanner.render((text) => {
        const id = text.includes('id=') ? text.split('id=')[1] : text;
        stopScanner();
        activateBorne(parseInt(id));
    });
}

function stopScanner() {
    if (html5QrScanner) html5QrScanner.clear();
    document.getElementById('stop-scan').style.display = 'none';
}

function activateBorne(id) {
    if (id > 0 && id <= 12) {
        if (!gameState.activated.includes(id)) gameState.activated.push(id);
        save(); renderBoard(); openStation(id);
    }
}

// QUESTIONS
function openStation(id) {
    if (!gameState.activated.includes(id) && !gameState.unlocked.includes(id)) {
        alert("Scannez d'abord le QR code de la borne " + id); return;
    }
    if (gameState.unlocked.includes(id) || gameState.failed.includes(id)) return;

    currentStation = id;
    const q = questions[id];
    document.getElementById('question-difficulty').innerText = q.diff;
    document.getElementById('question-text').innerText = q.q;
    
    // Vies
    if (!gameState.currentLives[id]) gameState.currentLives[id] = q.lives;
    const v = gameState.currentLives[id];
    document.getElementById('life-counter').innerText = v === Infinity ? "Essais ∞" : "Vies : " + v;

    // Image
    const img = document.getElementById('rebus-image');
    img.style.display = q.img ? 'block' : 'none';
    if(q.img) img.src = q.img;

    // Type
    if (q.type === 'qcm') {
        document.getElementById('input-zone').style.display = 'none';
        const container = document.getElementById('options-container');
        container.innerHTML = '';
        q.options.forEach(opt => {
            const b = document.createElement('button');
            b.className = 'option-btn'; b.innerText = opt;
            b.onclick = () => validate(opt);
            container.appendChild(b);
        });
    } else {
        document.getElementById('input-zone').style.display = 'block';
        document.getElementById('options-container').innerHTML = '';
    }
    document.getElementById('modal').classList.add('open');
}

function submitAnswer() { validate(document.getElementById('answer-input').value); }

function validate(val) {
    const q = questions[currentStation];
    const norm = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ok = Array.isArray(q.a) ? q.a.some(a => norm(val).includes(norm(a))) : norm(val) === norm(q.a);

    if (ok) {
        gameState.unlocked.push(currentStation);
        alert("Bravo !"); closeModal(); save(); renderBoard();
    } else {
        gameState.currentLives[currentStation]--;
        if (gameState.currentLives[currentStation] <= 0) {
            gameState.failed.push(currentStation);
            alert("Borne perdue !"); closeModal(); save(); renderBoard();
        } else {
            document.getElementById('feedback').innerText = "Réessayez !";
        }
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
}

// FINAL
function enableFinalHunt() {
    const board = document.getElementById('game-board');
    board.className = "game-board final-mode";
    board.style.backgroundImage = "url('image_2.png')";
    board.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const c = document.createElement('div');
        c.className = "final-col";
        c.onclick = () => {
            gameState.finalCode[i] = (gameState.finalCode[i] + 1) % 10;
            document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
            save();
        };
        board.appendChild(c);
    }
    document.getElementById('final-quest').style.display = 'block';
    document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
}

function checkFinalCode() {
    if (gameState.finalCode.join('') === "2119") alert("FÉLICITATIONS ! Code 2119 validé !");
    else alert("Code erroné...");
}

function save() { localStorage.setItem('easterGameProgress', JSON.stringify(gameState)); }
function resetGame() { if(confirm("Recommencer ?")) { localStorage.clear(); location.reload(); } }
