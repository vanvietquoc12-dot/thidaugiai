(function (global) {
  const NAMES = ["Lâm Quen", "Minh", "Hà", "Đức", "Lan", "Phúc", "Trang", "Nam"];

  function swissPair(players) {
    const sorted = players.slice().sort((a, b) => b.pts - a.pts || b.elo - a.elo);
    const pairs = [];
    const used = new Set();
    for (let i = 0; i < sorted.length; i++) {
      if (used.has(sorted[i].id)) continue;
      let mate = null;
      for (let j = i + 1; j < sorted.length; j++) {
        if (!used.has(sorted[j].id)) {
          mate = sorted[j];
          break;
        }
      }
      used.add(sorted[i].id);
      if (mate) {
        used.add(mate.id);
        pairs.push([sorted[i], mate]);
      } else {
        pairs.push([sorted[i], null]);
      }
    }
    return pairs;
  }

  function newEvent() {
    const you = { id: "you", name: "Bạn", elo: 1488, pts: 0, human: true };
    const bots = NAMES.slice(0, 7).map((name, i) => ({
      id: "bot-" + i,
      name,
      elo: 1400 + i * 25,
      pts: 0,
      human: false,
    }));
    const players = [you, ...bots];
    return {
      id: "swiss-" + Date.now(),
      name: "Swiss đêm · 10+5",
      round: 1,
      maxRounds: 3,
      status: "live",
      players,
      pairs: swissPair(players),
      history: [],
    };
  }

  function applyResult(evt, winnerId, loserId, draw) {
    const w = evt.players.find((p) => p.id === winnerId);
    const l = evt.players.find((p) => p.id === loserId);
    if (draw) {
      if (w) w.pts += 0.5;
      if (l) l.pts += 0.5;
    } else {
      if (w) w.pts += 1;
    }
    evt.history.push({ round: evt.round, winnerId, loserId, draw: !!draw });
  }

  function nextRound(evt) {
    if (evt.round >= evt.maxRounds) {
      evt.status = "done";
      evt.pairs = [];
      return evt;
    }
    evt.round += 1;
    evt.pairs = swissPair(evt.players);
    return evt;
  }

  global.Tournament = { newEvent, applyResult, nextRound, swissPair };
})(window);
