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
      sendDeliveryConfirmationMail(data, shippingFee);
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
 * Sends an order confirmation mail to the customer.
 * Failures are logged only, so that a mail error never rejects the order.
 */
function sendDeliveryConfirmationMail(data, shippingFee) {
  try {
    const to = data.shipEmail;
    if (!to) return;
    
    const address = [data.shipAddress, data.shipBuilding].filter(Boolean).join(" ");
    const body = [
      data.shipName + " 様",
      "",
      "SEW THE SOUND です。この度はご注文いただきありがとうございます。",
      "以下の内容で承りました。商品の発送準備が整い次第、改めてご連絡いたします。",
      "",
      "──────────────",
      "ご注文ID: " + data.selectedId,
      "プラン: " + data.plan,
      "オプション: " + (data.option || "なし"),
      "アイテム: " + data.item + " / " + data.itemColor + " / " + data.itemSize,
      "糸: " + [data.thread1, data.thread2, data.thread3].filter(Boolean).join(", "),
      "",
      "お届け先:",
      "〒" + (data.shipZip || ""),
      address,
      "TEL " + (data.shipPhone || ""),
      "",
      "送料: ¥" + Number(shippingFee).toLocaleString(),
      "合計金額（税込）: ¥" + Number(data.totalPrice).toLocaleString(),
      "──────────────",
      "",
      "※このメールは送信専用です。",
      "SEW THE SOUND"
    ].join("\n");
    
    MailApp.sendEmail({
      to: to,
      subject: "【SEW THE SOUND】ご注文ありがとうございます",
      body: body
    });
  } catch (mailError) {
    console.error("Failed to send confirmation mail: " + mailError);
  }
}
