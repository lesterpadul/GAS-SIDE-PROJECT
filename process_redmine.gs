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
  
  // - get the start of last month
  var monthEstimatedStart = Moment.moment(Moment.moment(new Date()).startOf('month').format('YYYY-MM-DD')).unix();
  var monthEstimatedEnd = Moment.moment(Moment.moment(new Date()).subtract(1,'months').endOf('month')).unix();
  
  // - setup body content
  while (hasNext) { 
    // - url
logger("FETCHING_REDMINE_ISSUE: - processing issue name | " + projectName + " | " + offset)
    var url = "https://dh-redmine.diamondhead.jp/issues.json?key=" + apiKey + "&limit=" + limit + "&offset=" + offset + "&project_id=" + object.project_id + "&status_id=*";
    var response = fetchJSONData(url);
logger("FETCHING_REDMINE_ISSUE: - end of processing issue name | " + projectName + " | " + offset)
    
    // - loop through the issues array
    for (var issuesIndex = 0; issuesIndex < response["issues"].length; issuesIndex++) {
      var currentIssue = response["issues"][issuesIndex];
      var currentAssignee = typeof currentIssue.assigned_to == 'undefined' ? {} : currentIssue.assigned_to;
      
      // - set environment variables
      var issueStartDate = typeof currentIssue.start_date == 'undefined' ? null : Moment.moment(currentIssue.start_date).format("YYYY/MM/DD");
      var issueDueDate = typeof currentIssue.closed_on == 'undefined' ? null : currentIssue.closed_on;
      issueDueDate = issueDueDate == null ? null : Moment.moment(issueDueDate).format("YYYY/MM/DD");
      var issueStatus = typeof currentIssue.closed_on != 'undefined' ? "完了" : "仕掛中"
      var issueEstHours = typeof currentIssue.estimated_hours != 'undefined' ? currentIssue.estimated_hours : 0
      var issueTrackerName = typeof currentIssue.tracker != "undefined" ? typeof currentIssue.tracker.name != 'undefined' ? currentIssue.tracker.name : "" : ""
      var issueAccountItem = ""
      var issueAssignee = typeof currentAssignee.name == 'undefined' ? "" : currentAssignee.name;
      var issueTeam = issueAssignee.substring(0,2) == "KB" ? "カラビナ" : "東京"
      var issueCustomName = typeof currentIssue.custom_fields != 'undefined' ? currentIssue.custom_fields[0].name : ""
      var issueCustomValue = typeof currentIssue.custom_fields != 'undefined' ? currentIssue.custom_fields[0].value : ""
      var brandInformation = findItemInObject(structBrand, issueCustomValue, "identifier");
      
      // - set account item
      //yun 02/01
      if (issueTrackerName == "機能開発" && issueStatus == "完了") {
        issueAccountItem= "資産"
        
      } else if (issueTrackerName == "機能開発" && issueStatus == "仕掛中") {
        issueAccountItem= "仮勘定"
        
      } else if (issueTrackerName == "保守" || issueTrackerName == "管理") {
        issueAccountItem= "費用"
        
      } else {}
      
      // - if has parent issue
      var isParent = typeof currentIssue.parent != 'undefined' ? false : true
      var unixIssueStartDate = Moment.moment(issueStartDate).unix();

      // - only include parent issues, and valid brands according ot the struct_brand.gs file
      //yun 02/01
      if (
        // - if is not parent
        !isParent || 
        
        // - if issue start date is null
        issueStartDate == null ||

        // - check if start date is within the 1st and 6th day of the month
        (
           issueStartDate != null &&
           Moment.moment(issueStartDate).isValid() &&
           (_CURRENT_DAY_CYCLE >= 1 && _CURRENT_DAY_CYCLE <= 6) &&
           unixIssueStartDate > monthEstimatedEnd
        ) ||
        
        // - if more than the 7th day of the month
        (
           issueStartDate != "" &&
           Moment.moment(issueStartDate).isValid() &&
           (_CURRENT_DAY_CYCLE > 6) &&
           unixIssueStartDate <= monthEstimatedEnd
        )
      ) { continue; }
      
      //yun 02/02 start
      // - translate to unix
      if (issueDueDate != null) {
        // - issue due date
        var currentIssueDueDate = Moment.moment(issueDueDate).unix()
        
        // - if within 1st and 6th day
        if (_CURRENT_DAY_CYCLE >= 1 && _CURRENT_DAY_CYCLE <= 6) {
          monthEstimatedStart = Moment.moment(Moment.moment(new Date()).subtract(1,'months').startOf('month')).unix();
          
          // - if less than start of this month
          if (currentIssueDueDate < monthEstimatedStart || currentIssueDueDate > monthEstimatedEnd) {
            continue;
          }
        }
      } else {
        issueDueDate = ""
      }
      
      // - set the client and brand name
      var clientName = typeof brandInformation.client_name == "undefined" ? "" : brandInformation.client_name
      var brandName = typeof brandInformation.brand_name == "undefined" ? "" : brandInformation.brand_name
      var mallName = typeof brandInformation.mall_name == "undefined" ? "" : brandInformation.mall_name
      
      // - get time summary
logger("FETCHING_REDMINE_ISSUE_SUMMARY_TIME: - processing issue name | " + projectName + " | " + offset)
      var issueTimeSummary = processRedmineIssueSummaryTime(currentIssue.id, apiKey);
logger("FETCHING_REDMINE_ISSUE_SUMMARY_TIME: - processing issue name | " + projectName + " | " + offset)
      
      // - push elements
      // - project name - プロジェクト
      bodyArray.push(currentIssue.project.name);
      
      // - issue custom name, custom_files[0].name - クライアント名
      bodyArray.push(clientName);
      
      // - issue custom value, custom_files[0].value - ブランド
      bodyArray.push(brandName);
      
      // - issue empty value, mall information - モール
      bodyArray.push(mallName)
      
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
      bodyArray.push("")
      
      // - issue account item, NEED TO ASK - 勘定科目
      bodyArray.push(issueAccountItem)
      
      // - scheduled release month, EMPTY
      bodyArray.push("")
      
      // - team name - チーム名, TBD
      bodyArray.push(issueTeam)
      
      // - contact name - 担当者名, TBD
      bodyArray.push(issueAssignee)
      
      // - remarks - 備考, TBD
      bodyArray.push("")
      
logger("SETTING_REDMINE_ROW_CONTENT: - processing issue row | " + projectName + " | " + offset + " | issue = " + currentIssue.id)
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
logger("SETTING_REDMINE_ROW_CONTENT: - processed issue row | " + projectName + " | " + offset + " | issue = " + currentIssue.id)
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
    
    // - check if pass the allowed execution time
    if (isPassExecutionTime()) {
      hasNext = false;
      break;
    }
  }
}

/*
processRedmineIssueSummaryTime
- param.object: contains a json object of the sheet's structure
- param.sheetObject: contains the active sheet
*/
function processRedmineIssueSummaryTime(issueID, apiKey){
  // - get the total hours
  var totalHours = 0;
  var totalHoursParent = 0;
  
  // - url
  var response = fetchJSONData("https://dh-redmine.diamondhead.jp/issues/" + issueID + ".json?limit=100&key=" + apiKey);
  var timeEntries = typeof response["issue"] == 'undefined' ? {} : response["issue"];
  
  // - get the total hours
  totalHoursParent = typeof timeEntries.total_estimated_hours == "undefined" ? "" : timeEntries.total_estimated_hours;
  totalHours = typeof timeEntries.total_spent_hours == "undefined" ? "" : timeEntries.total_spent_hours;
  
  // - return total hours
  return {totalHours: totalHours, totalHoursParent: totalHoursParent};
}