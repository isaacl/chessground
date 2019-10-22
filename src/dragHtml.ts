import * as board from './board';
import { State } from './state';
import * as cg from './types';
import { clear as drawClear } from './draw'
import { cancel as cancelJsDrag } from './drag'

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
  const offset = (s.dom.bounds().width / 8) / (navigator.userAgent.search("Firefox") > 0 ? window.devicePixelRatio : 1);
  // The grabber cursor blocks more of the piece so offset it to grab the piece lower
  e.dataTransfer.setDragImage(t, offset, offset * 1.15);

  requestAnimationFrame(() => {
    // raf for firefox, so dragged image isn't ghosted
    t.classList.add('ghost');

    // cancel in raf to avoid a flash
    cancelJsDrag(s);
    board.selectSquare(s, orig);
  });
}

export const onDragEnd = (s: State) => (e: DragEvent) => {
  const end = board.getKeyAtDomPos([e.clientX, e.clientY] as cg.NumberPair,
    board.whitePov(s), s.dom.bounds());

  console.log('ondragend', end);
  cancelJsDrag(s);
  board.unselect(s);
  (e.target as HTMLElement).classList.remove('ghost');
};

export const onDrop = (s: State) => (e: DragEvent) => {
  const dest = board.getKeyAtDomPos([e.clientX, e.clientY] as cg.NumberPair,
    board.whitePov(s), s.dom.bounds()),
  orig = e.dataTransfer!.getData(lichessKey) as cg.Key;

  console.log("ondrop", orig, dest);
  if (!dest || !orig) return;

  e.preventDefault();
  board.unsetPremove(s);
  board.unsetPredrop(s);
  if (orig !== dest) {
    s.stats.ctrlKey = e.ctrlKey;
    if (board.userMove(s, orig, dest)) s.stats.dragged = true;
  }

};
