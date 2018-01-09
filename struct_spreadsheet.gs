//MARK: - get data structures
var structSpreadsheet = {
  // - sheet api key
  "sheet_api_key": "d35ce1f282760a437c0aa08f04218fba24c22cfc",
  
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
  ],
  
  // - spreadsheet sheets
  "sheet_content": [
    // - DS2 sheet
    {
      "project_title": "DS2.0",
      "project_code": "ds_2",
      "project_status": "inactive",
      "api_urls": [
        {
          "type": "redmine",
          "project_id": 20
        },
        {
          "type": "jira",
          "project_id": "DS2"
        }
      ]
    },
    
    // - SCS sheet
    {
      "project_title": "SCS",
      "project_code": "scs",
      "project_status": "active",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "SCSOP"
        },
        {
          "type": "jira",
          "project_id": "SCS"
        }
      ]
    },
    
    // - アマコン sheet
    {
      "project_title": "アマコン",
      "project_code": "amakon",
      "project_status": "inactive",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "LANOPE"
        },
        {
          "type": "jira",
          "project_id": "LAN"
        }
      ]
    },
    
    // - PVS sheet
    {
      "project_title": "PVS",
      "project_code": "pvs",
      "project_status": "inactive",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "PVSOPE"
        },
        {
          "type": "jira",
          "project_id": "PVS"
        }
      ]
    },
    
    // - MDMAP sheet
    {
      "project_title": "MDMAP",
      "project_code": "mdmap",
      "project_status": "inactive",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "MDMAP"
        }
      ]
    },
    
    // - SNAPLINE sheet
    {
      "project_title": "SNAPLINE",
      "project_code": "snapline",
      "project_status": "active",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "SNAPLINE"
        }
      ]
    },
    
    // - 社内システム sheet
    {
      "project_title": "社内システム",
      "project_code": "office_system",
      "project_status": "inactive",
      "api_urls": [
        {
          "type": "jira",
          "project_id": "INHOUSE"
        }
      ]
    }
  ]
}
