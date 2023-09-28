If you're using multiple files in the engine, you'll discover that you can't
access variables, objects or functions in other files - only objects you've
defined in the sidebar.

Often times you'll need to share things between files, so gameify provides a way to.

Similar to the {@linkcode $get|` $get(...)`} function, the {@linkcode $share|` $share(...)`}
function allows you to share your own variables/objects between files.

If you have a function you'd like to share, you can use `$share` to give it a name
and share it.

```js
// define within $share
$share('say hi', function(name) {
    console.log('hi', name);
});

// OR share an existing function
function sayHi(name) {
    console.log('hi', name);
}
$share('say hi', sayHi);
```

Now you can access the function from another file:

```js
// access it directly
$share('say hi')('bob');

// OR save it to a variable
const sayHi = $share('say hi');
sayHi('bob');
```

## Common issues

### Shared variables/functions are undefined
First, check your typing. If this is correct, you're probably using the shared variable or function before it's avaiable (since each code file runs
at the same time, shared variables in one aren't always ready for another).

You might be doing something like this:
```js
// main.js
$share('say hi', function(name) {
    print('hi', name);
})

// level.js
console.log($share('say hi')('bob'));
// Error, undefined is not a function
```
Instead, wait until the update or draw function of a scene
```js
// main.js
$share('say hi', function(name) {
    print('hi', name);
})

// level.js
myLevel.onUpdate(function() {
    console.log($share('say hi')('bob'));
    // Prints 'hi bob' a lot
})
```


### Variables are not updated

You might be doing something similar to this:
```js
// DOESN'T UPDATE VARIABLES
// player.js
let playerHealth = 50
$share('player health', playerHealth);
playerHealth -= 10;

// level.js
console.log($share('player health')); // will always print 50
```
Instead, use a function to share your variables.
```js
// DOES UPDATE VARIABLES
// You can work around this by sharing a function
// main.js
let playerHealth = 50;
$share('player health', function() {
    return playerHealth;
});
playerHealth -= 10;

// level.js
console.log($share('player health')()); // will print 40
```

<br>
<br>