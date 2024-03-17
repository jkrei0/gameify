If you're using multiple files in the engine, you'll discover that you can't
access variables, objects or functions in other files - only objects you've
defined in the sidebar.

Often times you'll need to share things between files, and of course, there's an easy way to do that.

If you have a function or variable you'd like to share, you can simply add `export` to the front of it.

```js
// otherFile.js
// export a function so that other code files can use it
export function sayHi(name) {
    console.log('hi', name);
}

// export a variable
export let playerName = 'Steve';
```

Now you can access the function from another file:

```js
// main.js
import {sayHi, playerName} from './otherFile.js';

sayHi('Bob');      // prints 'hi Bob'
sayHi(playerName); // prints 'hi Steve'
```

### Modifying exported/imported variables

You can't modify a variable from an imported file. If you want to do this, you'll have to create
a function in the imported file.

```js
// otherFile.js
export function changeName(newName) {
    playerName = newName;
}
```

```js
// main.js
import {sayHi, playerName, changeName} from './otherFile.js';

sayHi(playerName);    // prints 'hi Steve'
changeName('Carrie'); // playerName is now 'Carrie'
sayHi(playerName);    // prints 'hi Carrie'
```

### Namespacing variables/functions

If you have a lot of exported variables or functions, it can get messy and hard to keep track of.
You can use `import * as name` to import everything from a file, as part of a namespace. Using
this approach also means you don't have to update files every time you export something new!

```js
import * as nameManager from './otherFile.js';

nameManager.sayHi('Bob'); // prints 'hi Bob'
nameManager.sayHi(nameManager.playerName); // prints 'hi Steve'

```