import React, {useContext} from 'react';
import RefCore from './ref';

import {Exchange} from '../../Exchange';

const FetchRef = ({sheetName, colName, disabled, cellData, data, placeholder}) => {

  const {getSuggs, setField, evalSheet} = useContext(Exchange);

  const {__path:path} = data;

  const saveEdit = (value) => {
    setField(sheetName, path, colName, {type:'fetch-ref', expr:value});
    evalSheet(sheetName);
  }

  const {expr="", result, code} = cellData;
  
  const desc = {
    WARN_UNDEFINED_FUNC:              '函数没有定义',
    WARN_INCOMPLETE_REFERENCE_FORMAT: '不是一个完整的引用（可能是没写取哪个数？）',
    WARN_SHEET_NOT_EXISTS:            '被引用的表没找到（再确认下名称）',
    WARN_RECORD_NOT_FOUND:            '按给定的路径没找到对应条目',
    WARN_NOT_EQUAL:                   '校验结果不相等',
    WARN_VAR_NOT_FOUND:               '要取的数或变量不存在',
    WARN:                             '请参考子项中的错误信息',
    INFO_ALTER_PATH:                  '此结果是通过等效的路径名称得到的',
    SUCC:                             '成功!',
    FAIL:                             '失败...',
    NORM:                             '正常'
  }[code];
  
  return <RefCore {...{expr, result, code, desc, disabled, getSuggs, saveEdit, placeholder}} />
}

const StoreRef = ({sheetName, colName, disabled, cellData, data:rec, placeholder}) => {
  
  const {expr="", result, code} = cellData;

  const {getSuggs, setField, assignRecTo, evalSheet} = useContext(Exchange);

  // const {__path: paath}

  const saveEdit = (value) => {
    assignRecTo(rec, colName, value)
    evalSheet(sheetName);
  }
  
  return <RefCore {...{expr, result, code, desc:'not implemented', disabled, getSuggs, saveEdit, placeholder}} />
}

export default ({sheetName, colName, disabled: disabledProp, children: cellData, data, attr:{placeholder='empty', type='fetch-ref'}={}}) => {

  if (cellData === undefined) {
    return "";
  }
  
  const {disabled: disabledData} = cellData;

  const disabled = disabledProp || disabledData;

  if (type === 'fetch-ref') {
    return <FetchRef {...{sheetName, colName, disabled, cellData, data, placeholder}} />
  } else if (type === 'store-ref') {
    return <StoreRef {...{sheetName, colName, disabled, cellData, data, placeholder}} />
  } else {
    return <div>Ref还不支持{type}类型</div>
  }

}