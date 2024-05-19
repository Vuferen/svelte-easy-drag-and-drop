# Svelte easy drag and drop

This library provides a single function to make your existing lists draggable.

## Usage
Wrap your list/array with the `draggable()` function, and provide a query string to target the wrapper as well as a function to make Svelte update the list:
```js
import { draggable } from "@vuferen/svelte-easy-drag-and-drop";
```
```svelte
<ul class="wrapper-id">
  {#each draggable(list, ".wrapper-id", () => {list = list}) as item (item.id)}
    <li>
      {item.name}
    </li>
  {/each}
</ul>
```

## Add a handle
If you only want to be able to grab a specific element, then give it the attribute `data-grabbable="true"`:
```svelte
<ul class="wrapper-id">
  {#each draggable(list, ".wrapper-id", () => {list = list}) as item (item.id)}
    <li>
      {item.name}
      <span data-grabbable="true"></span>
    </li>
  {/each}
</ul>
```
## Multiple list
If you want to drag elements between multiple list, then give them the same wrapper class:
```svelte
<ul class="wrapper-id">
  {#each draggable(list, ".wrapper-id", () => {list = list}) as item (item.id)}
    <li>
      {item.name}
    </li>
  {/each}
</ul>
<ul class="wrapper-id">
  {#each draggable(list2, ".wrapper-id", () => {list2 = list2}) as item (item.id)}
    <li>
      {item.name}
    </li>
  {/each}
</ul>
```
If you do not want to be able to drag elements between list, then give each list a unique wrapper id/class.

## Styling
When dragging an element, a preview of the placement will be shown as well as the element being dragged by the cursor.
You can style both of these by targeting them with css:
```scss
:global(html [data-preview-element]) {
  transform: scale(0.9);
  opacity: 0.4;
}
:global(html [data-dragging-element]) {
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
}
```
For targeting a specific list, you can add in the wrapper id/class:
```scss
:global(html .wrapper-id [data-preview-element]) {
  background-color: rgb(206, 210, 212);
}
```

## Reverse lists
If the elements in your list are in reverse order e.g. by using `flex-direction: column-reverse;` or `flex-direction: row-reverse;`, then add a fourth argument set to true:
```svelte
<ul class="wrapper-id">
  {#each draggable(list, ".wrapper-id", () => {list = list}, true) as item (item.id)}
    <li>
      {item.name}
    </li>
  {/each}
</ul>
```
