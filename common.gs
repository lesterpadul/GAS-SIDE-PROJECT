var SHEET_SETTINGS_TITLE = "sheet_settings";

//MARK: - send email
function sendEmail(sheet){
  // - get the sheet's document URL
  var url = sheet.getUrl();

  // - send the email
  var email = "padullester@gmail.com";

  // - Get the name of the document to use as an email subject line.
  var subject = sheet.getName() + "のURLはこちらになります";
  
  // - Append a new string to the "url" variable to use as an email body.
  var body = 'URL: ' + url;
  
  // - Send yourself an email with a link to the document.
  GmailApp.sendEmail(email, subject, body);
}

//MARK: - fetch JSON data
function fetchJSONData(url){
  // - The code below logs the HTML code of the Google home page.
  var options = {};
  options.headers = {"Authorization": "Basic " + Utilities.base64Encode("kb_ohbuchi-kenichi:karabiner0826")};
  
  // - get response
  var response = UrlFetchApp.fetch(url, options);
  
  // - initialise the global variables
  var jsonResponse = headers = {};
  
  // - try parsing the json information
  try {
    jsonResponse = JSON.parse(response);
  } catch (ex) {}
  
  // - return response
  return jsonResponse
}

//MARK: - fetch JSON data
function postJIRARequest(url){
  // - declare header payload
  var options = {
    'method' : 'get',
    'contentType': 'application/json',
    'headers' : {
      "Authorization": "Basic " + Utilities.base64Encode("bci.ohbuchi@karabiner.tech:karabiner0826")
    }
  };
  
  Logger.log("POSTING")
  Logger.log(url)
  
  // - get response
  var response = UrlFetchApp.fetch(url, options);
  
  Logger.log(response)
  
  // - initialise the global variables
  var jsonResponse = {};
  
  // - try parsing the json information
  try {
    jsonResponse = JSON.parse(response);
  } catch (ex) {
    Logger.log(ex)
    
  }
  
  // - return response
  return jsonResponse;
}

//MARK: - update sheet settings
function updateSheetSettings(){
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(SHEET_SETTINGS_TITLE);
  
  // - if has no sheet
  if (sheetObject == null) {
    sheetObject = _SPREADSHEET.insertSheet(SHEET_SETTINGS_TITLE);
    
  }
  
  // - clear the sheet object
  sheetObject.clear()      
  
  // - append header row information
  sheetObject.appendRow(["PROJECT_NAME", _CURRENT_PROJECT.project_title]);
  sheetObject.appendRow(["SHEET_PROJECT_INDEX", _CURRENT_PROJECT_INDEX]);
  sheetObject.appendRow(["SHEET_PROJECT_ISSUE_INDEX", _CURRENT_PROJECT_ISSUE_INDEX]);
  sheetObject.appendRow(["SHEET_LAST_ROW", _CURRENT_SHEET_LAST_ROW]);
  sheetObject.appendRow(["SHEET_LAST_OFFSET", _CURRENT_SHEET_LAST_OFFSET]);
  sheetObject.appendRow(["SHEET_LAST_PAGE", _CURRENT_SHEET_LAST_PAGE]);
}

//MARK: - update sheet settings
function logger(log){
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName("sheet_logs");
  
  // - if has no sheet
  if (sheetObject == null) {
    sheetObject = _SPREADSHEET.insertSheet("sheet_logs");
    
  }
  
  // - append header row information
  sheetObject.hideSheet();
  sheetObject.appendRow([new Date(), log]);
}

//MARK: - hide logger
function hideLogger(){
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName("sheet_logs");
  
  // - if has no sheet
  if (sheetObject == null) {
    return;
    
  }
  
  // - append header row information
  sheetObject.hideSheet();
}

//MARK: - clear sheet settings
function clearSheetSettings(){
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(SHEET_SETTINGS_TITLE);
  
  // - if has no sheet
  if (sheetObject == null) {
    sheetObject = _SPREADSHEET.insertSheet(SHEET_SETTINGS_TITLE);
    
  }
  
  // - clear the sheet object
  sheetObject.clear()
  sheetObject.hideSheet()
}

