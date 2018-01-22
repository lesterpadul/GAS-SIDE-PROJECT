/*
processRedMine
- param.object: contains a json object of the sheet's structure
- param.sheetObject: contains the active sheet
*/
function processRedMine(projectName, object, sheetObject){
  // - will check if has more views aside from the current offset
  var hasNext = true;
  
  // - set the limit
  var limit = 25
  
  // - set the offset
  var offset = _CURRENT_SHEET_LAST_OFFSET;
  
  // - set the total count
  var totalCount = 0;
  
  // - set the total pages
  var totalPages = 0;
  
  // - set the body array
  var bodyArray = [""];
  
  // - set the page counter
  var pageCounter = _CURRENT_SHEET_LAST_PAGE > 1 ? _CURRENT_SHEET_LAST_PAGE : 1;
  
  // - api key used in jira
  var apiKey = structSpreadsheet.sheet_api_key;
  
  // - setup body content
  while (hasNext) { 
    // - url
    var url = "https://dh-redmine.diamondhead.jp/issues.json?key=" + apiKey + "&limit=" + limit + "&offset=" + offset + "&project_id=" + object.project_id;
    var response = fetchJSONData(url);
    
    // - loop through the issues array
    for (var issuesIndex = 0; issuesIndex < response["issues"].length; issuesIndex++) {
      var currentIssue = response["issues"][issuesIndex];
      var currentAssignee = typeof currentIssue.assigned_to == 'undefined' ? {} : currentIssue.assigned_to;
      
      // - set environment variables
      var issueStartDate = typeof currentIssue.start_date == 'undefined' ? null : currentIssue.start_date;
      var issueDueDate = typeof currentIssue.closed_on == 'undefined' ? null : currentIssue.closed_on;
      var issueStatus = typeof currentIssue.closed_on != 'undefined' ? "完了" : "仕掛中"
      var issueEstHours = typeof currentIssue.estimated_hours != 'undefined' ? currentIssue.estimated_hours : 0
      var issueTrackerName = typeof currentIssue.tracker != "undefined" ? typeof currentIssue.tracker.name != 'undefined' ? currentIssue.tracker.name : "-" : "-"
      var issueAccountItem = "-"
      var issueAssignee = typeof currentAssignee.name == 'undefined' ? "-" : currentAssignee.name;
      var issueCustomName = typeof currentIssue.custom_fields != 'undefined' ? currentIssue.custom_fields[0].name : "-"
      var issueCustomValue = typeof currentIssue.custom_fields != 'undefined' ? currentIssue.custom_fields[0].value : "-"
      
      // - set account item
      if (issueTrackerName == "機能開発" && issueTrackerName == "ステータス=完了") {
        issueAccountItem= "資産"
        
      } else if (issueTrackerName == "機能開発" && issueStatus == "仕掛中") {
        issueAccountItem= "仮勘定"
        
      } else if (issueTrackerName == "保守" || issueTrackerName == "管理") {
        issueAccountItem= "費用"
        
      } else {}
      
      // - if has parent issue
      var isParent = typeof currentIssue.parent != 'undefined' ? false : true
      
      // - if startdate is empty, ignore
      if (issueStartDate == null) {
        issueStatus = "未着手"
      }
      
      // - only include parent issues
      if (!isParent) {
        continue;
      }
      
      // - get time summary
      var issueTimeSummary = processRedmineIssueSummaryTime(currentIssue.id, apiKey);
      
      // - push elements
      // - project name - プロジェクト
      bodyArray.push(currentIssue.project.name);
      
      // - issue custom name, custom_files[0].name - クライアント名
      bodyArray.push(issueCustomValue);
      
      // - issue custom value, custom_files[0].value - ブランド
      bodyArray.push(issueCustomName);
      
      // - issue empty value, mall information - モール
      bodyArray.push("-")
      
      // - issue id - ID
      bodyArray.push(currentIssue.id)
      
      // - issue subject - 案件名 - NEXT TODO
      bodyArray.push(currentIssue.subject)
      
      // - issue tracker name - 区分
      bodyArray.push(issueTrackerName)
      
      // - issue start date - 着手日 - NEXT TODO
      bodyArray.push(issueStartDate)
      
      // - issue due date - リリース日
      bodyArray.push(issueDueDate)
      
      // - issue status - ステータス
      bodyArray.push(issueStatus)
      
      // - estimated hours - 見積工数（h）
      bodyArray.push(issueTimeSummary.totalHoursParent)
      
      // - actual hours spent, TODO - 実工数(h）
      // - will have to cURL the time entries
      // - https://dh-redmine.diamondhead.jp/time_entries.json?key=<time>&issue_id=<issue>
      bodyArray.push(issueTimeSummary.totalHours)
      
      // - issue estimated cost, TBD - 請求金額
      bodyArray.push("-")
      
      // - issue account item, NEED TO ASK - 勘定科目
      bodyArray.push(issueAccountItem)
      
      // - scheduled release month, EMPTY
      bodyArray.push("-")
      
      // - team name - チーム名, TBD
      bodyArray.push("-")
      
      // - contact name - 担当者名, TBD
      bodyArray.push(issueAssignee)
      
      // - remarks - 備考, TBD
      bodyArray.push("-")
      
      // - append body content
      sheetObject.appendRow(bodyArray);
      bodyArray = [""];
      
      // - set background color
      var activeRange = sheetObject.getRange(sheetObject.getLastRow(), 1, 1, sheetObject.getLastColumn())
      if (sheetObject.getLastRow() %2 == 0) {
        activeRange.setBackgroundRGB(204,204,255);
        
      }
      
      // - if has issue key
      var getKeyRange = sheetObject.getRange(sheetObject.getLastRow(), 6)
      var link = "https://dh-redmine.diamondhead.jp/issues/" + currentIssue.id
      var displayName = currentIssue.id
      getKeyRange.setFormula("=hyperlink(\""+link+"\";\"" + displayName + "\")");
    }
    
    // - get pagination information
    totalCount = response["total_count"];
    totalPages = Math.ceil(totalCount / limit);
    offset = offset + limit;
    
    // - the last row of the current sheet
    _CURRENT_SHEET_LAST_ROW = sheetObject.getLastRow();
    
    // - the last offset of the sheet
    _CURRENT_SHEET_LAST_OFFSET = offset
    
    // - the last page count
    _CURRENT_SHEET_LAST_PAGE = pageCounter
    
    // - increment page counter
    pageCounter++;
    
    // - if total page, and page counter is the same, set last page
    if (offset > totalCount) {
      hasNext = false;
        
    }
    
    // - update sheet settings
    updateSheetSettings()
  }
}

