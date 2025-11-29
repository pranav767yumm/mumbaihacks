// 1. ROUTING
function doGet(e) {
  var route = e.parameter.page || 'index';
  var template = HtmlService.createTemplateFromFile(route);
  return template.evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setTitle('HealthX Quest login')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// 2. DATA FETCHER (For History Page)
function getHistoryData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Grabs first sheet automatically
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    // Fetch data: Rows 2 to end, Columns 1 to 3
    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    
    // Convert Dates to Strings to prevent HTML errors
    var cleanData = data.map(function(row) {
      if (row[0] && row[0] instanceof Date) {
        row[0] = row[0].toLocaleString(); 
      }
      return row;
    });

    return cleanData.reverse(); 
  } catch (e) {
    return [["Error", "Sheet Read Failed: " + e.toString(), ""]];
  }
}

// 3. MAIN ACTION: Save Image & Log to Sheet
function processCapture(dataUrl, actionName) {
  try {
    var base64Data = dataUrl.split(',')[1];
    var decodedBlob = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedBlob, "image/png", "HealthX_" + actionName + "_" + Date.now() + ".png");
    
    // --- FOLDER SELECTION (Using your specific ID) ---
    var folderId = "1jVjund7wvBaEOlN1c2RgvIOVrtW7Pmai"; 
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch(e) {
      // Fallback if ID fails
      var folderName = "BodyTracker_Images";
      var folders = DriveApp.getFoldersByName(folderName);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    }
    // ------------------------------------------------

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileUrl = file.getUrl();
    
    // Log to Sheet (First sheet)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([new Date(), actionName || "Unknown", fileUrl]);
    
    return { success: true, url: fileUrl };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// --- COIN FUNCTIONS ---
function getUserCoins() {
  var props = PropertiesService.getUserProperties();
  var coins = props.getProperty('coins');
  // Default to 100 if user has no history
  if (coins === null) { props.setProperty('coins', '100'); return 100; }
  return parseInt(coins);
}

function addCoins(amount) {
  var props = PropertiesService.getUserProperties();
  var current = parseInt(props.getProperty('coins') || 0);
  var newBal = current + amount;
  props.setProperty('coins', newBal.toString());
  return newBal;
}