//MARK: - resets the sheet settings
function resetSheetSettings(){
  // - the index of the current project's issue
  _CURRENT_PROJECT_ISSUE_INDEX = 0;
  
  // - the last row of the current sheet
  _CURRENT_SHEET_LAST_ROW = 1;
  
  // - the last offset of the sheet
  _CURRENT_SHEET_LAST_OFFSET = 0;
  
  // - the last page of the sheet
  _CURRENT_SHEET_LAST_PAGE = 1;
  
  // - catch when the sheet was parsed
  _DID_PARSE_SHEET = false
}

//MARK: - parse sheet settigns
function parseSheetSettings(){
  var sheetTitle = "sheet_settings";
  
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(sheetTitle);
  
  // - sheet object has no content
  if (sheetObject == null) {
    return;
  }
  
  // - total rows
  var totalRows = sheetObject.getLastRow();
  
  // - if has no rows
  if (totalRows == 0) {
    return;
    
  }
  
  // - if has rows
  for (var i = 0; i < totalRows; i++) {
    var key = sheetObject.getRange(i+1, 1).getValue();
    var value = sheetObject.getRange(i+1, 2).getValue();
    
    if (key == "SHEET_PROJECT_INDEX") {
      _CURRENT_PROJECT_INDEX = value
    }
    
    if (key == "SHEET_PROJECT_ISSUE_INDEX") {
      _CURRENT_PROJECT_ISSUE_INDEX = value
    }
    
    if (key == "SHEET_LAST_ROW") {
      _CURRENT_SHEET_LAST_ROW = value <= 0 ? 1 : value
    }
    
    if (key == "SHEET_LAST_OFFSET") {
      _CURRENT_SHEET_LAST_OFFSET = value
    }
    
    if (key == "SHEET_LAST_PAGE") {
      _CURRENT_SHEET_LAST_PAGE = value <= 0 ? 1 : value
    }
    
  }
  
  // - set did parse to true
  _DID_PARSE_SHEET = true
}

//MARK: - clean the sheet according to the existing content
function cleanSheetContent(){
  // - parse content
  var sheetStructure = structSpreadsheet;
  var sheetProjects = typeof sheetStructure.sheet_content != 'undefined' ? sheetStructure.sheet_content : [];
  
  // - get sheet and row
  var lastActiveProject = sheetProjects[_CURRENT_PROJECT_INDEX];
  var lastActiveIssue = lastActiveProject['api_urls'][_CURRENT_PROJECT_ISSUE_INDEX];
  var lastActiveRow = _CURRENT_SHEET_LAST_ROW;
  
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(lastActiveProject["project_title"]);
  
  // - if has no sheet, reset the sheet settings
  if (sheetObject == null) {
    Logger.log("NO SHEET DETECTED, START FROM THE BEGINNING")
    resetSheetSettings()
    return;
  }
  
  // - delete useless rows
  for (var i = sheetObject.getLastRow(); i > lastActiveRow; i--) {
    sheetObject.deleteRow(i); 
  }
}

//MARK: - get value from array by using its key
function getValueFromArrayByKey(key, array){
  // - set return object
  var returnObj = false;
  
  // - if array has 0 length
  if (array.length == 0) {
    return returnObj;
  }
  
  // - loop through each content
  for (var i = 0; i < array.length; i++) {
    // - if either key or value does not exist
    if (typeof array[i].key == "undefined" || typeof array[i].value == "undefined") {
      continue;
    }
    
    // - if key matches
    if (array[i].key == key) {
      returnObj = array[i];
    }
  }
  
  // - return object
  return returnObj;
}

//MARK: - find item inside the array
function findItemInObject(array, needle, column){
  var exists = false;
  
  // - check if array contains anything
  if (array.length == 0 || array == null) {
    return exists;
  }
  
  // - loop for item
  for (var i = 0; i < array.length; i++) {
    // - if column does not exist, move on to the next loop
    if (typeof array[i][column] != "undefined") {
      // - if value exists, return true
      if (array[i][column] == needle) {
        exists = array[i];
      }
    }
  }
  
  // - return whatever result
  return exists;
}