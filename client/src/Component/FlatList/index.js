import React, { createContext, useContext, useState, forwardRef, useEffect} from "react";
import {Col, Input, Button} from 'reactstrap';
import {DynamicSizeList as List} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";

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

  return <ItemRenderer ref={ref} data={entries[index]} style={style} />;
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

const Row = (colSpecs) => {

  return forwardRef(({ data, style, select}, ref) => {
  
    const cols = [];
    for (let key in colSpecs){
      const {width, ColRenderer} = colSpecs[key];
      cols.push(<Col md={width} key={key}><ColRenderer>{data[key]}</ColRenderer></Col>)
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

const FilterCol = ({colKey, isFilterable, isSortable, ...colProps}) => {

  const [inputVal, setInputVal] = useState('');

  const {sort, filter} = useContext(FlatListContext);

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

  return () => <FilterContainer>{cols}</FilterContainer>
}

const Header = (colSpecs) => {

  const cols = [];
  for (let key in colSpecs){
    const {width, desc, HeaderColRenderer} = colSpecs[key];
    cols.push(<Col md={width} key={key}><HeaderColRenderer>{desc}</HeaderColRenderer></Col>)
  }

  return <div className="flatlist-header">
    {cols}
  </div>
}

export const ColRenderer = ({children}) => {
  return typeof children === 'number'
  ? <div style={{textAlign:'right', fontFamily:'Arial Narrow', fontWeight:'700'}}>
      {parseFloat(children.toFixed(2)).toLocaleString('en-us')}
    </div>
  : <div style={{margin:'0.5rem'}}>{children}</div>;
}

export const HeaderColRenderer = ({children}) =>
  <div style={{margin:'0.5rem'}}>{children}</div>;

export default ({data, colSpecs, style}) => {

  console.log(data)

  return <div style={{display:'flex', flexDirection:"column", height:'100%', width:800, ...style}}>
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
  </div>
}