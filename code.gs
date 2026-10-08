/**
 * Google Apps Script for "SEW THE SOUND"
 * Handles folder scanning, master data serving, order submission,
 * and Sound Library search (returns wav bytes as audioBase64).
 */

const FOLDER_ID = "1NFTXy-gqHPxHIPvDl01yVBl_XQx2qLmW";
const EXTRACTION_SHEET_NAME = "ファイル名抽出シート";
const SUBMISSION_SHEET_NAME = "送信情報収集シート";
const MASTER_DATA_SHEET_NAME = "マスタデータ";
const DELIVERY_SHEET_NAME = "配送情報シート";
const MAIL_TEMPLATE_SHEET_NAME = "メール文面";

// メール文面シートの初期値。シート側を編集すればそちらが優先される。
const DEFAULT_MAIL_FROM = "order@jogimagi.com";
const DEFAULT_MAIL_SENDER_NAME = "SEW THE SOUND";
const DEFAULT_MAIL_SUBJECT = "【SEW THE SOUND】ご注文ありがとうございます";
const DEFAULT_MAIL_BODY = [
  "{{name}} 様",
  "",
  "SEW THE SOUND です。この度はご注文いただきありがとうございます。",
  "以下の内容で承りました。商品の発送準備が整い次第、改めてご連絡いたします。",
  "",
  "──────────────",
  "ご注文ID: {{orderId}}",
  "プラン: {{plan}}",
  "オプション: {{option}}",
  "GPS日時: {{gpsDatetime}}",
  "GPS緯度経度: {{gpsLocation}}",
  "音が聴けるカード: {{soundCard}}",
  "アイテム: {{item}} / {{itemColor}} / {{itemSize}}",
  "糸: {{threads}}",
  "",
  "お届け先:",
  "〒{{zip}}",
  "{{address}}",
  "TEL {{phone}}",
  "",
  "送料: ¥{{shippingFee}}",
  "合計金額（税込）: ¥{{totalPrice}}",
  "──────────────",
  "",
  "※このメールは送信専用です。",
  "SEW THE SOUND"
].join("\n");

const SUBMISSION_HEADERS = [
  "タイムスタンプ", "選択ID", "プラン", "オプション", "アイテム", "アイテムカラー",
  "アイテムサイズ", "糸1", "糸2", "糸3", "備考", "トータル金額", "ステータス",
  "受取方法", "送料", "音が聴けるカード", "GPS日時", "GPS緯度経度"
];

const OTHER_COLOR_ITEMS = "Tシャツ, ロンT, キッズT, トートバック";
const OTHER_SIZE_ITEMS = "Tシャツ, ロンT, キッズT";
const DEFAULT_GPS_LOCATION = "34.814733,135.378753";

const DEFAULT_THREAD_COLORS = [
  ["ThreadColor", "A", 0, "#ffffff|White", "表示"],
  ["ThreadColor", "B", 0, "#212322|Black", "表示"],
  ["ThreadColor", "C", 0, "#847f87|Gray", "表示"],
  ["ThreadColor", "D", 0, "#006aad|Blue", "表示"],
  ["ThreadColor", "E", 0, "#8ec5bd|Light Blue", "表示"],
  ["ThreadColor", "F", 0, "#007a3e|Green", "表示"],
  ["ThreadColor", "G", 0, "#b1d0a2|Pale Green", "表示"],
  ["ThreadColor", "H", 0, "#d50032|Red", "表示"],
  ["ThreadColor", "I", 0, "#f79fba|Pink", "表示"],
  ["ThreadColor", "J", 0, "#e35205|Orange", "表示"],
  ["ThreadColor", "K", 0, "#f7e200|Yellow", "表示"],
  ["ThreadColor", "L", 0, "#823b34|Brown", "表示"]
];

const DELIVERY_HEADERS = [
  "タイムスタンプ", "選択ID", "郵便番号", "住所", "建物名・部屋番号", "名前",
  "電話番号", "メールアドレス", "送料", "合計金額", "進捗", "送り状番号", "発送日", "備考"
];

// 送料マスタ初期値: 北海道(00x, 04x-09x) / 沖縄(90x) と主な離島の郵便番号プレフィックス
const DEFAULT_REMOTE_PREFIXES =
  "00,04,05,06,07,08,09,90,685,817,853,894,8913,8914,952,10021";

function onOpen() {
  setupSpreadsheet();
}

