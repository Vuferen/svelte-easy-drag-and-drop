import { onMount } from "svelte";
let isMounted = new Promise(() => {});
let draggableLists = new Map(); // map drag targets to elements
let mouse = {x: 0, y: 0};

export function draggable(list, wrapperQuery) {
	// Handle reactivity
	// list.splice(0,1)
	// list = list;
	isMounted.then(() => {
		list = handleDraggable(list, wrapperQuery)
	});
	// Initial load
	onMount(() => {
		isMounted = Promise.resolve(true);
		list = handleDraggable(list, wrapperQuery)
		document.addEventListener("dragover", (e) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		});
		// document.addEventListener("mouseover", (e) => {
		// 	mouse.x = e.clientX;
		// 	mouse.y = e.clientY;
		// });
	})
	return list;
}

function handleDraggable(list, wrapperQuery) {
	let dragLists = document.querySelectorAll(wrapperQuery);
	let listElements = [];
	
	dragLists.forEach((dragList) => {
		if (dragList instanceof HTMLElement) {
			listElements = [...listElements, ...getChildren(dragList)]
		}
	})

	let dragTargets = new Map();
	
	let currentIndex = (draggableLists.get(wrapperQuery) != undefined ? draggableLists.get(wrapperQuery).size : 1) - 1;
	listElements.forEach((e) => {
		
		if (!e.getAttribute("data-tracked-by-easy-draggable")) {
			e.setAttribute("data-tracked-by-easy-draggable", "true")
			let newGrabbables = getGrabbables(e);
			// dragTargets = new Map([...dragTargets, ...newGrabbables])
			newGrabbables.forEach((value, key) => {
				key.style.cursor = "pointer"
				key.style.userSelect = "none"
				key.setAttribute("draggable", "true")
				key.addEventListener("dragstart", (e) => {dragStart(e, value)});
				key.addEventListener("dragend", () => {dragEnd(value)});
				value.addEventListener("dragover", (e) => {e.preventDefault()})
				value.addEventListener("drop", (e) => drop(e, list, wrapperQuery, currentIndex))
				value.addEventListener("dragenter", (e) => dragEnter(e))
				value.addEventListener("dragleave", (e) => dragLeave(e))
				dragTargets.set(key, {element: value, id: currentIndex})
				currentIndex++;
			});
		}
	})

	draggableLists.set(wrapperQuery, new Map([...draggableLists.get(wrapperQuery) || new Map() , ...dragTargets]))
	console.log(draggableLists)
	return list;
}

function getChildren(element) {
	const children = [];
  
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

function getGrabbables(element, parentnode = null) {
	let map = new Map()
	let children = getChildren(element);

	// Find all grabbables and add them to the map
	if (element.getAttribute("data-grabbable") == "true") {
		map.set(element, parentnode);
	}
	if (children.length > 0) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
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
let draggingElementDisplay;
let draggingElement;
let elementToPlace;
function dragStart(event, element) {
	if (currentlyDragging) return;
	currentlyDragging = true;
	if (event.dataTransfer) {
		event.dataTransfer.setDragImage(new Image(), 0, 0)
	}
	// Have to use timeout because of chrome being chrome
	setTimeout(() => {
		// Hide element while dragging
		draggingElementDisplay = element.style.display != "none" ? element.style.display : draggingElementDisplay; // Fix two grabbables on top of each other

		// Show cloned element instead
		draggingElement = element.cloneNode(true);
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

		element.addEventListener("drag", (e) => {
			// console.log(e)
			let elementBeingDragged = document.getElementById("element-being-dragged");
			if (!elementBeingDragged) return;
			elementBeingDragged.style.left = (mouse.x - offsetX) + "px";
			elementBeingDragged.style.top = (mouse.y - offsetY) + "px";
		})
		// element.style.display = "none";
		element.style.opacity = "0";
		document.body.after(draggingElement);
		// toggleDraggable(false)
	}, 0)

}

function dragEnd(element) {
	currentlyDragging = false;
	// Have to use timeout because of chrome being chrome
	setTimeout(() => {
		draggingElement.remove();
		// element.style.display = draggingElementDisplay
		element.style.opacity = "1"
		// toggleDraggable(true)
	}, 0)
}

function dragEnter(event) {
	setTimeout(() => {
		event.preventDefault()
		let target = event.target
		draggingElement.style.opacity = "0"
		elementToPlace.style.opacity = "1"
		target.after(elementToPlace);
	}, 0)
}
function dragLeave(event) {
	setTimeout(() => {
		event.preventDefault()
		elementToPlace.remove()
		draggingElement.style.opacity = "1"
		elementToPlace.style.opacity = "0"
	}, 0)
}

function toggleDraggable(on) {
	draggableLists.forEach((list) => {
		list.forEach((value) => {
			value.element.setAttribute("draggable", on ? "true" : "false")
		})
	})
}

function drop(event, list, wrapperQuery, index) {
	event.preventDefault()
	let element = event.target;
	let newId = draggableLists.get(wrapperQuery)?.get(element)?.id;
	let oldValue = draggableLists.get(wrapperQuery)?.get(elementToPlace);
	let oldId = oldValue?.id;
	
	console.log(newId, oldId)
	if (oldValue && newId != undefined && oldId != undefined) {
		console.log("move")
		console.log(list)
		let moveData = list[oldId];
		list.splice(oldId, 1); // remove element
		newId = newId > oldId ? newId - 1  : newId;
		draggableLists.get(wrapperQuery)?.set(elementToPlace, {element: oldValue.element, id: newId + 1})
		list.splice(newId + 1, 0, moveData) // insert element in new position
		list = list;
		console.log(list)
		updateIds(wrapperQuery, oldId, newId);
	}
	// console.log(newId)
}

function updateIds(wrapperQuery, deleteId, insertId) {
	let map = draggableLists.get(wrapperQuery);
	map?.forEach((value, key) => {
		map?.set(key, {element: value.element, id: value.id > insertId && value.id < deleteId ? value.id + 1 : (value.id > deleteId && value.id < insertId ? value.id - 1 : value.id)})
	})
}