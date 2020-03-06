import React, { createContext, useContext, useState, forwardRef, useEffect} from "react";
import {Spinner,Col, Input, Button} from 'reactstrap';
import {DynamicSizeList as List} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";

import './tree-list.css';
import FilterIcon from './filter.svg';
import SortIcon from './sort-ascending.svg';

const DEFAULT_FILTER_HEIGHT = 3;

// TreeList 用来显示层级数据的重要部件
// ----------------------------------
// **props:**
// TreeList accepts a "data" prop, indicating the input tree-like
// data strcture besides other props of react-window. The data
// is in array-of-record form, of which the record should contain a
// children attribute that refers to another array-of-record form.
// 
// **inner attribute / state:**
// The TreeList contains three important attributes. Since they will be
// updated, they can also be seen as state.
// 
// history: the history / path to particular record / node.
// sublist: the children of the record that the history navigate to.
// displayList: the sublist applied with fitler and sort method.
// 
// methods:
// select: select the node from list (either the root nodes or childrens
//         of other node.)

const TreeListContext = createContext({

  sublist: [],
  displayList: [],
  history:[],

  sort:() => {},
  filter: () => {},

  pop:() => {},
  select:() => {},
});

// Item Wrapper
// ------------
// the direct item render of react-window List.
// 
// Note:
// 1. Item Wrapper only displays the content of sublist.
// 
// 2. Through it doesn't render the history records and filter bar, however,
//    it reserves the room for them. For DynamicSizeList, the height of the
//    component returned from ItemWrapper cannot be directly assigned. It
//    depends on the height of inner component. So you could specify the height
//    in the inner component.
// 
// 3. Conceivably the calculation of row height utilizes the getBoundingClientRect(),
//    thus it requires the ref of the component inside the ItemRenderer. Thus,
//    both of ItemRenderer and ItemWrapper need to be wrapped with forwardRef, so that
//    to pass the ref from ItemMeasurer (the stuff actually measures height) to the
//    innermost component.

const ItemWrapper = forwardRef(({ data, index, style }, ref) => {

  const {select} = useContext(TreeListContext);
  const { ItemRenderer, entries } = data;

  if (entries[index] === undefined){
    return <div ref={ref}></div>
  }

  const {filter} = entries[index];
  if(filter !== undefined){
    return <div ref={ref}><div style={{height:filter ? 40 : DEFAULT_FILTER_HEIGHT}} /></div>;
  }

  if (entries[index].histIndex !== undefined) {
    return <div ref={ref}><div style={{height:30}} /></div>;
  }

  return <ItemRenderer
    ref={ref}
    style={style}
    data={entries[index]}
    select={() => select(entries[index].listIndex)}
  />;
});