/**
 * マスタ編集時:
 * - ThreadColor の備考(#hex|Name) → 同じ行の F列（色見本）に背景色
 * - F25 のカラーコード → F24 の背景色
 * - 対象アイテムは「表示 / 非表示」プルダウン
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== MASTER_DATA_SHEET_NAME) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row < 2) return;

  const editedValue = e.range.getValue();

  // F25 のカラーコード → F24 背景
  if (col === 6 && row === 25) {
    applyBackgroundFromColorCode(sheet.getRange(24, 6), editedValue);
    return;
  }

  // ThreadColor: 備考(D列)編集 → 色見本(F列)
  if (col === 4) {
    const category = String(sheet.getRange(row, 1).getValue() || "");
    if (category === "ThreadColor") {
      applyBackgroundFromColorCode(sheet.getRange(row, 6), editedValue);
    }
  }
}

/**
 * 備考やセル値から #RGB / #RRGGBB を抜き出して背景色を適用。
 */
function extractHexColor(raw) {
  const m = String(raw == null ? "" : raw).match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
  return m ? "#" + m[1] : "";
}

function applyBackgroundFromColorCode(cell, raw) {
  const hex = extractHexColor(raw);
  if (hex) {
    cell.setBackground(hex);
    return;
  }
  if (String(raw == null ? "" : raw).trim() === "") {
    cell.setBackground(null);
  }
}

