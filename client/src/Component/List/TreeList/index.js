import React, { useState, forwardRef, useEffect} from "react";
import List from '@marvintau/poloscope';
import AutoSizer from "react-virtualized-auto-sizer";

import './tree-list.css';
import {Spinner} from 'reactstrap';

const LoadIndicator = ({status}) => {
  const text = {
    'PUSH': '更新',
    'PULL': '载入'
  }[status];
  return <div className="nodata-indicator">
    <Spinner color="info" />
    <div style={{marginTop:'20px'}}>正在{text}数据...</div>
  </div>
};

const ErrorIndicator = ({status}) => {
  // console.log(status, 'error indicator' )
  const text = {
    'DEAD_LOAD' : '网络错误，请刷新重试，或联系开发人员',
    'DEAD_INFO' : '未指定数据和远程地址。请联系开发人员',
    'DEAD_NOT_FOUND' : '没有找到数据，可能是您还没上传',
    'DEAD_NOT_IMPL_PULL': '数据存在，但是没有实现表示数据的方法，请联系开发人员',
    'DEAD_NOT_IMPL_PUSH': '服务器没有实现更新数据的方法，请联系开发人员',
    'DEAD_NOT_IMPL_UPLOAD': '服务器没有实现上传数据的处理方法，请联系开发人员',
    'DEAD_NOT_IMPL' : '服务器上没有对应数据的处理方法，请联系开发人员',
    'DEAD_PROC_ERROR' : '处理数据时发生了错误，请联系开发人员',
    'DEAD_BALANCE_NOT_FOUND': '需要您先上传科目余额表',
    'DEAD_UNKNOWN_UPLOAD_ERROR': '上传时发生了错误',
    'DEAD_UNKNOWN_FETCH_ERROR': '获取数据时发生了错误',
    'DEAD_UNKNOWN_PUSH_ERROR': '更新数据库时发生了错误',
    'DEAD_INVALID_NUMERIC_FORMAT': '不支持的数字格式。通常发生在您上传的Excel中，应该是数字的单元格中包含了文本'
  }[status];
  return <div className="nodata-indicator">
    <div className="bad-icon" />
    <div style={{marginTop:'20px'}}>{text}</div>
  </div>
}

export default function({itemData, Row:OrigRow, HistRow, FilterRow, overscan, initialItemHeight, status}){

  // console.log('before first useState called');

  const [history, setHistory] = useState([]);
  const [sublist, setSublist] = useState(itemData);

  const [colFilters, setColFilters] = useState({});
  const [colSorts, setColSorts] = useState({});

  const [updateKey, setUpdateKey] = useState('NEW');

  const rerenderList = () => {
    setUpdateKey(Math.random().toString(35).slice(2, 7));
  }

  useEffect(() => {
    setSublist(itemData);
    setColFilters({});
    rerenderList();
  }, [itemData])

  const select = (record) => {
  
    console.log('select', record, 'sublist:', record.__children);

    if (record.__children !== undefined && record.__children.length > 0){
      setHistory([...history, record]);
      setSublist(record.__children);
      rerenderList();
    }
  }

  const pop = (index) => {

    const newHist = history.slice(0, index);

    setHistory(newHist);
    if (newHist.length === 0){
      setSublist(itemData);
    } else {
      const lastElem = newHist.slice(-1)[0];
      setSublist(lastElem.__children);
    }
    rerenderList();
  }

  const filter = (key, pattern) => {
    console.log('filtered by', pattern);
    setColFilters({...colFilters, [key]: pattern});
  }

  const sort = (key) => {
    const order = colSorts[key];
    const nextOrder = order === 'ascending'
    ? 'descending'
    : order === 'descending'
    ? undefined
    : 'ascending'
    
    setColSorts({[key]: nextOrder})
  }

  let displayed = [...sublist];

  for (let key in colFilters){
    const filtered = displayed.filter((elem) => {
      return elem[key].toString().includes(colFilters[key]);
    })

    if (filtered.length > 0){
      displayed = filtered;
    }
  }

  for (let key in colSorts){
    if (colSorts[key]){
      displayed.sort(({[key]:valA}, {[key]:valB}) => colSorts[key] === 'descending' ? valB - valA : valA - valB);
    }
  }

  const Row = forwardRef(({data, style}, ref) => 
    <OrigRow {...{ref, data, style, select}} />
  )

  // console.log(status, 'before rendering list')
  if (status.startsWith('DEAD')){
    return <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    return <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    return <AutoSizer disableWidth={true}>
    {
      ({height}) => <List {...{key:updateKey, itemData:displayed, Row, height, overscan, initialItemHeight}}>
        {history.map((data, i) => <HistRow key={i} {...{data, select:() => pop(i)}} />)}
        <FilterRow filterCol={filter} sortCol={sort} />
      </List>
    }
    </AutoSizer> 
  } else {
    return <div>未知状态: {status}</div>
  }
}
