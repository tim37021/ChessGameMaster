[].forEach.call(document.getElementsByClassName("draggable"), (elmnt: HTMLElement) => {
    dragElement(elmnt);
});

export function dragElement(elmnt: HTMLElement) {
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;


    elmnt.onmousedown = dragMouseDown;


    function dragMouseDown(e: MouseEvent) {
    e = e || (window.event as MouseEvent);
    if (e.button !== 0) {
        return;
    }
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
    e = e || (window.event as MouseEvent);
    if (e.button !== 0) {
        return;
    }
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
    }
}
