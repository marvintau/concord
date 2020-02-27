import React, { createContext, useContext, useState, forwardRef, useEffect} from "react";
import {Spinner, Col, Input, Button} from 'reactstrap';
import {DynamicSizeList as List} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";

import {DataFetchContext} from '../DataFetch'

import './flat-list.css';
import FilterIcon from './filter.svg';
import SortIcon from './sort-ascending.svg';

const DEFAULT_FILTER_HEIGHT = 3;

const FlatListContext = createContext({
  displayList: [],
  sort:() => {},
  filter: () => {},  
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

  const { ItemRenderer, entries } = data;

  if (entries[index] === undefined){
    return <div ref={ref}></div>
  }

  const {filter} = entries[index];
  if(filter !== undefined){
    return <div ref={ref}><div style={{height:filter ? 40 : DEFAULT_FILTER_HEIGHT}} /></div>;
  }

  return <ItemRenderer ref={ref} data={entries[index]} index={index} style={style} />;
});


const FlatList = function({data, children, filterRowRenderer, ...rest}){

  const [colSorts, setColSorts] = useState([]);
  const [colFilters, setColFilters] = useState({});

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

  let displayed = [...data];
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

  const entries = [{filter: filterRowRenderer !== undefined }, ...displayed]
  
  return <FlatListContext.Provider value={{sort, filter}}>
    <List
      itemData={{ ItemRenderer: children, entries}}
      innerElementType={StickTopContainer(filterRowRenderer)}
      {...rest}
    >
      {ItemWrapper}
    </List>
  </FlatListContext.Provider>
}

const StickTopContainer = (FilterRowRenderer) => {

  if (FilterRowRenderer === undefined){
    FilterRowRenderer = () => {
      const style = {
        top: 0,
        height: DEFAULT_FILTER_HEIGHT,
        backgroundColor:'lightgray',
      }    

      return <div style={style} />
    }
  }

  return ({children, ...rest }) => {

    return <div {...rest}>
      <FilterRowRenderer topLength={0} />
      {children}
    </div>
  }
}

export const Column = ({children}) => {
  return typeof children === 'number'
  ? <div style={{textAlign:'right', fontFamily:'Arial Narrow', fontWeight:'700'}}>
      {parseFloat(children.toFixed(2)).toLocaleString('en-us')}
    </div>
  : <div style={{margin:'0.5rem'}}>{children}</div>;
}

const Row = (colSpecs) => {

  return forwardRef(({ data, index, style, select}, ref) => {
  
    const cols = [];
    for (let key in colSpecs){
      const {width, ColRenderer=Column, noBackground} = colSpecs[key];
      cols.push(<Col className={noBackground ? 'clear-back' : ''} md={width} key={key}>
        <ColRenderer index={index-1}>{data[key]}</ColRenderer>
      </Col>)
    }
    
    return <div ref={ref} className='flatlist-row hovered' style={style} onClick={select}>
      {cols}
    </div>
  });
}

const FilterContainer = ({children}) => {
  
  const style = {
    top: 0,
    height: 40,
  }
  
  return <div className="flatlist-filter-row sticky" style={style}>{children}</div>
}

const FilterCol = ({colKey, isHidden, isFilterable, isSortable, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

  const {sort, filter} = useContext(FlatListContext);

  const FilterComp = <div style={{display:'flex'}}>
    <Input bsSize="sm" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
    <Button color="warning" size="sm" style={{marginLeft:'0.5rem'}} onClick={() => filter(colKey, inputVal)}>
      <img alt="filter-button" style={{height:'1rem'}} src={FilterIcon} />
    </Button>
  </div>

  const ManageComp = <div>
    {isFilterable && FilterComp}
    {isSortable && <Button color="warning" size="sm" onClick={() => {sort(colKey)}} style={{marginLeft:'0.5rem'}}>
        <img alt="sort-button" style={{height:'1rem'}} src={SortIcon} />
      </Button>}
  </div>

  return <Col className={`flatlist-filter-col ${ isHidden ? 'blank' : ''}`} style={{height: 40}} {...colProps} >
    {!isHidden && ManageComp}
  </Col>
}

const FilterRow = (colSpecs) => {

  let isNothing = Object.values(colSpecs).every(({isSortable, isFilterable}) => !(isSortable || isFilterable));
  if(isNothing){
    return undefined;
  }

  const cols = [];
  for (let key in colSpecs){
    const {width, isSortable, isFilterable, noBackground} = colSpecs[key];
    cols.push(<FilterCol md={width} key={key} colKey={key} {...{isSortable, isFilterable, isHidden:noBackground}}/>)
  }

  return () => <FilterContainer>{cols}</FilterContainer>
}


export const HeaderCol = ({width, noBack, children}) =>
  <div className={`flatlist-header-col col-md-${width} ${noBack ? 'clear-back' : ''}`}>{children}</div>;

const Header = (colSpecs) => {

  const cols = [];
  for (let key in colSpecs){
    const {width, desc, HeaderColRenderer=HeaderCol, noBackground} = colSpecs[key];

    cols.push(<HeaderColRenderer
      key={key}
      width={width}
      noBack={noBackground}
    >{desc}</HeaderColRenderer>)
  }

  return <div className="flatlist-header">
    {cols}
  </div>
}

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
    'DEAD_INFO' : '未指定数据和远程地址。请联系开发人员'
  }[status];
  return <>
    {Header({none:{width:12}})}
    <div className="nodata-indicator">
      <div className="bad-icon" />
      <div style={{marginTop:'20px'}}>{text}</div>
    </div>
  </>
}

const TableContent = ({colSpecs, data}) => <>
  {Header(colSpecs)}
  <div style={{flex:1, width:'100%'}}>
    <AutoSizer>
      {({height, width}) => {
        return <FlatList
          height={height}
          width={width}
          data={data}
          itemCount={data.length}
          filterRowRenderer={FilterRow(colSpecs)}
        >
          {Row(colSpecs)}
        </FlatList>
      }}
    </AutoSizer>
  </div>
</>

export default ({colSpecs, style}) => {

  const {status, data} = useContext(DataFetchContext);
  console.log(status, data);

  let content;
  if (status.startsWith('DEAD')){
    content = <ErrorIndicator {...{status}} />
  } else if (['PUSH', 'PULL'].includes(status)){
    content = <LoadIndicator {...{status}} />
  } else if (status === 'DONE'){
    content = <TableContent {...{colSpecs, data}} />;
  }

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:'100%', ...style}}>
    {content}
  </div>
}