/**
 * Initial setup of the spreadsheet structure.
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Extraction Sheet
  let extractionSheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
  if (!extractionSheet) {
    extractionSheet = ss.insertSheet(EXTRACTION_SHEET_NAME);
    extractionSheet.appendRow(["フルファイル名", "ファイルURL", "ファイルID"]);
  }
  
  // 2. Submission Sheet
  let submissionSheet = ss.getSheetByName(SUBMISSION_SHEET_NAME);
  if (!submissionSheet) {
    submissionSheet = ss.insertSheet(SUBMISSION_SHEET_NAME);
    submissionSheet.appendRow(SUBMISSION_HEADERS);
  } else {
    // 既存シートに不足している列（受取方法・送料）を末尾へ追加
    const lastCol = submissionSheet.getLastColumn();
    const header = submissionSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    SUBMISSION_HEADERS.forEach(function (name) {
      if (header.indexOf(name) === -1) {
        submissionSheet.getRange(1, submissionSheet.getLastColumn() + 1).setValue(name);
      }
    });
  }
  
  // 3. Master Data Sheet
  let masterSheet = ss.getSheetByName(MASTER_DATA_SHEET_NAME);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(MASTER_DATA_SHEET_NAME);
    masterSheet.appendRow(["カテゴリ", "項目名", "価格", "備考", "対象アイテム"]);
    
    const initialData = [
      ["Item", "持ち込み", 0, "", ""],
      ["Item", "ポーチ", 500, "", ""],
      ["Item", "トートバック", 500, "", ""],
      ["Item", "キッズT", 500, "", ""],
      ["Item", "Tシャツ", 1500, "", ""],
      ["Item", "ロンT", 2000, "", ""],
      
      ["ItemColor", "ホワイト", 0, "", "Tシャツ, ロンT, キッズT"],
      ["ItemColor", "ブラック", 0, "", "Tシャツ, キッズT"],
      ["ItemColor", "グレー", 0, "", "ロンT"],
      ["ItemColor", "ナチュラル", 0, "", "ポーチ, トートバック"],
      ["ItemColor", "その他", 0, "", OTHER_COLOR_ITEMS],
      
      ["ItemSize", "S", 0, "", "Tシャツ"],
      ["ItemSize", "M", 0, "", "Tシャツ, ロンT"],
      ["ItemSize", "L", 0, "", "Tシャツ, ロンT"],
      ["ItemSize", "XL", 0, "", "Tシャツ"],
      ["ItemSize", "110", 0, "", "キッズT"],
      ["ItemSize", "130", 0, "", "キッズT"],
      ["ItemSize", "F", 0, "", "ポーチ, トートバック, 持ち込み"],
      ["ItemSize", "その他", 0, "", OTHER_SIZE_ITEMS],

      ["GpsConfig", "緯度経度", 0, DEFAULT_GPS_LOCATION, ""]
    ];

    initialData.concat(DEFAULT_THREAD_COLORS).forEach(row => masterSheet.appendRow(row));
  }

  migrateMasterData(masterSheet);
  setupMasterThreadUi(masterSheet);

  // 送料マスタ（未登録なら追加）
  const masterValues = masterSheet.getDataRange().getValues();
  const hasShipping = masterValues.some(row => row[0] === "Shipping");
  if (!hasShipping) {
    masterSheet.appendRow(["Shipping", "通常送料", 0, "北海道・沖縄・離島以外", ""]);
    masterSheet.appendRow([
      "Shipping", "遠方送料", 1000,
      "北海道・沖縄・離島（対象アイテム列に郵便番号の先頭数字をカンマ区切りで記載）",
      DEFAULT_REMOTE_PREFIXES
    ]);
  }

  // 4. Delivery Sheet
  let deliverySheet = ss.getSheetByName(DELIVERY_SHEET_NAME);
  if (!deliverySheet) {
    deliverySheet = ss.insertSheet(DELIVERY_SHEET_NAME);
    deliverySheet.appendRow(DELIVERY_HEADERS);
  }
  applyDeliveryTextColumns(deliverySheet);

  // 5. Mail Template Sheet
  let mailSheet = ss.getSheetByName(MAIL_TEMPLATE_SHEET_NAME);
  if (!mailSheet) {
    mailSheet = ss.insertSheet(MAIL_TEMPLATE_SHEET_NAME);
    mailSheet.appendRow(["項目", "内容"]);
    mailSheet.appendRow(["差出人メールアドレス", DEFAULT_MAIL_FROM]);
    mailSheet.appendRow(["差出人名", DEFAULT_MAIL_SENDER_NAME]);
    mailSheet.appendRow(["件名", DEFAULT_MAIL_SUBJECT]);
    mailSheet.appendRow(["本文", DEFAULT_MAIL_BODY]);
    mailSheet.appendRow(["", ""]);
    mailSheet.appendRow(["差し込みタグ", [
      "{{name}} お名前",
      "{{orderId}} ご注文ID",
      "{{plan}} プラン",
      "{{option}} オプション",
      "{{gpsDatetime}} GPS日時",
      "{{gpsLocation}} GPS緯度経度",
      "{{soundCard}} 音が聴けるカード",
      "{{item}} アイテム",
      "{{itemColor}} アイテムカラー",
      "{{itemSize}} アイテムサイズ",
      "{{threads}} 糸（カンマ区切り）",
      "{{zip}} 郵便番号",
      "{{address}} 住所（建物名を含む）",
      "{{building}} 建物名・部屋番号",
      "{{phone}} 電話番号",
      "{{email}} メールアドレス",
      "{{shippingFee}} 送料",
      "{{totalPrice}} 合計金額"
    ].join("\n")]);

    mailSheet.setColumnWidth(1, 180);
    mailSheet.setColumnWidth(2, 560);
    mailSheet.getRange("B5").setWrap(true);
    mailSheet.getRange("B7").setWrap(true);
  } else {
    ensureMailTemplateTags(mailSheet);
  }
}

/**
 * 既存マスタへ不足行の追記・その他カラー対象の修正。
 */
function migrateMasterData(masterSheet) {
  const values = masterSheet.getDataRange().getValues();
  let hasOtherSize = false;
  let hasGpsLocation = false;
  const threadIds = {};

  for (let i = 1; i < values.length; i++) {
    const category = values[i][0];
    const name = values[i][1];
    if (category === "ItemColor" && name === "その他") {
      const current = String(values[i][4] || "");
      if (current !== OTHER_COLOR_ITEMS) {
        masterSheet.getRange(i + 1, 5).setValue(OTHER_COLOR_ITEMS);
      }
    }
    if (category === "ItemSize" && name === "その他") {
      hasOtherSize = true;
    }
    if (category === "GpsConfig" && name === "緯度経度") {
      hasGpsLocation = true;
    }
    if (category === "ThreadColor") {
      threadIds[String(name)] = true;
    }
  }

  if (!hasOtherSize) {
    masterSheet.appendRow(["ItemSize", "その他", 0, "", OTHER_SIZE_ITEMS]);
  }
  if (!hasGpsLocation) {
    masterSheet.appendRow(["GpsConfig", "緯度経度", 0, DEFAULT_GPS_LOCATION, ""]);
  }
  DEFAULT_THREAD_COLORS.forEach(function (row) {
    if (!threadIds[row[1]]) {
      masterSheet.appendRow(row);
    }
  });
}

