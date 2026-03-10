/**
 * Google Apps Script for "SEW THE SOUND"
 * Handles folder scanning, master data serving, and order submission.
 */

const FOLDER_ID = "1NFTXy-gqHPxHIPvDl01yVBl_XQx2qLmW";
const EXTRACTION_SHEET_NAME = "ファイル名抽出シート";
const SUBMISSION_SHEET_NAME = "送信情報収集シート";
const MASTER_DATA_SHEET_NAME = "マスタデータ";

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
    submissionSheet.appendRow([
      "タイムスタンプ", "選択ID", "プラン", "アイテム", "アイテムカラー", 
      "アイテムサイズ", "糸1", "糸2", "糸3", "備考", "トータル金額", "ステータス"
    ]);
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
}

/**
 * Scans the Google Drive folder for files and updates the extraction sheet.
 * (Performance Upgraded: 差分のみ追記し、全体をソートする仕様に変更)
 */
function scanWavFiles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
  
  // 1. 既存のファイルID一覧を取得（重複チェック用）
  const data = sheet.getDataRange().getValues();
  const existingIds = new Set();
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
        // C列(インデックス2)にファイルIDが入っている前提
        existingIds.add(data[i][2]);
    }
  }

  // 2. Driveフォルダをスキャンし、未登録のものだけ抽出
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const newRows = [];
  
  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    
    // シートに存在しないIDのみ処理対象とする
    if (!existingIds.has(id)) {
      const name = file.getName();
      // 元コードに合わせてURLとタイムスタンプも取得
      const url = file.getUrl();
      const timestamp = parseTimestamp(name);
      
      // 便宜上、一旦配列に保持。タイムスタンプもソート用に隠しデータとして持つか、後で全体ソートする
      newRows.push([name, url, id, timestamp]);
    }
  }
  
  // 3. 新規ファイルがあればシートの最後に追記
  if (newRows.length > 0) {
    // 追記用にタイムスタンプ列を除外した配列を作る
    const appendData = newRows.map(row => [row[0], row[1], row[2]]);
    sheet.getRange(sheet.getLastRow() + 1, 1, appendData.length, 3).setValues(appendData);
    console.log(`${appendData.length} 個の新しいファイルを追加しました。`);
    
    // 4. データが追加された場合のみ、A列のファイル名（またはタイムスタンプ要素）を基準に降順ソート
    // ヘッダー行(1行目)を除外して、2行目から最終行までをZ→A(降順)で並び替え
    const rangeToSort = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3);
    // A列(ファイル名の先頭が日付時刻)を基準に降順設定
    rangeToSort.sort({column: 1, ascending: false});
  } else {
    console.log('新しいファイルはありませんでした。');
  }
}

/**
 * Parses YYYYMMDD_HHMMSS from filename (e.g., 20260302_083345_name.wav)
 * ※この関数は元のままでOKですが念のため再掲します
 */
function parseTimestamp(fileName) {
  const match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6]).getTime();
  }
  return 0;
}


/**
 * Handles GET requests:
 * 1. 追加: STS Library 用の検索パラメータ(?name=)がある場合は該当ファイルのIDを返す
 * 2. 既存: それ以外の場合は最新5件とマスタデータを返す
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ==========================================
  // [追加機能] STS Libraryからの検索リクエスト処理
  // ==========================================
  if (e.parameter && e.parameter.name) {
    const nameQuery = e.parameter.name;
    const targetName = nameQuery + '.wav'; 
    
    // 抽出シートから検索（フルスキャン）
    const extractionSheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
    const data = extractionSheet.getDataRange().getValues();
    
    // A列(0) = フルファイル名, C列(2) = ファイルID
    for (let i = 1; i < data.length; i++) {
        // 大文字小文字の違いによるエラーを防ぐため念のためtoLowerCase()などで比較するのも◎
      if (data[i][0] === targetName) {
        return ContentService.createTextOutput(JSON.stringify({
          found: true,
          name: data[i][0],
          id: data[i][2]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 見つからなかった場合
    return ContentService.createTextOutput(JSON.stringify({found: false}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ==========================================
  // [既存機能] ダッシュボード / オーダー用リクエスト
  // ==========================================
  // Get latest 5 from extraction sheet
  const extractionSheet = ss.getSheetByName(EXTRACTION_SHEET_NAME);
  const extractionData = extractionSheet.getDataRange().getValues();
  const latestFiles = extractionData.slice(1, 6).map(row => {
    const fullName = row[0];
    // Parse ID: 20260302_083345_name -> 083345_name
    const friendlyId = fullName.replace(/^\d{8}_/, "").replace(/\.wav$/i, "");
    return {
      fullName: fullName,
      friendlyId: friendlyId,
      url: row[1]
    };
  });
  
  // Get master data
  const masterSheet = ss.getSheetByName(MASTER_DATA_SHEET_NAME);
  const masterData = masterSheet.getDataRange().getValues();
  const master = {
    items: [],
    colors: [],
    sizes: []
  };
  
  masterData.slice(1).forEach(row => {
    const category = row[0];
    const item = { 
      name: row[1], 
      price: row[2], 
      note: row[3],
      associatedItems: row[4] ? row[4].split(",").map(i => i.trim()) : []
    };
    if (category === "Item") master.items.push(item);
    if (category === "ItemColor") master.colors.push(item);
    if (category === "ItemSize") master.sizes.push(item);
  });
  
  // Get latest 6 submissions for admin dashboard
  const submissionSheet = ss.getSheetByName(SUBMISSION_SHEET_NAME);
  let submissions = [];
  if (submissionSheet) { // シート名の変更等で存在しない場合のエラー回避
    const submissionData = submissionSheet.getDataRange().getValues();
    submissions = submissionData.slice(1).reverse().slice(0, 6).map(row => {
      return {
        timestamp: row[0],
        selectedId: row[1],
        plan: row[2],
        item: row[3],
        itemColor: row[4],
        itemSize: row[5],
        thread1: row[6],
        thread2: row[7],
        thread3: row[8],
        notes: row[9],
        totalPrice: row[10],
        status: row[11]
      };
    });
  }
  
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
    
    const row = [
      timestamp,
      data.selectedId,
      data.plan,
      data.item,
      data.itemColor,
      data.itemSize,
      data.thread1,
      data.thread2,
      data.thread3,
      data.notes,
      data.totalPrice,
      "新規"
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
