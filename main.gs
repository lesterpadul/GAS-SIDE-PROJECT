// - doGet function
function doGet(){
  // debug
  var currentDateTime = Moment.moment().format("YYYY-MM-DD")
  var currentDateTime = "March 1, 2018"
  
  //MARK: - set sheet primer information
  var newTime = new Date(currentDateTime)
  var currentHour = newTime.getHours();
  var currentDay = newTime.getDate();
  var ss = null;
  var didCreate = false;
  
  //MARK: - set current day cycle (NEW!)
  _CURRENT_DAY_CYCLE = currentDay
  
  //MARK: - if first day of the month, and between 12:00 AM and 5:00AM (allocate an allowance of 5 hours just in case!)
  if ((currentHour >= 5)) {
    //return false;
  }
  
  //MARK: - start parsing the sheet configuration
  // - parse sheet information
  logger("CONFIG: - starting parse logic")
  // - parse configuration from sheet
  parseConfig()
  
  // - parse brand from sheet
  parseBrand()
  
  // - parse sheet content from sheet
  parseSheetContent()
  logger("CONFIG: - ending parse logic")
  
  //MARK: - generate/reuse the sheet
  logger("MAIN_SHEET_INIT: - generating parent spreadsheet")
  // - get sheet title
  var sheetTitle = "MONTHLY REPORT : " + Utilities.formatDate(new Date(currentDateTime), "GMT+9", "yyyy-MM");
  if (_CURRENT_DAY_CYCLE >= 1 && _CURRENT_DAY_CYCLE <= 6) {
    sheetTitle = "MONTHLY REPORT : " + Utilities.formatDate(new Date(currentDateTime), "GMT+9", "yyyy-MM-dd");
  }
  
  // - get drive
  var folder = DriveApp.getFolderById(structSpreadsheet.folder_id);
  var files = folder.getFilesByName(sheetTitle);
  
  // - create or reuse sheet
  // - if has file
  if (files.hasNext()) {
    while (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
      
    }
  
  // - if has no file, create a new one
  } else {
    // - create new sheet
    ss = SpreadsheetApp.create(sheetTitle);
    
    // - get
    var file = DriveApp.getFileById(ss.getId());
    
    // - add file to the folder
    folder.addFile(file);
    
    // - remove file from the root folder
    DriveApp.getRootFolder().removeFile(file);
    
    // - grant access
    ss.addEditor(_ADMIN_MAIL)
    
    // - send email
    sendEmail(ss)
    
    // - set to true
    didCreate = true;
  }
  logger("MAIN_SHEET_INIT: - got parent spreadsheet")
  
  //MARK: - set the spreadsheet globally
  _SPREADSHEET = ss;
  
  //MARK: - check sheet status
  logger("STATUS_CHECK: - initializing status check")
  checkSheetStatus();
  logger("STATUS_CHECK: - initialized status check")
  
  //MARK: - delete first sheet if newly generated
  logger("DELETE_FIRST_SHEET: - deleting first sheet")
  // - if a new sheet was created
  if (didCreate) {
    // - get the sheets
    var sheets = _SPREADSHEET.getSheets()
    if (sheets[0] != "undefined") {
      _SPREADSHEET.setActiveSheet(sheets[0])
      _SPREADSHEET.deleteActiveSheet()
    }
    
  }
  logger("DELETE_FIRST_SHEET: - deleted first sheet")
  
  //MARK: - check time constraints
  if (
    // - if sheet settings is not present
    (_LAST_START_TIME == null ||
    _CURRENT_START_TIME == null ||
    _LAST_START_TIME.length == 0 ||
    _CURRENT_START_TIME.length == 0) ||
    
    // - if status is still ongoing, run after 5 minutes
    (
      _LAST_START_TIME.length != 0 &&
      _CURRENT_START_TIME.length != 0 &&
      _LAST_START_TIME != null &&
      _CURRENT_START_TIME != null &&
      _CURRENT_START_TIME.getTime() > _LAST_START_TIME.getTime() &&
      ((_CURRENT_START_TIME.getTime() - _LAST_START_TIME.getTime())/1000) >= 360 &&
      _CURRENT_STATUS == "ONGOING"
    ) ||
    
    // - if status is done, rerun after 3 hours
    (
      _LAST_START_TIME.length != 0 &&
      _CURRENT_START_TIME.length != 0 &&
      _LAST_START_TIME != null &&
      _CURRENT_START_TIME != null &&
      _CURRENT_START_TIME.getTime() > _LAST_START_TIME.getTime() &&
      ((_CURRENT_START_TIME.getTime() - _LAST_START_TIME.getTime())/1000) >= 18000 &&
      _CURRENT_STATUS == "DONE"
    )
  ) {
    // - if the current status is 'done', move to 'ongoing'
    if (_CURRENT_STATUS == "DONE") {
      _CURRENT_STATUS = "ONGOING"
    }
    
    // - update the sheet status
    updateSheetStatus(_CURRENT_STATUS);
    
    // - generate the sheet
    try {
      generateSpreadsheets();
      
    } catch (e) {
      logger("CAUGHT ERROR " + e)
      
    }
    
  }
}

