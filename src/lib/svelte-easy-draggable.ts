import { onMount } from "svelte";

type ElementMapValue = {element: HTMLElement, id: number, listId: number};
type ElementMap = Map<HTMLElement, ElementMapValue>;
type ListMapValue = {map: ElementMap};
type ListMap = Map<string, ListMapValue>;
type SvelteListMapValue = Array<{list: Array<any>, update: Function}>;
type SvelteListMap = Map<string, SvelteListMapValue>;

let isMounted = new Promise(() => {});
let droppableLists: ListMap = new Map(); // map list elements to drag targets
let svelteLists: SvelteListMap = new Map();
let updateFuncListMap: Map<string, number> = new Map();
let mouse = {x: 0, y: 0};

export function draggable(list: Array<any>, wrapperQuery: string, onUpdate: Function) {
	isMounted.then(() => {
		list = handleDraggable(list, wrapperQuery, onUpdate)
	});
	// Initial load
	onMount(() => {
		isMounted = Promise.resolve(true);
		list = handleDraggable(list, wrapperQuery, onUpdate)
		document.addEventListener("dragover", (e) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		});
	})
	return list;
}

function handleDraggable(list: Array<any>, wrapperQuery: string, onUpdate: Function) {
	if (svelteLists.get(wrapperQuery) == undefined) {
		svelteLists.set(wrapperQuery, [{list: list, update: onUpdate}]);
		updateFuncListMap.set(onUpdate.name, 0);
	} else if (updateFuncListMap.get(onUpdate.name) != undefined) {
		let svelteList = <SvelteListMapValue>svelteLists.get(wrapperQuery);
		svelteList[<number>updateFuncListMap.get(onUpdate.name)].list = list
		svelteList[<number>updateFuncListMap.get(onUpdate.name)].update = onUpdate
		svelteLists.set(wrapperQuery, svelteList);
	}
	else {
		updateFuncListMap.set(onUpdate.name, (<SvelteListMapValue>svelteLists.get(wrapperQuery)).length);
		svelteLists.get(wrapperQuery)?.push({list: list, update: onUpdate});
	}
	
	let dragLists = document.querySelectorAll(wrapperQuery);
	let dragTargets: ElementMap = new Map();
	let dropTargets: ElementMap = new Map();
	let currentListIndex = 0;
	
	dragLists.forEach((dragList) => {
		let listElements: HTMLElement[] = [];
		if (dragList instanceof HTMLElement) {
			listElements = [...listElements, ...getChildren(dragList)]
		}
		let currentIndex = 0;
		listElements.forEach((e) => {
			if (!e.getAttribute("data-tracked-by-easy-draggable")) {
				e.setAttribute("data-tracked-by-easy-draggable", wrapperQuery)
				let newGrabbables = getGrabbables(e);
				newGrabbables.forEach((value, key) => {
					key.style.cursor = "grab"
					key.style.userSelect = "none"
					key.setAttribute("draggable", "true")
					key.addEventListener("dragstart", (e) => {dragStart(e, value)});
					key.addEventListener("dragend", (e) => {dragEnd(value); drop(e, list, wrapperQuery, currentIndex, onUpdate)});
					value.addEventListener("dragover", (e) => {dragOver(e, wrapperQuery)})
					value.addEventListener("drop", (e) => drop(e, list, wrapperQuery, currentIndex, onUpdate))
					value.addEventListener("dragenter", (e) => dragEnter(e, wrapperQuery))
					value.addEventListener("dragleave", (e) => dragLeave(e))
					dragTargets.set(key, {element: value, id: currentIndex, listId: currentListIndex})
					dropTargets.set(value, {element: key,  id: currentIndex, listId: currentListIndex})
				});
			}
			currentIndex++;
		})
		currentListIndex++;
	})
	let filteredDroppableLists = new Map()
	if (droppableLists.get(wrapperQuery) != undefined) {
		filteredDroppableLists = new Map(
			[...(<ListMapValue>droppableLists.get(wrapperQuery)).map]
			.filter(([k, v]) => ![...dropTargets].some(([dk, dv]) => v.id == dv.id && v.listId == dv.listId))
		);
	}

	droppableLists.set(wrapperQuery, {map: new Map([...filteredDroppableLists, ...dropTargets])})
	return list;
}

