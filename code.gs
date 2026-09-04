/**
 * Google Apps Script for "SEW THE SOUND"
 * Handles folder scanning, master data serving, order submission,
 * and specific file searching for the Sound Library.
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
  "受取方法", "送料"
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
      ["ItemColor", "その他", 0, "", "Tシャツ, ロンT, キッズTポーチ, トートバック, 持ち込み"],
      
      ["ItemSize", "S", 0, "", "Tシャツ"],
      ["ItemSize", "M", 0, "", "Tシャツ, ロンT"],
      ["ItemSize", "L", 0, "", "Tシャツ, ロンT"],
      ["ItemSize", "XL", 0, "", "Tシャツ"],
      ["ItemSize", "110", 0, "", "キッズT"],
      ["ItemSize", "130", 0, "", "キッズT"],
      ["ItemSize", "F", 0, "", "ポーチ, トートバック, 持ち込み"]
    ];
    
    initialData.forEach(row => masterSheet.appendRow(row));
  }

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
 * Handles GET requests: returns latest 5 files and master data,
 * OR handles search queries for the sound library when 'name' parameter is present.
 */
function doGet(e) {
  // =======================================================
  // 1. Library検索システム用 (name パラメータが存在する場合)
  // =======================================================
  if (e.parameter && e.parameter.name) {
    const name = e.parameter.name;
    const fileName = name + '.wav'; 
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(fileName);

    if (files.hasNext()) {
      const file = files.next();
      const result = {
        found: true,
        name: fileName,
        id: file.getId()
      };
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({found: false})).setMimeType(ContentService.MimeType.JSON);
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
    shipping: []
  };
  
  masterData.slice(1).forEach(row => {
    const category = row[0];
    const item = { 
      name: row[1], 
      price: row[2], 
      note: row[3],
      associatedItems: row[4] ? String(row[4]).split(",").map(i => i.trim()) : []
    };
    if (category === "Item") master.items.push(item);
    if (category === "ItemColor") master.colors.push(item);
    if (category === "ItemSize") master.sizes.push(item);
    if (category === "Shipping") master.shipping.push(item);
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
  
  // Get latest 6 submissions for admin dashboard
  const submissionSheet = ss.getSheetByName(SUBMISSION_SHEET_NAME);
  const submissionData = submissionSheet.getDataRange().getValues();
  const submissions = submissionData.slice(1).reverse().slice(0, 6).map(row => {
    return {
      timestamp: row[0],
      selectedId: row[1],
      plan: row[2],
      option: row[3],
      item: row[4],
      itemColor: row[5],
      itemSize: row[6],
      thread1: row[7],
      thread2: row[8],
      thread3: row[9],
      notes: row[10],
      totalPrice: row[11],
      status: row[12],
      deliveryMethod: row[13] || "当日渡し",
      shippingFee: row[14] || 0,
      delivery: deliveryMap[row[1]] || null
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
    
    const row = [
      timestamp,
      data.selectedId,
      data.plan,
      data.option || "なし",
      data.item,
      data.itemColor,
      data.itemSize,
      data.thread1,
      data.thread2,
      data.thread3,
      data.notes,
      data.totalPrice,
      "新規",
      deliveryMethod,
      shippingFee
    ];
    
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
    const vars = {
      name: data.shipName || "",
      orderId: data.selectedId || "",
      plan: data.plan || "",
      option: data.option || "なし",
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
