let ASSISTED = [
  ['科目名称', 'ccode_name'],
  ['科目编号', 'ccode'],
  ['科目编码', 'ccode'],
  ['会计月', 'iperiod'],
  ['凭证编号', 'ino_id'],
  ['编号','inid'],
  ['业务说明', 'cdigest'],
  ['核算项目类型编号', 'check_type_code'],
  ['核算项目类型名称', 'check_type_name'],
  ['核算项目ID', 'check_id'],
  ['核算项目名称', 'check_name'],
  ['核算项目序号', 'check_num'],
  ['借方发生额', 'mb'],
  ['贷方发生额', 'mc'],
  ['会计年', 'iyear'],
  ['对方科目名称', 'ccode_equal'],
  ['记账时间','dbill_date'],
]

let JOURNAL = [
  ['会计年', 'iyear'],
  ['会计月', 'iperiod'],
  ['记账时间', 'dbill_date'],
  ['凭证编号', 'ino_id'],
  ['编号', 'inid'],
  ['行', 'inid'],
  ['业务说明', 'cdigest'],
  ['摘要', 'cdigest'],
  ['科目编号', 'ccode'],
  ['科目编码', 'ccode'],
  ['科目名称', 'ccode_name'],
  ['借方发生额', 'md'],
  ['贷方发生额', 'mc'],
  ['对方科目名称', 'ccode_equal'],
]

let BALANCE = [
  ['会计年' , 'iyear'],
  ['会计月' , 'iperiod'],
  ['科目编号' , 'ccode'],
  ['科目编码', 'ccode'],
  ['科目名称' , 'ccode_name'],
  ['科目类别' , 'cclass'],
  ['账面期初数' , 'mb'],
  ['账面期初余额' , 'mb'],
  ['期初余额' , 'mb'],
  ['期初金额' , 'mb'],
  ['期初余额借方' , 'mbd'],
  ['期初余额贷方' , 'mbc'],
  
  ['本期发生借方', 'md'],
  ['账面借方发生额' , 'md'],
  ['未审借方发生额' , 'md'],
  ['借方发生额', 'md'],

  ['账面贷方发生额' , 'mc'],
  ['贷方发生额' , 'mc'],
  ['未审贷方发生额' , 'mc'],
  ['本期发生贷方', 'mc'],

  ['账面期末数' , 'me'],
  ['账面期末余额' , 'me'],
  ['期末金额' , 'me'],
  ['期末余额' , 'me'],
  ['期末余额借方' , 'med'],
  ['期末余额贷方' , 'mec'],
]

let CASHFLOW_WORKSHEET = [
  ['项目', 'item'],
  ['值', 'value']
]

let FINANCIAL_WORKSHEET = [
  ['项目', 'item'],
  ['值', 'value']
]

module.exports = {
  BALANCE,
  JOURNAL,
  ASSISTED,
  CASHFLOW_WORKSHEET,
  FINANCIAL_WORKSHEET
}
