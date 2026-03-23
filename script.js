// --- CONFIGURATION DU JEU ---
const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu, mais aujourd'hui, je suis enveloppé d'or ou d'aluminium. Que suis-je ?", a: ['oeuf', 'un oeuf', 'oeufs', 'œuf'], lives: Infinity },
    2: { type: 'free', diff: 'Facile', q: "Pour trouver le gros butin, déchiffrer ce code secret : 3 - 8 - 15 - 3 - 15 - 12 - 1 - 20 (Chaque chiffre correspond à la place d'une lettre dans l'alphabet)", a: ['chocolat', 'le chocolat'], lives: Infinity },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['illimite', 'illimité', 'ilimite', 'ilimité'], lives: Infinity },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chasse au tresor', 'chasse au trésor'], lives: Infinity },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Mon tout est une personne de ta famille. Qui suis-je ?", a: ['ton tonton', 'tonton'], lives: 3 },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'envelope'], lives: 3 },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents, mais ne mange pas ?", a: ['un peigne', 'peigne'], lives: 3 },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou'], lives: 3 },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['la lumiere', 'lumiere'], lives: 3 },
    10: { type: 'free', diff: 'Normal', q: "Vous participez à une course cycliste. Si vous doublez le deuxième, vous devenez...", a: ['2eme', 'deuxieme', '2ème', 'second'], lives: 3 },
    11: { type: 'qcm', diff: 'Difficile', q: "Un nénuphar double de surface chaque jour. Il met 30 jours pour occuper l'ensemble de la surface d'un lac. Combien de temps mettront deux nénuphars pour occuper ensemble toute la surface de ce lac?", options: ['29 jours', '15 jours', '22 jours', '30 jours'], a: '29 jours', lives: 2 },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot est tombé dans un puits de 12 mètres. Dans la journée, il grimpe de 3m, mais la nuit, il glisse de 2m. Combien de jours faudra-t-il à l'escargot pour s'en sortir?", options: ['10 jours', '11 jours', '12 jours', '8 jours'], a: '10 jours', lives: 2 }
};

let gameState = JSON.parse(localStorage.getItem('easterGameProgress')) || {
    unlocked: [], activated: [], failed: [], currentLives: {}, finalCode: [0, 0, 0, 0]
};

let html5QrScanner = null;

window.onload = () => {
    checkUrlParam();
    renderBoard();
};

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    board.className = "game-board";

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        const isUnlocked = gameState.unlocked.includes(i);
        const isActivated = gameState.activated.includes(i);
        const isFailed = gameState.failed.includes(i);
        
        div.className = `station station-${i} ${isUnlocked ? 'unlocked' : (isFailed ? 'failed' : (isActivated ? 'active' : 'locked'))}`;
        div.innerText = isUnlocked ? '' : i;
        div.onclick = () => openStation(i);
        board.appendChild(div);
    }

    if (gameState.unlocked.length + gameState.failed.length >= 12) {
        enableFinalHunt();
    }
}

// --- SCANNER INTÉGRÉ ---
function startScanner() {
    document.getElementById('reader').style.display = 'block';
    html5QrScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrScanner.render((text) => {
        const url = new URL(text);
        const id = url.searchParams.get("id") || text;
        html5QrScanner.clear();
        document.getElementById('reader').style.display = 'none';
        checkScannedId(parseInt(id));
    });
}

function checkScannedId(id) {
    if (id && id <= 12) {
        if (!gameState.activated.includes(id)) gameState.activated.push(id);
        localStorage.setItem('easterGameProgress', JSON.stringify(gameState));
        renderBoard();
        openStation(id);
    }
}

function checkUrlParam() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) checkScannedId(parseInt(id));
}

function openStation(id) {
    if (!gameState.activated.includes(id) && !gameState.unlocked.includes(id)) {
        alert("Scannez la borne " + id + " d'abord !");
        return;
    }
    if (gameState.unlocked.includes(id) || gameState.failed.includes(id)) return;

    const qData = questions[id];
    currentStation = id;
    document.getElementById('question-difficulty').innerText = qData.diff;
    document.getElementById('question-text').innerText = qData.q;
    
    const imgEl = document.getElementById('rebus-image');
    imgEl.style.display = qData.img ? 'block' : 'none';
    if (qData.img) imgEl.src = qData.img;

    if (qData.type === 'qcm') {
        document.getElementById('input-zone').style.display = 'none';
        const container = document.getElementById('options-container');
        container.style.display = 'block';
        container.innerHTML = '';
        qData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => validate(opt);
            container.appendChild(btn);
        });
    } else {
        document.getElementById('input-zone').style.display = 'block';
        document.getElementById('options-container').style.display = 'none';
    }
    document.getElementById('modal').classList.add('open');
}

function validate(userAns) {
    const qData = questions[currentStation];
    const norm = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isCorrect = Array.isArray(qData.a) ? qData.a.some(a => norm(userAns).includes(norm(a))) : norm(userAns) === norm(qData.a);

    if (isCorrect) {
        gameState.unlocked.push(currentStation);
        saveAndRefresh("Bravo !");
    } else {
        if (!gameState.currentLives[currentStation]) gameState.currentLives[currentStation] = qData.lives;
        gameState.currentLives[currentStation]--;
        if (gameState.currentLives[currentStation] <= 0) {
            gameState.failed.push(currentStation);
            saveAndRefresh("Dommage, essais épuisés !");
        } else {
            alert("Mauvaise réponse !");
        }
    }
}

function saveAndRefresh(m) {
    localStorage.setItem('easterGameProgress', JSON.stringify(gameState));
    alert(m);
    document.getElementById('modal').classList.remove('open');
    renderBoard();
}

// --- PHASE FINALE HORIZONTALE ---
function enableFinalHunt() {
    const board = document.getElementById('game-board');
    board.className = "game-board horizontal-final";
    board.style.backgroundImage = "url('image_2.png')";
    board.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const col = document.createElement('div');
        col.className = "final-col";
        col.onclick = () => {
            gameState.finalCode[i] = (gameState.finalCode[i] + 1) % 10;
            document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
            localStorage.setItem('easterGameProgress', JSON.stringify(gameState));
        };
        board.appendChild(col);
    }
    document.getElementById('final-quest').style.display = 'block';
    document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
}

function checkFinalCode() {
    if (gameState.finalCode.join('') === "2119") {
        alert("🎉 CODE VALIDE ! Bravo !");
    } else {
        alert("Code incorrect...");
    }
}

function resetGame() { if(confirm("Recommencer ?")) { localStorage.clear(); location.reload(); } }
