import React, {useContext} from 'react';
import RefCore from './ref';

import {Exchange} from '../../Exchange';


const explanation = {
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
}

export const FetchRef = ({sheetName, colName, disabled, children: cellData, data:{__path}}) => {

  const {expr="", result, code} = cellData;
  
  const {getSuggs, setField, evalSheet} = useContext(Exchange);

  const desc = explanation[code];

  const saveEdit = (value) => {
    setField(sheetName, __path, colName, {expr:value});
    evalSheet(sheetName);
  }

  return <RefCore {...{expr, result, code, desc, disabled, getSuggs, saveEdit}} />
}

export const StoreRef = ({sheetName, colName, disabled, children: cellData}) => {
  return <></>
}