const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu, mais aujourd'hui, je suis enveloppé d'or ou d'aluminium. Que suis-je ?", a: ['oeuf', 'un oeuf', 'œuf'] },
    2: { type: 'free', diff: 'Facile', q: "Déchiffrez ce code secret : 3 - 8 - 15 - 3 - 15 - 12 - 1 - 20. Chaque chiffre correspond à sa place dans l'alphabet (A=1, B=2...).", a: ['chocolat','chocolats']  },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['illimite', 'illimité', 'i lit mie thé', 'ilimité'] },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chasse au tresor', 'chasse au trésor'] },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Mon tout est une personne de ta famille. Qui suis-je ?", a: ['ton tonton', 'thon tonton' ] },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'envellope', 'envelope', 'envelloppe'] },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents, mais ne mange pas ?", a: ['un peigne', 'peigne'] },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou', 'Milou'] },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['la lumiere', 'lumiere'] },
    10: { type: 'qcm', diff: 'Normal', q: "Vous participez à une course cycliste. Si vous doublez le deuxième, vous devenez...", options: ['1er', '2ème', '3ème'], a: '2ème' },
    11: { type: 'qcm', diff: 'Difficile', q: "Un nénuphar double de surface chaque jour. Il met 30 jours pour occuper tout un lac. Combien de temps mettront deux nénuphars pour occuper ensemble toute la surface ?", options: ['29 jours', '15 jours', '22 jours'], a: '29 jours' },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot dans un puits de 12m grimpe de 3m le jour et glisse de 2m la nuit. Combien de jours pour s'en sortir ?", options: ['10 jours', '11 jours', '12 jours'], a: '10 jours' }
};

// Positions pour le code 2119
const eggPositions = [
    { col: 0, t: '22%', l: '12%' }, { col: 0, t: '65%', l: '15%' }, // Col I (2)
    { col: 1, t: '45%', l: '35%' },                                // Col II (1)
    { col: 2, t: '75%', l: '62%' },                                // Col III (1)
    { col: 3, t: '15%', l: '85%' }, { col: 3, t: '35%', l: '92%' }, 
    { col: 3, t: '55%', l: '78%' }, { col: 3, t: '80%', l: '88%' },
    { col: 3, t: '12%', l: '78%' }, { col: 3, t: '42%', l: '85%' },
    { col: 3, t: '68%', l: '90%' }, { col: 3, t: '90%', l: '80%' },
    { col: 3, t: '50%', l: '88%' }                                 // Col IV (9)
];

let gameState = JSON.parse(localStorage.getItem('game_2026')) || {
    unlocked: [], activated: [], failed: [], lives: {}, eggs: []
};

let qr = null;
let currentStation = null;

window.onload = () => {
    renderBoard(); updateProgress();
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) activateBorne(parseInt(id));
};

function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

function renderBoard() {
    const board = document.getElementById('game-board'); board.innerHTML = '';
    if (gameState.unlocked.length + gameState.failed.length >= 12) { enableFinalHunt(); return; }

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        const st = gameState.unlocked.includes(i) ? 'unlocked' : (gameState.failed.includes(i) ? 'failed' : (gameState.activated.includes(i) ? 'active' : 'locked'));
        div.className = `station station-${i} ${st}`;
        div.innerText = gameState.unlocked.includes(i) ? '' : i;
        div.onclick = () => openStation(i);
        board.appendChild(div);
    }
}

function startScanner() {
    document.getElementById('start-scan-btn').style.display = 'none';
    document.getElementById('camera-box').style.display = 'block';
    qr = new Html5Qrcode("reader");
    qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        const id = text.includes('id=') ? text.split('id=')[1] : text;
        stopScanner(); activateBorne(parseInt(id));
    }).catch(() => stopScanner());
}

function stopScanner() {
    if (qr) qr.stop().then(() => {
        document.getElementById('camera-box').style.display = 'none';
        document.getElementById('start-scan-btn').style.display = 'block';
    });
}

function activateBorne(id) {
    if (id > 0 && id <= 12) {
        if (!gameState.activated.includes(id)) gameState.activated.push(id);
        save(); renderBoard(); openStation(id);
    }
}

