// - jira container
var JIRA_GROUP_NAME_CONTAINER = [];
var JIRA_EPIC_CONTAINER = [];

/*
processJIRA
- param.object: contains a json object of the sheet's structure
- param.sheetObject: contains the active sheet
*/
function processJira(projectName, object, sheetObject){
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
  
  // - setup body content
  while (hasNext) {
    // - setup URL information
    var url = 'https://diamondhead.atlassian.net/rest/api/2/search?jql=(project=' + object.project_id + ' AND issuetype in standardIssueTypes() AND statusCategory in (%22In%20Progress%22%2C%22To%20Do%22) AND resolutiondate is empty)&startAt=' + offset + '&maxResults=' + limit;
    var response = postJIRARequest(url);

    // - if has no contents
    if (response["issues"].length == 0) {
      hasNext = false;
      return;
    }
    
    // - loop through the issues array
    for (var issuesIndex = 0; issuesIndex < response["issues"].length; issuesIndex++) {
      var currentIssue = response["issues"][issuesIndex];
      var currentIssueFields = typeof currentIssue.fields == 'undefined' ? {} : currentIssue.fields;
      var currentIssueStatus = typeof currentIssue.status == 'undefined' ? {} : currentIssue.status;
      var currentIssueAssignee = currentIssueFields.assignee == null ? {} : currentIssueFields.assignee;
      
      // - set environment variables
      // - get issue date
      var issueDueDate = typeof currentIssueFields.resolutiondate == 'undefined' ? "-" : currentIssueFields.resolutiondate;
      issueDueDate = !issueDueDate ? "-" : issueDueDate;
      issueDueDate = issueDueDate == "-" ? "-" : Moment.moment(issueDueDate).format("YYYY-MM-DD");
      
      // - get issue status
      var issueStatus = typeof currentIssueStatus.name == 'undefined' ? "-" : currentIssueStatus.name;
      
      // - get issue resolution date
      var issueResolutionDate = typeof currentIssueFields.resolutiondate == 'undefined' ? "-" : currentIssueFields.resolutiondate;
      issueResolutionDate = !issueResolutionDate ? "-" : issueResolutionDate;
      issueResolutionDate = issueResolutionDate == "-" ? "-" : Moment.moment(currentIssueFields.resolutiondate).format("YYYY-MM-DD");
      
      // - get issue assignee
      var issueAssignee = typeof currentIssueAssignee.name == 'undefined' ? "-" : currentIssueAssignee.name;
      
      // - get issue key
      var issueKey = typeof currentIssue.key == 'undefined' ? "-" : currentIssue.key;
      
      // - set issue summary
      var issueSummary = typeof currentIssueFields.summary == "undefined" ? "-" : currentIssueFields.summary;
      
      // - set estimated hours
      var issueEstimatedHours = typeof currentIssueFields.aggregatetimeoriginalestimate == 'undefined' ? false : parseInt(currentIssueFields.aggregatetimeoriginalestimate);
      issueEstimatedHours = isNaN(issueEstimatedHours) ? "-" : (issueEstimatedHours/60)/60;
      
      // - set the actual hours spent per issue
      var issueActualHours = typeof currentIssueFields.aggregatetimespent == 'undefined' ? false : parseInt(currentIssueFields.aggregatetimespent);
      issueActualHours = isNaN(issueActualHours) ? "-" : (issueActualHours/60)/60;
      
      // - set the issue tracker name
      var issueTrackerName = typeof currentIssueFields.customfield_10007 == 'undefined' ? "-" : currentIssueFields.customfield_10007;
      
      // - get issue dates
      var issueDates = {};
      var issueGroupNames = "-";
      
      // - if has an issue key
      if (issueKey != "-" && issueKey) {
        issueDates = processJIRASummaryTime(issueKey);
        
      }
      
      // - if has issue assignee
      if (issueAssignee != "-" && issueAssignee) {
        // - check if the same key already exists in the temporary container
        var hasGroupValue = getValueFromArrayByKey(issueAssignee, JIRA_GROUP_NAME_CONTAINER);
        if (typeof hasGroupValue.value != "undefined") {
          issueGroupNames = hasGroupValue.value;
          
        } else {
          issueGroupNames = processJIRAGroupNames(issueAssignee);
          JIRA_GROUP_NAME_CONTAINER.push({"key": issueAssignee, "value": issueGroupNames});
          
        }
        
      }
      
      // - if has issue tracker name
      if (issueTrackerName != "-" && issueTrackerName) {
        // - check if the same key already exists in the temporary container
        var hasEpicValue = getValueFromArrayByKey(issueTrackerName, JIRA_EPIC_CONTAINER);
        if (typeof hasEpicValue.value != "undefined") {
          issueTrackerName = hasEpicValue.value;
        
        } else {
          issueTrackerName = processJIRAEpic(issueTrackerName);
          JIRA_EPIC_CONTAINER.push({"key": issueTrackerName, "value": issueTrackerName});
          
        }
        
      }
      
      // - issue hours
      var issueStarteDate = typeof issueDates.startDate != 'undefined' ? issueDates.startDate : "-"
      if (issueStarteDate == "-") {
        currentIssueStatus = "未着手"
      }
      
      //MARK: - push elements
      //MARK: - project name - プロジェクト
      bodyArray.push(projectName);
      
      //MARK: - issue custom name, custom_files[0].name - クライアント名
      bodyArray.push("-");
      
      //MARK: - issue custom value, custom_files[0].value - ブランド
      bodyArray.push("-");
      
      //MARK: - issue empty value, mall information - モール
      bodyArray.push("-");
      
      //MARK: - issue id - ID
      bodyArray.push(issueKey);
      
      //MARK: - issue subject - 案件名
      bodyArray.push(issueSummary);
      
      //MARK: - issue tracker name - 区分
      bodyArray.push(issueTrackerName);
      
      //MARK: - issue start date - 着手日
      bodyArray.push(issueStarteDate);
      
      //MARK: - issue due date - リリース日
      bodyArray.push(issueResolutionDate);
      
      //MARK: - issue status - ステータス
      bodyArray.push(issueStatus);
      
      //MARK: - estimated hours - 見積工数（h）
      bodyArray.push(issueEstimatedHours);
      
      //MARK: - actual hours spent, TODO - 実工数(h)
      bodyArray.push(issueActualHours);
      
      //MARK: - issue estimated cost, TBD - 請求金額
      bodyArray.push("-");
      
      //MARK: - issue account item, NEED TO ASK - 勘定科目
      bodyArray.push("-");
      
      //MARK: - scheduled release month, EMPTY
      bodyArray.push(issueDueDate);
      
      //MARK: - team name - チーム名
      bodyArray.push(issueGroupNames);
      
      //MARK: - contact name - 担当者名
      bodyArray.push(issueAssignee);
      
      //MARK: - remarks - 備考
      bodyArray.push("-");
      
      //MARK: - append body content
      sheetObject.appendRow(bodyArray);
      bodyArray = [""];
      
      // - set background color
      var activeRange = sheetObject.getRange(sheetObject.getLastRow(), 1, 1, sheetObject.getLastColumn())
      if (sheetObject.getLastRow() %2 == 0) {
        activeRange.setBackgroundRGB(204,204,255);
        
      }
      
      // - if has issue key
      if (issueKey != "-") {
        var getKeyRange = sheetObject.getRange(sheetObject.getLastRow(), 6)
        var link = "https://diamondhead.atlassian.net/browse/" + issueKey + "?page=com.atlassian.jira.plugin.system.issuetabpanels%3Aworklog-tabpanel"
        var displayName = issueKey
        getKeyRange.setFormula("=hyperlink(\""+link+"\";\"" + displayName + "\")");
      }
    }
    
    // - get pagination information
    totalCount = response["total"];
    totalPages = Math.ceil(totalCount / limit);
    offset = offset + limit;
    
    // - the last row of the current sheet
    _CURRENT_SHEET_LAST_ROW = sheetObject.getLastRow();
    
    // - the last offset of the sheet
    _CURRENT_SHEET_LAST_OFFSET = offset
    
    // - if total page, and page counter is the same, set last page
    if (offset > totalCount) {
      hasNext = false;
        
    }
    
    // - update sheet settings
    updateSheetSettings()
  }
  
}

