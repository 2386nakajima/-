const APP_NAME = 'SMTG 顧客カルテ';
const DB_PROPERTY = 'SMTG_CLIENT_RECORD_SHEET_ID';
const SHEETS = {
  Companies: ['id','name','normalizedName','industry','contact','status','source','createdAt','updatedAt'],
  Units: ['id','name','normalizedName','createdAt'],
  CompanyUnits: ['id','companyId','unitId','groupName','createdAt'],
  Meetings: ['id','companyId','calendarEventId','title','startAt','endAt','location','description','createdAt','updatedAt'],
  Tasks: ['id','companyId','title','note','dueDate','completed','createdAt','updatedAt'],
  Videos: ['id','companyId','title','url','createdAt'],
  Settings: ['key','value']
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBootstrap() {
  const db = ensureDatabase_();
  return {
    user: { email: currentUserEmail_(), databaseUrl: db.getUrl() },
    data: getAllData_(db)
  };
}

function syncCalendar() {
  return withUserLock_(function () {
    const db = ensureDatabase_();
    const now = new Date();
    const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const events = CalendarApp.getDefaultCalendar().getEvents(from, to, { search: 'SMTG' });
    const state = loadState_(db);
    let synced = 0, createdCompanies = 0, createdUnits = 0, linkedVideos = 0, skipped = 0;

    events.forEach(function (event) {
      const parsed = parseSmtgTitle_(event.getTitle());
      if (!parsed || isDeclined_(event)) { skipped++; return; }
      let company = state.companiesByName[normalize_(parsed.companyName)];
      if (!company) {
        company = createCompany_(db, parsed.companyName, 'calendar');
        state.companiesByName[company.normalizedName] = company;
        createdCompanies++;
      }
      parsed.unitNames.forEach(function (unitName) {
        let unit = state.unitsByName[normalize_(unitName)];
        if (!unit) {
          unit = createUnit_(db, unitName);
          state.unitsByName[unit.normalizedName] = unit;
          createdUnits++;
        }
        const linkKey = company.id + '|' + unit.id;
        if (!state.linksByKey[linkKey]) {
          const link = { id: Utilities.getUuid(), companyId: company.id, unitId: unit.id, groupName: '', createdAt: isoNow_() };
          appendRecord_(db, 'CompanyUnits', link);
          state.linksByKey[linkKey] = link;
        }
      });

      const eventId = event.getId();
      const meeting = {
        id: state.meetingsByEvent[eventId] ? state.meetingsByEvent[eventId].id : Utilities.getUuid(),
        companyId: company.id,
        calendarEventId: eventId,
        title: event.getTitle(),
        startAt: event.getStartTime().toISOString(),
        endAt: event.getEndTime().toISOString(),
        location: event.getLocation() || 'Google Calendar',
        description: event.getDescription() || '',
        createdAt: state.meetingsByEvent[eventId] ? state.meetingsByEvent[eventId].createdAt : isoNow_(),
        updatedAt: isoNow_()
      };
      upsertRecord_(db, 'Meetings', meeting, 'calendarEventId');
      state.meetingsByEvent[eventId] = meeting;
      synced++;

      extractVideoUrls_(meeting.description).forEach(function (url) {
        const key = company.id + '|' + url;
        if (state.videosByKey[key]) return;
        const video = { id: Utilities.getUuid(), companyId: company.id, title: meeting.title + ' 録画', url: url, createdAt: meeting.startAt };
        appendRecord_(db, 'Videos', video);
        state.videosByKey[key] = video;
        linkedVideos++;
      });
    });
    setSetting_(db, 'lastSyncedAt', isoNow_());
    return { data: getAllData_(db), summary: { synced, createdCompanies, createdUnits, linkedVideos, skipped } };
  });
}

function saveCompany(input) {
  return withUserLock_(function () {
    if (!input || !String(input.name || '').trim()) throw new Error('企業名を入力してください。');
    const db = ensureDatabase_();
    const existing = input.id ? findRecord_(db, 'Companies', 'id', input.id) : null;
    const now = isoNow_();
    const company = {
      id: existing ? existing.id : Utilities.getUuid(),
      name: String(input.name).trim(),
      normalizedName: normalize_(input.name),
      industry: String(input.industry || '').trim(),
      contact: String(input.contact || '').trim(),
      status: String(input.status || '対応中').trim(),
      source: existing ? existing.source : 'manual',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
    upsertRecord_(db, 'Companies', company, 'id');

    const names = splitUnitNames_(input.supportUnits || []);
    const selectedUnitIds = [];
    names.forEach(function (name) {
      let unit = findRecord_(db, 'Units', 'normalizedName', normalize_(name));
      if (!unit) unit = createUnit_(db, name);
      selectedUnitIds.push(unit.id);
    });
    deleteWhere_(db, 'CompanyUnits', function (row) { return row.companyId === company.id; });
    selectedUnitIds.forEach(function (unitId) {
      appendRecord_(db, 'CompanyUnits', { id: Utilities.getUuid(), companyId: company.id, unitId: unitId, groupName: String(input.groupName || '').trim(), createdAt: now });
    });
    return getAllData_(db);
  });
}

function mergeCompanies(sourceId, targetId) {
  return withUserLock_(function () {
    if (!sourceId || !targetId || sourceId === targetId) throw new Error('統合元と統合先を選択してください。');
    const db = ensureDatabase_();
    ['Meetings','Tasks','Videos'].forEach(function (sheetName) {
      const rows = readRecords_(db, sheetName);
      rows.forEach(function (row) {
        if (row.companyId === sourceId) { row.companyId = targetId; upsertRecord_(db, sheetName, row, 'id'); }
      });
    });
    const links = readRecords_(db, 'CompanyUnits');
    const targetUnits = {};
    links.forEach(function (row) { if (row.companyId === targetId) targetUnits[row.unitId] = true; });
    links.forEach(function (row) {
      if (row.companyId !== sourceId || targetUnits[row.unitId]) return;
      row.companyId = targetId; upsertRecord_(db, 'CompanyUnits', row, 'id'); targetUnits[row.unitId] = true;
    });
    deleteWhere_(db, 'CompanyUnits', function (row) { return row.companyId === sourceId; });
    deleteWhere_(db, 'Companies', function (row) { return row.id === sourceId; });
    return getAllData_(db);
  });
}

function saveTask(input) {
  return withUserLock_(function () {
    if (!input || !input.companyId || !String(input.title || '').trim()) throw new Error('タスク名を入力してください。');
    const db = ensureDatabase_(), now = isoNow_();
    appendRecord_(db, 'Tasks', { id: Utilities.getUuid(), companyId: input.companyId, title: String(input.title).trim(), note: String(input.note || '').trim(), dueDate: String(input.dueDate || ''), completed: 'false', createdAt: now, updatedAt: now });
    return getAllData_(db);
  });
}

function toggleTask(taskId) {
  return withUserLock_(function () {
    const db = ensureDatabase_();
    const task = findRecord_(db, 'Tasks', 'id', taskId);
    if (!task) throw new Error('タスクが見つかりません。');
    task.completed = String(task.completed) === 'true' ? 'false' : 'true'; task.updatedAt = isoNow_();
    upsertRecord_(db, 'Tasks', task, 'id');
    return getAllData_(db);
  });
}

function saveVideo(input) {
  return withUserLock_(function () {
    if (!input || !input.companyId || !String(input.url || '').trim()) throw new Error('動画URLを入力してください。');
    const db = ensureDatabase_();
    appendRecord_(db, 'Videos', { id: Utilities.getUuid(), companyId: input.companyId, title: String(input.title || '関連動画').trim(), url: String(input.url).trim(), createdAt: isoNow_() });
    return getAllData_(db);
  });
}

function parseSmtgTitle_(title) {
  const match = String(title || '').match(/【SMTG】\s*([^：:]+?)\s*[：:]\s*(.+)$/i);
  if (!match) return null;
  const unitNames = splitUnitNames_(match[1]);
  const companyName = String(match[2]).replace(/[\s　]*様\s*$/, '').trim();
  if (!unitNames.length || !companyName) return null;
  return { unitNames: unitNames, companyName: companyName };
}

function splitUnitNames_(value) {
  const values = Array.isArray(value) ? value : [value];
  const seen = {};
  return values.join('＋').split(/[＋+]/).map(function (name) { return String(name).trim(); }).filter(function (name) {
    const key = normalize_(name); if (!key || seen[key]) return false; seen[key] = true; return true;
  });
}

function extractVideoUrls_(text) {
  const urls = String(text || '').match(/https?:\/\/[^\s<>'"）)]+/g) || [];
  const seen = {};
  return urls.filter(function (url) {
    const video = /youtu\.be|youtube\.com|vimeo\.com|loom\.com|drive\.google\.com\/file/i.test(url);
    if (!video || seen[url]) return false; seen[url] = true; return true;
  });
}

function ensureDatabase_() {
  const properties = PropertiesService.getUserProperties();
  const id = properties.getProperty(DB_PROPERTY);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (error) { properties.deleteProperty(DB_PROPERTY); }
  }
  const db = SpreadsheetApp.create(APP_NAME + ' データ');
  ensureSheets_(db);
  setSetting_(db, 'createdAt', isoNow_());
  properties.setProperty(DB_PROPERTY, db.getId());
  return db;
}

function ensureSheets_(db) {
  Object.keys(SHEETS).forEach(function (name, index) {
    let sheet = db.getSheetByName(name);
    if (!sheet) sheet = index === 0 && db.getSheets().length === 1 && db.getSheets()[0].getLastRow() === 0 ? db.getSheets()[0].setName(name) : db.insertSheet(name);
    const headers = SHEETS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#183d35').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });
}

function getAllData_(db) {
  const companies = readRecords_(db, 'Companies'), units = readRecords_(db, 'Units'), links = readRecords_(db, 'CompanyUnits');
  const unitById = {}; units.forEach(function (unit) { unitById[unit.id] = unit; });
  companies.forEach(function (company) {
    company.supportUnits = links.filter(function (link) { return link.companyId === company.id; }).map(function (link) { return { id: link.unitId, name: unitById[link.unitId] ? unitById[link.unitId].name : '', groupName: link.groupName || '' }; }).filter(function (unit) { return unit.name; });
  });
  return { companies: companies, units: units, meetings: readRecords_(db, 'Meetings'), tasks: readRecords_(db, 'Tasks'), videos: readRecords_(db, 'Videos'), settings: settingsObject_(db) };
}

function loadState_(db) {
  const companiesByName = {}, unitsByName = {}, linksByKey = {}, meetingsByEvent = {}, videosByKey = {};
  readRecords_(db, 'Companies').forEach(function (row) { companiesByName[row.normalizedName] = row; });
  readRecords_(db, 'Units').forEach(function (row) { unitsByName[row.normalizedName] = row; });
  readRecords_(db, 'CompanyUnits').forEach(function (row) { linksByKey[row.companyId + '|' + row.unitId] = row; });
  readRecords_(db, 'Meetings').forEach(function (row) { meetingsByEvent[row.calendarEventId] = row; });
  readRecords_(db, 'Videos').forEach(function (row) { videosByKey[row.companyId + '|' + row.url] = row; });
  return { companiesByName, unitsByName, linksByKey, meetingsByEvent, videosByKey };
}

function createCompany_(db, name, source) {
  const now = isoNow_();
  const company = { id: Utilities.getUuid(), name: String(name).trim(), normalizedName: normalize_(name), industry: '', contact: '', status: '確認待ち', source: source, createdAt: now, updatedAt: now };
  appendRecord_(db, 'Companies', company); return company;
}
function createUnit_(db, name) { const unit = { id: Utilities.getUuid(), name: String(name).trim(), normalizedName: normalize_(name), createdAt: isoNow_() }; appendRecord_(db, 'Units', unit); return unit; }
function normalize_(value) { return String(value || '').normalize('NFKC').replace(/[\s　]/g, '').replace(/(株式会社|有限会社|合同会社)/g, '').toLowerCase(); }
function isoNow_() { return new Date().toISOString(); }
function currentUserEmail_() { return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || 'Googleアカウント'; }
function isDeclined_(event) { try { return event.getMyStatus() === CalendarApp.GuestStatus.NO; } catch (error) { return false; } }
function withUserLock_(callback) { const lock = LockService.getUserLock(); lock.waitLock(30000); try { return callback(); } finally { lock.releaseLock(); } }

function readRecords_(db, sheetName) {
  const sheet = db.getSheetByName(sheetName), lastRow = sheet.getLastRow(), headers = SHEETS[sheetName];
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues().map(function (values) { const row = {}; headers.forEach(function (header, index) { row[header] = values[index]; }); return row; });
}
function appendRecord_(db, sheetName, record) { const headers = SHEETS[sheetName]; db.getSheetByName(sheetName).appendRow(headers.map(function (header) { return record[header] == null ? '' : record[header]; })); }
function findRecord_(db, sheetName, key, value) { return readRecords_(db, sheetName).filter(function (row) { return row[key] === String(value); })[0] || null; }
function upsertRecord_(db, sheetName, record, key) {
  const sheet = db.getSheetByName(sheetName), headers = SHEETS[sheetName], rows = readRecords_(db, sheetName);
  const index = rows.findIndex(function (row) { return row[key] === String(record[key]); });
  const values = headers.map(function (header) { return record[header] == null ? '' : record[header]; });
  if (index < 0) sheet.appendRow(values); else sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
}
function deleteWhere_(db, sheetName, predicate) { const sheet = db.getSheetByName(sheetName), rows = readRecords_(db, sheetName); for (let index = rows.length - 1; index >= 0; index--) if (predicate(rows[index])) sheet.deleteRow(index + 2); }
function settingsObject_(db) { const result = {}; readRecords_(db, 'Settings').forEach(function (row) { result[row.key] = row.value; }); return result; }
function setSetting_(db, key, value) { upsertRecord_(db, 'Settings', { key: key, value: value }, 'key'); }

function runParserTests() {
  const cases = [
    ['【SMTG】採用支援：株式会社ABC', ['採用支援'], '株式会社ABC'],
    ['【SMTG】採用支援＋営業支援：株式会社ABC 様', ['採用支援','営業支援'], '株式会社ABC'],
    ['通常MTG：株式会社ABC', null, null]
  ];
  cases.forEach(function (test) {
    const parsed = parseSmtgTitle_(test[0]);
    if (test[1] === null && parsed !== null) throw new Error('解析除外に失敗: ' + test[0]);
    if (test[1] !== null && (!parsed || parsed.companyName !== test[2] || JSON.stringify(parsed.unitNames) !== JSON.stringify(test[1]))) throw new Error('解析に失敗: ' + test[0]);
  });
  return 'Parser tests passed: ' + cases.length;
}