function getChildren(element: HTMLElement): HTMLElement[] {
	const children: HTMLElement[] = [];
  
	if (element.children) {
	  // Using Array.from to convert HTMLCollection to an array
	  Array.from(element.children).forEach((child) => {
		if (child instanceof HTMLElement) {
		  children.push(child);
		}
	  });
	}
  
	return children;
  }

function getGrabbables(element: HTMLElement, parentnode: HTMLElement | null = null): Map<HTMLElement, HTMLElement> {
	let map = new Map()
	let children = getChildren(element);

	// Find all grabbables and add them to the map
	if (element.getAttribute("data-grabbable") == "true") {
		map.set(element, parentnode);
	}
	if (children.length > 0) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			if (child.nodeType == 3) continue;
			map = new Map([...map, ...getGrabbables(child, parentnode ? parentnode : element)])
		}
	}

	// If no grabbables were found, add the element itself as the grabbable
	if (parentnode == null && map.size == 0) {
		map.set(element, element)
	}

	return map
}
let currentlyDragging = false;
let draggingElementDisplay: string;
let draggingElement: HTMLElement;
let elementToPlace: HTMLElement;
function dragStart(event: DragEvent, element: HTMLElement) {
	// Have to use timeout because of chrome being chrome
	if (event.dataTransfer) {
		event.dataTransfer.setDragImage(new Image(), 0, 0)
		event.dataTransfer.effectAllowed = "move";
	}
	setTimeout(() => {
		if (currentlyDragging) return;
		currentlyDragging = true;
		togglePreventChildInterference(true);
		// Hide element while dragging
		draggingElementDisplay = element.style.display != "none" ? element.style.display : draggingElementDisplay; // Fix two grabbables on top of each other

		// Show cloned element instead
		draggingElement = <HTMLElement>element.cloneNode(true);
		elementToPlace = element;
		draggingElement.style.position = "fixed"
		draggingElement.style.listStyle = "none"
		draggingElement.style.pointerEvents = "none"
		draggingElement.id = "element-being-dragged"
		const offsetX = event.clientX - element.getBoundingClientRect().x;
		const offsetY = event.clientY - element.getBoundingClientRect().y;
		mouse.x = event.clientX;
		mouse.y = event.clientY;
		draggingElement.style.left = element.getBoundingClientRect().x + "px";
		draggingElement.style.top = element.getBoundingClientRect().y + "px";

		element.addEventListener("drag", (e: DragEvent) => {
			let elementBeingDragged = document.getElementById("element-being-dragged");
			if (!elementBeingDragged) return;
			elementBeingDragged.style.left = (mouse.x - offsetX) + "px";
			elementBeingDragged.style.top = (mouse.y - offsetY) + "px";
		})
		// element.style.display = "none";
		element.style.opacity = "0.4";
		document.body.after(draggingElement);
		// toggleDraggable(false)
	}, 0)

}

function dragEnd(element: HTMLElement) {
	// Have to use timeout because of chrome being chrome
	setTimeout(() => {
	currentlyDragging = false;
	togglePreventChildInterference(false);
		draggingElement.remove();
		// element.style.display = draggingElementDisplay
		element.style.opacity = "1"
		// toggleDraggable(true)
	}, 0)
}

