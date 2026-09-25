(function () {
  const X = Xiangqi;
  const views = {
    lobby: document.getElementById("view-lobby"),
    match: document.getElementById("view-match"),
    table: document.getElementById("view-table"),
  };
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let evt = Tournament.newEvent();
  let game = null;
  let selected = null;
  let hints = [];
  let opponent = null;
  let humanSide = X.RED;

  function show(name) {
    Object.values(views).forEach((v) => v.classList.add("hidden"));
    views[name].classList.remove("hidden");
  }

  function renderLobby() {
    document.getElementById("evt-meta").textContent =
      evt.name + " · vòng " + evt.round + "/" + evt.maxRounds;
    const list = document.getElementById("pair-list");
    list.innerHTML = "";
    evt.pairs.forEach((pair) => {
      const a = pair[0], b = pair[1];
      const card = document.createElement("div");
      card.className = "card";
      const youHere = a.id === "you" || (b && b.id === "you");
      card.innerHTML = "<strong>" + a.name + (b ? " vs " + b.name : " (bye)") + "</strong>" +
        "<span>" + a.pts + " — " + (b ? b.pts : "-") + " điểm</span>";
      if (youHere && b) {
        const btn = document.createElement("button");
        btn.textContent = "Vào bàn";
        btn.onclick = () => startMatch(b);
        const wrap = document.createElement("div");
        wrap.style.marginTop = "8px";
        wrap.appendChild(btn);
        card.appendChild(wrap);
      }
      list.appendChild(card);
    });
  }

  function startMatch(opp) {
    opponent = opp;
    game = X.newGame();
    selected = null;
    hints = [];
    humanSide = X.RED;
    document.getElementById("you-name").textContent = "Bạn";
    document.getElementById("you-elo").textContent = "Elo 1488";
    document.getElementById("opp-name").textContent = opp.name;
    document.getElementById("opp-elo").textContent = "Elo " + opp.elo;
    document.getElementById("badge").textContent = "SWISS · R" + evt.round + " · 10+5";
    show("match");
    draw();
  }

  function cellPos(f, rank) {
    return { left: (f / 8) * 100 + "%", top: ((9 - rank) / 9) * 100 + "%" };
  }

  function draw() {
    boardEl.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 8 9");
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    const ns = svg.namespaceURI;
    const line = (x1, y1, x2, y2) => {
      const l = document.createElementNS(ns, "line");
      l.setAttribute("x1", x1); l.setAttribute("y1", y1);
      l.setAttribute("x2", x2); l.setAttribute("y2", y2);
      l.setAttribute("stroke", "#5c3d22");
      l.setAttribute("stroke-width", "0.03");
      svg.appendChild(l);
    };
    for (let i = 0; i <= 8; i++) {
      if (i === 0 || i === 8) line(i, 0, i, 9);
      else { line(i, 0, i, 4); line(i, 5, i, 9); }
    }
    for (let j = 0; j <= 9; j++) line(0, j, 8, j);
    line(3, 0, 5, 2); line(5, 0, 3, 2);
    line(3, 7, 5, 9); line(5, 7, 3, 9);
    boardEl.appendChild(svg);
    const hintSet = new Set(hints.map((h) => h[0] + "," + h[1]));
    for (let rank = 0; rank < 10; rank++) {
      for (let f = 0; f < 9; f++) {
        const p = game.board[rank][f];
        const has = p && p !== X.EMPTY;
        const isHint = hintSet.has(f + "," + rank);
        if (!has && !isHint) continue;
        const el = document.createElement("div");
        el.className = "sq" + (isHint ? " hint" : "") + (has ? " cap" : "");
        if (selected && selected[0] === f && selected[1] === rank) el.classList.add("sel");
        const pos = cellPos(f, rank);
        el.style.left = pos.left;
        el.style.top = pos.top;
        if (has) {
          const piece = document.createElement("div");
          piece.className = "piece " + X.sideOf(p);
          piece.textContent = X.GLYPH[p] || p;
          el.appendChild(piece);
        }
        el.onclick = () => onCell(f, rank);
        boardEl.appendChild(el);
      }
    }
    const end = game.result;
    if (end) statusEl.textContent = end === "win" ? "Bạn thắng" : end === "loss" ? "Bạn thua" : "Hòa";
    else if (game.turn === humanSide) statusEl.textContent = X.inCheck(game.board, humanSide) ? "Chiếu tướng — đến lượt bạn" : "Đến lượt bạn";
    else statusEl.textContent = "Đối thủ đang nghĩ…";
  }

  function finish(result) {
    game.result = result;
    const youWin = result === "win";
    const draw = result === "draw";
    Tournament.applyResult(evt, youWin ? "you" : opponent.id, youWin ? opponent.id : "you", draw);
    draw();
    setTimeout(() => {
      Tournament.nextRound(evt);
      renderTable();
      renderLobby();
      show(evt.status === "done" ? "table" : "lobby");
    }, 900);
  }

  function onCell(f, rank) {
    if (!game || game.result) return;
    if (game.turn !== humanSide) return;
    const p = game.board[rank][f];
    if (selected) {
      const ok = hints.some((h) => h[0] === f && h[1] === rank);
      if (ok) { play(selected, [f, rank]); return; }
    }
    if (X.sideOf(p) === humanSide) {
      selected = [f, rank];
      hints = X.legalMoves(game.board, f, rank);
    } else { selected = null; hints = []; }
    draw();
  }

  function play(from, to) {
    game.board = X.applyMove(game.board, from, to);
    game.history.push({ from, to });
    selected = null;
    hints = [];
    const o = X.outcome(game.board, X.BLACK);
    if (o === "checkmate") { finish("win"); return; }
    if (o === "stalemate") { finish("draw"); return; }
    game.turn = X.BLACK;
    draw();
    setTimeout(aiMove, 380);
  }

  function aiMove() {
    if (!game || game.result) return;
    const m = XiangqiAI.pick(game.board, X.BLACK, 1);
    if (!m) { finish(X.inCheck(game.board, X.BLACK) ? "win" : "draw"); return; }
    game.board = X.applyMove(game.board, m.from, m.to);
    const o = X.outcome(game.board, X.RED);
    if (o === "checkmate") { finish("loss"); return; }
    if (o === "stalemate") { finish("draw"); return; }
    game.turn = X.RED;
    draw();
  }

  function renderTable() {
    const body = document.getElementById("standings");
    const rows = evt.players.slice().sort((a, b) => b.pts - a.pts || b.elo - a.elo);
    body.innerHTML = rows.map((p, i) =>
      "<tr><td>" + (i + 1) + "</td><td>" + p.name + "</td><td>" + p.pts + "</td><td>" + p.elo + "</td></tr>"
    ).join("");
  }

  document.getElementById("btn-resign").onclick = () => { if (game && !game.result) finish("loss"); };
  document.getElementById("btn-draw").onclick = () => { if (game && !game.result) finish("draw"); };
  document.getElementById("btn-menu").onclick = () => { show("lobby"); renderLobby(); };
  document.getElementById("btn-table").onclick = () => { renderTable(); show("table"); };
  document.getElementById("btn-back-lobby").onclick = () => { show("lobby"); renderLobby(); };
  document.getElementById("btn-new").onclick = () => { evt = Tournament.newEvent(); renderLobby(); show("lobby"); };

  renderLobby();
  show("lobby");
})();
