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
    var url = "https://diamondhead.atlassian.net/rest/api/2/search?jql=";
    
    //yun 02/02 start
    // - encode the JQL params 
    var urlParams = "(project=" + object.project_id + " AND issuetype in standardIssueTypes() AND "
    urlParams += "((statusCategory in ('In Progress', 'To Do')) OR "
    
    // - get the start of last month
    var currentMonthStart = Moment.moment(new Date()).startOf('month').format('YYYY-MM-DD 00:00:00');
    
    // - if within 1st and 6th day, start from the 7th day of last month
    if (_CURRENT_DAY_CYCLE >= 1 && _CURRENT_DAY_CYCLE <= 6) {
      currentMonthStart = Moment.moment(new Date()).subtract(1,'months').startOf('month').format('YYYY-MM-DD 00:00:00');
      
    }
    
    // - include data
    urlParams += "(statusCategory in ('Done') AND resolutiondate >= '" + currentMonthStart + "')))"
    
    // - append the encoded uri
    url += encodeURIComponent(urlParams) + "&startAt=" + offset + "&maxResults=" + limit
    
    // - set the response
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
      var issueDueDate = ""
      
      // - get issue resolution date
      var issueResolutionDate = typeof currentIssueFields.resolutiondate == 'undefined' || currentIssueFields.resolutiondate == null ? "-" : currentIssueFields.resolutiondate;
      issueResolutionDate = issueResolutionDate == "-" ? "" : Moment.moment(currentIssueFields.resolutiondate).format("YYYY/MM/DD");
      
      // - set the issue status
      var issueStatus = issueResolutionDate != '' ? "完了" : "仕掛中"
      
      // - get issue assignee
      var issueAssignee = typeof currentIssueAssignee.name == 'undefined' ? "" : currentIssueAssignee.name;
      
      // - get issue key
      var issueKey = typeof currentIssue.key == 'undefined' ? "" : currentIssue.key;
      
      // - set issue summary
      var issueSummary = typeof currentIssueFields.summary == "undefined" ? "" : currentIssueFields.summary;
      
      // - set estimated hours
      var issueEstimatedHours = typeof currentIssueFields.aggregatetimeoriginalestimate == 'undefined' ? false : parseInt(currentIssueFields.aggregatetimeoriginalestimate);
      issueEstimatedHours = isNaN(issueEstimatedHours) ? "" : (issueEstimatedHours/60)/60;
      
      // - set the actual hours spent per issue
      var issueActualHours = typeof currentIssueFields.aggregatetimespent == 'undefined' ? false : parseInt(currentIssueFields.aggregatetimespent);
      issueActualHours = isNaN(issueActualHours) ? "" : (issueActualHours/60)/60;
      
      // - set the issue tracker name
      var issueTrackerName = typeof currentIssueFields.customfield_10007 == 'undefined' ? "" : currentIssueFields.customfield_10007;
      
      // - get issue dates
      var issueDates = {};
      var issueGroupNames = "";
      
      //yun 02/02 start
      var issueAccountItem = ""
      //yun 02/02 end
      
      // - get the labels
      var issueLabels = typeof currentIssueFields.labels != "undefined" ? currentIssueFields.labels : [];
logger("FETCHING_JIRA_ISSUE_IDENTIFIER: - processing issue name | " + projectName + " | " + offset + " | issue id = " + issueKey)
      var issueIdentifier = getJIRAIdentifierInfo(issueLabels)
