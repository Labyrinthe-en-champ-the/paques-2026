// --- CONFIGURATION DU JEU DU LABYRINTHE EN-CHAMP-THÉ ---
const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu... Que suis-je ?", a: ['oeuf', 'un oeuf', 'oeufs', 'œuf'], lives: Infinity },
    2: { type: 'free', diff: 'Facile', q: "Déchiffrez le code (A=1, B=2...) : 3-8-15-3-15-12-1-20", a: ['chocolat', 'le chocolat'], lives: Infinity },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['illimite', 'illimité', 'ilimite', 'ilimité'], lives: Infinity },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chasse au tresor', 'chasse au trésor', 'chasse'], lives: Infinity },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Qui suis-je ?", a: ['ton tonton', 'tonton'], lives: 3 },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'envelope'], lives: 3 },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents mais ne mange pas ?", a: ['un peigne', 'peigne'], lives: 3 },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou'], lives: 3 },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['la lumiere', 'lumiere'], lives: 3 },
    10: { type: 'free', diff: 'Normal', q: "Si vous doublez le deuxième d'une course, vous devenez...", a: ['2eme', 'deuxieme', '2ème', 'second'], lives: 3 },
    11: { type: 'qcm', diff: 'Difficile', q: "Combien de temps mettront deux nénuphars pour occuper le lac ?", options: ['29 jours', '15 jours', '22 jours'], a: '29 jours', lives: 2 },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot monte de 3m le jour et glisse de 2m la nuit dans un puits de 12m. Combien de jours ?", options: ['8 jours', '10 jours', '11 jours'], a: '10 jours', lives: 2 }
};

// --- CHARGEMENT DE LA PROGRESSION ---
let gameState = JSON.parse(localStorage.getItem('easterGameProgress')) || {
    unlocked: [],   // Cases réussies (visibles)
    activated: [],  // Bornes scannées (accessibles)
    failed: [],     // Cases ratées (bloquées en gris)
    currentLives: {},
    finalCode: [0, 0, 0, 0]
};

let currentStation = null;

window.onload = () => {
    checkUrlParam(); // Vérifie si on arrive d'un scan QR
    renderBoard();   // Dessine la grille
};

// --- LOGIQUE DE LA GRILLE ---
function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        const isUnlocked = gameState.unlocked.includes(i);
        const isActivated = gameState.activated.includes(i);
        const isFailed = gameState.failed.includes(i);
        
        // Classe CSS selon l'état
        let statusClass = 'locked';
        if (isUnlocked) statusClass = 'unlocked';
        else if (isFailed) statusClass = 'failed';
        else if (isActivated) statusClass = 'active';

        div.className = `station station-${i} ${statusClass}`;
        div.innerText = isUnlocked ? '' : i;
        div.onclick = () => openStation(i);
        board.appendChild(div);
    }

    // Si toutes les cases sont terminées (réussies ou ratées), on lance le jeu final
    if (gameState.unlocked.length + gameState.failed.length >= 12) {
        enableFinalHunt();
    }
}

// --- VÉRIFICATION DU SCAN QR ---
function checkUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    if (id && id <= 12) {
        if (!gameState.activated.includes(id)) {
            gameState.activated.push(id);
            saveToStorage();
        }
        openStation(id);
    }
}

// --- OUVERTURE D'UNE QUESTION ---
function openStation(id) {
    // Sécurité : Ne pas ouvrir si pas encore scanné
    if (!gameState.activated.includes(id) && !gameState.unlocked.includes(id)) {
        alert("🔍 Borne verrouillée ! Cherchez la pancarte n°" + id + " dans le labyrinthe et scannez son QR code.");
        return;
    }

    // Ne pas ouvrir si déjà fini
    if (gameState.unlocked.includes(id) || gameState.failed.includes(id)) return;

    currentStation = id;
    const qData = questions[id];
    
    // Remplissage de la modale
    document.getElementById('question-difficulty').innerText = qData.diff;
    document.getElementById('question-text').innerText = qData.q;
    
    // Gestion des vies
    if (!(id in gameState.currentLives)) gameState.currentLives[id] = qData.lives;
    const v = gameState.currentLives[id];
    document.getElementById('life-counter').innerText = v === Infinity ? "Essais illimités" : `Vies restantes : ${v}`;

    // Image (Rébus)
    const imgEl = document.getElementById('rebus-image');
    if (qData.img) { imgEl.src = qData.img; imgEl.style.display = 'block'; }
    else { imgEl.style.display = 'none'; }

    // Affichage Réponse Libre ou QCM
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

// --- VALIDATION DE LA RÉPONSE ---
function validate(userAns) {
    const qData = questions[currentStation];
    // Normalisation (minuscule, sans accent, sans espaces inutiles)
    const normalize = (str) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const userNorm = normalize(userAns);
    
    let isCorrect = false;
    if (Array.isArray(qData.a)) {
        isCorrect = qData.a.some(ans => userNorm.includes(normalize(ans)));
    } else {
        isCorrect = userNorm === normalize(qData.a);
    }

    if (isCorrect) {
        gameState.unlocked.push(currentStation);
        saveAndRefresh("Bravo ! Une partie de l'image est révélée.");
    } else {
        gameState.currentLives[currentStation]--;
        if (gameState.currentLives[currentStation] <= 0) {
            gameState.failed.push(currentStation);
            saveAndRefresh("Mince ! Vous avez épuisé vos vies sur cette borne.");
        } else {
            document.getElementById('feedback').innerText = "Ce n'est pas la bonne réponse... Réessayez !";
        }
    }
}

// --- SAUVEGARDE ET RECHARGEMENT ---
function saveAndRefresh(msg) {
    saveToStorage();
    alert(msg);
    closeModal();
    renderBoard();
}

function saveToStorage() {
    localStorage.setItem('easterGameProgress', JSON.stringify(gameState));
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
}

// --- PHASE FINALE : CHASSE AUX ŒUFS (2019) ---
function enableFinalHunt() {
    document.getElementById('final-quest').style.display = 'block';
    const board = document.getElementById('game-board');
    
    // On affiche l'image complète (image_2.png)
    board.innerHTML = '';
    board.style.backgroundImage = "url('image_2.png')";
    board.style.backgroundSize = "cover";
    board.style.position = "relative";

    // Création des 4 colonnes cliquables
    for (let i = 0; i < 4; i++) {
        const col = document.createElement('div');
        col.className = "final-col";
        col.style.width = "25%";
        col.style.height = "100%";
        col.style.float = "left";
        col.onclick = () => {
            gameState.finalCode[i] = (gameState.finalCode[i] + 1) % 10;
            document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
            saveToStorage();
        };
        board.appendChild(col);
    }
    document.getElementById('code-display').innerText = gameState.finalCode.join(' ');
}

function checkFinalCode() {
    if (gameState.finalCode.join('') === "2019") {
        alert("🐣 INCROYABLE ! Vous avez trouvé le code 2019. Allez vite chercher votre cadeau à l'accueil !");
    } else {
        alert("Le code est erroné... Observez bien le nombre d'œufs cachés dans chaque colonne de l'image.");
    }
}

// --- RÉINITIALISER POUR TESTS ---
function resetGame() {
    if(confirm("Voulez-vous vraiment recommencer le jeu à zéro ?")) {
        localStorage.removeItem('easterGameProgress');
        window.location.href = window.location.pathname; // Recharge sans les paramètres d'URL
    }
}