const TreeList = function({data, children, historyRowHeight, historyRowRenderer, filterRowRenderer, ...rest}){

  const ProcessedData = data.map((e, i) => ({...e, listIndex:i}));

  const [history, setHistory] = useState([]);
  const [sublist, setSublist] = useState(ProcessedData);

  const [colSorts, setColSorts] = useState([]);
  const [colFilters, setColFilters] = useState({});

  useEffect(() => {
    const ProcessedData = data.map((e, i) => ({...e, listIndex:i}));
    setSublist(ProcessedData);
    setColSorts([]);
    setColFilters({});
  }, [data])

  const select = (ith) => {

    console.log('select', ith);

    if (sublist[ith] && sublist[ith].children !== undefined){
      let newHistoryEntry = {...sublist[ith], histIndex:history.length};
      let newSublist = sublist[ith].children.map((e, i) => ({...e, listIndex:i}))
  
      setHistory([...history, newHistoryEntry]);
      setSublist(newSublist);
    }
  }

  const pop = (ith) => {
    const newHistory = history.slice(0, ith);
    setHistory(newHistory);

    let newSublist;
    if (newHistory.length > 0){
      newSublist = newHistory[newHistory.length-1].children.map((e, i) => ({...e, listIndex:i}));
    } else {
      newSublist = data.map((e, i) => ({...e, listIndex:i}))
    }
    setSublist(newSublist);
  }

  const sort = (key) => {

    let sorts = [...colSorts];

    if(sorts.length > 0){
      let keyIndex = sorts.findIndex((e) => e.col === key);

      let iden = {col:key, order:'ascend'};
      if (keyIndex !== -1){
        [iden] = sorts.splice(keyIndex, 1);
        iden.order = iden.order === 'ascend' ? 'descend' : 'ascend';
      }
      sorts.push(iden);

    } else {
      sorts = [{col:key, order:'ascend'}];
    }

    setColSorts(sorts);
  }

  const filter = (key, pattern) => {
    console.log('filtered')
    setColFilters({...colFilters, [key]: pattern});
  }

  let displayed = [...sublist];
  for (let {col, order} of colSorts){
    displayed.sort((prev, next) => {
      const original = prev[col] < next[col] ? -1 : prev[col] > next[col] ? 1 : 0;
      const modifier = {
        'descend' : 1,
        'ascend'  : -1
      }[order];

      return original * modifier;
    })
  }

  for (let key in colFilters){
    const filtered = displayed.filter((elem) => {
      return elem[key].toString().includes(colFilters[key]);
    })

    if (filtered.length > 0){
      displayed = filtered;
    }
  }

  const entries = [...history, {filter: filterRowRenderer !== undefined }, ...displayed]
  
  return <TreeListContext.Provider value={{history, sublist, select, pop, sort, filter}}>
    <List
      itemData={{ ItemRenderer: children, entries}}
      itemCount={entries.length}
      innerElementType={HistoryContainer(historyRowRenderer, filterRowRenderer, historyRowHeight, history, pop)}
      {...rest}
    >
      {ItemWrapper}
    </List>
  </TreeListContext.Provider>
}

const HistoryContainer = (HistRowRenderer, FilterRowRenderer, historyRowHeight, history, pop) => {

  if (FilterRowRenderer === undefined){
    FilterRowRenderer = ({topLength}) => {
      const style = {
        top: topLength * historyRowHeight,
        height: DEFAULT_FILTER_HEIGHT,
        backgroundColor:'lightgray',
      }    

      return <div style={style} />
    }
  }

  return ({children, ...rest }) => {

    return <div {...rest}>
      {history.map((elem, index) => {

        const style = {
          left: 0, 
          top: index * historyRowHeight,
          width: "100%", height: historyRowHeight
        }

        return <HistRowRenderer
          data={history[index]}
          key={index}
          style={style}
          pop={() => pop(history[index].histIndex)}
        />
      })}
      <FilterRowRenderer topLength={history.length} />
      {children}
    </div>
  }
}

const HIST_LINE_HEIGHT = 30;

export const Column = ({children}) => {
  return typeof children === 'number'
  ? <div style={{textAlign:'right', fontFamily:'Arial Narrow', fontWeight:'700'}}>
      {parseFloat(children.toFixed(2)).toLocaleString('en-us')}
    </div>
  : <div style={{margin:'0.5rem'}}>{children}</div>;
}

const Row = (colSpecs) => {

  return forwardRef(({ data, style, select}, ref) => {
  
    console.log(data, 'row');

    const cols = [];
    for (let key in colSpecs){
      const {width, ColRenderer=Column} = colSpecs[key];
      cols.push(<Col md={width} key={key}><ColRenderer>{data[key]}</ColRenderer></Col>)
    }
    
    return <div ref={ref} className='treelist-row hovered' style={style} onClick={select}>
      {cols}
    </div>
  });
}

export const HistCol = ({children}) => {
  return typeof children === 'number'
  ? <div style={{textAlign:'right', fontFamily:'Arial Narrow', fontWeight:'700'}}>
      {parseFloat(children.toFixed(2)).toLocaleString('en-us')}
    </div>
  : <div style={{margin:'0.5rem'}}>{children}</div>;
}

const HistoryRow = (colSpecs) => {

  return ({ data, style, pop}) => {
      
    const cols = [];
    for (let key in colSpecs){
      const {width, HistColRenderer=HistCol} = colSpecs[key];
      cols.push(<Col md={width} key={key}><HistColRenderer>{data[key]}</HistColRenderer></Col>)
    }

    return <div className="treelist-history-row sticky hovered" style={style} onClick={pop}>
      {cols}
    </div>
  }
};

