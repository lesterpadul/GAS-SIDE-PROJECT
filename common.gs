//MARK: - send email
function sendEmail(sheet){
  // - get the sheet's document URL
  var url = sheet.getUrl();

  // - send the email
  var email = "padullester@gmail.com";

  // - Get the name of the document to use as an email subject line.
  var subject = sheet.getName();

  // - Append a new string to the "url" variable to use as an email body.
  var body = 'Link to your doc: ' + url;
  
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
  
  // - get response
  var response = UrlFetchApp.fetch(url, options);
  
  // - initialise the global variables
  var jsonResponse = {};
  
  // - try parsing the json information
  try {
    jsonResponse = JSON.parse(response);
  } catch (ex) {}
  
  // - return response
  return jsonResponse;
}

//MARK: - update sheet settings
function updateSheetSettings(obj){
  // - obj information
  obj = typeof obj == "undefined" ? {} : obj;
  
  // - set the sheet content information
  var sheetName = typeof obj.sheet_name == "undefined" ? false : obj.sheet_name;
  var sheetOffset = typeof obj.sheet_offset == "undefined" ? false : obj.sheet_offset;
  var sheetCode = typeof obj.sheet_code == "undefined" ? false : obj.sheet_code;
  var sheetLastRow = typeof obj.sheet_last_row == "undefined" ? false : obj.sheet_last_row;
  var sheetIssueType = typeof obj.sheet_issue_type == "undefined" ? false : obj.sheet_issue_type;
  var sheetLastPage = typeof obj.sheet_page_counter == "undefined" ? false : obj.sheet_page_counter;
  var sheetTitle = "sheet_settings";
  
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(sheetTitle);
  
  // - if has no sheet
  if (sheetObject == null) {
    sheetObject = _SPREADSHEET.insertSheet(sheetTitle);
    
  }
  
  // - clear the sheet object
  sheetObject.clear()
  
  // - append header row information
  sheetObject.appendRow(["sheet_name", _CURRENT_OBJECT.project_title]);
  sheetObject.appendRow(["sheet_offset", sheetOffset]);
  sheetObject.appendRow(["sheet_code", _CURRENT_OBJECT.project_code]);
  sheetObject.appendRow(["sheet_last_row", sheetLastRow]);
  sheetObject.appendRow(["sheet_issue_type", sheetIssueType]);
  sheetObject.appendRow(["sheet_last_page", sheetLastPage]);
  sheetObject.appendRow(["sheet_last_issue_index", _CURRENT_ISSUE_INDEX]);
  sheetObject.appendRow(["sheet_last_project_index", _CURRENT_PROJECT_INDEX]);
}

//MARK: - clear sheet settings
function clearSheetSettings(){
  var sheetTitle = "sheet_settings";
  
  // - try fetching the sheet by name
  var sheetObject = _SPREADSHEET.getSheetByName(sheetTitle);
  
  // - if has no sheet
  if (sheetObject == null) {
    sheetObject = _SPREADSHEET.insertSheet(sheetTitle);
    
  }
  
  // - clear the sheet object
  sheetObject.clear()
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
    
    // - sheet offset
    if (key == "sheet_offset") {
      _CURRENT_LAST_OFFSET = value;
      
    }
    
    // - sheet last row
    if (key == "sheet_last_row") {
      _CURRENT_LAST_ROW = value;
      
    }
    
    // - sheet last page
    if (key == "sheet_last_page") {
      _CURRENT_LAST_PAGE = value;
      
    }
    
    // - sheet last issue index
    if (key == "sheet_last_issue_index") {
      _CURRENT_ISSUE_INDEX = value;
      
    }
    
    // - sheet last issue index
    if (key == "sheet_last_project_index") {
      _CURRENT_PROJECT_INDEX = value;
      
    }
  }
  
  // - set did parse to true
  _DID_PARSE_SHEET = true
}