//MARK: - check the sheet status
function checkSheetStatus(){
  // - try fetching the sheet by name
  var sheetStatus = _SPREADSHEET.getSheetByName("sheet_process_status");
  var shouldTrigger = false;
  var lastStatus = "DONE"; // DONE || ONGOING
  
  // - get properties
  var scriptProperties = PropertiesService.getScriptProperties();
  
  // - declare reasonable waiting time
  var reasonableWaitTime = 7;
  
  // - declare dates
  var startTime = new Date();
  var endTime = new Date(startTime.getTime() + (reasonableWaitTime * 60 * 1000));
  
  // - get the start time
  _CURRENT_START_TIME = startTime;
  _CURRENT_END_TIME = new Date(endTime);
  _LAST_START_TIME = null;
  
  // - if has no sheet
  if (sheetStatus == null) {
    // - insert new sheet
    sheetStatus = _SPREADSHEET.insertSheet("sheet_process_status");
    lastStatus = "ONGOING";
    
  } else {
    // - total rows
    var totalRows = sheetStatus.getLastRow();
    
    // - if has no rows
    if (totalRows != 0 ) {
      // - if has rows
      for (var i = 0; i < totalRows; i++) {
        var key = sheetStatus.getRange(i+1, 1).getValue();
        var value = sheetStatus.getRange(i+1, 2).getValue();
        
        // - parse the status
        if (key == "STATUS") {
          lastStatus = value
          
        }
        
        // - get the last start time
        if (key == "LAST_START_TIME") {
          _LAST_START_TIME = value
          
        }
        
      }
      
      // - if the last status is not ongoing or done, set to done
      if (lastStatus != "ONGOING" && lastStatus != "DONE") {
        lastStatus = "DONE";
        
      }
      
    } else {
      lastStatus = "ONGOING";
      
    }
    
  }
  
  // - set the global sheet status
  _CURRENT_SHEET_STATUS = sheetStatus
  
  // - set the last status
  _CURRENT_STATUS = lastStatus
  
}

//MARK: - update the sheet status
function updateSheetStatus(newStatus){
  // - clear sheet information
  _CURRENT_SHEET_STATUS.clear();
  
  // - append a status to the sheet
  _CURRENT_SHEET_STATUS.appendRow(["STATUS", newStatus]);
  _CURRENT_SHEET_STATUS.appendRow(["LAST_START_TIME", _CURRENT_START_TIME]);
  _CURRENT_SHEET_STATUS.appendRow(["NEXT_START_TIME", _CURRENT_END_TIME]);
  
  // - if done, hide the sheet
  if  (newStatus == "DONE") {
    _CURRENT_SHEET_STATUS.hideSheet()
    
  // - else, show the sheet
  } else {
    _CURRENT_SHEET_STATUS.showSheet()
    
  }
}

//MARK: - generate spreadsheets
function generateSpreadsheets() {
  // - reset the settings for parsing
  resetSheetSettings();
  
  // - get the last contents
  parseSheetSettings();
  
  // - try cleaning the last sheet in preparation for the continue logic
  if (_DID_PARSE_SHEET) {
    cleanSheetContent();
    
  }
  
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
    
    // - set global variable
    _CURRENT_PROJECT_INDEX = i
    
    // - try fetching the sheet by name
    var sheetObject = _SPREADSHEET.getSheetByName(project.project_title);
    _DID_GENERATE_NEW = false;
    
    // - if has no sheet
    if (sheetObject == null) { 
      sheetObject = _SPREADSHEET.insertSheet(project.project_title);
      
      // - set flag for generating new sheet
      _DID_GENERATE_NEW = true;
      
    }
    
    // - if did not parse the sheet settings
    if (_DID_GENERATE_NEW == true || _DID_PARSE_SHEET == false) {
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
      
logger("PROCESSING_ISSUE: - processing issue | " + project.project_title)
      processIssues(project.project_title, project["api_urls"][j], sheetObject);
logger("PROCESSING_ISSUE: - end of processing issue | " + project.project_title)
      
      // - after each loop, clean the settings
      resetSheetSettings();
      
      // - check if pass the allowed execution time
      if (isPassExecutionTime()) {
        break;
      }
    }
    
    // - clear all the sheeet settings so far
    if (i == (sheetProjects.length - 1)) {
      clearSheetSettings();
      updateSheetStatus("DONE");
    }
    
    // - check if pass the allowed execution time
    if (isPassExecutionTime()) {
      break;
    }
  }
  
  // - check if pass the allowed execution time
  if (isPassExecutionTime()) {
    Logger.log("MAX EXECUTION TIME REACHED!")
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