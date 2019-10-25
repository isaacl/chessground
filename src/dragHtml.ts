import * as board from './board';
import { State } from './state';
import * as cg from './types';
import { clear as drawClear } from './draw'
import * as dragJs from './drag'
import * as util from './util'

let dragOrigin: cg.Key | undefined;

let dragCancelCallback: number | undefined;

export const onDragStart = (s: State) => (e: DragEvent) => {
  if (!e.target || !e.dataTransfer) return;
  const t = e.target as cg.PieceNode,
  orig = t.cgKey,
  piece = s.pieces[orig];

  console.log("ondragstart", orig, piece);

  if (!orig || !piece || !board.isDraggable(s, orig)) return;

  if (s.drawable.enabled && (s.drawable.eraseOnClick || piece.color !== s.turnColor))
    drawClear(s);

  dragOrigin = orig;

  // Firefox requires data to start a drag...
  e.dataTransfer.setData('application/lichess', 'dummy');

  e.dataTransfer.effectAllowed = 'move';
  // TODO: fix before merge..
  const offset = (s.dom.bounds().width / 8) / (navigator.userAgent.search("Firefox") > 0 ? window.devicePixelRatio : 1);
  e.dataTransfer.setDragImage(t, offset, offset);

  if (s.selected !== orig) {
    board.setSelected(s, orig);
    s.hold.start();
  }

  // raf for firefox, so dragged image isn't ghosted
  requestAnimationFrame(() => t.classList.add('ghost'))

  dragCancelCallback = setTimeout(() => {
    dragCancelCallback = undefined;
    // cancel in timeout to avoid flash from slow drag image.
    dragJs.cancel(s);
    board.selectSquare(s, orig);
    s.dom.redraw();
  }, 150);
}

export const onDragEnd = (s: State) => (e: DragEvent) => {
  dragOrigin = undefined;
  (e.target as HTMLElement).classList.remove('ghost');
  board.unselect(s);
  if (dragCancelCallback) {
    clearTimeout(dragCancelCallback);
    dragCancelCallback = undefined;
    dragJs.cancel(s);
  }
  s.dom.redraw();
};

export const onDrop = (s: State) => (e: DragEvent) => {
  const pos = util.eventPosition(e as cg.MouchEvent);
  if (!pos) return;
  const dest = board.getKeyAtDomPos(pos, board.whitePov(s), s.dom.bounds());
  console.log("ondrop", dragOrigin, dest);
  if (!dest || !dragOrigin) return;

  e.preventDefault();
  board.unsetPremove(s);
  board.unsetPredrop(s);
  if (dragOrigin !== dest) {
    s.stats.ctrlKey = e.ctrlKey;
    if (board.userMove(s, dragOrigin, dest)) s.stats.dragged = true;
  }
  s.dom.redraw();
};

export const squareDragEnter = (e: DragEvent) => {
  (e.target as HTMLElement).classList.add('dragover');
}

export const squareDragLeave = (e: DragEvent) => {
  (e.target as HTMLElement).classList.remove('dragover');
}

// This event does not seem to matter but according to spec must be canceled.
export const boardDragEnter = (board: HTMLElement) => (e: DragEvent) => {
  console.log('dragenter', e.target, dragOrigin);
  if (e.target !== board || !dragOrigin) return;
  e.preventDefault();
}

export const boardDragOver = (s: State) => (e: DragEvent) => {
  if (!dragOrigin) return;

  // Update js drag location to bridge gap until drag image is displayed.
  dragJs.move(s, e as cg.MouchEvent);

  e.dataTransfer!.dropEffect = 'move';
  // required to accept drops.
  e.preventDefault();
}