/*
processJIRASummaryTime
- param.object: contains a json object of the sheet's structure
- param.sheetObject: contains the active sheet
*/
function processJIRASummaryTime(issueID){
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
  
  // - set total hours
  var objReturn = {startDate: "-", actualHours: "-"};
  var totalSeconds = 0;
  var oldestCreated = false;
  
  // - setup body content
  while (hasNext) { 
    // - url
    var response = postJIRARequest("https://diamondhead.atlassian.net/rest/api/2/issue/" + issueID + "/worklog?startAt=" + offset + "&maxResults=" + limit);
    var workLogs = typeof response["worklogs"] == 'undefined' ? [] : response["worklogs"];
    
    // - if has no work logs
    for (var i = 0; i < workLogs.length; i ++) {
      // - use work log
      var workLog = workLogs[i];
      
      // - get total seconds
      var totalTimeSpent = typeof workLog.timeSpentSeconds == "undefined" ? "-" : parseInt(workLog.timeSpentSeconds);
      totalTimeSpent = isNaN(totalTimeSpent) ? 0 : totalTimeSpent;
      
      // - increment the total seconds
      totalSeconds += totalTimeSpent;
      
      // - if has no created
      if (typeof workLog.created == 'undefined') {
        continue;
        
      }
      
      // - if first time
      if (oldestCreated == false) {
        oldestCreated = workLog.created;
        continue;
        
      }
      
      // - get dates
      var oldCreated = new Date(oldestCreated).valueOf();
      var newCreated = new Date(workLog.created).valueOf();
      
      // - if the new created is older than the previous date
      if (newCreated <= oldCreated) {
        oldestCreated = workLog.created;
        
      }
      
    }
    
    // - get pagination information
    totalCount = response["total"];
    offset = offset + limit;
    
    // - if total page, and page counter is the same, set last page
    if (offset > totalCount) {
      hasNext = false;
        
    }
    
  }
  
  // - set the resolution date
  oldestCreated = !oldestCreated ? "-" : oldestCreated;
  oldestCreated = oldestCreated == "-" ? "-" : Moment.moment(oldestCreated).format("YYYY-MM-DD");
  
  // - convert seconds to hours
  objReturn.actualHours = (totalSeconds/60)/60;
  objReturn.startDate = oldestCreated;
  
  // - return total hours
  return objReturn;
}