/**
 * ThreadColor 行の「表示/非表示」プルダウンと色見本(F列)を整える。
 * 手動実行: setupMasterThreadUi(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("マスタデータ"))
 */
function setupMasterThreadUi(masterSheet) {
  if (!masterSheet) {
    masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MASTER_DATA_SHEET_NAME);
  }
  if (!masterSheet) return;

  if (String(masterSheet.getRange(1, 6).getValue() || "") !== "色見本") {
    masterSheet.getRange(1, 6).setValue("色見本");
  }
  masterSheet.setColumnWidth(6, 56);

  const visibilityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["表示", "非表示"], true)
    .setAllowInvalid(false)
    .setHelpText("表示=注文画面に出す / 非表示=出さない")
    .build();

  const values = masterSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] !== "ThreadColor") continue;
    const row = i + 1;
    const flagCell = masterSheet.getRange(row, 5);
    flagCell.setDataValidation(visibilityRule);

    const flag = String(values[i][4] || "").trim();
    if (flag !== "表示" && flag !== "非表示") {
      // 空欄は従来どおり非表示扱い → 明示的に「非表示」へ
      flagCell.setValue("非表示");
    }

    const swatch = masterSheet.getRange(row, 6);
    swatch.setValue("");
    applyBackgroundFromColorCode(swatch, values[i][3]);
  }

  // F25 にカラーコード文字列があるときだけ F24 へ初期同期（空の色見本で消さない）
  const f25Value = masterSheet.getRange(25, 6).getValue();
  if (extractHexColor(f25Value)) {
    applyBackgroundFromColorCode(masterSheet.getRange(24, 6), f25Value);
  }
}

/**
 * 既存メール文面に不足タグを挿入する。
 */
function ensureMailTemplateTags(mailSheet) {
  const data = mailSheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    if (key === "本文") {
      let body = String(data[i][1] || "");
      if (body.indexOf("{{soundCard}}") === -1) {
        if (body.indexOf("オプション: {{option}}") !== -1) {
          body = body.replace(
            "オプション: {{option}}",
            "オプション: {{option}}\n音が聴けるカード: {{soundCard}}"
          );
        } else {
          body = body + "\n音が聴けるカード: {{soundCard}}";
        }
      }
      if (body.indexOf("{{gpsDatetime}}") === -1) {
        if (body.indexOf("オプション: {{option}}") !== -1) {
          body = body.replace(
            "オプション: {{option}}",
            "オプション: {{option}}\nGPS日時: {{gpsDatetime}}\nGPS緯度経度: {{gpsLocation}}"
          );
        } else {
          body = body + "\nGPS日時: {{gpsDatetime}}\nGPS緯度経度: {{gpsLocation}}";
        }
      }
      mailSheet.getRange(i + 1, 2).setValue(body);
    }
    if (key === "差し込みタグ") {
      let tags = String(data[i][1] || "");
      if (tags.indexOf("{{soundCard}}") === -1) {
        tags = tags + "\n{{soundCard}} 音が聴けるカード";
      }
      if (tags.indexOf("{{gpsDatetime}}") === -1) {
        tags = tags + "\n{{gpsDatetime}} GPS日時\n{{gpsLocation}} GPS緯度経度";
      }
      mailSheet.getRange(i + 1, 2).setValue(tags);
    }
  }
}

/**
 * Scans the Google Drive folder for .wav files and updates the extraction sheet.
 * Sorts by filename timestamp (YYYYMMDD_HHMMSS) descending.
 */
function scanWavFiles() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const fileData = [];
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.toLowerCase().endsWith(".wav")) {
      fileData.push({
        fullName: name,
        url: file.getUrl(),
        id: file.getId(),
        timestamp: parseTimestamp(name)
      });
    }
  }
  
  fileData.sort((a, b) => b.timestamp - a.timestamp);
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
  sheet.clear();
  sheet.appendRow(["フルファイル名", "ファイルURL", "ファイルID"]);
  
  fileData.forEach(f => {
    sheet.appendRow([f.fullName, f.url, f.id]);
  });
}

/**
 * Parses YYYYMMDD_HHMMSS from filename (e.g., 20260302_083345_name.wav)
 */
function parseTimestamp(fileName) {
  const match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6]).getTime();
  }
  return 0;
}

/**
 * Shorten ID for display: 20260319_005608_test -> 005608_test
 */
