//MARK: - constant variables
var _SPREADSHEET = null;
var _CURRENT_SHEET = null;
var _CURRENT_OBJECT = {};
var _CURRENT_LAST_ROW = false;
var _CURRENT_LAST_OFFSET = false;
var _CURRENT_LAST_PAGE = false;
var _CURRENT_ISSUE_INDEX = false;
var _CURRENT_PROJECT_INDEX = false;
var _DID_GENERATE_NEW = false;
var _DID_PARSE_SHEET = false;

//MARK: - generate spreadsheets
function generateSpreadsheets() {
  // - get sheet title
  var sheetTitle = "MONTHLY REPORT : " + Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM");
  
  // - get drive
  var files = DriveApp.getFilesByName(sheetTitle);
  var ss = null;
  
  //STEP 1 - create or reuse sheet
  // : if has file
  if (files.hasNext()) {
    while (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
      
    }
  
  // - if has no file, create a new one
  } else {
    ss = SpreadsheetApp.create(sheetTitle);
    
  }
  
  // - set the spreadsheet globally
  _SPREADSHEET = ss;
  
  //STEP 2 - parse settings
  //parseSheetSettings()
  
  //STEP 3 - get table structure
  var sheetStructure = structSpreadsheet;
  var sheetProjects = typeof sheetStructure.sheet_content != 'undefined' ? sheetStructure.sheet_content : [];
  var sheetHeaders = typeof sheetStructure.sheet_headers != 'undefined' ? sheetStructure.sheet_headers : [];
  var startIndex = 0;
  
  // - set the last issue index
  if (_CURRENT_ISSUE_INDEX != false) {
    startIndex =  _CURRENT_ISSUE_INDEX;
    _CURRENT_ISSUE_INDEX = false;
    
  }
  
  //STEP 4 - setup sheet content
  for (var i = startIndex; i < sheetProjects.length; i++) {
    // - set project variables
    var project = sheetProjects[i];
    var headerArray = [""];
    _DID_GENERATE_NEW = false;
    _CURRENT_ISSUE_INDEX = i
    
    // - if project status is not active, continue
    if (project.project_status != "active") {
      Logger.log("PROJECT " + project.project_title + " IS NOT ACTIVE");
      continue;
      
    }
    
    // - try fetching the sheet by name
    var sheetObject = ss.getSheetByName(project.project_title);
    
    // - if has no sheet
    if (sheetObject == null) {
      // - insert new sheet
      sheetObject = ss.insertSheet(project.project_title);
      
      // - set flag for generating new sheet
      _DID_GENERATE_NEW = true;
      
    }
    
    // - if did not parse the sheet settings
    if (_DID_PARSE_SHEET == false || _DID_GENERATE_NEW == true) {
      // - clear sheet
      sheetObject.clear();
      
      // - loop through headers
      for (var j = 0; j < sheetStructure.sheet_headers.length; j++) {
        headerArray.push(sheetStructure.sheet_headers[j]["jp_name"])
      }
      
      // - append header row information
      sheetObject.appendRow(headerArray);
      
      // - set background color of the header row
      var activeRange = sheetObject.getRange(1, 2, 1, headerArray.length - 1)
      activeRange.setBackgroundRGB(155, 229, 42)
      activeRange.setBorder(true, true, true, true, true, true)
    }
    
    // - sheet object
    _CURRENT_SHEET = sheetObject;
    _CURRENT_OBJECT = project;
    
    // - check if has issues per project
    if (project["api_urls"].length == 0) {
      continue;
      
    }
    
    // - load issues in project
    for (var j = 0; j < project["api_urls"].length; j++) {
      _CURRENT_PROJECT_INDEX = j;
      processIssues(project.project_title, project["api_urls"][j], sheetObject); 
      
    }
    
    // - clear all the sheeet settings so far
    if (i == (sheetProjects.length - 1)) {
      clearSheetSettings()
      
    }
    
  }
  
}

//MARK: - process issues
function processIssues(projectName, issue, sheetObject){
  // - get issue
  issue = typeof issue == "undefined" ? {} : issue;
  
  // - if has missing parameters
  if (typeof issue.project_id == 'undefined' || typeof issue.type == 'undefined') {
    return;
    
  }
  
  // - if redmine
  if (issue.type == "redmine") {
    processRedMine(projectName, issue, sheetObject);
    
  }
  
  // - if JIRA
  if (issue.type == "jira") {
    processJira(projectName, issue, sheetObject);
    
  }
  
}