/*
processJIRAGroupNames
- designatedUser: contains a user's name
*/
function processJIRAGroupNames(designatedUser){
  // - set object to return
  var objReturn = "";
  
  // - set response
  var response = postJIRARequest("https://diamondhead.atlassian.net/rest/api/2/user?username=" + designatedUser + "&expand=groups");
  var groups = typeof response["groups"] == 'undefined' ? {} : response["groups"];
  groups = typeof groups["items"] == 'undefined' ? [] : groups["items"];
  
  // - if has no groups, return value
  if (groups.length == 0) {
    return "-";
  }
  
  // - if has groups, try parsing the information
  for (var i = 0; i < groups.length; i ++) {
    var groupItem = groups[i];
    var groupName = groupItem.name;
    
    // - if group name is undefined, continue
    if (groupName == "undefined") {
      continue;
    }
    
    // - ignore the following group names
    if (
      groupName == "confluence-users" || 
      groupName == "jira-developers" || 
      groupName == "jira-users" || 
      groupName == "diamondhead-admins" ||
      groupName == "jira-admins" ||
      groupName == "co-well-admins"
    ) {
      continue;
    }
    
    // - decide when to add a comma
    if (objReturn.length != 0) {
      objReturn += ", ";
    }
    
    // - add group name
    objReturn += groupName;
  }
  
  // - return total hours
  return objReturn.length == 0 ? "-" : objReturn;
}

/*
processJIRAEpic
- issueID: contains an issue's ID
*/
function processJIRAEpic(issueID){
  // - set total hours
  var objReturn = ""
  
  // - set response
  var response = postJIRARequest("https://diamondhead.atlassian.net/rest/api/2/issue/" + issueID);
  var responseIssues = typeof response["fields"] == "undefined" ? {} : response["fields"];
  var objReturn = typeof responseIssues["customfield_10008"] == 'undefined' ? "-" : responseIssues["customfield_10008"];
  
  // - return total hours
  return objReturn;
}