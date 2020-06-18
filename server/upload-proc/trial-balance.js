var Window = require('window');
global.window = new Window();

const {setTable} = require('../database');
const {columnNameRemap, readSheets, cascade} = require('./utils');

let header = [
  ['项目名称', 'ccode_name'],
  ['项目编号', 'ccode'],
  ['金额', 'ref'],
  ['归入条目', 'categorized'],

  // 以下部分是专门用于所有者权益变动表的
  ['股本', 'capital'],
  ['其他权益工具-优先股', 'other-preferred-shares'],
  ['其他权益工具-永续债', 'other-perpetual-bonds'],
  ['其他权益工具-其它', 'other-other'],
  ['资本公积', 'capital-surplus'],
  ['减：库存股', 'treasury'],
  ['其他综合收益', 'other-earned'],
  ['专项储备', 'special-reserves'],
  ['盈余公积', 'feature-surplus'],
  ['一般风险准备', 'risk-prepare'],
  ['未分配利润', 'undistributed'],
  ['股东权益合计', 'amount'],
  
  ['期初余额', 'mb'],
  ['期末余额', 'me'],
  ['借方发生', 'md'],
  ['贷方发生', 'mc'],
]

async function TRIAL_BALANCE(fileBuffer, context){

  const {project_id} = context;

  const sheets = readSheets(fileBuffer, [
    'TB-试算平衡条目',
    'SOFP-资产负债表条目',
    'PAL-损益表条目',
    'CASH-现金流量表条目',
    'EQUITY-所有者权益表条目'
  ]);

  // console.log(sheets, 'sheets');

  const sheetEntries = {};

  for (let sheetName in sheets) {
    let sheet = sheets[sheetName];

    const tableName = {
      'TB-试算平衡条目': 'TRIAL_BALANCE',
      'SOFP-资产负债表条目': 'SOFP',
      'PAL-损益表条目': 'PAL',
      'CASH-现金流量表条目': 'CASHFLOW',
      'EQUITY-所有者权益表条目': 'EQUITY',
    }[sheetName];

    sheet = columnNameRemap(sheet, header, {handleNum:false});

    
    if (tableName === 'TRIAL_BALANCE') {

      for (let rec of sheet) {

        rec.mb = {type:'ref-fetch', expr:rec.mb, disp:'res'}
        rec.md = {type:'ref-fetch', expr:rec.md, disp:'res'}
        rec.mc = {type:'ref-fetch', expr:rec.mc, disp:'res'}
        rec.me = {type:'ref-fetch', expr:rec.me, disp:'res'}
      }
      // console.log(sheet);
    }
    
    if ('ccode' in sheet[0]) {
      sheet = cascade(sheet, 'ccode');
    }
    
    const entry = {data: sheet, indexColumn:'ccode_name'};

    sheetEntries[tableName] = entry;

    await setTable({project_id, table:'PROJECT'}, tableName, entry)
    
  }

  // console.log(JSON.stringify(sheetEntries['EQUITY'], null, 2));

  return sheetEntries['TRIAL_BALANCE'];
}

module.exports = TRIAL_BALANCE