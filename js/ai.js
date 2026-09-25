(function (global) {
  const X = global.Xiangqi;
  const VAL = { K: 10000, R: 90, C: 45, H: 40, E: 20, A: 20, P: 10 };

  function score(board, side) {
    let s = 0;
    for (let r = 0; r < 10; r++) {
      for (let f = 0; f < 9; f++) {
        const p = board[r][f];
        if (!p || p === X.EMPTY) continue;
        const v = VAL[X.kindOf(p)] || 0;
        s += X.sideOf(p) === side ? v : -v;
      }
    }
    if (X.inCheck(board, side === X.RED ? X.BLACK : X.RED)) s += 6;
    if (X.inCheck(board, side)) s -= 8;
    return s;
  }

  function pick(board, side, depth) {
    const moves = X.allLegal(board, side);
    if (!moves.length) return null;
    let best = moves[0];
    let bestS = -1e9;
    const shuffled = moves.slice().sort(() => Math.random() - 0.5);
    for (const m of shuffled) {
      const next = X.applyMove(board, m.from, m.to);
      let s = score(next, side);
      if (depth > 0) {
        const reply = X.allLegal(next, side === X.RED ? X.BLACK : X.RED);
        let worst = 1e9;
        for (const n of reply.slice(0, 24)) {
          const nn = X.applyMove(next, n.from, n.to);
          worst = Math.min(worst, score(nn, side));
        }
        if (reply.length) s = worst;
      }
      s += Math.random() * 1.5;
      if (s > bestS) {
        bestS = s;
        best = m;
      }
    }
    return best;
  }

  global.XiangqiAI = { pick };
})(window);
