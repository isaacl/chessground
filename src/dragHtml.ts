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
  // TODO: fix before merge..
  const offset = (s.dom.bounds().width / 8) / (navigator.userAgent.search("Firefox") > 0 ? window.devicePixelRatio : 1);
  e.dataTransfer.setDragImage(t, offset, offset);


  // TODO: tweak timing of removing old drag image?
  // once drag begins, mouse movements no longer get reported, so
  // js drag piece can be in wrong place.  But drag image takes a bit
  // to display so removing the old render too fast means a flash
  // maybe use dragover to update coordinates to drag and delay
  // removing drag image for a bit
  requestAnimationFrame(() => {
    // raf for firefox, so dragged image isn't ghosted
    t.classList.add('ghost');

    // cancel in raf to avoid a flash
    cancelJsDrag(s);
    board.selectSquare(s, orig);
    s.dom.redraw();
  });
}

export const onDragEnd = (s: State) => (e: DragEvent) => {
  (e.target as HTMLElement).classList.remove('ghost');
  board.unselect(s);
  s.dom.redraw();
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
  s.dom.redraw();
};

export const squareDragEnter = (e: DragEvent) => {
  (e.target as HTMLElement).classList.add('dragover');
}

export const squareDragLeave = (e: DragEvent) => {
  (e.target as HTMLElement).classList.remove('dragover');
}

export const boardDragEnter = (board: HTMLElement) => (e: DragEvent) => {
  if (e.target !== board) return;
  if (e.dataTransfer!.types.indexOf(lichessKey) < 0) return;
  e.preventDefault();
}

export const boardDragOver = (e: DragEvent) => {
  // required to accept drops.
  e.preventDefault();
}
