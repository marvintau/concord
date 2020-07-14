import React, {useState} from 'react';
import './refcell.css';

export default ({result, code}) => {

  const [explained, setExplained] = useState();

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
    FAIL_NO_ASSIGN_COND:              '没有满足的重分类条件，不能重分类',
    FAIL_MUL_ASSIGN_COND:             '有多个满足的重分类条件, 不能重分类',
    NORM:                             '正常'
  }[code];

  const content = typeof result === 'number'
  ? parseFloat(result.toFixed(2)).toLocaleString('en-us', {minimumFractionDigits: 2})
  : result

  const onClick = (e)=>{
    e.preventDefault();
    e.stopPropagation();
    setExplained(!explained)
  }

  const className = `refcell-badge ${code ? code.slice(0, 4).toLowerCase() : 'NONE' }`;

  return <div {...{className, onClick}}>
    {content}
    {explained && <div className="refcell-result-tip">{desc || '不解释'}</div>}
  </div>

}
