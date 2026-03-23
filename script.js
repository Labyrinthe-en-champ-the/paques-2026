// --- CONFIGURATION DU JEU ---
const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu... Que suis-je ?", a: ['oeuf', 'un oeuf', 'oeufs', 'œuf'], lives: Infinity },
    2: { type: 'free', diff: 'Facile', q: "Déchiffrez le code (A=1, B=2...) : 3-8-15-3-15-12-1-20", a: ['chocolat', 'le chocolat'], lives: Infinity },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['il est peint', 'peint', 'paint'], lives: Infinity },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chateau tresor', 'château trésor'], lives: Infinity },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Qui suis-je ?", a: ['ton tonton', 'tonton'], lives: 3 },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'l\'enveloppe', 'envelope'], lives: 3 },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents mais ne mange pas ?", a: ['un peigne', 'peigne'], lives: 3 },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou'], lives: 3 },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['la lumiere', 'lumiere'], lives: 3 },
    10: { type: 'free', diff: 'Normal', q: "Si vous doublez le deuxième d'une course, vous devenez...", a: ['2eme', 'deuxieme', '2ème', 'second'], lives: 3 },
    11: { type: 'qcm', diff: 'Difficile', q: "Combien de temps mettront deux nénuphars pour occuper le lac ?", options: ['29 jours', '15 jours', '22 jours'], a: '29 jours', lives: 2 },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot monte de 3m le jour et glisse de 2m la nuit dans un puits de 12m. Combien de jours ?", options: ['8 jours', '10 jours', '11 jours'], a: '10 jours', lives: 2 }
};

let gameState = JSON.parse(localStorage.getItem('easterGameProgress')) || {
    unlocked: [],
    failed: [],
    currentLives: {},
    finalCode: [0, 0, 0, 0] // État des 4 colonnes
};

let currentStation = null;

// --- INITIALISATION ---
window.onload = () => {
    renderBoard();
    checkUrlParam();
};

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // On crée les 12 cases
    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = `station station-${i} ${gameState.unlocked.includes(i) ? 'unlocked' : 'locked'}`;
        div.innerText = gameState.unlocked.includes(i) ? '' : i;
        div.onclick = () => openStation(i);
        board.appendChild(div);
    }

    // Si tout est fini, on active la phase finale interactive sur l'image
    if (gameState.unlocked.length + gameState.failed.length >= 12) {
        enableFinalHunt();
    }
}

function enableFinalHunt() {
    document.getElementById('final-quest').style.display = 'block';
    const board = document.getElementById('game-board');
    board.style.position = 'relative';
    board.innerHTML = ''; // On vide pour mettre les 4 zones cliquables
    
    // On recrée l'image complète en fond
    board.style.backgroundImage = "url('image_2.png')";
    board.style.backgroundSize = "cover";

    // On crée 4 colonnes invisibles
    for (let i = 0; i < 4; i++) {
        const col = document.createElement('div');
        col.style.height = "100%";
        col.style.width = "25%";
        col.style.float = "left";
        col.style.borderRight = "1px dashed rgba(255,255,255,0.3)";
        col.onclick = () => {
            gameState.finalCode[i] = (gameState.finalCode[i] + 1) % 10;
            updateCodeDisplay();
        };
        board.appendChild(col);
    }
    updateCodeDisplay();
}

function updateCodeDisplay() {
    document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
}

function checkFinalCode() {
    if (gameState.finalCode.join('') === "2019") {
        alert("🎉 BRAVO ! Vous avez trouvé le trésor (2019). Montrez cet écran à l'accueil !");
    } else {
        alert("Le code n'est pas bon. Comptez bien les œufs cachés dans chaque colonne de l'image...");
    }
}

// --- LOGIQUE COMMUNE (Scan / Questions) ---
function checkUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    if (id && id <= 12) openStation(id);
}

function openStation(id) {
    if (gameState.unlocked.includes(id) || gameState.failed.includes(id)) return;
    currentStation = id;
    const qData = questions[id];
    
    document.getElementById('question-difficulty').innerText = `Difficulté : ${qData.diff}`;
    document.getElementById('question-text').innerText = qData.q;
    
    if (!(id in gameState.currentLives)) gameState.currentLives[id] = qData.lives;
    const v = gameState.currentLives[id];
    document.getElementById('life-counter').innerText = v === Infinity ? "" : `Vies restantes : ${v}`;

    const imgEl = document.getElementById('rebus-image');
    if (qData.img) { imgEl.src = qData.img; imgEl.style.display = 'block'; }
    else { imgEl.style.display = 'none'; }

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

function submitAnswer() {
    validate(document.getElementById('answer-input').value);
}

function validate(userAns) {
    const qData = questions[currentStation];
    const normalizedUser = userAns.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let isCorrect = false;
    if (Array.isArray(qData.a)) {
        isCorrect = qData.a.some(ans => normalizedUser.includes(ans.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
    } else {
        isCorrect = userAns === qData.a;
    }

    if (isCorrect) {
        gameState.unlocked.push(currentStation);
        saveAndRefresh("Bravo ! La case se révèle.");
    } else {
        gameState.currentLives[currentStation]--;
        if (gameState.currentLives[currentStation] <= 0) {
            gameState.failed.push(currentStation);
            saveAndRefresh("Zut ! Cette case restera mystérieuse...");
        } else {
            document.getElementById('feedback').innerText = "Ce n'est pas ça... Réessaie !";
        }
    }
}

function saveAndRefresh(msg) {
    localStorage.setItem('easterGameProgress', JSON.stringify(gameState));
    alert(msg);
    closeModal();
    renderBoard();
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
}
