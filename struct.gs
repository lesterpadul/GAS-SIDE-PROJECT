// - global spreadsheet variable
var _SPREADSHEET = null;

// - denotes the current sheet
var _CURRENT_SHEET = null;

// - denotes the current sheet status
var _CURRENT_SHEET_STATUS = null;

// - determines if a new sheet was generated
var _DID_GENERATE_NEW = false;

// - the index of the current project
var _CURRENT_PROJECT_INDEX = 0;

// - the index of the current project's issue
var _CURRENT_PROJECT_ISSUE_INDEX = 0;

// - the current proejct
var _CURRENT_PROJECT = {};

// - the last row of the current sheet
var _CURRENT_SHEET_LAST_ROW = 1;

// - the last offset of the sheet
var _CURRENT_SHEET_LAST_OFFSET = 0;

// - the last page of the sheet
var _CURRENT_SHEET_LAST_PAGE = 1;

// - catch when the sheet was parsed
var _DID_PARSE_SHEET = false

// - get start time
var _CURRENT_START_TIME = null;

// - get the end time
var _CURRENT_END_TIME = null;

// - get the last start time
var _LAST_START_TIME = null;

// -set the current status
var _CURRENT_STATUS = "DONE"

// - access mail
var _ADMIN_MAIL = "killkue@gmail.com"

// - set the process start time
var _PROCESS_START_TIME = Moment.moment().unix();

// - get data structures
var structSpreadsheet = {
  // - sheet api key
  "sheet_api_key": "",
  
  // - jira credentials
  "jira_login_id": "",
  "jira_login_pw": "",
  
  // - folder id
  "folder_id": "",
  
  // - set the shet content
  "sheet_content": [],
  
  // - sheet headers
  "sheet_headers": [
    {
      "eng_name": "project",
      "jp_name": "プロジェクト"
    },
    {
      "eng_name": "client name",
      "jp_name": "クライアント名"
    },
    {
      "eng_name": "brand",
      "jp_name": "ブランド"
    },
    {
      "eng_name": "mall",
      "jp_name": "モール"
    },
    {
      "eng_name": "ID",
      "jp_name": "ID"
    },
    {
      "eng_name": "project title",
      "jp_name": "案件名"
    },
    {
      "eng_name": "distinction",
      "jp_name": "区分"
    },
    {
      "eng_name": "start date",
      "jp_name": "着手日"
    },
    {
      "eng_name": "release date",
      "jp_name": "リリース日"
    },
    {
      "eng_name": "status",
      "jp_name": "ステータス"
    },
    {
      "eng_name": "estimated hours",
      "jp_name": "見積工数（h）"
    },
    {
      "eng_name": "actual hours",
      "jp_name": "実工数(h）"
    },
    {
      "eng_name": "billing amount",
      "jp_name": "請求金額"
    },
    {
      "eng_name": "account item",
      "jp_name": "勘定科目"
    },
    {
      "eng_name": "scheduled release month",
      "jp_name": "リリース予定月"
    },
    {
      "eng_name": "team name",
      "jp_name": "チーム名"
    },
    {
      "eng_name": "contact name",
      "jp_name": "担当者名"
    },
    {
      "eng_name": "remarks",
      "jp_name": "備考"
    }
  ]
};

// - set brand structure
var structBrand = [  
   {  
      client_name: "",
      brand_name: "",
      mall_name: "",
      identifier: ""
   }
];