function parseDisplayId(id) {
  return id.replace(/^\d{8}_/, "");
}

/**
 * JSON 応答。Library 検索と注文 API で共用する。
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Library 用: Drive 固定フォルダから {name}.wav を探し、3秒音声を JSON で返す。
 * ブラウザは Drive を直接開かず、audioBase64 から再生・ダウンロードする。
 */
function searchLibraryAudio(rawName) {
  const name = String(rawName || "").replace(/^\s+|\s+$/g, "").replace(/\.wav$/i, "");
  if (!name) {
    return jsonResponse({ found: false });
  }

  const fileName = name + ".wav";
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(fileName);

  if (!files.hasNext()) {
    return jsonResponse({ found: false });
  }

  const file = files.next();
  const blob = file.getBlob();
  let mime = blob.getContentType() || "audio/wav";
  if (mime === "application/octet-stream") {
    mime = "audio/wav";
  }

  return jsonResponse({
    found: true,
    name: fileName,
    id: file.getId(),
    mimeType: mime,
    audioBase64: Utilities.base64Encode(blob.getBytes())
  });
}

/**
 * Handles GET requests: returns latest 5 files and master data,
 * OR handles search queries for the sound library when 'name' parameter is present.
 */
function doGet(e) {
  // =======================================================
  // 1. Library検索システム用 (name パラメータが存在する場合)
  // =======================================================
  if (e.parameter && e.parameter.name) {
    try {
      return searchLibraryAudio(e.parameter.name);
    } catch (err) {
      return jsonResponse({ found: false });
    }
  }

  // =======================================================
  // 2. ダッシュボード・フォームシステム用 (パラメータなしの場合)
  // =======================================================
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get latest 5 from extraction sheet
  const extractionSheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
  const extractionData = extractionSheet.getDataRange().getValues();
  const latestFiles = extractionData.slice(1, 6).map(row => {
    const fullName = row[0];
    const fullId = fullName.replace(/\.wav$/i, "");
    const displayId = parseDisplayId(fullId);
    
    return {
      fullName: fullName,
      fullId: fullId,
      friendlyId: fullId, // Keep for compatibility
      displayId: displayId,
      url: row[1]
    };
  });
  
  // Get master data
  const masterSheet = ss.getSheetByName(MASTER_DATA_SHEET_NAME);
  const masterData = masterSheet.getDataRange().getValues();
  const master = {
    items: [],
    colors: [],
    sizes: [],
    shipping: [],
    threads: [],
    gpsConfig: []
  };
  
  masterData.slice(1).forEach(row => {
    const category = row[0];
    const item = { 
      name: row[1], 
      price: row[2], 
      note: row[3],
      associatedItems: row[4] ? String(row[4]).split(",").map(i => i.trim()).filter(Boolean) : []
    };
    if (category === "Item") master.items.push(item);
    if (category === "ItemColor") master.colors.push(item);
    if (category === "ItemSize") master.sizes.push(item);
    if (category === "Shipping") master.shipping.push(item);
    if (category === "ThreadColor") master.threads.push(item);
    if (category === "GpsConfig") master.gpsConfig.push(item);
  });
  
  // Delivery records keyed by order ID (latest wins)
  const deliveryMap = {};
  const deliverySheet = ss.getSheetByName(DELIVERY_SHEET_NAME);
  if (deliverySheet) {
    deliverySheet.getDataRange().getValues().slice(1).forEach(row => {
      if (!row[1]) return;
      deliveryMap[row[1]] = {
        zip: row[2],
        address: row[3],
        building: row[4],
        name: row[5],
        phone: row[6],
        email: row[7],
        shippingFee: row[8],
        progress: row[10],
        trackingNumber: row[11]
      };
    });
  }
  
  // Get latest 10 submissions for admin dashboard
  const submissionSheet = ss.getSheetByName(SUBMISSION_SHEET_NAME);
  const submissionData = submissionSheet.getDataRange().getValues();
  const submissionHeader = submissionData[0] || [];
  const col = function (name) {
    return submissionHeader.indexOf(name);
  };
  const cell = function (row, name, fallback) {
    const i = col(name);
    if (i === -1) return fallback;
    const v = row[i];
    return v === "" || v === null || v === undefined ? fallback : v;
  };
  const submissions = submissionData.slice(1).reverse().slice(0, 10).map(row => {
    const selectedId = cell(row, "選択ID", row[1]);
    return {
      timestamp: cell(row, "タイムスタンプ", row[0]),
      selectedId: selectedId,
      plan: cell(row, "プラン", row[2]),
      option: cell(row, "オプション", row[3]),
      item: cell(row, "アイテム", row[4]),
      itemColor: cell(row, "アイテムカラー", row[5]),
      itemSize: cell(row, "アイテムサイズ", row[6]),
      thread1: cell(row, "糸1", row[7]),
      thread2: cell(row, "糸2", row[8]),
      thread3: cell(row, "糸3", row[9]),
      notes: cell(row, "備考", row[10]),
      totalPrice: cell(row, "トータル金額", row[11]),
      status: cell(row, "ステータス", row[12]),
      deliveryMethod: cell(row, "受取方法", row[13] || "当日渡し"),
      shippingFee: cell(row, "送料", row[14] || 0),
      soundCardQty: Number(cell(row, "音が聴けるカード", 0) || 0),
      gpsDatetime: cell(row, "GPS日時", ""),
      gpsLocation: cell(row, "GPS緯度経度", ""),
      delivery: deliveryMap[selectedId] || null
    };
  });
  
  const response = {
    latestFiles: latestFiles,
    masterData: master,
    submissions: submissions
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles POST requests: appends submission data.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SUBMISSION_SHEET_NAME);
    
    const data = JSON.parse(e.postData.contents);
    const timestamp = new Date();
    
    const deliveryMethod = data.deliveryMethod === "配送" ? "配送" : "当日渡し";
    const shippingFee = data.shippingFee || 0;
    const soundCardQty = Number(data.soundCardQty || 0);

    // 不足ヘッダ（音が聴けるカード等）を末尾へ追加
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    SUBMISSION_HEADERS.forEach(function (name) {
      if (header.indexOf(name) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(name);
        header.push(name);
      }
    });

    const valuesByHeader = {
      "タイムスタンプ": timestamp,
      "選択ID": data.selectedId,
      "プラン": data.plan,
      "オプション": data.option || "なし",
      "アイテム": data.item,
      "アイテムカラー": data.itemColor || "",
      "アイテムサイズ": data.itemSize || "",
      "糸1": data.thread1,
      "糸2": data.thread2,
      "糸3": data.thread3,
      "備考": data.notes,
      "トータル金額": data.totalPrice,
      "ステータス": "新規",
      "受取方法": deliveryMethod,
      "送料": shippingFee,
      "音が聴けるカード": soundCardQty,
      "GPS日時": data.option === "GPS日時" ? (data.gpsDatetime || "") : "",
      "GPS緯度経度": data.option === "GPS日時" ? (data.gpsLocation || "") : ""
    };

    const row = header.map(function (name) {
      return valuesByHeader[name] !== undefined ? valuesByHeader[name] : "";
    });

    sheet.appendRow(row);
    
    if (deliveryMethod === "配送") {
      appendDeliveryRow(ss, timestamp, data, shippingFee);
      sendDeliveryConfirmationMail(ss, data, shippingFee);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a row to the delivery sheet. Tracking number / shipping date are
 * left blank for staff to fill in manually.
 */
function appendDeliveryRow(ss, timestamp, data, shippingFee) {
  let deliverySheet = ss.getSheetByName(DELIVERY_SHEET_NAME);
  if (!deliverySheet) {
    deliverySheet = ss.insertSheet(DELIVERY_SHEET_NAME);
    deliverySheet.appendRow(DELIVERY_HEADERS);
  }
  applyDeliveryTextColumns(deliverySheet);
  
  deliverySheet.appendRow([
    timestamp,
    data.selectedId,
    data.shipZip || "",
    data.shipAddress || "",
    data.shipBuilding || "",
    data.shipName || "",
    data.shipPhone || "",
    data.shipEmail || "",
    shippingFee,
    data.totalPrice,
    "未発送",
    "",
    "",
    ""
  ]);
}

/**
 * 郵便番号(C列)・電話番号(G列)・送り状番号(L列) を書式「テキスト」にする。
 * 数値として扱われると先頭の 0 が失われるため。
 */
function applyDeliveryTextColumns(sheet) {
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  [3, 7, 12].forEach(function (col) {
    sheet.getRange(2, col, rows, 1).setNumberFormat("@");
  });
}

/**
 * 既存データの先頭 0 を復元する（郵便番号は7桁、電話番号は10〜11桁に整形）。
 * メニューやエディタから手動で実行するための補助関数。
 */
function repairDeliveryLeadingZeros() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DELIVERY_SHEET_NAME);
  if (!sheet) return;
  
  applyDeliveryTextColumns(sheet);
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  const pad = function (value, length) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    return digits.length < length ? "0".repeat(length - digits.length) + digits : digits;
  };
  
  const zipRange = sheet.getRange(2, 3, lastRow - 1, 1);
  zipRange.setValues(zipRange.getValues().map(function (row) {
    return [pad(row[0], 7)];
  }));
  
  const phoneRange = sheet.getRange(2, 7, lastRow - 1, 1);
  phoneRange.setValues(phoneRange.getValues().map(function (row) {
    const digits = String(row[0]).replace(/\D/g, "");
    if (!digits) return [""];
    // 9桁なら固定電話、10桁なら携帯として先頭の 0 が落ちたとみなす
    return [digits.length === 9 || digits.length === 10 ? "0" + digits : digits];
  }));
}