/*
processRedmineIssueSummaryTime
- param.object: contains a json object of the sheet's structure
- param.sheetObject: contains the active sheet
*/
function processRedmineIssueSummaryTime(issueID, apiKey){
  // - will check if has more views aside from the current offset
  var hasNext = true;
  
  // - set the limit
  var limit = 100
  
  // - set the offset
  var offset = 0;
  
  // - set the total count
  var totalCount = 0;
  
  // - set the total pages
  var totalPages = 0;
  
  // - api key used in jira
  var apiKey = structSpreadsheet.sheet_api_key;
  
  // - get the total hours
  var totalHours = 0;
  var totalHoursParent = 0;
  
  // - setup body content
  while (hasNext) { 
    // - url
    var response = fetchJSONData("https://dh-redmine.diamondhead.jp/time_entries.json?limit=" + limit + "&key=" + apiKey + "&issue_id=" + issueID + "&offset=" + offset);
    var timeEntries = typeof response["time_entries"] == 'undefined' ? [] : response["time_entries"];
    
    // - loop through time entries
    for (var i = 0; i < timeEntries.length; i++) {
      // - get the total hours
      totalHours += typeof timeEntries[i]["hours"] == "undefined" ? 0 : timeEntries[i]["hours"];
      
      // - if has issue
      if (
        typeof timeEntries[i]["issue"] != "undefined" && 
        typeof timeEntries[i]["issue"]["id"] != "undefined" &&
        issueID == timeEntries[i]["issue"]["id"]
      ) {
        totalHoursParent += timeEntries[i]["hours"];
        
      }
      
    }
    
    // - get pagination information
    totalCount = response["total_count"];
    offset = offset + limit;
    
    // - if total page, and page counter is the same, set last page
    if (offset > totalCount) {
      hasNext = false;
      
    }
  }
  
  // - return total hours
  return {totalHours: totalHours, totalHoursParent: totalHoursParent};
}