let isPlacedBeforeTarget: HTMLElement | null = null;
let isPlacedAfterTarget: HTMLElement | null = null;
let enteredFromAbove = false;
let enteredFromBelow = false;
function dragEnter(event: DragEvent, wrapperQuery: string) {
	event.preventDefault()
	if ((<HTMLElement>event.target).getAttribute("data-tracked-by-easy-draggable") !== elementToPlace.getAttribute("data-tracked-by-easy-draggable")) {
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "none";
		}
		return
	};
	setTimeout(() => {

		let target = <HTMLElement>event.target
		if (elementToPlace.contains(target)) return;

		const targetRect = target.getBoundingClientRect();
		const lowerBound = targetRect.top + (targetRect.bottom - targetRect.top) * 0.8;
		const upperBound = targetRect.top + (targetRect.bottom - targetRect.top) * 0.2;
		if (mouse.y > lowerBound) {
			enteredFromBelow = true;
		} else if (mouse.y < upperBound) {
			enteredFromAbove = true;
		} else {
			enteredFromBelow = false;
			enteredFromAbove = false;
		}
		updatePosition(target, lowerBound, upperBound, wrapperQuery, true);
	}, 0)
}

function dragOver(event: DragEvent, wrapperQuery: string) {
	event.preventDefault()
	if ((<HTMLElement>event.target).getAttribute("data-tracked-by-easy-draggable") !== elementToPlace.getAttribute("data-tracked-by-easy-draggable")) {
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "none";
		}
		return
	};
	setTimeout(() => {

		let target = <HTMLElement>event.target;
		if (elementToPlace.contains(target)) return;

		const targetRect = target.getBoundingClientRect();
		const lowerBound = targetRect.top + (targetRect.bottom - targetRect.top) * 0.8;
		const upperBound = targetRect.top + (targetRect.bottom - targetRect.top) * 0.2;
		updatePosition(target, lowerBound, upperBound, wrapperQuery, false);
	}, 0)
}

let extraUpdatesAfterEntering = 0;
function updatePosition(target: HTMLElement, lowerBound: number, upperBound: number, wrapperQuery: string, isEntering: boolean) {
	const isNotPlaced = isPlacedBeforeTarget == null && isPlacedAfterTarget == null;

	let isPlacedSomewhereAfterTarget = false;
	let isPlacedSomewhereBeforeTarget = false;
	if (isEntering || extraUpdatesAfterEntering > 0) {
		let element = <HTMLElement>(isPlacedBeforeTarget || isPlacedAfterTarget || elementToPlace);
		let dropTarget = droppableLists.get(wrapperQuery)?.map.get(element);
		let newDropTarget = droppableLists.get(wrapperQuery)?.map.get(target);
		if (extraUpdatesAfterEntering > 0) {
			extraUpdatesAfterEntering--;
		}
		if (dropTarget != undefined && newDropTarget != undefined) {
			if (dropTarget.listId == newDropTarget.listId) {
				isPlacedSomewhereAfterTarget = dropTarget.id > newDropTarget.id || (isPlacedAfterTarget != null && isPlacedAfterTarget.isSameNode(target));
				isPlacedSomewhereBeforeTarget = dropTarget.id < newDropTarget.id || (isPlacedBeforeTarget != null && isPlacedBeforeTarget.isSameNode(target));
			} else {
				isPlacedSomewhereAfterTarget = true;
				extraUpdatesAfterEntering = 2; // 2 updates are required after entering a new list to stabilize the position
			}
		}
	}

	const shouldPlaceBefore = (enteredFromAbove && mouse.y < upperBound && !isNotPlaced) || 
							  (enteredFromBelow && mouse.y < lowerBound) || 
							  (!enteredFromAbove && !enteredFromBelow && isPlacedSomewhereAfterTarget);
	const shouldPlaceAfter = (enteredFromAbove && mouse.y > upperBound) || 
							 ((enteredFromBelow) && mouse.y > lowerBound && !isNotPlaced) || 
							 (!enteredFromAbove && !enteredFromBelow && isPlacedSomewhereBeforeTarget);

	if (shouldPlaceBefore && !isPlacedBeforeTarget?.isSameNode(target)) {
		removeElement()
		target.before(elementToPlace);
		showElement()
		isPlacedBeforeTarget = target;
		isPlacedAfterTarget = null;
	} else if (shouldPlaceAfter && !isPlacedAfterTarget?.isSameNode(target)) {
		removeElement()
		target.after(elementToPlace);
		showElement()
		isPlacedBeforeTarget = null;
		isPlacedAfterTarget = target;
	}
}

