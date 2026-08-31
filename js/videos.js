// Le Laoa — video library page: filter tabs, on-site player, up-next list.
(function () {
  var DATA = window.LE_LAOA;
  var PLAYER_COLOR = 'b3722c';

  var state = { filter: 'all', current: null };

  var els = {
    tabs: document.getElementById('tabs'),
    grid: document.getElementById('video-grid'),
    gridCount: document.getElementById('grid-count'),
    player: document.getElementById('player'),
    playerTitle: document.getElementById('player-title'),
    playerChip: document.getElementById('player-chip'),
    playerDuration: document.getElementById('player-duration'),
    upNext: document.getElementById('up-next'),
    playerSection: document.getElementById('player-section')
  };

  function filtered() {
    if (state.filter === 'all') return DATA.videos;
    return DATA.videos.filter(function (v) { return v.collection === state.filter; });
  }

  function findVideo(id) {
    for (var i = 0; i < DATA.videos.length; i++) {
      if (DATA.videos[i].id === id) return DATA.videos[i];
    }
    return null;
  }

  function embedSrc(v, autoplay) {
    return 'https://player.vimeo.com/video/' + v.id +
      '?color=' + PLAYER_COLOR + '&byline=0&portrait=0&dnt=1' +
      (autoplay ? '&autoplay=1' : '');
  }

  function renderTabs() {
    var html = '<button class="tab' + (state.filter === 'all' ? ' active' : '') +
      '" data-filter="all">All &middot; ' + DATA.videos.length + '</button>';
    DATA.collections.forEach(function (c) {
      html += '<button class="tab' + (state.filter === c.slug ? ' active' : '') +
        '" data-filter="' + c.slug + '">' + c.name + ' &middot; ' + c.count + '</button>';
    });
    els.tabs.innerHTML = html;
  }

  function cardHtml(v) {
    return '<button class="video-card" data-id="' + v.id + '">' +
      '<span class="video-thumb">' +
      '<img src="' + v.thumbnail + '" alt="" loading="lazy">' +
      '<span class="badge">&#9654;&#xFE0E; ' + (v.duration || '') + '</span>' +
      '</span>' +
      '<span class="video-card-body">' +
      '<span class="cat-chip">' + v.collectionName + '</span>' +
      '<h3>' + v.title + '</h3>' +
      '</span></button>';
  }

  function renderGrid() {
    var list = filtered();
    els.grid.innerHTML = list.map(cardHtml).join('');
    if (els.gridCount) {
      els.gridCount.textContent = list.length + (list.length === 1 ? ' video' : ' videos');
    }
  }

  function renderUpNext() {
    var list = filtered();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (state.current && list[i].id === state.current.id) { idx = i; break; }
    }
    var next = [];
    for (var j = 1; j <= list.length && next.length < 5; j++) {
      var v = list[(idx + j + list.length) % list.length];
      if (!state.current || v.id !== state.current.id) next.push(v);
    }
    els.upNext.innerHTML = next.map(function (v) {
      return '<button class="up-next-item" data-id="' + v.id + '">' +
        '<img src="' + v.thumbnail + '" alt="" loading="lazy">' +
        '<span><span class="t">' + v.title + '</span><br>' +
        '<span class="c">' + v.collectionName + (v.duration ? ' &middot; ' + v.duration : '') + '</span></span>' +
        '</button>';
    }).join('');
  }

  function play(v, autoplay, scroll) {
    state.current = v;
    els.player.innerHTML = '<iframe src="' + embedSrc(v, autoplay) +
      '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + v.title + '"></iframe>';
    els.playerTitle.textContent = v.title;
    els.playerChip.textContent = v.collectionName;
    els.playerDuration.textContent = v.duration || '';
    renderUpNext();
    if (history.replaceState) {
      history.replaceState(null, '', '#v=' + v.id + (state.filter !== 'all' ? '&c=' + state.filter : ''));
    }
    if (scroll) els.playerSection.scrollIntoView({ behavior: 'smooth' });
  }

  function setFilter(slug) {
    state.filter = slug;
    renderTabs();
    renderGrid();
    renderUpNext();
  }

  function readHash() {
    var h = location.hash.replace(/^#/, '');
    var out = {};
    h.split('&').forEach(function (part) {
      var kv = part.split('=');
      if (kv.length === 2) out[kv[0]] = kv[1];
    });
    return out;
  }

  els.tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (btn) setFilter(btn.getAttribute('data-filter'));
  });

  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-id]');
    if (!card || card.classList.contains('tab')) return;
    var v = findVideo(card.getAttribute('data-id'));
    if (v) play(v, true, true);
  });

  // Initial state from URL hash (#v=<id>&c=<collection>)
  var params = readHash();
  var valid = DATA.collections.some(function (c) { return c.slug === params.c; });
  state.filter = valid ? params.c : 'all';
  renderTabs();
  renderGrid();
  var start = params.v ? findVideo(params.v) : null;
  play(start || filtered()[0], false, !!start);
})();
