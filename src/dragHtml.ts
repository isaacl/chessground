import * as board from './board';
import { State } from './state';
import * as cg from './types';

export const onDragStart = (s: State) => (e: DragEvent) => {
  if (!e.target || !e.dataTransfer) return;
  const t = e.target as HTMLElement,
  position = [e.clientX, e.clientY] as cg.NumberPair,
  orig = board.getKeyAtDomPos(position, board.whitePov(s), s.dom.bounds());
  console.log("ondragstart", position, orig);

  e.dataTransfer.setData("key", 'e5');
  e.dataTransfer.effectAllowed = 'moveCopy';
  // (event.dataTransfer as any).mozCursor = 'auto';
  // sigh.
  const offset = t.clientWidth * (navigator.userAgent.search("Firefox") > 0 ? 0.5 : 1);
  // The grabber cursor blocks more of the piece so offset it to grab the piece lower
  e.dataTransfer.setDragImage(t, offset, offset + t.clientWidth * .3);

  if (navigator.userAgent.search("Firefox") > 0) {
    // sigh
    setTimeout(() => (t.style.opacity = ".1"), 0);
  } else t.style.opacity = ".1";
};
