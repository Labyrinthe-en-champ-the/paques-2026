const questions = {
    1: { type: 'free', diff: 'Facile', q: "Je commence dans un nid, mais je finis souvent dans un panier. Je peux être dur, à la coque ou fondu... Que suis-je ?", a: ['oeuf', 'un oeuf', 'œuf'] },
    2: { type: 'free', diff: 'Facile', q: "Déchiffrez ce code secret : 3 - 8 - 15 - 3 - 15 - 12 - 1 - 20 (A=1, B=2...)", a: ['chocolat', 'le chocolat'] },
    3: { type: 'free', diff: 'Facile', q: "Rébus n°1 :", img: 'rebus1.png', a: ['illimite', 'illimité', 'ilimite'] },
    4: { type: 'free', diff: 'Facile', q: "Rébus n°2 :", img: 'rebus2.png', a: ['chasse au tresor', 'chasse au trésor'] },
    5: { type: 'free', diff: 'Normal', q: "Mon premier est un poisson. Mon deuxième est un poisson. Mon troisième est un poisson. Mon tout est une personne de ta famille. Qui suis-je ?", a: ['tonton', 'ton tonton'] },
    6: { type: 'free', diff: 'Normal', q: "Je commence par 'e', je finis par 'e' et je contiens une lettre. Qui suis-je ?", a: ['enveloppe', 'une enveloppe', 'envelope'] },
    7: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui a des dents, mais ne mange pas ?", a: ['peigne', 'un peigne'] },
    8: { type: 'free', diff: 'Normal', q: "Je suis Tintin mais je ne suis pas Tintin. Qui suis-je ?", a: ['milou', 'Milou'] },
    9: { type: 'free', diff: 'Normal', q: "Qu'est-ce qui peut remplir tout un espace sans prendre de place ?", a: ['lumiere', 'la lumiere'] },
    10: { type: 'qcm', diff: 'Normal', q: "Vous participez à une course cycliste. Si vous doublez le deuxième, vous devenez...", options: ['1er', '2ème', '3ème'], a: '2ème' },
    11: { type: 'qcm', diff: 'Difficile', q: "Un nénuphar double chaque jour. Il met 30 jours pour occuper tout le lac. Combien de jours pour deux nénuphars ?", options: ['29 jours', '15 jours', '22 jours'], a: '29 jours' },
    12: { type: 'qcm', diff: 'Difficile', q: "Un escargot monte de 3m le jour et glisse de 2m la nuit dans un puits de 12m. Combien de jours pour sortir ?", options: ['10 jours', '11 jours', '12 jours'], a: '10 jours' }
};

const eggPos = [
    {col:0, t:'25%', l:'10%'}, {col:0, t:'65%', l:'18%'}, // 2
    {col:1, t:'45%', l:'35%'}, // 1
    {col:2, t:'70%', l:'62%'}, // 1
    {col:3, t:'15%', l:'85%'}, {col:3, t:'35%', l:'92%'}, {col:3, t:'55%', l:'78%'}, 
    {col:3, t:'75%', l:'88%'}, {col:3, t:'10%', l:'82%'}, {col:3, t:'42%', l:'85%'},
    {col:3, t:'62%', l:'92%'}, {col:3, t:'85%', l:'80%'}, {col:3, t:'50%', l:'88%'} // 9
];

let state = JSON.parse(localStorage.getItem('labyrinth_2026')) || { unlocked: [], activated: [], eggs: [] };
let qr = null, currentStation = null;

window.onload = () => { render(); checkUrl(); };

function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

function render() {
    const board = document.getElementById('game-board'); board.innerHTML = '';
    const pct = Math.round((state.unlocked.length / 12) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';

    if (state.unlocked.length >= 12) { enableFinal(); return; }

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        const st = state.unlocked.includes(i) ? 'unlocked' : (state.activated.includes(i) ? 'active' : 'locked');
        div.className = `station station-${i} ${st}`;
        div.innerText = state.unlocked.includes(i) ? '' : i;
        div.onclick = () => open(i);
        board.appendChild(div);
    }
}

