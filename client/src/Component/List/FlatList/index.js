import React, { createContext, useState, forwardRef, useCallback} from "react";
import {DynamicSizeList as List} from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer";
import { OverlayScrollbarsComponent as ScrollDiv } from 'overlayscrollbars-react';

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
      outerElementType={PrimDivWrapper}
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

    return  <div {...rest} options={{scrollbars: {autoHide:'move'}}}>
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

export default ({colSpecs, sheetName, data, CreateRow, CreateFilterRow, rowEdit}) =>
  <AutoSizer disableWidth={true}>
    {({height}) => {
      return <FlatList
        height={height}
        data={data}
        filterRowRenderer={CreateFilterRow(colSpecs)}
      >
        {CreateRow(colSpecs, rowEdit, sheetName)}
      </FlatList>
    }}
  </AutoSizer>
