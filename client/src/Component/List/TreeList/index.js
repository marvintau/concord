import React, { useState, forwardRef, useEffect} from "react";
import List from '@marvintau/poloscope';
import AutoSizer from "react-virtualized-auto-sizer";

import {get} from '@marvintau/chua';

import './tree-list.css';

export default function({itemData, Row:OrigRow, HistRow, FilterRow, overscan}){

  const [history, setHistory] = useState([]);
  const [sublist, setSublist] = useState(itemData);

  const [colFilters, setColFilters] = useState({});

  useEffect(() => {
    setSublist(itemData);
    setColFilters({});
  }, [itemData])

  const select = (path) => {
    console.log('select', path);
    const {record, list} = get(itemData, {path, withList:true});
    if (record.__children !== undefined && record.__children.length > 0){
      setHistory(list);
      setSublist(record.__children);
    }
  }

  const pop = (path) => {
    if (path.length === 1){
      setHistory([]);
      setSublist(itemData);
    } else {
      const {record, list} = get(itemData, {path:path.slice(0, -1), withList: true});
      setHistory(list);
      setSublist(record.__children);
    }
  }

  const filter = (key, pattern) => {
    console.log('filtered')
    setColFilters({...colFilters, [key]: pattern});
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

  const Row = forwardRef(({data, style}, ref) => 
    <OrigRow {...{ref, data, style, select:() => select(data.__path)}} />
  )

  return <AutoSizer disableWidth={true}>
    {
      ({height}) => <List {...{itemData:displayed, Row, height, overscan}}>
        {history.map((data, i) => <HistRow key={i} {...{data, select:() => pop(data.__path)}} />)}
        <FilterRow filterCol={filter} />
      </List>
    }
  </AutoSizer>
}
