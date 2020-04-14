import React, { memo, createContext, useState, forwardRef} from "react";
import {DynamicSizeList as List, areEqual} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";
import {Col} from 'reactstrap';

import FilterRow from '../FilterRow';
import Cell from '../../Cell';

import './flat-list.css';

const DEFAULT_FILTER_HEIGHT = 3;

const FlatListContext = createContext({
  displayList: [],
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

  const [colFilters, setColFilters] = useState({});

  const filter = (key, pattern) => {
    console.log('filtered')
    setColFilters({...colFilters, [key]: pattern});
  }

  let displayed = [...data];
  for (let key in colFilters){
    const filtered = displayed.filter((elem) => {
      return elem[key].toString().includes(colFilters[key]);
    })

    if (filtered.length > 0){
      displayed = filtered;
    }
  }

  const entries = [{filter: filterRowRenderer !== undefined }, ...displayed]
  console.log(entries, 'entries');
  return <FlatListContext.Provider value={{filter}}>
    <List
      itemData={{ ItemRenderer: children, entries}}
      itemCount={entries.length}
      innerElementType={StickTopContainer(filterRowRenderer, filter)}
      overscanCount={20}
      {...rest}
    >
      {ItemWrapper}
    </List>
  </FlatListContext.Provider>
}

const StickTopContainer = (FilterRowRenderer, filter) => {

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
      <FilterRowRenderer topLength={0} filterCol={filter} />
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

const Row = (colSpecs, sheetName) => {

  return memo(forwardRef(({ data, style, select}, ref) => {
  
    const cols = [];
    for (let key in colSpecs){
      const {width, cellType:type='Text', noBackground, attr} = colSpecs[key];
      const ColRenderer = Cell[type];
      cols.push(<div className={noBackground ? 'clear-back' : ''} key={key} style={{width, height:'100%', flexShrink: 0}}>
        <ColRenderer data={data} sheetName={sheetName} colName={key} attr={attr}>{data[key]}</ColRenderer>
      </div>)
    }
    
    return <div ref={ref} className='flatlist-row hovered' style={style} onClick={select}>
      {cols}
    </div>
  }), areEqual);
}

export default ({colSpecs, sheetName, data, sort, filter}) =>
  <AutoSizer disableWidth={true}>
    {({height}) => {
      return <FlatList
        height={height}
        data={data}
        filterRowRenderer={FilterRow(colSpecs, filter, sort)}
      >
        {Row(colSpecs, sheetName)}
      </FlatList>
    }}
  </AutoSizer>
