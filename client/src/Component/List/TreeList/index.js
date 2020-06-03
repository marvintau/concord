import React, { useState, forwardRef, useEffect} from "react";
import List from '@marvintau/poloscope';
import AutoSizer from "react-virtualized-auto-sizer";

import './tree-list.css';

export default function({itemData, Row:OrigRow, HistRow, FilterRow, overscan}){

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
      const lastElem = history.slice(-1)[0];
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

  return <AutoSizer disableWidth={true}>
    {
      ({height}) => <List {...{key:updateKey, itemData:displayed, Row, height, overscan}}>
        {history.map((data, i) => <HistRow key={i} {...{data, select:() => pop(i)}} />)}
        <FilterRow filterCol={filter} sortCol={sort} />
      </List>
    }
  </AutoSizer>
}
