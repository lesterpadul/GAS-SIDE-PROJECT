// - global spreadsheet variable
var _SPREADSHEET = null;

// - denotes the current sheet
var _CURRENT_SHEET = null;

// - determines if a new sheet was generated
var _DID_GENERATE_NEW = false;

// - the index of the current project
var _CURRENT_PROJECT_INDEX = 0;

// - the index of the current project's issue
var _CURRENT_PROJECT_ISSUE_INDEX = 0;

// - the current proejct
var _CURRENT_PROJECT = {};

// - the last row of the current sheet
var _CURRENT_SHEET_LAST_ROW = 0;

// - the last offset of the sheet
var _CURRENT_SHEET_LAST_OFFSET = 0;

// - the last page of the sheet
var _CURRENT_SHEET_LAST_PAGE = 0;

// - catch when the sheet was parsed
var _DID_PARSE_SHEET = false

//MARK: - generate spreadsheets
function generateSpreadsheets() {
  // - get sheet title
  var sheetTitle = "MONTHLY REPORT : " + Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM");
  
  // - get drive
  var files = DriveApp.getFilesByName(sheetTitle);
  var ss = null;
  
  // - create or reuse sheet
  // - if has file
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
  
  // - get the last contents
  parseSheetSettings();
  
  // - try cleaning the last sheet in preparation for the continue logic
  cleanSheetContent();
  
  // - get table structure
  var sheetStructure = structSpreadsheet;
  var sheetProjects = typeof sheetStructure.sheet_content != 'undefined' ? sheetStructure.sheet_content : [];
  var sheetHeaders = typeof sheetStructure.sheet_headers != 'undefined' ? sheetStructure.sheet_headers : [];
  var startIndex = _CURRENT_PROJECT_INDEX;
  
  // - setup sheet content
  for (var i = startIndex; i < sheetProjects.length; i++) {
    // - set project variables
    var project = sheetProjects[i];
    var headerArray = [""];
    
    // - if project status is not active, continue
    if (project.project_status != "active") {
      continue;
      
    }
    
    // - set global variable
    _CURRENT_PROJECT_INDEX = i
    
    // - try fetching the sheet by name
    var sheetObject = ss.getSheetByName(project.project_title);
    _DID_GENERATE_NEW = false;
    
    // - if has no sheet
    if (sheetObject == null) {
      // - insert new sheet
      sheetObject = ss.insertSheet(project.project_title);
      
      // - set flag for generating new sheet
      _DID_GENERATE_NEW = true;
      
    }
    
    // - if did not parse the sheet settings
    if (_DID_GENERATE_NEW == true) {
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
    _CURRENT_PROJECT = project;
    
    // - check if has issues per project
    if (project["api_urls"].length == 0) {
      continue;
      
    }
    
    // - load issues in project
    var startProjectIndex = _CURRENT_PROJECT_ISSUE_INDEX != 0 ? _CURRENT_PROJECT_ISSUE_INDEX : 0;
    for (var j = startProjectIndex; j < project["api_urls"].length; j++) {
      _CURRENT_PROJECT_ISSUE_INDEX = j;
      processIssues(project.project_title, project["api_urls"][j], sheetObject);
    }
    
    // - TODO: after each loop, clean the settings
    _CURRENT_PROJECT_ISSUE_INDEX = 0;
    _CURRENT_SHEET = null;
    _CURRENT_PROJECT = null;
    _CURRENT_SHEET_LAST_ROW = 1;
    _CURRENT_SHEET_LAST_OFFSET = 0;
    _CURRENT_SHEET_LAST_PAGE = 0;
    
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
    //processRedMine(projectName, issue, sheetObject);
    
  }
  
  // - if JIRA
  if (issue.type == "jira") {
    processJira(projectName, issue, sheetObject);
    
  }
  
}