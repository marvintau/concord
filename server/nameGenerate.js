const vowels = ['ar', 'ra', 're', 'co', 'mo', 'ge', 'be', 'ti'],
      ends = ['ll', 'st', 'lt', 'sch', 'ius'];

function genName(vowelMinLen=4, vowelMaxLen=8, {end=true, capital=true}={}){
  let len = Math.floor(Math.random()*(vowelMaxLen-vowelMinLen) + vowelMinLen);

  // avoiding same vowel repeats too many times in a name.
  let vowelMarked = vowels.map(e => ({key:e, rem:2}));

  let name = '';
  for (let i = 0; i < len; i++){
    const vowelIndex = Math.floor(Math.random()*vowels.length);
    const {key, rem} = vowelMarked[vowelIndex];
    if(rem > 0){
      vowelMarked[vowelIndex].rem --;
      name += key;
    }
  }

  // Both to make it looks more like a real name.
  if (end) {
    let endVowel = ends[Math.floor(Math.random()*ends.length)];
    name += endVowel;
  }

  if (capital){
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name;
}

const PROB = 0.1;
function recursivePush(list, field, entry){
  let listRef = list,
      prefix = '';
  
  while(true) notFoundClosestAncestorYet:{
    for (let {[field]: col, children} of listRef){
      if(Math.random() < PROB){
        listRef = children;
        prefix = col;
        break notFoundClosestAncestorYet;
      }
    }

    // When for loop ends and we reach here, we have
    // found the closest ancestor: the owner of listRef.
    let randAdd = Math.random().toString(36).substring(11);
    listRef.push({...entry, [field]:`${prefix}${randAdd}`});
    break;
  }
}

function genEntries(length){

  let entries = [];
  for (let i = 0; i < length; i++){
    recursivePush(entries, 'name', {
      desc: genName(3, 6),
      key:i,
      mb:Math.random()*10e7,
      me:Math.random()*10e7,
      mc:Math.random()*10e7,
      md:Math.random()*10e7,
      children:[]
    });
  }

  return entries;
}


function genDirectories(length) {
  let directories = {Home: {children: []}};

  for (let i = 0; i < length; i++){
    const name = genName(3, 5);
    
    if (name in directories){
      i--; break;
    }
    
    const keys = Object.keys(directories);
    const randomKey = keys[Math.floor(Math.random()*keys.length)];
    directories[name] = {};

    if (!directories[randomKey].children){
      directories[randomKey].children = [];
    }
    directories[randomKey].children.push(name);
  }

  return directories;
}

function prefix(p, arr, delim="/"){
  return arr.map(([k, v]) => [`${p}${delim}${k}`, v]);
}

function flat(entries, pathColKey){
  return entries
  .reduce((acc, entry) => {
    
    // get the actual column value according to the specified key.
    const {[pathColKey]:pathCol, children} = entry;

    const prefixed = children === undefined || children.length === 0
    ? [[pathCol, entry]]                           // for leaf node
    : prefix(pathCol, flat(children, pathColKey)) // for non-leaf node.
    
    return [...acc, ...prefixed]
  }, [])
}

function genRefTable(entries, len){
  // 1. flat the entries
  const flattened = flat(entries, 'desc');

  len = Math.min(len, entries.length);
  const result = [];
  for (let i = 0; i < len; i++){
    result.push(flattened.splice(Math.floor(Math.random() * entries.length), 1)[0])
  }

  const options = ['$期初', '$期末', '$借方', '$贷方'];

  return result.map(([k, {desc}]) => ({ value: `/${k}:${options[(Math.floor(Math.random() * options.length))]}`, desc }));
}

module.exports = {
  genName
}