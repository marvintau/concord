import React, { createContext, useContext, useState, forwardRef, useEffect, useCallback} from "react";
import {DynamicSizeList as List} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";

import {get} from '@marvintau/chua';

import './tree-list.css';

const DEFAULT_FILTER_HEIGHT = 3;
const HIST_LINE_HEIGHT = 40;


const TreeListContext = createContext({

  sublist: [],
  history:[],
  displayed: [],

  filter: () => {},
  select:() => {},
});


const ItemWrapper = forwardRef(({ data, index, style }, ref) => {

  const {select} = useContext(TreeListContext);
  const { ItemRenderer, entries, delimIndex } = data;

  if (entries[index] === undefined){
    return <div ref={ref}></div>
  }

  if(index === delimIndex){
    return <div ref={ref}><div style={{height:entries[index].filter ? 40 : DEFAULT_FILTER_HEIGHT}} /></div>;
  } else if (index < delimIndex){
    return <div ref={ref}><div style={{height:HIST_LINE_HEIGHT}} /></div>;
  } else {
    const {__path: path} = entries[index];
    return <ItemRenderer ref={ref} style={style} data={entries[index]} select={() => select(path)} />;
  }
});

const PrimDiv = ({ onScroll, forwardedRef, style, children }) => {
  const refSetter = useCallback(scrollbarsRef => {
    if (scrollbarsRef) {
      forwardedRef(scrollbarsRef.view);
    } else {
      forwardedRef(null);
    }
  }, []);

  return (
    <div className='hidden-scroll'
      ref={refSetter}
      style={style}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};

const PrimDivWrapper = forwardRef((props, ref) => (
  <PrimDiv {...props} forwardedRef={ref} />
));


const TreeList = function({data, children, historyRowHeight, historyRowRenderer, filterRowRenderer, ...rest}){

  const [history, setHistory] = useState([]);
  const [sublist, setSublist] = useState(data);

  const [colFilters, setColFilters] = useState({});

  useEffect(() => {
    setSublist(data);
    setColFilters({});
  }, [data])

  const select = (path) => {

    const {record, list} = get(data, {path, withList:true});
    if (record.__children !== undefined){
      setHistory(list);
      setSublist(record.__children);
    }
  }

  const pop = (path) => {
    if (path.length === 1){
      setHistory([]);
      setSublist(data);
    } else {
      const {record, list} = get(data, {path:path.slice(0, -1), withList: true});
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

  const entries = [...history, {filter: filterRowRenderer !== undefined }, ...displayed]
  console.log('displayed tree', entries);
  return <TreeListContext.Provider value={{history, sublist, select, pop, filter}}>
    <List
      itemData={{ ItemRenderer: children, entries, delimIndex: history.length}}
      itemCount={entries.length}
      overscanCount={20}
      outerElementType={PrimDivWrapper}
      innerElementType={HistoryContainer(historyRowRenderer, filterRowRenderer, historyRowHeight, history, pop, filter)}
      {...rest}
    >
      {ItemWrapper}
    </List>
  </TreeListContext.Provider>
}

const HistoryContainer = (HistRowRenderer, FilterRowRenderer, historyRowHeight, history, pop, filter) => {

  return ({children, ...rest }) => {

    return <div key="HistoryContainer" {...rest}>
      {history.map((elem, index) => {

        const style = {
          left: 0, 
          top: index * historyRowHeight,
          height: historyRowHeight,
          width: "100%", 
        }

        const {__path: path} = elem;

        const Hist = <HistRowRenderer
          data={elem}
          key={index}
          style={style}
          select={() => pop(path)}
        />

        return Hist;
      })}
      <FilterRowRenderer topLength={history.length} filterCol={filter} />
      {children}
    </div>
  }
}


export default ({data, Row, HistRow, FilterRow}) => 
  <AutoSizer disableWidth={true}>
  {({height}) => {
    return <TreeList
      height={height}
      data={data}
      historyRowRenderer={HistRow}
      historyRowHeight={HIST_LINE_HEIGHT}
      filterRowRenderer={FilterRow}
    >
      {Row}
    </TreeList>
  }}
  </AutoSizer>

// HistRow = CreateRow(colSpecs, rowEdit, sheetName, {sticky:true, editable: false})
// Row = CreateRow(colSpecs, rowEdit, sheetName)
// FilterRow = CreateFilterRow(colSpecs)