/**
 * Reads the editable mail template from the spreadsheet.
 * Missing sheet or blank cells fall back to the defaults above.
 */
function getMailTemplate(ss) {
  const template = {
    from: DEFAULT_MAIL_FROM,
    senderName: DEFAULT_MAIL_SENDER_NAME,
    subject: DEFAULT_MAIL_SUBJECT,
    body: DEFAULT_MAIL_BODY
  };
  
  const sheet = ss.getSheetByName(MAIL_TEMPLATE_SHEET_NAME);
  if (!sheet) return template;
  
  sheet.getDataRange().getValues().forEach(function (row) {
    const key = String(row[0]).trim();
    const value = row[1];
    if (value === "" || value === null || value === undefined) return;
    
    if (key === "差出人メールアドレス") template.from = String(value).trim();
    if (key === "差出人名") template.senderName = String(value).trim();
    if (key === "件名") template.subject = String(value);
    if (key === "本文") template.body = String(value);
  });
  
  return template;
}

/**
 * Replaces {{tag}} placeholders with the order values.
 */
function renderMailTemplate(text, vars) {
  return String(text).replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return vars[key] !== undefined && vars[key] !== null ? vars[key] : "";
  });
}

/**
 * Sends an order confirmation mail to the customer.
 * Failures are logged only, so that a mail error never rejects the order.
 */