logger("FETCHING_JIRA_ISSUE_IDENTIFIER: - processed issue name | " + projectName + " | " + offset + " | issue id = " + issueKey)
      
      // - if has an issue key
      if (issueKey != "" && issueKey) {
logger("FETCHING_JIRA_SUMMARY_TIME: - processing summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)
        issueDates = processJIRASummaryTime(issueKey);
logger("FETCHING_JIRA_SUMMARY_TIME: - processed summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)

      }
      
      // - if has issue assignee
      if (issueAssignee != "" && issueAssignee) {
        // - check if the same key already exists in the temporary container
        var hasGroupValue = getValueFromArrayByKey(issueAssignee, JIRA_GROUP_NAME_CONTAINER);
        if (typeof hasGroupValue.value != "undefined") {
          issueGroupNames = hasGroupValue.value;
          
        } else {
logger("FETCHING_JIRA_GROUP_NAMES: - processing summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)
          issueGroupNames = processJIRAGroupNames(issueAssignee);
          JIRA_GROUP_NAME_CONTAINER.push({"key": issueAssignee, "value": issueGroupNames});
logger("FETCHING_JIRA_GROUP_NAMES: - processing summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)

        }
        
      }
      
      // - if has issue tracker name
      if (issueTrackerName != "" && issueTrackerName) {
        // - check if the same key already exists in the temporary container
        var hasEpicValue = getValueFromArrayByKey(issueTrackerName, JIRA_EPIC_CONTAINER);
        if (typeof hasEpicValue.value != "undefined") {
          issueTrackerName = hasEpicValue.value;
        
        } else {
logger("FETCHING_JIRA_GROUP_NAMES: - processing summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)
          issueTrackerName = processJIRAEpic(issueTrackerName);
          JIRA_EPIC_CONTAINER.push({"key": issueTrackerName, "value": issueTrackerName});
logger("FETCHING_JIRA_GROUP_NAMES: - processing summary time | " + projectName + " | " + offset + " | issue id = " + issueKey)
          
        }
        
      }
      
      //yun 02/02 start
      // - set account item
      if (issueTrackerName == "機能開発" && issueStatus == "完了") {
        issueAccountItem= "資産"
        
      } else if (issueTrackerName == "機能開発" && issueStatus == "仕掛中") {
        issueAccountItem= "仮勘定"
        
      } else if (issueTrackerName == "保守" || issueTrackerName == "管理") {
        issueAccountItem= "費用"
        
      } else {}
      //yun 02/02 end
      
      // - get the issue start date
      var issueStartDate = typeof issueDates.startDate != 'undefined' ? issueDates.startDate : ""
      
      // - if issue start date is empty, don't continue
      if (issueStartDate == "") {
        continue;
      }
      
      //MARK: - push elements
      //MARK: - project name - プロジェクト
      bodyArray.push(projectName);
      
      //MARK: - issue custom name, custom_files[0].name - クライアント名
      bodyArray.push(typeof issueIdentifier["client_name"] == "undefined" ? "" : issueIdentifier["client_name"]);
      
      //MARK: - issue custom value, custom_files[0].value - ブランド
      bodyArray.push(typeof issueIdentifier["brand_name"] == "undefined" ? "" : issueIdentifier["brand_name"]);
      
      //MARK: - issue empty value, mall information - モール
      bodyArray.push(typeof issueIdentifier["mall_name"] == "undefined" ? "" : issueIdentifier["mall_name"]);
      
      //MARK: - issue id - ID
      bodyArray.push(issueKey);
      
      //MARK: - issue subject - 案件名
      bodyArray.push(issueSummary);
      
      //MARK: - issue tracker name - 区分
      bodyArray.push(issueTrackerName);
      
      //MARK: - issue start date - 着手日
      bodyArray.push(issueStartDate);
      
      //MARK: - issue due date - リリース日
      bodyArray.push(issueResolutionDate);
      
      //MARK: - issue status - ステータス
      bodyArray.push(issueStatus);
      
      //MARK: - estimated hours - 見積工数（h）
      bodyArray.push(issueEstimatedHours);
      
      //MARK: - actual hours spent, TODO - 実工数(h)
      bodyArray.push(issueActualHours);
      
      //MARK: - issue estimated cost, TBD - 請求金額
      bodyArray.push("");
      
      //MARK: - issue account item, NEED TO ASK - 勘定科目
      //yun 
      bodyArray.push(issueAccountItem);
      
      //MARK: - scheduled release month, EMPTY
      bodyArray.push(issueDueDate);
      
      //MARK: - team name - チーム名
      bodyArray.push(issueGroupNames);
      
      //MARK: - contact name - 担当者名
      bodyArray.push(issueAssignee);
      
      //MARK: - remarks - 備考
      bodyArray.push("");
      
      //MARK: - append body content
logger("SETTING_JIRA_ROW_CONTENT: - processing issue row | " + projectName + " | " + offset + " | issue id = " + issueKey)
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
logger("SETTING_JIRA_ROW_CONTENT: - processed issue row | " + projectName + " | " + offset + " | issue id = " + issueKey)
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
    
    // - check if pass the allowed execution time
    if (isPassExecutionTime()) {
      hasNext = false;
      break;
    }
  }
  
}

//yun 02/02 start
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
  var objReturn = {startDate: "", actualHours: ""};
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
      var totalTimeSpent = typeof workLog.timeSpentSeconds == "undefined" ? "" : parseInt(workLog.timeSpentSeconds);
      totalTimeSpent = isNaN(totalTimeSpent) ? 0 : totalTimeSpent;
      
      // - increment the total seconds
      totalSeconds += totalTimeSpent;
      
      // - if has no created
      if (typeof workLog.started == 'undefined') {
        continue;
        
      }
      
      // - if first time
      if (oldestCreated == false) {
        oldestCreated = workLog.started;
        continue;
        
      }
      
      // - get dates
      var oldCreated = new Date(oldestCreated).valueOf();
      var newCreated = new Date(workLog.created).valueOf();
      
      // - if the new created is older than the previous date
      if (newCreated <= oldCreated) {
        oldestCreated = workLog.started;
        
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
  oldestCreated = !oldestCreated ? "" : oldestCreated;
  oldestCreated = oldestCreated == "" ? "" : Moment.moment(oldestCreated).format("YYYY/MM/DD");
  
  // - convert seconds to hours
  objReturn.actualHours = (totalSeconds/60)/60;
  objReturn.startDate = oldestCreated;
  
  // - return total hours
  return objReturn;
}
//yun 02/02 end

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
    return "";
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
      groupName == "co-well-admins" ||
      groupName == "balsamiq-mockups-editors" ||
      groupName == "site-admins" ||
      groupName == "administrators"
    ) {
      continue;
    }
    
    // - if diamondhead
    if (groupName == "diamondhead") {
      groupName = "東京"
    }
    
    // - if karabiner
    if (groupName == "karabiner") {
      groupName = "カラビナ"
    }
    
    // - if cowell
    if (groupName == "co-well") {
      groupName = "コウェル"
    }
    
    // - decide when to add a comma
    if (objReturn.length != 0) {
      objReturn += ", ";
    }
    
    // - add group name
    objReturn += groupName;
  }
  
  // - return total hours
  return objReturn.length == 0 ? "" : objReturn;
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
  var objReturn = typeof responseIssues["customfield_10008"] == 'undefined' ? "" : responseIssues["customfield_10008"];
  
  // - return total hours
  return objReturn;
}

/*
getJIRAIdentifierInfo
- issueID: this will fetch the custom field and value
*/
function getJIRAIdentifierInfo(labels){
  // - object to return
  var objReturn = {'client_name': "", 'brand_name': "", 'mall_name': ""};
  
  // - if labels is empty return default
  if (labels.length == 0) {
    return objReturn;
  }
  
  // - loop through the labels
  for (var jiraI = 0; jiraI < labels.length; jiraI++) {
    // - try to fetch the information
    var tmpObj = findItemInObject(structBrand, labels[jiraI], "identifier");
    
    // - if tmp object gets a hit, return immediately
    if (tmpObj != false) {
      // - set the returned values
      objReturn.client_name = typeof tmpObj.client_name != "undefined" ? tmpObj.client_name : "" 
      objReturn.brand_name = typeof tmpObj.brand_name != "undefined" ? tmpObj.brand_name : ""
      objReturn.mall_name = typeof tmpObj.mall_name != "undefined" ? tmpObj.mall_name : ""
      return objReturn
    }
  }
  
  // - return total hours
  return objReturn;
}