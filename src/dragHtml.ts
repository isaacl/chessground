import * as board from './board';
import { State } from './state';
import * as cg from './types';
import { clear as drawClear } from './draw'


const lichessKey = 'application/lichess.origin'

export const onDragStart = (s: State) => (e: DragEvent) => {
  if (!e.target || !e.dataTransfer) return;
  const t = e.target as cg.PieceNode,
  orig = t.cgKey;
  console.log("ondragstart", orig);

  if (s.drawable.enabled && s.drawable.eraseOnClick) // TODO || piece.color !== s.turnColor
    drawClear(s);

  e.dataTransfer.setData(lichessKey, orig.toString());
  e.dataTransfer.effectAllowed = 'move';
  // (event.dataTransfer as any).mozCursor = 'auto';
  // sigh.
  const offset = t.clientWidth / (navigator.userAgent.search("Firefox") > 0 ? window.devicePixelRatio : 1);
  // The grabber cursor blocks more of the piece so offset it to grab the piece lower
  e.dataTransfer.setDragImage(t, offset, offset * 1.3);

  if (navigator.userAgent.search("Firefox") > 0) {
    // sigh
    setTimeout(() => t.classList.add('ghost'), 0);
  } else t.classList.add('ghost');
}

export const onDragEnd = (s: State) => (e: DragEvent) => {
  const end = board.getKeyAtDomPos([e.clientX, e.clientY] as cg.NumberPair,
    board.whitePov(s), s.dom.bounds());

  console.log('ondragend', end);
  (e.target as HTMLElement).classList.remove('ghost');
};

export const onDrop = (s: State) => (e: DragEvent) => {
  const end = board.getKeyAtDomPos([e.clientX, e.clientY] as cg.NumberPair,
    board.whitePov(s), s.dom.bounds());

  console.log("ondrop", e.dataTransfer!.getData(lichessKey), end);
};
