const TEAM_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSq-xwYUHeI87hnaBdGwnLdBBpRmXtGCgHGDFz-qd1dlr7NFwY0OGIUzN4S84KuXIvojoN6LmhTfUA4/pub?output=csv';

const LOGIN_TARGETS = {
  '19e639b064bdb018bbf393d0f751e6e5e9934f70394531ab3f617513529ab264': {
    teamKey: 'tobas',
    page: 'Tobas.html'
  },
  'bb76dc3c076cd8e06b6b727b1913eff38a71ffc30bd6a4916e52fd39798ec81f': {
    teamKey: 'ranqueles',
    page: 'Ranqueles.html'
  },
  '11b6d5d62c0c8d756f35f780fd07f409e8bbd291fa433349036c3bcb85ce4e32': {
    teamKey: 'querandies',
    page: 'Querandies.html'
  },
  'b88c399bc0698b809333f91ee7380e28c85b5db1d2fa242d2c647bbe2ca8beca': {
    teamKey: 'guaranies',
    page: 'Guaranies.html'
  },
  '02176ff993f4b2809f28d2ee81885182edd67c3eb0ed10ecdcb87cde5aecdd09': {
    teamKey: 'wichis',
    page: 'Wichis.html'
  }
};

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getCurrentPageTeamKey() {
  const fileName = window.location.pathname.split('/').pop() || '';
  return normalizeText(fileName.replace(/\.html$/i, ''));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function buildTeamMap(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ''));

  if (!rows.length) {
    return {};
  }

  const headers = rows.shift().map(normalizeText);
  const teamIndex = headers.indexOf('equipo');
  const fdIndex = headers.indexOf('fd');

  if (teamIndex === -1 || fdIndex === -1) {
    throw new Error('El CSV debe incluir las columnas Equipo y FD.');
  }

  const teamMap = {};

  rows.forEach((row) => {
    const teamName = normalizeText(row[teamIndex]);
    const fdValue = String(row[fdIndex] ?? '').trim();

    if (teamName) {
      teamMap[teamName] = fdValue;
    }
  });

  return teamMap;
}

async function loadTeamMap() {
  const response = await fetch(TEAM_CSV_URL, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('No se pudo leer el CSV del banco.');
  }

  const csvText = await response.text();
  return buildTeamMap(csvText);
}

async function resolveTeamFd(teamKey, providedFd) {
  if (providedFd) {
    return providedFd;
  }

  const teamMap = await loadTeamMap();
  return teamMap[teamKey] || '';
}

async function initWalletPage() {
  const balanceEl = document.getElementById('balance');
  const toggleBtn = document.getElementById('toggleBtn');

  if (!balanceEl || !toggleBtn) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const teamKey = normalizeText(params.get('team') || getCurrentPageTeamKey());
  const providedFd = String(params.get('fd') || '').trim();

  toggleBtn.disabled = true;
  balanceEl.textContent = 'Cargando...';

  try {
    const saldoReal = await resolveTeamFd(teamKey, providedFd);

    if (!saldoReal) {
      balanceEl.textContent = 'Sin dato';
      toggleBtn.textContent = 'Mostrar Saldo';
      return;
    }

    let saldoVisible = false;

    balanceEl.textContent = '----';
    toggleBtn.textContent = 'Mostrar Saldo';
    toggleBtn.disabled = false;

    toggleBtn.addEventListener('click', () => {
      if (saldoVisible) {
        balanceEl.textContent = '----';
        toggleBtn.textContent = 'Mostrar Saldo';
      } else {
        balanceEl.textContent = '$' + saldoReal;
        toggleBtn.textContent = 'Ocultar Saldo';
      }

      saldoVisible = !saldoVisible;
    });

  } catch (_error) {
    balanceEl.textContent = 'Sin dato';
    toggleBtn.textContent = 'Mostrar Saldo';
  }
}

async function initLoginPage() {
  const loginForm = document.getElementById('loginForm');

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.getElementById('codigo').value.trim();
    const hash = CryptoJS.SHA256(input).toString();
    const target = LOGIN_TARGETS[hash];

    if (!target) {
      alert('Código incorrecto');
      return;
    }

    try {
      const teamMap = await loadTeamMap();
      const fdValue = teamMap[target.teamKey] || '';

      const redirectUrl = new URL(target.page, window.location.href);
      redirectUrl.searchParams.set('team', target.teamKey);

      if (fdValue) {
        redirectUrl.searchParams.set('fd', fdValue);
      }

      window.location.href = redirectUrl.toString();
    } catch (_error) {
      window.location.href = target.page;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initWalletPage();
  initLoginPage();
});