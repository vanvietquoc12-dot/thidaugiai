/** Xiangqi rules. Files 0-8. Ranks 0-9: 0 = red back rank (bottom). */
(function (global) {
  const RED = "r";
  const BLACK = "b";
  const EMPTY = ".";

  const START = [
    ["rR", "rH", "rE", "rA", "rK", "rA", "rE", "rH", "rR"],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, "rC", EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "rC", EMPTY],
    ["rP", EMPTY, "rP", EMPTY, "rP", EMPTY, "rP", EMPTY, "rP"],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ["bP", EMPTY, "bP", EMPTY, "bP", EMPTY, "bP", EMPTY, "bP"],
    [EMPTY, "bC", EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "bC", EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ["bR", "bH", "bE", "bA", "bK", "bA", "bE", "bH", "bR"],
  ];

  const GLYPH = {
    rK: "帥", rA: "仕", rE: "相", rH: "僌", rR: "俥", rC: "砲", rP: "兵",
    bK: "將", bA: "士", bE: "象", bH: "馬", bR: "車", bC: "包", bP: "卒",
  };

  function cloneBoard(b) { return b.map((row) => row.slice()); }
  function inBounds(f, r) { return f >= 0 && f <= 8 && r >= 0 && r <= 9; }
  function sideOf(p) { if (!p || p === EMPTY) return null; return p[0]; }
  function kindOf(p) { return p && p !== EMPTY ? p[1] : null; }
  function palace(side, f, r) {
    if (f < 3 || f > 5) return false;
    return side === RED ? r >= 0 && r <= 2 : r >= 7 && r <= 9;
  }
  function findKing(board, side) {
    for (let r = 0; r < 10; r++) for (let f = 0; f < 9; f++) if (board[r][f] === side + "K") return [f, r];
    return null;
  }
  function flyingGenerals(board) {
    const rk = findKing(board, RED);
    const bk = findKing(board, BLACK);
    if (!rk || !bk || rk[0] !== bk[0]) return false;
    const f = rk[0];
    const lo = Math.min(rk[1], bk[1]) + 1;
    const hi = Math.max(rk[1], bk[1]);
    for (let r = lo; r < hi; r++) if (board[r][f] !== EMPTY) return false;
    return true;
  }
  function pieceMoves(board, f, r) {
    const p = board[r][f];
    if (!p || p === EMPTY) return [];
    const side = sideOf(p);
    const k = kindOf(p);
    const out = [];
    const add = (tf, tr) => {
      if (!inBounds(tf, tr)) return;
      const t = board[tr][tf];
      if (t === EMPTY || sideOf(t) !== side) out.push([tf, tr]);
    };
    if (k === "K") {
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([df, dr]) => {
        const tf = f + df, tr = r + dr;
        if (palace(side, tf, tr)) add(tf, tr);
      });
    } else if (k === "A") {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([df, dr]) => {
        const tf = f + df, tr = r + dr;
        if (palace(side, tf, tr)) add(tf, tr);
      });
    } else if (k === "E") {
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([df, dr]) => {
        const tf = f + df, tr = r + dr;
        const ef = f + df / 2, er = r + dr / 2;
        if (!inBounds(tf, tr)) return;
        if (board[er][ef] !== EMPTY) return;
        if (side === RED && tr > 4) return;
        if (side === BLACK && tr < 5) return;
        add(tf, tr);
      });
    } else if (k === "H") {
      const hops = [
        [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
        [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
      ];
      hops.forEach(([df, dr, bf, br]) => {
        const blockF = f + bf, blockR = r + br;
        if (!inBounds(blockF, blockR) || board[blockR][blockF] !== EMPTY) return;
        add(f + df, r + dr);
      });
    } else if (k === "R") {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([df, dr]) => {
        let tf = f + df, tr = r + dr;
        while (inBounds(tf, tr)) {
          if (board[tr][tf] === EMPTY) out.push([tf, tr]);
          else { if (sideOf(board[tr][tf]) !== side) out.push([tf, tr]); break; }
          tf += df; tr += dr;
        }
      });
    } else if (k === "C") {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([df, dr]) => {
        let tf = f + df, tr = r + dr, jumped = false;
        while (inBounds(tf, tr)) {
          const t = board[tr][tf];
          if (!jumped) {
            if (t === EMPTY) out.push([tf, tr]); else jumped = true;
          } else {
            if (t !== EMPTY) { if (sideOf(t) !== side) out.push([tf, tr]); break; }
          }
          tf += df; tr += dr;
        }
      });
    } else if (k === "P") {
      const fwd = side === RED ? 1 : -1;
      add(f, r + fwd);
      const crossed = side === RED ? r >= 5 : r <= 4;
      if (crossed) { add(f + 1, r); add(f - 1, r); }
    }
    return out;
  }
  function applyMove(board, from, to) {
    const next = cloneBoard(board);
    next[to[1]][to[0]] = next[from[1]][from[0]];
    next[from[1]][from[0]] = EMPTY;
    return next;
  }
  function attackedBy(board, f, r, attacker) {
    for (let yr = 0; yr < 10; yr++) {
      for (let xf = 0; xf < 9; xf++) {
        if (sideOf(board[yr][xf]) !== attacker) continue;
        if (pieceMoves(board, xf, yr).some(([tf, tr]) => tf === f && tr === r)) return true;
      }
    }
    return false;
  }
  function inCheck(board, side) {
    const k = findKing(board, side);
    if (!k) return true;
    if (flyingGenerals(board)) return true;
    return attackedBy(board, k[0], k[1], side === RED ? BLACK : RED);
  }
  function legalMoves(board, f, r) {
    const p = board[r][f];
    const side = sideOf(p);
    return pieceMoves(board, f, r).filter(([tf, tr]) => !inCheck(applyMove(board, [f, r], [tf, tr]), side));
  }
  function allLegal(board, side) {
    const list = [];
    for (let r = 0; r < 10; r++) {
      for (let f = 0; f < 9; f++) {
        if (sideOf(board[r][f]) !== side) continue;
        legalMoves(board, f, r).forEach((to) => list.push({ from: [f, r], to }));
      }
    }
    return list;
  }
  function outcome(board, sideToMove) {
    const moves = allLegal(board, sideToMove);
    if (moves.length) return null;
    return inCheck(board, sideToMove) ? "checkmate" : "stalemate";
  }
  function newGame() {
    return { board: cloneBoard(START), turn: RED, history: [], result: null };
  }
  global.Xiangqi = {
    RED, BLACK, EMPTY, GLYPH, START, cloneBoard, sideOf, kindOf,
    legalMoves, allLegal, applyMove, inCheck, outcome, newGame, findKing,
  };
})(window);
