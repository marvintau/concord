import {useEffect, useRef, useState, useCallback} from 'react';

const useRafState = (initState) => {
  const frame = useRef(0);
  const [state, setState] = useState(initState);

  const setRafState = useCallback((val) => {
    cancelAnimationFrame(frame.current);

    frame.current = requestAnimationFrame(() => {
      setState(val);
    });
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
  });

  return [state, setRafState];
}

export default (ref) => {

  const [state, setState] = useRafState({
    scrollTop: 0,
    isScrolling: false,
    scrollTopDelta: 0
  });

  useEffect(() => {
    const handler = (e) => {
      (ref.current) && setState(({scrollTop:prevTop}) => {
        const {scrollTop:currTop, isScrolling} = ref.current;
        const scrollTopDelta = currTop - prevTop;
        return {
          isScrolling,
          scrollTop: currTop,
          scrollTopDelta 
        }
      });
    };

    (ref.current) && ref.current.addEventListener('scroll', handler, {
      capture: false,
      passive: true,
    });

    return () => {
      (ref.current) && ref.current.removeEventListener('scroll', handler);
    };
  }, [ref]);

  return state;
};
