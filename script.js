  const defaultCriteria = [
    { id: idGen(), name: 'Biaya', type: 'cost', weight: 0.25 },
    { id: idGen(), name: 'Performa', type: 'benefit', weight: 0.20 },
    { id: idGen(), name: 'Konektivitas', type: 'benefit', weight: 0.20 },
    { id: idGen(), name: 'Kemudahan', type: 'benefit', weight: 0.20 },
    { id: idGen(), name: 'Keamanan', type: 'benefit', weight: 0.15 },
  ];

  const defaultAlts = [
    { id: idGen(), name: 'Arduino Uno' },
    { id: idGen(), name: 'Raspberry Pi' },
    { id: idGen(), name: 'ESP32' },
    { id: idGen(), name: 'BeagleBone' },
    { id: idGen(), name: 'Intel Edison' },
    { id: idGen(), name: 'Particle Photon' },
    { id: idGen(), name: 'Arduino Mega' },
  ];

  let criteria = JSON.parse(JSON.stringify(defaultCriteria));
  let alternatives = JSON.parse(JSON.stringify(defaultAlts));
  let matrix = {}; 

  // helpers
  function idGen() {
    return 'id' + Math.random().toString(36).slice(2, 9);
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // init
  function init() {
    renderCriteriaTable();
    renderAltTable();
    createEmptyMatrix();
    renderMatrix();
    updateWeightSum();
  }

  function createEmptyMatrix() {
    matrix = {};
    alternatives.forEach(a => {
      matrix[a.id] = {};
      criteria.forEach(c => matrix[a.id][c.id] = 0);
    });
  }

  // render functions
  function renderCriteriaTable() {
    const tbody = $('#criteriaTable tbody');
    tbody.innerHTML = '';

    criteria.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.type}</td>
        <td>
          <input data-critid="${c.id}" class="weightInp" type="number"
            step="0.01" min="0" value="${c.weight}" style="width:86px"/>
        </td>
        <td><button class="mutebtn small" data-del="${c.id}">Hapus</button></td>
      `;
      tbody.appendChild(tr);
    });

    // attach events
    $all('.weightInp').forEach(inp =>
      inp.addEventListener('input', e => {
        const id = e.target.dataset.crítid || e.target.dataset.critid;
        const c = criteria.find(x => x.id === id);
        if (!c) return;
        c.weight = parseFloat(e.target.value) || 0;
        updateWeightSum();
      })
    );

    $all('button[data-del]').forEach(b =>
      b.onclick = () => {
        const id = b.dataset.del;
        criteria = criteria.filter(x => x.id !== id);
        createEmptyMatrix();
        renderCriteriaTable();
        renderMatrix();
        updateWeightSum();
      }
    );
  }

  function renderAltTable() {
    const tbody = $('#altTable tbody');
    tbody.innerHTML = '';

    alternatives.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.name}</td>
        <td><button class="mutebtn small" data-delalt="${a.id}">Hapus</button></td>
      `;
      tbody.appendChild(tr);
    });

    $all('button[data-delalt]').forEach(b =>
      b.onclick = () => {
        const id = b.dataset.delalt;
        alternatives = alternatives.filter(x => x.id !== id);
        createEmptyMatrix();
        renderAltTable();
        renderMatrix();
      }
    );
  }

  function renderMatrix() {
    const wrap = $('#matrixWrap');
    wrap.innerHTML = '';

    if (criteria.length === 0 || alternatives.length === 0) {
      wrap.innerHTML = '<div class="footnote">Tambahkan minimal 1 kriteria dan 1 alternatif.</div>';
      return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');

    let headRow =
      '<tr><th>Alternatif \\ Kriteria</th>' +
      criteria.map(c => `<th>${c.name}<br/><small>${c.type}</small></th>`).join('') +
      '</tr>';
    thead.innerHTML = headRow;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    alternatives.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${a.name}</td>` +
        criteria
          .map(
            c =>
              `<td><input data-altid="${a.id}" data-crtid="${c.id}" type="number"
                step="0.01" value="${matrix[a.id] ? matrix[a.id][c.id] : 0}" style="width:86px"/></td>`
          )
          .join('');
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    // events
    $all('#matrixWrap input').forEach(inp =>
      inp.addEventListener('input', e => {
        const aId = e.target.dataset.altid;
        const cId = e.target.dataset.crtid;
        const val = parseFloat(e.target.value) || 0;
        matrix[aId][cId] = val;
      })
    );
  }

  // events add
  $('#addAltBtn').addEventListener('click', () => {
    const name = $('#altName').value.trim();
    if (!name) return alert('Masukkan nama alternatif');

    const a = { id: idGen(), name };
    alternatives.push(a);
    createEmptyMatrix();
    renderAltTable();
    renderMatrix();
    $('#altName').value = '';
  });

  $('#addCritBtn').addEventListener('click', () => {
    const name = $('#critName').value.trim();
    const type = $('#critType').value;
    if (!name) return alert('Masukkan nama kriteria');

    const c = { id: idGen(), name, type, weight: 0.1 };
    criteria.push(c);
    createEmptyMatrix();
    renderCriteriaTable();
    renderMatrix();
    $('#critName').value = '';
    updateWeightSum();
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Reset data ke default?')) return;

    criteria = JSON.parse(JSON.stringify(defaultCriteria));
    alternatives = JSON.parse(JSON.stringify(defaultAlts));
    createEmptyMatrix();
    renderCriteriaTable();
    renderAltTable();
    renderMatrix();
    updateWeightSum();
    $('#results').innerHTML = '';
    $('#rankings').innerHTML = '';
  });

  $('#computeBtn').addEventListener('click', () => {
    const res = computeSAW_WP();
    renderResults(res);
  });

  $('#copyBtn').addEventListener('click', async () => {
    const txt =
      $('#results').innerText ||
      $('#results').textContent ||
      'Tidak ada hasil';

    try {
      await navigator.clipboard.writeText(txt);
      alert('Hasil disalin ke clipboard');
    } catch (e) {
      alert('Tidak dapat menyalin: ' + e.message);
    }
  });

  // compute functions
  function computeSAW_WP() {
    if (criteria.length === 0 || alternatives.length === 0) return null;

    const sumW = criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
    if (sumW <= 0) return null;

    // 1. raw matrix
    const raw = alternatives.map(a => {
      return {
        id: a.id,
        name: a.name,
        vals: criteria.map(c => ({
          critId: c.id,
          val: parseFloat(matrix[a.id][c.id]) || 0,
          type: c.type,
          weight: parseFloat(c.weight) || 0
        }))
      };
    });

    // 2. normalize SAW
    const normalized = raw.map(r => ({ id: r.id, name: r.name, vals: [] }));

    criteria.forEach((c, idx) => {
      const col = raw.map(r => r.vals[idx].val);

      if (c.type === 'benefit') {
        const max = Math.max(...col);
        raw.forEach((r, i) =>
          normalized[i].vals.push({
            critId: c.id,
            norm: max ? r.vals[idx].val / max : 0,
            weight: c.weight
          })
        );
      } else {
        const min = Math.min(...col);
        raw.forEach((r, i) =>
          normalized[i].vals.push({
            critId: c.id,
            norm: min ? min / r.vals[idx].val : 0,
            weight: c.weight
          })
        );
      }
    });

    // SAW score
    const saw = normalized.map(r => {
      const score = r.vals.reduce((s, v) => s + v.norm * v.weight, 0);
      return { id: r.id, name: r.name, score };
    });

    // 3. WP score
    const wp = raw.map(r => {
      let product = 1;

      r.vals.forEach((cell, idx) => {
        const c = criteria[idx];
        const col = raw.map(rr => rr.vals[idx].val);
        let norm = 0;

        if (c.type === 'benefit') {
          const max = Math.max(...col);
          norm = max ? cell.val / max : 0;
        } else {
          const min = Math.min(...col);
          norm = cell.val ? min / cell.val : 0;
        }

        product *= Math.pow(norm || 0.0000001, cell.weight / sumWeights());
      });

      return { id: r.id, name: r.name, score: product };
    });

    const wpSum = wp.reduce((s, x) => s + x.score, 0);
    const wpNorm = wp.map(x => ({
      id: x.id,
      name: x.name,
      score: wpSum ? x.score / wpSum : 0
    }));

    const sawRank = [...saw]
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const wpRank = [...wpNorm]
      .sort((a, b) => (b.score - a.score ? b.score - a.score : 0))
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return { raw, normalized, saw, sawRank, wp, wpNorm, wpRank };

    function sumWeights() {
      return criteria.reduce(
        (s, c) => s + (parseFloat(c.weight) || 0),
        0
      );
    }
  }

  function renderResults(res) {
    const out = $('#results');
    out.innerHTML = '';

    if (!res) {
      out.innerHTML = '<div class="footnote">Tidak cukup data / bobot tidak valid.</div>';
      return;
    }

    // SAW table
    const sawCard = document.createElement('div');
    sawCard.className = 'card';
    sawCard.style.marginTop = '10px';
    sawCard.innerHTML = `<h4>Hasil SAW</h4>`;

    const t = document.createElement('table');
    t.innerHTML =
      `<thead><tr><th>Alternatif</th><th>Skor</th><th>Peringkat</th></tr></thead><tbody>` +
      res.sawRank
        .map(
          r =>
            `<tr><td>${r.name}</td><td>${r.score.toFixed(4)}</td><td><span class="rank-badge">${r.rank}</span></td></tr>`
        )
        .join('') +
      `</tbody>`;

    sawCard.appendChild(t);
    out.appendChild(sawCard);

    // WP table
    const wpCard = document.createElement('div');
    wpCard.className = 'card';
    wpCard.style.marginTop = '10px';
    wpCard.innerHTML = `<h4>Hasil WP</h4>`;

    const t2 = document.createElement('table');
    t2.innerHTML =
      `<thead><tr><th>Alternatif</th><th>Skor</th><th>Peringkat</th></tr></thead><tbody>` +
      res.wpNorm
        .sort((a, b) => b.score - a.score)
        .map(
          (r, i) =>
            `<tr><td>${r.name}</td><td>${r.score.toFixed(4)}</td><td><span class="rank-badge">${i + 1}</span></td></tr>`
        )
        .join('') +
      `</tbody>`;

    wpCard.appendChild(t2);
    out.appendChild(wpCard);

    // comparison
    const comp = document.createElement('div');
    comp.className = 'card comparison';
    comp.style.marginTop = '10px';
    comp.innerHTML = `<h4>Perbandingan Peringkat</h4>`;

    const cmpTable = document.createElement('table');
    cmpTable.innerHTML =
      `<thead><tr><th>Alternatif</th><th>Peringkat SAW</th><th>Peringkat WP</th></tr></thead><tbody>` +
      alternatives
        .map(a => {
          const sawR = res.sawRank.find(x => x.id === a.id);
          const wpR = res.wpRank.find(x => x.id === a.id);
          return `<tr><td>${a.name}</td><td>${sawR ? sawR.rank : '-'}</td><td>${wpR ? wpR.rank : '-'}</td></tr>`;
        })
        .join('') +
      `</tbody>`;

    comp.appendChild(cmpTable);
    out.appendChild(comp);

    $('#rankings').innerHTML =
      '<div class="footnote">Lihat hasil lengkap di panel utama.</div>';

    const bestSAW = res.sawRank[0].name;
    const bestWP = res.wpNorm.sort((a, b) => b.score - a.score)[0].name;

    const summ = document.createElement('div');
    summ.className = 'card';
    summ.style.marginTop = '10px';
    summ.innerHTML = `<strong>Rekomendasi:</strong> SAW -> ${bestSAW}. WP -> ${bestWP}.`;
    out.appendChild(summ);
  }

  function updateWeightSum() {
    const sum = criteria.reduce(
      (s, c) => s + (parseFloat(c.weight) || 0),
      0
    );
    $('#weightSum').innerText = sum.toFixed(2);
  }

  // initial fill
  init();

  // demo sample
  function fillSampleValues() {
    alternatives.forEach(a => {
      criteria.forEach(c => {
        const v = Math.round((Math.random() * 8 + 1) * 100) / 100;
        matrix[a.id][c.id] = v;
      });
    });
    renderMatrix();
  }
  fillSampleValues();
