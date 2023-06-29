The sidebar isn't very useful if you can't use the objects in your game.

Any projects in the engine have access to the {@linkcode $get|`$get(...)`} function, which you can use to access any objects from the sidebar. The easiest way to do this is to right-click the object in the sidebar, and select `Copy Javascript`

![](/tutorials/rc_copy_javascript.png)

You can then paste this into your code to use the object in your code.

You can then interact with the object directly,

```js
$get('Tilemap::Dungeon Map').offset.x += 1;
```

Although if you're using the object in multiple places (which you will be almost all of the time), you should instead store it as a variable.

```js
const dungeonMap = $get('Tilemap::Dungeon Map')

dungeonMap.offset.x += 1;
```