function startScanner() {
    document.getElementById('start-scan-btn').style.display = 'none';
    document.getElementById('camera-box').style.display = 'block';
    qr = new Html5Qrcode("reader");
    qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        const id = text.includes('id=') ? text.split('id=')[1] : text;
        stopScanner(); activate(parseInt(id));
    }).catch(() => stopScanner());
}

function stopScanner() {
    if (qr) qr.stop().then(() => {
        document.getElementById('camera-box').style.display = 'none';
        document.getElementById('start-scan-btn').style.display = 'block';
    });
}

function checkUrl() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) activate(parseInt(id));
}

function activate(id) {
    if (id > 0 && id <= 12 && !state.activated.includes(id)) {
        state.activated.push(id); save(); render(); open(id);
    }
}

function open(id) {
    if (!state.activated.includes(id) && !state.unlocked.includes(id)) { alert("Scannez la borne " + id); return; }
    if (state.unlocked.includes(id)) return;
    currentStation = id;
    const q = questions[id];
    document.getElementById('q-diff').innerText = q.diff;
    document.getElementById('q-text').innerText = q.q;
    document.getElementById('q-rebus').style.display = q.img ? 'block' : 'none';
    if(q.img) document.getElementById('q-rebus').src = q.img;

    const inputArea = document.getElementById('input-area');
    const qcmArea = document.getElementById('qcm-area');

    if (q.type === 'qcm') {
        inputArea.style.display = 'none'; qcmArea.style.display = 'flex';
        qcmArea.innerHTML = '';
        q.options.forEach(opt => {
            const b = document.createElement('button'); b.className = 'option-btn'; b.innerText = opt;
            b.onclick = () => validate(opt); qcmArea.appendChild(b);
        });
    } else {
        inputArea.style.display = 'flex'; qcmArea.style.display = 'none';
    }
    document.getElementById('modal').classList.add('open');
}

function submitAnswer() { validate(document.getElementById('q-input').value); }

function validate(val) {
    const q = questions[currentStation];
    const norm = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ok = Array.isArray(q.a) ? q.a.some(a => norm(val).includes(norm(a))) : norm(val) === norm(q.a);

    if (ok) {
        vibrate(150); state.unlocked.push(currentStation);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
        closeModal(); save(); render();
    } else {
        vibrate(50); document.getElementById('feedback').innerText = "Oups ! Essaie encore.";
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('q-input').value = '';
    document.getElementById('feedback').innerText = '';
}

function enableFinal() {
    document.getElementById('start-scan-btn').style.display = 'none';
    document.getElementById('final-hunt-ui').style.display = 'block';
    const board = document.getElementById('game-board');
    board.className = "game-board final-hunt"; board.style.backgroundImage = "url('image_2.png')"; board.innerHTML = '';
    eggPos.forEach((pos, idx) => {
        const e = document.createElement('div'); e.className = 'egg' + (state.eggs.includes(idx) ? ' found' : '');
        e.style.top = pos.t; e.style.left = pos.l;
        e.onclick = () => {
            if (!state.eggs.includes(idx)) { vibrate(70); state.eggs.push(idx); e.classList.add('found'); updateFinal(); save(); }
        };
        board.appendChild(e);
    });
    updateFinal();
}

function updateFinal() {
    const counts = [0, 0, 0, 0];
    state.eggs.forEach(idx => counts[eggPos[idx].col]++);
    counts.forEach((c, i) => document.getElementById('d-' + i).innerText = c);
    if (counts.join('') === "2119") {
        confetti({ spread: 180, particleCount: 500 });
        setTimeout(() => { document.getElementById('victory-screen').style.display = 'flex'; }, 800);
    }
}

function save() { localStorage.setItem('labyrinth_2026', JSON.stringify(state)); }
function resetGame() { if(confirm("Recommencer ?")) { localStorage.clear(); location.reload(); } }
function closeVictory() { document.getElementById('victory-screen').style.display = 'none'; }