function removeElement() {
	elementToPlace.remove()
	draggingElement.style.opacity = "1"
	elementToPlace.style.opacity = "0.2"
}

function showElement() {
	draggingElement.style.opacity = "1"
	elementToPlace.style.opacity = "0.4"
}

function dragLeave(event: DragEvent) {
	setTimeout(() => {
		
	}, 0)
}

function drop(event: DragEvent, list: Array<any>, wrapperQuery: string, index: number, onUpdate: Function) {
	event.preventDefault()
	let element = <HTMLElement>(isPlacedBeforeTarget || isPlacedAfterTarget);
	let shouldPlaceBeforeTarget = isPlacedBeforeTarget != null;
	let dropTarget = droppableLists.get(wrapperQuery)?.map.get(element);
	let newId = dropTarget?.id;
	let oldValue = droppableLists.get(wrapperQuery)?.map.get(elementToPlace); //draggableLists.get(wrapperQuery)?.map.get(<HTMLElement>event.target);
	let oldId = oldValue?.id;
	let lists = svelteLists.get(wrapperQuery);
	
	if (oldValue && newId != undefined && oldId != undefined && dropTarget != undefined && lists != undefined) {
		oldValue.element = elementToPlace;
		let oldList = lists[oldValue.listId];
		let newList = lists[dropTarget.listId];

		let moveData = oldList.list[oldId];
		oldList.list.splice(oldId, 1); // remove element

		if (oldValue.listId == dropTarget.listId) {
			newId = newId > oldId ? newId - 1  : newId;
		}
		newId = shouldPlaceBeforeTarget ? newId : newId + 1;
		updateIds(droppableLists, wrapperQuery, oldId, newId, oldValue.listId, dropTarget.listId);
		if (oldValue.listId == dropTarget.listId) {
			droppableLists.get(wrapperQuery)?.map.set(<HTMLElement>oldValue.element, {element: <HTMLElement>event.target, id: newId, listId: dropTarget.listId})
		} else {
			droppableLists.get(wrapperQuery)?.map.delete(<HTMLElement>oldValue.element);
		}
		newList.list.splice(newId, 0, moveData) // insert element in new position
		
		oldList.list = oldList.list;
		newList.list = newList.list;
		oldList.update();
		newList.update();
		isPlacedBeforeTarget = null;
		isPlacedAfterTarget = null;
	}
}

function updateIds(lists: ListMap, wrapperQuery: string, deleteId: number, insertId: number, deleteListId: number, insertListId: number) {
	let map = lists.get(wrapperQuery)?.map;
	map?.forEach((value, key) => {
		if (deleteListId == insertListId && value.listId == insertListId) {
			map?.set(key, {element: value.element, id: value.id >= insertId && value.id < deleteId ? value.id + 1 : (value.id > deleteId && value.id <= insertId ? value.id - 1 : value.id), listId: value.listId})
		} else if (deleteListId == value.listId) {
			map?.set(key, {element: value.element, id: value.id > deleteId ? value.id - 1 : value.id, listId: value.listId})
		} else if (insertListId == value.listId) {
			map?.set(key, {element: value.element, id: value.id >= insertId ? value.id + 1 : value.id, listId: value.listId})
		}
	})
}


function togglePreventChildInterference(shouldPrevent: Boolean) {
	let preventStyle = document.getElementById("svelteEasyDraggablePreventChildInterference");
	if (shouldPrevent && preventStyle == null) {
		const style = `
			[data-tracked-by-easy-draggable] * {
				pointer-events: none;
			}
		`;
		let styleSheet = document.createElement("style");
		styleSheet.innerText = style;
		styleSheet.id = "svelteEasyDraggablePreventChildInterference";
		document.head.appendChild(styleSheet);
	} else {
		preventStyle?.remove();
	}
}