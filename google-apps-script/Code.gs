/**
 * Knight & Ember — inquiry sink for Google Sheets.
 *
 * Deploy this as a Web App bound to the inquiries spreadsheet:
 *   Extensions → Apps Script → paste this file →
 *   Project Settings → Script properties → add SHEETS_SHARED_SECRET →
 *   Deploy → New deployment → Web app →
 *     Execute as: Me   |   Who has access: Anyone → Deploy → authorize →
 *   copy the /exec URL into the site's GOOGLE_SHEETS_WEBHOOK_URL env var.
 *
 * The site POSTs { secret, values } where `values` is keyed by column label.
 * Headers are created (bold + frozen) on first write and auto-extend if new
 * fields appear later — the app is the source of truth for the columns.
 */

var TAB_NAME = 'Inquiries';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    var secret = PropertiesService.getScriptProperties().getProperty('SHEETS_SHARED_SECRET');
    if (secret && body.secret !== secret) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    var values = body.values || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);

    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // serialize concurrent submissions
    try {
      var headers = sheet.getLastColumn() > 0
        ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        : [];

      // Extend header row with any new keys, preserving existing order.
      var changed = headers.length === 0;
      Object.keys(values).forEach(function (k) {
        if (headers.indexOf(k) === -1) { headers.push(k); changed = true; }
      });
      if (changed) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }

      var row = headers.map(function (h) {
        return values[h] !== undefined && values[h] !== null ? values[h] : '';
      });
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'knight-ember-inquiries' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