function openStation(id) {
    if (!gameState.activated.includes(id) && !gameState.unlocked.includes(id)) return;
    if (gameState.unlocked.includes(id) || gameState.failed.includes(id)) return;
    currentStation = id;
    const q = questions[id];
    document.getElementById('q-diff').innerText = q.diff;
    document.getElementById('q-text').innerText = q.q;
    const img = document.getElementById('q-rebus');
    img.style.display = q.img ? 'block' : 'none'; if(q.img) img.src = q.img;

    if (q.type === 'qcm') {
        document.getElementById('input-area').style.display = 'none';
        const area = document.getElementById('qcm-area'); area.innerHTML = '';
        q.options.forEach(opt => {
            const b = document.createElement('button'); b.className = 'option-btn'; b.innerText = opt;
            b.onclick = () => validate(opt); area.appendChild(b);
        });
    } else {
        document.getElementById('input-area').style.display = 'block';
        document.getElementById('qcm-area').innerHTML = '';
    }
    document.getElementById('modal').classList.add('open');
}

function submitAnswer() { validate(document.getElementById('q-input').value); }

function validate(val) {
    const q = questions[currentStation];
    const norm = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ok = Array.isArray(q.a) ? q.a.some(a => norm(val).includes(norm(a))) : norm(val) === norm(q.a);

    if (ok) {
        vibrate(150); showSuccess(); gameState.unlocked.push(currentStation);
        setTimeout(() => { closeModal(); save(); renderBoard(); updateProgress(); }, 850);
    } else {
        vibrate(40); document.getElementById('feedback').innerText = "Oups ! Essaie encore.";
    }
}

function showSuccess() {
    const ov = document.getElementById('success-flash'); ov.style.display = 'flex'; ov.classList.add('show');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 } });
    setTimeout(() => { ov.style.display = 'none'; ov.classList.remove('show'); }, 800);
}

function closeModal() { document.getElementById('modal').classList.remove('open'); document.getElementById('q-input').value = ''; document.getElementById('feedback').innerText = ''; }

function updateProgress() {
    const pct = Math.round(((gameState.unlocked.length + gameState.failed.length) / 12) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-label').innerText = `Progression : ${pct}%`;
}

function enableFinalHunt() {
    document.getElementById('scanner-ui').style.display = 'none';
    document.getElementById('final-hunt-ui').style.display = 'block';
    const board = document.getElementById('game-board');
    board.className = "game-board final-hunt"; board.style.backgroundImage = "url('image_2.png')"; board.innerHTML = '';

    for(let i=1; i<=3; i++) {
        const line = document.createElement('div'); line.className = 'col-line'; line.style.left = (i*25) + '%';
        board.appendChild(line);
    }

    eggPositions.forEach((pos, idx) => {
        const egg = document.createElement('div');
        egg.className = 'egg' + (gameState.eggs.includes(idx) ? ' found' : '');
        egg.style.top = pos.t; egg.style.left = pos.l;
        egg.onclick = () => {
            if (!gameState.eggs.includes(idx)) {
                vibrate(70); gameState.eggs.push(idx); egg.classList.add('found');
                updateFinalUI(); save();
            }
        };
        board.appendChild(egg);
    });
    updateFinalUI();
}

function updateFinalUI() {
    const counts = [0, 0, 0, 0];
    gameState.eggs.forEach(idx => counts[eggPositions[idx].col]++);
    counts.forEach((c, i) => document.getElementById('d-' + i).innerText = c);
    if (counts.join('') === "2119") {
        confetti({ spread: 180, particleCount: 400 });
        setTimeout(() => alert("🐣 GÉNIAL ! Le code 2119 est validé !"), 500);
    }
}

function save() { localStorage.setItem('game_2026', JSON.stringify(gameState)); }
function resetGame() { if(confirm("Voulez-vous tout recommencer ?")) { localStorage.clear(); location.reload(); } }
// MODIFICATION DE LA FONCTION DE MISE À JOUR FINALE
function updateFinalUI() {
    const counts = [0, 0, 0, 0];
    gameState.eggs.forEach(idx => counts[eggPositions[idx].col]++);
    counts.forEach((c, i) => document.getElementById('d-' + i).innerText = c);
    
    // Si le code est 2119
    if (counts.join('') === "2119") {
        vibrate([100, 50, 100, 50, 300]); // Vibration spéciale victoire
        confetti({ 
            spread: 180, 
            particleCount: 500, 
            origin: { y: 0.6 },
            colors: ['#8bab96', '#c9a84c', '#ffffff'] 
        });
        
        // On affiche le bel écran au lieu de l'alerte moche
        setTimeout(() => {
            document.getElementById('victory-screen').style.display = 'flex';
        }, 800);
    }
}

// Petite fonction pour pouvoir fermer l'écran si besoin
function closeVictory() {
    document.getElementById('victory-screen').style.display = 'none';
}
