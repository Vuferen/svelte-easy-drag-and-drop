<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<button on:click={() => newItem()}>Add</button>
<button on:click={() => bold = !bold}>Toggle bold</button>
{#if bold}
<ul class="wrapper-id bold">
	{#each draggable(list, ".wrapper-id", () => {list = list}) as item, index (item.name)}
		<li>
			<span class="text">{item.name}</span>
			<span class="grab" data-grabbable="true"></span>
		</li>
	{/each}
</ul>
{:else}
<ul class="wrapper-id">
	{#each draggable(list, ".wrapper-id", () => {list = list}) as item, index (item.name)}
		<li>
			<span class="text">{item.name}</span>
			<span class="grab" data-grabbable="true"></span>
		</li>
	{/each}
</ul>
{/if}

<!-- <button on:click={() => {list2 = [...list2, {name: "test2"}]}}>Add</button> -->
<ul class="wrapper-id">
	{#each draggable(list2, ".wrapper-id", () => {list2 = list2}) as item, index (item.name)}
		<li>
			<span class="text">{item.name}</span> 
			<span class="grab" data-grabbable="true"></span>
		</li>
	{/each}
</ul>

<ul class="wrapper-id-2">
	{#each draggable(list3, ".wrapper-id-2", () => {list3 = list3}) as item, index (item.name)}
		<li>
			<span class="text">{item.name}</span> 
			<span class="grab" data-grabbable="true"></span>
		</li>
	{/each}
</ul>

<script lang="ts">
	import {draggable} from "$lib/svelte-easy-draggable.ts"
	let bold = false;
	let list = [{
		name: "Lorem",
	},
	{
		name: "Ipsum",
	},
	{
		name: "Foo",
	}, 
	{
		name: "Bar",
	}]
	$: console.log("svelte", list)

	let list2 = [{
		name: "Lorem2",
	},
	{
		name: "Ipsum2",
	},
	{
		name: "Foo2",
	}, 
	{
		name: "Bar2",
	}]
	$: console.log("svelte", list2)

	let list3 = [{
		name: "Lorem3",
	},
	{
		name: "Ipsum3",
	},
	{
		name: "Foo3",
	}, 
	{
		name: "Bar3",
	}]
	$: console.log("svelte", list3)

	let uniqueId = 0;
	function newItem() {
		list  = [...list , {name: "test" + uniqueId++}]
		console.log(list)
	}

	function updateList(updateList) {
		updateList = updateList;
	}

</script>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin-bottom: 50px;
	}
	li {
		list-style: none;
		background: rgb(226, 229, 231);
		margin-bottom: 0.2rem;
		border-radius: 5px;
		width: 200px;
		display: grid;
		grid-template-columns: 1fr auto;
		overflow: hidden;
	}
	.text {
		padding: 0.4em 0.8em;
	}
	.grab {
		background: rgb(206, 210, 212);
		width: 30px;
		height: 100%;
		display: block;
	}
	.bold {
		font-weight: bold;
	}
</style>