function sendDeliveryConfirmationMail(ss, data, shippingFee) {
  try {
    const to = data.shipEmail;
    if (!to) return;
    
    const template = getMailTemplate(ss);
    const soundCardQty = Number(data.soundCardQty || 0);
    const isGps = data.option === "GPS日時";
    const vars = {
      name: data.shipName || "",
      orderId: data.selectedId || "",
      plan: data.plan || "",
      option: data.option || "なし",
      gpsDatetime: isGps ? (data.gpsDatetime || "") : "なし",
      gpsLocation: isGps ? (data.gpsLocation || "") : "なし",
      soundCard: soundCardQty > 0 ? soundCardQty + "枚" : "なし",
      item: data.item || "",
      itemColor: data.itemColor || "",
      itemSize: data.itemSize || "",
      threads: [data.thread1, data.thread2, data.thread3].filter(Boolean).join(", "),
      zip: data.shipZip || "",
      address: [data.shipAddress, data.shipBuilding].filter(Boolean).join(" "),
      building: data.shipBuilding || "",
      phone: data.shipPhone || "",
      email: data.shipEmail || "",
      shippingFee: Number(shippingFee || 0).toLocaleString(),
      totalPrice: Number(data.totalPrice || 0).toLocaleString()
    };
    
    const options = {
      name: template.senderName,
      replyTo: template.from
    };
    
    // from は Gmail に登録済みのエイリアスでのみ指定できる
    const aliases = GmailApp.getAliases();
    if (template.from && aliases.indexOf(template.from) !== -1) {
      options.from = template.from;
    } else {
      console.warn(
        "差出人 " + template.from + " は Gmail のエイリアス未登録のため、" +
        "スクリプト所有者のアドレスで送信します（Gmail の設定 > アカウント > 名前 で追加してください）"
      );
    }
    
    GmailApp.sendEmail(
      to,
      renderMailTemplate(template.subject, vars),
      renderMailTemplate(template.body, vars),
      options
    );
  } catch (mailError) {
    console.error("Failed to send confirmation mail: " + mailError);
  }
}