const FilterContainer = ({children, topLength}) => {
  
  const style = {
    top: topLength * HIST_LINE_HEIGHT,
    height: 40,
  }
  
  return <div className="treelist-filter-row sticky" style={style}>{children}</div>
}

const FilterCol = ({colKey, isFilterable, isSortable, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

  const {sort, filter} = useContext(TreeListContext);

  const colStyle = {
    display:'flex',
  }

  const FilterComp = <div style={{display:'flex'}}>
    <Input bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
    <Button color="warning" size="sm" style={{marginLeft:'0.5rem'}} onClick={() => filter(colKey, inputVal)}>
      <img alt="filter-button" style={{height:'1rem'}} src={FilterIcon} />
    </Button>
  </div>

  return <Col style={colStyle} {...colProps} >
    {isFilterable && FilterComp}
    {isSortable && <Button color="warning" size="sm" onClick={() => {sort(colKey)}} style={{marginLeft:'0.5rem'}}>
        <img alt="sort-button" style={{height:'1rem'}} src={SortIcon} />
      </Button>}
  </Col>
}

const FilterRow = (colSpecs) => {

  let isNothing = Object.values(colSpecs).every(({isSortable, isFilterable}) => !(isSortable || isFilterable));
  if(isNothing){
    return undefined;
  }

  const cols = [];
  for (let key in colSpecs){
    const {width, isSortable, isFilterable} = colSpecs[key];
    cols.push(<FilterCol md={width} key={key} colKey={key} isSortable={isSortable} isFilterable={isFilterable} />)
  }

  return ({topLength}) => 
    <FilterContainer topLength={topLength}>
      {cols}
    </FilterContainer>
}

export const HeaderCol = ({children}) =>
  <div style={{margin:'0.5rem'}}>{children}</div>;

const Header = (colSpecs) => {

  const cols = [];
  for (let key in colSpecs){
    const {width, desc, HeaderColRenderer=HeaderCol} = colSpecs[key];
    cols.push(<Col md={width} key={key}><HeaderColRenderer>{desc}</HeaderColRenderer></Col>)
  }

  return <div className="treelist-header">
    {cols}
  </div>
}

const TableContent = ({data, colSpecs}) => <>
  {Header(colSpecs)}
  <div style={{flex:1, width:'100%'}}>
    <AutoSizer>
    {({height, width}) => {
      return <TreeList
        height={height}
        width={width}
        data={data}
        historyRowRenderer={HistoryRow(colSpecs)}
        historyRowHeight={HIST_LINE_HEIGHT}
        filterRowRenderer={FilterRow(colSpecs)}
      >
        {Row(colSpecs)}
      </TreeList>
    }}
    </AutoSizer>
  </div>
</>

const LoadIndicator = ({status}) => {
  const text = {
    'PUSH': '更新',
    'PULL': '载入'
  }[status];
  return <>
    {Header({none:{width:12}})}
    <div className="nodata-indicator">
      <Spinner color="info" />
      <div style={{marginTop:'20px'}}>正在{text}数据...</div>
    </div>
  </>
};

const ErrorIndicator = ({status}) => {
  const text = {
    'DEAD_LOAD' : '网络错误，请刷新重试，或联系开发人员',
    'DEAD_INFO' : '未指定数据和远程地址。请联系开发人员',
    'DEAD_REFS_NOT_FOUND' : '没有找到引用表的数据，可能是您还没上传',
    'DEAD_DATA_NOT_FOUND' : '没有找到数据表的数据，可能是您还没上传',
    'DEAD_NOT_IMPL' : '服务器上没有对应数据的处理方法，请联系开发人员',
    'DEAD_PROC_ERROR' : '处理数据时发生了错误，请联系开发人员'
  }[status];
  return <>
    {Header({none:{width:12}})}
    <div className="nodata-indicator">
      <div className="bad-icon" />
      <div style={{marginTop:'20px'}}>{text}</div>
    </div>
  </>
}

export default ({data, status, colSpecs}) => {

  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status.startsWith('DONE')){
    content = <TableContent {...{colSpecs, data}} />;
  }

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:'100%'}}>
    {content}
  </div>
}