const {
  createRecs,
  retrieveRecs,
  update,
  remove
} = require('.');

const tableSpecSchema = {
  keys: {
    name: String, // table name
    tableTools: Select(['HeaderCreate', 'SaveRemote', 'ExportExcel']),
    colSpecs: {
      keys: {
        desc: String,
        cellType: Select(['Text', 'Number', 'Ref', 'StateForm', 'Labels']),
        width: Number,
        isFilerable: Boolean,
        isSortable: Boolean,
      }      
    }
  }
}

const defaultTableSpecs = [
  {
    name: 'CATEGORY_NAME_ALIASES',
    tableTools: ['HeaderCreate', 'SaveRemote'],
    colSpecs: {
      alias: {desc: '科目别名', width: 12, cellType:'Labels'},
    },
  },
  {
    name: 'COLUMN_NAME_ALIASES',
    tableTools: ['HeaderCreate', 'SaveRemote'],
    colSpecs: {
      aliases: {desc: '表头别名', width: 12, cellType: 'Labels'},
    },
  },
  {
    name: 'PROJECT',
    tableTools: ['HeaderCreate'],
    colSpecs: {
      year: {desc: '年度', width: 2, isFilterable: true},
      companyName: {desc: '项目（企业）名称', width: 10, isFilterable: true},
    },
    rowEdit: {isSync: true, removeEnabled: true},
  },
  {
    name: 'BALANCE',
    colSpecs: {
      ccode: {desc: '编码', width: 1, isFilterable: true},
      ccode_name: {desc: '科目名称', width: 3, isFilterable: true},
      mb: {desc: '期初', width: 2, isFilterable: true, cellType:'Number'},
      md: {desc: '借方', width: 2, isFilterable: true, cellType:'Number'},
      mc: {desc: '贷方', width: 2, isFilterable: true, cellType:'Number'},
      me: {desc: '期末', width: 2, isFilterable: true, cellType:'Number'},
    }
  },
  {
    name: 'ACCRUAL_ANALYSIS',
    isCascaded: true,
    isHidingManual: true,
    tools: ['SaveRemote', 'ExportExcel'],
    colSpecs: {
      ccode_name: {desc: '科目名称', width: 2, isFilterable: true},
      md: {desc: '借方发生', width: 1, isFilterable: true, isSortable: true, cellType:'Number'},
      mc: {desc: '贷方发生', width: 1, isFilterable: true, isSortable: true, cellType:'Number'},
      dest_ccode_name: {desc: '对方科目', width: 2, isFilterable: true},
      descendant_num: {desc: '笔数', width: 1, isSortable: true},
      digest: {desc:'摘要', width: 4, isFilerable: true},
      analyzed: {desc:'已分析', width: 1}
    },
  },
]

// table specs should be created via createRec.

async function initTableSpecs () {
  // 1. remove all exisiting records
    await remove({table: 'TABLE_SPEC'});
    await createRecs('TABLE_SPEC', defaultTableSpecs);

    return 
}

function addTableSpec(){
  // ...
}

function editTableSpec(){
  // ...
}

function fetchTable(tableName){
  // ...
}